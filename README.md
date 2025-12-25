# Grocery Delivery Application

A full-stack grocery delivery application with separate interfaces for users and shopkeepers.

## Features

### User Features
- Browse grocery items with search and category filtering
- Add items to shopping cart
- Place orders with delivery address
- View order history
- User authentication (login/register)

### Shopkeeper Features
- Full CRUD operations on grocery items
- View all items in a dashboard
- Add new items with details (name, description, price, category, stock, image)
- Edit existing items
- Delete items
- Shopkeeper authentication

## Tech Stack

### Backend
- Node.js
- Express.js
- SQLite (database)
- JWT (authentication)
- bcryptjs (password hashing)

### Frontend
- React
- React Router
- Axios (HTTP client)
- CSS3 (styling)

## Project Structure

```
Grocery_store/
├── backend/
│   ├── server.js          # Express server and API routes
│   ├── package.json       # Backend dependencies
│   └── .env               # Environment variables
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── context/       # Auth context
│   │   ├── pages/         # Page components
│   │   ├── App.js         # Main app component
│   │   └── index.js       # Entry point
│   └── package.json       # Frontend dependencies
└── README.md
```

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional, defaults are provided):
```env
PORT=5000
JWT_SECRET=your-secret-key-change-in-production
```

4. Start the server:
```bash
npm start
# or for development with auto-reload:
npm run dev
```

The backend server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file (optional):
```env
REACT_APP_API_URL=http://localhost:5000/api
```

4. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## Default Accounts

### Shopkeeper Account
- **Username:** `shopkeeper`
- **Password:** `shopkeeper123`
- **Access:** Full CRUD operations on items

### User Account
- **Username:** `user`
- **Password:** `user123`
- **Access:** Browse items, add to cart, place orders

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Shopkeeper Routes (Protected)
- `GET /api/shopkeeper/items` - Get all items
- `POST /api/shopkeeper/items` - Create new item
- `PUT /api/shopkeeper/items/:id` - Update item
- `DELETE /api/shopkeeper/items/:id` - Delete item

### User Routes
- `GET /api/items` - Get available items (with optional category and search filters)
- `GET /api/items/:id` - Get single item details
- `GET /api/categories` - Get all categories
- `POST /api/orders` - Create new order (Protected)
- `GET /api/orders` - Get user's orders (Protected)

## Usage

1. **As a Shopkeeper:**
   - Login with shopkeeper credentials
   - Access the dashboard to manage items
   - Add, edit, or delete grocery items
   - Set prices, stock levels, categories, and images

2. **As a User:**
   - Register a new account or login
   - Browse available grocery items
   - Use search and category filters
   - Add items to cart
   - Place orders with delivery address
   - View order history

## Database

The application uses SQLite database (`grocery.db`) which is automatically created when the server starts. The database includes:

- **users** - User accounts (users and shopkeepers)
- **items** - Grocery items
- **orders** - User orders
- **order_items** - Order line items

## Security Features

- Password hashing with bcrypt
- JWT token-based authentication
- Role-based access control (shopkeeper vs user)
- Protected API routes

## Development

To run both backend and frontend simultaneously, you can use two terminal windows or a process manager like `concurrently`.

## Deployment

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

Quick deployment options:
- **Backend**: Deploy to Heroku, Railway, or Render
- **Frontend**: Deploy to Vercel or Netlify
- **Database**: Use SQLite (small scale) or PostgreSQL (production)

## License

This project is open source and available for educational purposes.

