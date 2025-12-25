# Visual Guide - Grocery Delivery Application

## 🎨 Application Overview

The application has a modern, clean design with a green color scheme (#4CAF50) representing freshness and groceries.

## 📱 User Interface Screens

### 1. **Home Page (Landing Page)**
- **Header**: Green navigation bar with "🛒 Grocery Store" logo
- **Welcome Section**: 
  - Large heading: "Welcome to Grocery Store"
  - Subtitle: "Shop fresh groceries delivered to your door"
- **Search & Filter Bar**:
  - Search input field (search by item name/description)
  - Category dropdown (All Categories, Fruits, Vegetables, Dairy, etc.)
- **Item Grid**: 
  - Responsive card layout (3-4 items per row on desktop)
  - Each card shows:
    - Item image (or placeholder emoji 🛒)
    - Item name
    - Description
    - Price in green (₹XX.XX)
    - Stock availability
    - "Add to Cart" button (disabled if out of stock)

### 2. **Login Page**
- Centered white card on light gray background
- Form fields:
  - Username input
  - Password input
  - "Login" button (green)
- Link to register page
- Demo credentials displayed at bottom:
  - Shopkeeper: `shopkeeper` / `shopkeeper123`
  - User: `user` / `user123`

### 3. **Register Page**
- Similar design to login page
- Additional fields:
  - Email input
  - Confirm Password input
- Link to login page

### 4. **Shopping Cart Page**
- **Left Side**: List of cart items
  - Each item shows:
    - Item name
    - Price per unit
    - Stock availability
    - Quantity controls (- / + buttons)
    - Total price for that item
    - "Remove" button
- **Right Side**: Order Summary (sticky)
  - Subtotal
  - Total amount
  - Delivery address textarea
  - "Place Order" button

### 5. **My Orders Page**
- List of all past orders
- Each order card shows:
  - Order number (#ID)
  - Order date/time
  - Status badge (pending/processing/delivered) with color coding
  - List of items with quantities
  - Delivery address
  - Total amount in green (₹XX.XX)

### 6. **Shopkeeper Dashboard**
- **Header**: "Shopkeeper Dashboard" with "Add New Item" button
- **Items Table**: 
  - Columns: ID, Name, Description, Category, Price, Stock, Actions
  - Each row has "Edit" and "Delete" buttons
  - Hover effect on rows
- **Add/Edit Item Modal**:
  - Form fields:
    - Name (required)
    - Description (textarea)
    - Category
    - Price (required, number)
    - Stock (required, number)
    - Image URL
  - "Cancel" and "Create/Update" buttons

## 🎨 Design Elements

### Color Scheme
- **Primary Green**: #4CAF50 (buttons, navbar, prices)
- **Background**: #f5f5f5 (light gray)
- **Cards**: White with subtle shadows
- **Text**: Dark gray (#333) for headings, medium gray (#666) for body

### Typography
- Clean, modern sans-serif font
- Headings: Bold, larger size
- Body text: Regular weight, readable size

### Components
- **Buttons**: Rounded corners, hover effects, disabled states
- **Cards**: White background, rounded corners, box shadows
- **Forms**: Clean inputs with labels, error messages in red
- **Modals**: Centered overlay with white content card

### Responsive Design
- Mobile-friendly layout
- Grid adjusts to screen size
- Navigation collapses on small screens
- Forms stack vertically on mobile

## 🔐 Navigation Bar

**When Logged Out:**
- Logo (left)
- Login | Register (right)

**When Logged In as User:**
- Logo (left)
- Shop | Cart | My Orders | Hello, [username] | Logout (right)

**When Logged In as Shopkeeper:**
- Logo (left)
- Dashboard | Hello, shopkeeper | Logout (right)

## ✨ Interactive Features

1. **Hover Effects**: Cards lift slightly, buttons change color
2. **Loading States**: "Loading..." messages during API calls
3. **Error Messages**: Red text below forms
4. **Success Feedback**: Alerts for successful actions
5. **Empty States**: Friendly messages when no items/orders exist

## 📊 Status Badges (Orders)

- **Pending**: Yellow background (#fff3cd)
- **Processing**: Blue background (#cfe2ff)
- **Delivered**: Green background (#d1e7dd)
- **Cancelled**: Red background (#f8d7da)

---

**The application is now running!**
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

Open your browser and navigate to **http://localhost:3000** to see the application!

