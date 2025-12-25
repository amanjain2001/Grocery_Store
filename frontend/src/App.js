import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import ShopkeeperDashboard from './pages/ShopkeeperDashboard';
import ShopkeeperOrders from './pages/ShopkeeperOrders';
import Cart from './pages/Cart';
import Orders from './pages/Orders';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <ToastProvider>
          <Router>
            <div className="App">
              <Navbar />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
              <Route path="/shopkeeper" element={<ShopkeeperDashboard />} />
              <Route path="/shopkeeper/orders" element={<ShopkeeperOrders />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/orders" element={<Orders />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </div>
          </Router>
        </ToastProvider>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;

