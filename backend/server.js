const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// CORS configuration - update allowedOrigins for production
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:3000']; // Default for development

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());

// Initialize database
// On Render, the working directory should be writable
// Use ./grocery.db (relative to working directory) which should work on Render
const dbPath = process.env.DATABASE_PATH || './grocery.db';
let dbReady = false;

const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    console.error('Database path:', dbPath);
    console.error('Current working directory:', process.cwd());
    console.error('NODE_ENV:', process.env.NODE_ENV);
    // Don't exit - let the app start and log errors for debugging
    console.error('Database connection failed. Some endpoints may not work.');
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    console.log('Working directory:', process.cwd());
    initializeDatabase(() => {
      dbReady = true;
      console.log('Database initialized and ready');
    });
  }
});

// Handle database errors
db.on('error', (err) => {
  console.error('Database error:', err);
  dbReady = false;
});

// Initialize database tables
function initializeDatabase(callback) {
  db.serialize(() => {
    // Users table
    // Note: Username is NOT unique - multiple users can have same username
    // Email and phone_number must be unique
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      phone_number TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    
    // Create indexes for email and phone_number uniqueness
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`, (err) => {
      if (err) console.log('Index creation note:', err.message);
    });
    db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number)`, (err) => {
      if (err) console.log('Index creation note:', err.message);
    });

    // Check and migrate old schema if username has UNIQUE constraint
    db.all("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'", (err, rows) => {
      if (err) {
        console.error('Error checking schema:', err);
        return;
      }
      
      if (rows.length > 0) {
        const createSql = rows[0].sql;
        // Check if username has UNIQUE constraint in existing table
        if (createSql && createSql.includes('username TEXT UNIQUE')) {
          console.log('Migrating database: Removing UNIQUE constraint from username...');
          // SQLite doesn't support ALTER TABLE to remove constraints
          // We need to recreate the table
          db.serialize(() => {
            // Create new table without UNIQUE on username
            db.run(`CREATE TABLE IF NOT EXISTS users_new (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              username TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              phone_number TEXT UNIQUE NOT NULL,
              role TEXT NOT NULL DEFAULT 'user',
              created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )`, (err) => {
              if (err) {
                console.error('Error creating new users table:', err);
                return;
              }
              
              // Copy data - handle NULL phone_numbers by using a default
              db.run(`INSERT INTO users_new (id, username, email, password, phone_number, role, created_at)
                      SELECT id, username, email, password, 
                             CASE WHEN phone_number IS NULL OR phone_number = '' THEN 'temp_' || id ELSE phone_number END,
                             role, created_at FROM users`, (err) => {
                if (err) {
                  console.error('Error copying data:', err);
                  db.run('DROP TABLE IF EXISTS users_new');
                  return;
                }
                
                // Drop old table and rename new one
                db.run(`DROP TABLE users`, (err) => {
                  if (err) {
                    console.error('Error dropping old table:', err);
                    return;
                  }
                  
                  db.run(`ALTER TABLE users_new RENAME TO users`, (err) => {
                    if (err) {
                      console.error('Error renaming table:', err);
                      return;
                    }
                    console.log('Migration completed: Username UNIQUE constraint removed');
                  });
                });
              });
            });
          });
        }
      }
    });

    // Add phone_number column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE users ADD COLUMN phone_number TEXT`, (err) => {
      // Ignore error if column already exists
    });

    // Items table
    db.run(`CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      category TEXT,
      stock INTEGER NOT NULL DEFAULT 0,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Orders table
    db.run(`CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      delivery_address TEXT NOT NULL,
      delivery_fee REAL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`);

    // Add delivery_fee column if it doesn't exist (for existing databases)
    db.run(`ALTER TABLE orders ADD COLUMN delivery_fee REAL DEFAULT 0`, (err) => {
      // Ignore error if column already exists
    });

    // Order items table
    db.run(`CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      item_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (item_id) REFERENCES items(id)
    )`);

    // OTP table for phone verification
    db.run(`CREATE TABLE IF NOT EXISTS otp_verifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      phone_number TEXT NOT NULL,
      otp TEXT NOT NULL,
      expires_at DATETIME NOT NULL,
      verified INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    // Create default shopkeeper account
    const defaultPassword = bcrypt.hashSync('shopkeeper123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, email, password, phone_number, role) 
            VALUES ('shopkeeper', 'shopkeeper@store.com', ?, '+91-9876543210', 'shopkeeper')`, [defaultPassword]);

    // Create default user account
    const defaultUserPassword = bcrypt.hashSync('user123', 10);
    db.run(`INSERT OR IGNORE INTO users (username, email, password, phone_number, role) 
            VALUES ('user', 'user@store.com', ?, '+91-9876543211', 'user')`, [defaultUserPassword], (err) => {
      if (err) {
        console.error('Error creating default user:', err);
      }
      if (callback) callback();
    });
  });
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware to check if user is shopkeeper
const isShopkeeper = (req, res, next) => {
  if (req.user.role !== 'shopkeeper') {
    return res.status(403).json({ error: 'Access denied. Shopkeeper role required' });
  }
  next();
};

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Normalize phone number (remove spaces, dashes, etc. for consistent storage)
function normalizePhoneNumber(phone) {
  if (!phone) return phone;
  // Remove all non-digit characters (spaces, dashes, parentheses, plus signs)
  let normalized = phone.replace(/[\s\-()+]/g, '');
  // For Indian numbers, remove country code if present (91) and keep last 10 digits
  // Handle formats like: +91-9876543210, 9876543210, 919876543210
  if (normalized.startsWith('91') && normalized.length > 10) {
    normalized = normalized.slice(2); // Remove 91 prefix
  }
  // Return the last 10 digits (standard Indian mobile number length)
  if (normalized.length >= 10) {
    return normalized.slice(-10);
  }
  return normalized;
}

// Clean expired OTPs
function cleanExpiredOTPs() {
  db.run('DELETE FROM otp_verifications WHERE expires_at < datetime("now")');
}

// Auth Routes
// Send OTP to phone number
app.post('/api/auth/send-otp', [
  body('phone_number').notEmpty().withMessage('Phone number is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone_number } = req.body;
  const normalizedPhone = normalizePhoneNumber(phone_number);
  cleanExpiredOTPs();

  // Check if phone number already exists (using normalized comparison)
  db.all('SELECT id, phone_number FROM users', (err, allUsers) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }
    
    // Check if any user has the same normalized phone number
    const existingUser = allUsers.find(u => {
      const userNormalized = normalizePhoneNumber(u.phone_number);
      return userNormalized === normalizedPhone;
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Delete any existing OTPs for this phone number (both formats)
    db.run('DELETE FROM otp_verifications WHERE phone_number = ? OR phone_number = ?', [phone_number, normalizedPhone], () => {
      // Insert new OTP - store both original and normalized for lookup
      db.run(
        'INSERT INTO otp_verifications (phone_number, otp, expires_at) VALUES (?, ?, ?)',
        [normalizedPhone, otp, expiresAt.toISOString()],
        function(err) {
          if (err) {
            return res.status(500).json({ error: 'Error generating OTP' });
          }

          // In production, send OTP via SMS service (Twilio, etc.)
          // For now, return OTP in response for testing until SMS is integrated
          // TODO: Integrate SMS service and remove OTP from response
          if (process.env.NODE_ENV === 'production') {
            // TODO: Integrate SMS service here (Twilio, MSG91, etc.)
            console.log(`OTP for ${phone_number} (normalized: ${normalizedPhone}): ${otp}`);
            // For now, return OTP in response (remove after SMS integration)
            res.json({ 
              message: 'OTP sent successfully. Check the response for OTP (SMS integration pending)',
              otp: otp, // Remove this after SMS integration
              expires_in: 600
            });
          } else {
            // Development mode - return OTP for testing
            console.log(`OTP for ${phone_number} (normalized: ${normalizedPhone}): ${otp}`);
            res.json({ 
              message: 'OTP sent successfully',
              otp: otp, // Only for development/testing
              expires_in: 600
            });
          }
        }
      );
    });
  });
});

// Verify OTP
app.post('/api/auth/verify-otp', [
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone_number, otp } = req.body;
  const normalizedPhone = normalizePhoneNumber(phone_number);
  cleanExpiredOTPs();

  db.get(
    'SELECT * FROM otp_verifications WHERE (phone_number = ? OR phone_number = ?) AND otp = ? AND (verified = 0 OR verified IS NULL) AND expires_at > datetime("now")',
    [phone_number, normalizedPhone, otp],
    (err, otpRecord) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Mark OTP as verified
      db.run(
        'UPDATE otp_verifications SET verified = 1 WHERE id = ?',
        [otpRecord.id],
        (err) => {
          if (err) {
            return res.status(500).json({ error: 'Error verifying OTP' });
          }

          res.json({ message: 'OTP verified successfully', verified: true });
        }
      );
    }
  );
});

// Register with verified OTP
app.post('/api/auth/register', [
  body('username').notEmpty().withMessage('Username is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phone_number').notEmpty().withMessage('Phone number is required')
    .matches(/^[+]?[0-9\s-()]{10,}$/).withMessage('Invalid phone number format'),
  body('otp').notEmpty().withMessage('OTP is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, email, password, phone_number, otp, role = 'user' } = req.body;
  const normalizedPhone = normalizePhoneNumber(phone_number);
  cleanExpiredOTPs();

  // Verify OTP - check if already verified or verify it now
  // Try both original and normalized phone number formats
  db.get(
    'SELECT * FROM otp_verifications WHERE (phone_number = ? OR phone_number = ?) AND otp = ? AND expires_at > datetime("now")',
    [phone_number, normalizedPhone, otp],
    (err, otpRecord) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!otpRecord) {
        // Debug: Check what OTPs exist for this phone
        db.all('SELECT phone_number, otp, verified, expires_at, datetime("now") as now FROM otp_verifications WHERE phone_number = ? OR phone_number = ?', 
          [phone_number, normalizedPhone], 
          (debugErr, debugRecords) => {
            if (!debugErr && debugRecords.length > 0) {
              console.log('Debug - Found OTP records:', debugRecords);
            }
          }
        );
        return res.status(400).json({ 
          error: 'Invalid or expired OTP. Please request a new OTP.',
          debug: 'Check console for OTP records'
        });
      }

      // If not verified yet, verify it now
      if (otpRecord.verified === 0) {
        db.run(
          'UPDATE otp_verifications SET verified = 1 WHERE id = ?',
          [otpRecord.id],
          (updateErr) => {
            if (updateErr) {
              return res.status(500).json({ error: 'Error verifying OTP' });
            }
            // Continue with registration
            proceedWithRegistration();
          }
        );
      } else {
        // Already verified, proceed with registration
        proceedWithRegistration();
      }

      function proceedWithRegistration() {
        // Check if email already registered
        db.get('SELECT id FROM users WHERE email = ?', [email], (err, existingEmail) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (existingEmail) {
            return res.status(400).json({ error: 'Email already registered' });
          }

          // Check if phone number already registered (both formats)
          db.get('SELECT id FROM users WHERE phone_number = ? OR phone_number = ?', [phone_number, normalizedPhone], (err, existingPhone) => {
            if (err) {
              return res.status(500).json({ error: 'Database error' });
            }
            if (existingPhone) {
              return res.status(400).json({ error: 'Phone number already registered' });
            }

            const hashedPassword = bcrypt.hashSync(password, 10);

            db.run(
              'INSERT INTO users (username, email, password, phone_number, role) VALUES (?, ?, ?, ?, ?)',
              [username, email, hashedPassword, normalizedPhone, role],
              function(err) {
                if (err) {
                  console.error('Database insert error:', err.message);
                  if (err.message.includes('UNIQUE constraint')) {
                    // Check which field caused the constraint violation
                    const errorMsg = err.message.toLowerCase();
                    if (errorMsg.includes('email') || errorMsg.includes('idx_users_email')) {
                      return res.status(400).json({ error: 'Email already registered' });
                    } else if (errorMsg.includes('phone') || errorMsg.includes('idx_users_phone')) {
                      return res.status(400).json({ error: 'Phone number already registered' });
                    } else if (errorMsg.includes('username')) {
                      // This should not happen with new schema, but handle old database
                      return res.status(400).json({ error: 'Username already exists. Please choose a different username or use email/phone for login.' });
                    }
                    return res.status(400).json({ error: 'Email or phone number already exists' });
                  }
                  return res.status(500).json({ error: 'Error creating user: ' + err.message });
                }

                // Delete used OTP (both formats)
                db.run('DELETE FROM otp_verifications WHERE phone_number = ? OR phone_number = ?', [phone_number, normalizedPhone]);

                const token = jwt.sign(
                  { id: this.lastID, username, role },
                  JWT_SECRET,
                  { expiresIn: '24h' }
                );

                res.json({ token, user: { id: this.lastID, username, email, phone_number: normalizedPhone, role } });
              }
            );
          });
        });
      }
    }
  );
});

// Login with phone number and OTP
app.post('/api/auth/login-send-otp', [
  body('phone_number').notEmpty().withMessage('Phone number is required')
], (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone_number } = req.body;
    if (!phone_number) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const normalizedPhone = normalizePhoneNumber(phone_number);
    cleanExpiredOTPs();

    // Check if phone number exists in users table
    // Get all users and compare normalized phone numbers
    db.all('SELECT id, phone_number FROM users', (err, allUsers) => {
      if (err) {
        console.error('Database error in login-send-otp (users query):', err);
        return res.status(500).json({ error: 'Database error: ' + err.message });
      }
    
    // Find user by comparing normalized phone numbers
    const user = allUsers.find(u => {
      const userNormalized = normalizePhoneNumber(u.phone_number);
      return userNormalized === normalizedPhone;
    });
    
    if (!user) {
      return res.status(404).json({ error: 'Phone number not registered. Please register first.' });
    }
    
    const userPhoneNumber = user.phone_number;
    const userNormalizedPhone = normalizePhoneNumber(userPhoneNumber);

      // Generate OTP for login
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      // Delete any existing OTPs for this phone number (check both formats)
      // First get all OTPs and find matching ones by normalized comparison
      db.all('SELECT phone_number FROM otp_verifications', (err, otps) => {
        if (err) {
          console.error('Database error in login-send-otp (otp_verifications query):', err);
          return res.status(500).json({ error: 'Database error: ' + err.message });
        }
        
        // Delete OTPs that match when normalized
        const deletePromises = [];
        if (otps) {
          otps.forEach(otpRecord => {
            const otpNormalized = normalizePhoneNumber(otpRecord.phone_number);
            if (otpNormalized === normalizedPhone) {
              deletePromises.push(new Promise((resolve) => {
                db.run('DELETE FROM otp_verifications WHERE phone_number = ?', [otpRecord.phone_number], resolve);
              }));
            }
          });
        }
        
        // Wait for deletions to complete, then insert new OTP
        Promise.all(deletePromises).then(() => {
          db.run(
            'INSERT INTO otp_verifications (phone_number, otp, expires_at) VALUES (?, ?, ?)',
            [normalizedPhone, otp, expiresAt.toISOString()],
          function(err) {
            if (err) {
              console.error('Error inserting OTP:', err);
              return res.status(500).json({ error: 'Error generating OTP: ' + err.message });
            }

            // In production, send OTP via SMS (when SMS service is integrated)
            // For now, return OTP in response for testing
            // TODO: Integrate SMS service (Twilio, MSG91, etc.) and remove OTP from response
            if (process.env.NODE_ENV === 'production') {
              console.log(`Login OTP for ${phone_number} (normalized: ${normalizedPhone}): ${otp}`);
              // TODO: Send OTP via SMS service here
              // For now, return OTP in response (remove after SMS integration)
              res.json({ 
                message: 'OTP sent successfully. Check the response for OTP (SMS integration pending)',
                otp: otp, // Remove this after SMS integration
                expires_in: 600
              });
            } else {
              // Development mode - return OTP for testing
              console.log(`Login OTP for ${phone_number} (normalized: ${normalizedPhone}): ${otp}`);
              res.json({ 
                message: 'OTP sent successfully',
                otp: otp, // Only for development/testing
                expires_in: 600
              });
            }
          });
        }).catch((error) => {
          console.error('Error in Promise.all for OTP deletion:', error);
          return res.status(500).json({ error: 'Error processing OTP: ' + error.message });
        });
      });
    }
  );
  } catch (error) {
    console.error('Unexpected error in login-send-otp:', error);
    return res.status(500).json({ error: 'Internal server error: ' + error.message });
  }
});

app.post('/api/auth/login', [
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('otp').notEmpty().withMessage('OTP is required').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { phone_number, otp } = req.body;
  const normalizedPhone = normalizePhoneNumber(phone_number);
  cleanExpiredOTPs();

  // Verify OTP first
  db.get(
    'SELECT * FROM otp_verifications WHERE (phone_number = ? OR phone_number = ?) AND otp = ? AND (verified = 0 OR verified IS NULL) AND expires_at > datetime("now")',
    [phone_number, normalizedPhone, otp],
    (err, otpRecord) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!otpRecord) {
        return res.status(400).json({ error: 'Invalid or expired OTP' });
      }

      // Mark OTP as verified
      db.run(
        'UPDATE otp_verifications SET verified = 1 WHERE id = ?',
        [otpRecord.id],
        (updateErr) => {
          if (updateErr) {
            return res.status(500).json({ error: 'Error verifying OTP' });
          }

          // Find user by phone number (using normalized comparison)
          db.all('SELECT * FROM users', (userErr, allUsers) => {
            if (userErr) {
              return res.status(500).json({ error: 'Database error' });
            }

            // Find user by comparing normalized phone numbers
            const user = allUsers.find(u => {
              const userNormalized = normalizePhoneNumber(u.phone_number);
              return userNormalized === normalizedPhone;
            });

            if (!user) {
              return res.status(404).json({ error: 'User not found' });
            }

              // Delete used OTP (using normalized comparison)
              db.all('SELECT phone_number FROM otp_verifications', (otpErr, otps) => {
                if (otps) {
                  otps.forEach(otpRecord => {
                    const otpNormalized = normalizePhoneNumber(otpRecord.phone_number);
                    if (otpNormalized === normalizedPhone) {
                      db.run('DELETE FROM otp_verifications WHERE phone_number = ?', [otpRecord.phone_number]);
                    }
                  });
                }

                // Generate JWT token
              const token = jwt.sign(
                { id: user.id, username: user.username, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
              );

              res.json({
                token,
                user: {
                  id: user.id,
                  username: user.username,
                  email: user.email,
                  phone_number: user.phone_number,
                  role: user.role
                }
              });
            });
          });
        }
      );
    }
  );
});

// Shopkeeper Routes - CRUD Operations on Items
app.get('/api/shopkeeper/items', authenticateToken, isShopkeeper, (req, res) => {
  db.all('SELECT * FROM items ORDER BY created_at DESC', (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching items' });
    }
    res.json(items);
  });
});

app.post('/api/shopkeeper/items', authenticateToken, isShopkeeper, [
  body('name').notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, description, price, category, stock, image_url } = req.body;

  db.run(
    'INSERT INTO items (name, description, price, category, stock, image_url) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description || '', price, category || '', stock, image_url || ''],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating item' });
      }

      db.get('SELECT * FROM items WHERE id = ?', [this.lastID], (err, item) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching created item' });
        }
        res.status(201).json(item);
      });
    }
  );
});

app.put('/api/shopkeeper/items/:id', authenticateToken, isShopkeeper, [
  body('name').notEmpty().withMessage('Item name is required'),
  body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  body('stock').isInt({ min: 0 }).withMessage('Valid stock quantity is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { name, description, price, category, stock, image_url } = req.body;

  db.run(
    'UPDATE items SET name = ?, description = ?, price = ?, category = ?, stock = ?, image_url = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [name, description || '', price, category || '', stock, image_url || '', id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating item' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Item not found' });
      }

      db.get('SELECT * FROM items WHERE id = ?', [id], (err, item) => {
        if (err) {
          return res.status(500).json({ error: 'Error fetching updated item' });
        }
        res.json(item);
      });
    }
  );
});

app.delete('/api/shopkeeper/items/:id', authenticateToken, isShopkeeper, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting item' });
    }

    if (this.changes === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ message: 'Item deleted successfully' });
  });
});

// User Routes - Browse and Order Items
app.get('/api/items', (req, res) => {
  const { category, search } = req.query;
  let query = 'SELECT * FROM items WHERE stock > 0';
  const params = [];

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  if (search) {
    query += ' AND (name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, items) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching items' });
    }
    res.json(items);
  });
});

app.get('/api/items/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM items WHERE id = ?', [id], (err, item) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching item' });
    }

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json(item);
  });
});

app.get('/api/categories', (req, res) => {
  db.all('SELECT DISTINCT category FROM items WHERE category IS NOT NULL AND category != ""', (err, categories) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching categories' });
    }
    res.json(categories.map(c => c.category));
  });
});

app.post('/api/orders', authenticateToken, [
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('delivery_address').notEmpty().withMessage('Delivery address is required')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { items, delivery_address, delivery_fee = 0 } = req.body;
  const userId = req.user.id;
  const deliveryFee = parseFloat(delivery_fee) || 0;

  // Calculate total and validate items
  let totalAmount = 0;
  const orderItems = [];

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    const validateItems = () => {
      return new Promise((resolve, reject) => {
        let processed = 0;
        let hasError = false;

        items.forEach((orderItem) => {
          db.get('SELECT * FROM items WHERE id = ?', [orderItem.item_id], (err, item) => {
            if (err || !item) {
              hasError = true;
              reject(new Error(`Item ${orderItem.item_id} not found`));
              return;
            }

            if (item.stock < orderItem.quantity) {
              hasError = true;
              reject(new Error(`Insufficient stock for ${item.name}`));
              return;
            }

            const itemTotal = item.price * orderItem.quantity;
            totalAmount += itemTotal;
            orderItems.push({ ...orderItem, price: item.price });

            processed++;
            if (processed === items.length && !hasError) {
              resolve();
            }
          });
        });
      });
    };

    validateItems()
      .then(() => {
        // Add delivery fee to total
        const finalTotal = totalAmount + deliveryFee;
        
        // Create order
        db.run(
          'INSERT INTO orders (user_id, total_amount, status, delivery_address, delivery_fee) VALUES (?, ?, ?, ?, ?)',
          [userId, finalTotal, 'pending', delivery_address, deliveryFee],
          function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: 'Error creating order' });
            }

            const orderId = this.lastID;

            // Create order items and update stock
            let itemsProcessed = 0;
            items.forEach((orderItem) => {
              const itemData = orderItems.find(oi => oi.item_id === orderItem.item_id);
              
              db.run(
                'INSERT INTO order_items (order_id, item_id, quantity, price) VALUES (?, ?, ?, ?)',
                [orderId, orderItem.item_id, orderItem.quantity, itemData.price],
                (err) => {
                  if (err) {
                    db.run('ROLLBACK');
                    return res.status(500).json({ error: 'Error creating order items' });
                  }

                  // Update stock
                  db.run(
                    'UPDATE items SET stock = stock - ? WHERE id = ?',
                    [orderItem.quantity, orderItem.item_id],
                    (err) => {
                      if (err) {
                        db.run('ROLLBACK');
                        return res.status(500).json({ error: 'Error updating stock' });
                      }

                      itemsProcessed++;
                      if (itemsProcessed === items.length) {
                        db.run('COMMIT', (err) => {
                          if (err) {
                            return res.status(500).json({ error: 'Error committing transaction' });
                          }

                          db.get('SELECT * FROM orders WHERE id = ?', [orderId], (err, order) => {
                            if (err) {
                              return res.status(500).json({ error: 'Error fetching order' });
                            }
                            res.status(201).json(order);
                          });
                        });
                      }
                    }
                  );
                }
              );
            });
          }
        );
      })
      .catch((error) => {
        db.run('ROLLBACK');
        res.status(400).json({ error: error.message });
      });
  });
});

app.get('/api/orders', authenticateToken, (req, res) => {
  const userId = req.user.id;

  db.all(
    `SELECT o.*, 
     (SELECT json_group_array(json_object('id', oi.id, 'item_id', oi.item_id, 'quantity', oi.quantity, 'price', oi.price, 'name', i.name))
      FROM order_items oi
      JOIN items i ON oi.item_id = i.id
      WHERE oi.order_id = o.id) as items
     FROM orders o
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId],
    (err, orders) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching orders' });
      }

      orders.forEach(order => {
        try {
          order.items = JSON.parse(order.items || '[]');
        } catch (e) {
          order.items = [];
        }
      });

      res.json(orders);
    }
  );
});

// Shopkeeper Routes - Order Management
app.get('/api/shopkeeper/orders', authenticateToken, isShopkeeper, (req, res) => {
  db.all(
    `SELECT o.*, u.username, u.email, u.phone_number,
     COALESCE(
       (SELECT json_group_array(json_object('id', oi.id, 'item_id', oi.item_id, 'quantity', oi.quantity, 'price', oi.price, 'name', i.name))
        FROM order_items oi
        JOIN items i ON oi.item_id = i.id
        WHERE oi.order_id = o.id),
       '[]'
     ) as items
     FROM orders o
     JOIN users u ON o.user_id = u.id
     ORDER BY o.created_at DESC`,
    [],
    (err, orders) => {
      if (err) {
        console.error('Database error fetching orders:', err);
        return res.status(500).json({ error: 'Error fetching orders: ' + err.message });
      }

      if (!orders) {
        return res.json([]);
      }

      const processedOrders = orders.map(order => {
        try {
          const itemsStr = order.items || '[]';
          order.items = typeof itemsStr === 'string' ? JSON.parse(itemsStr) : itemsStr;
        } catch (e) {
          console.error('Error parsing items for order', order.id, ':', e);
          order.items = [];
        }
        return order;
      });

      res.json(processedOrders);
    }
  );
});

app.put('/api/shopkeeper/orders/:id/status', authenticateToken, isShopkeeper, [
  body('status').isIn(['pending', 'processing', 'delivered', 'cancelled']).withMessage('Invalid status')
], (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { status } = req.body;

  db.run(
    'UPDATE orders SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating order status' });
      }

      if (this.changes === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.get(
        `SELECT o.*, u.username, u.email, u.phone_number,
         (SELECT json_group_array(json_object('id', oi.id, 'item_id', oi.item_id, 'quantity', oi.quantity, 'price', oi.price, 'name', i.name))
          FROM order_items oi
          JOIN items i ON oi.item_id = i.id
          WHERE oi.order_id = o.id) as items
         FROM orders o
         JOIN users u ON o.user_id = u.id
         WHERE o.id = ?`,
        [id],
        (err, order) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching updated order' });
          }

          try {
            order.items = JSON.parse(order.items || '[]');
          } catch (e) {
            order.items = [];
          }

          res.json(order);
        }
      );
    }
  );
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

