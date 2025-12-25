import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { usePendingOrders } from '../hooks/usePendingOrders';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isShopkeeper } = useAuth();
  const { getCartItemCount } = useCart();
  const pendingOrdersCount = usePendingOrders();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          🛒 Grocery Store
        </Link>
        <div className="navbar-links">
          {user ? (
            <>
              {isShopkeeper ? (
                <>
                  <Link to="/shopkeeper" className="navbar-link">
                    Dashboard
                  </Link>
                  <Link to="/shopkeeper/orders" className="navbar-link cart-link">
                    Orders
                    {pendingOrdersCount > 0 && (
                      <span className="cart-badge">{pendingOrdersCount}</span>
                    )}
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/" className="navbar-link">
                    Shop
                  </Link>
                  <Link to="/cart" className="navbar-link cart-link">
                    Cart
                    {getCartItemCount() > 0 && (
                      <span className="cart-badge">{getCartItemCount()}</span>
                    )}
                  </Link>
                  <Link to="/orders" className="navbar-link">
                    My Orders
                  </Link>
                </>
              )}
              <span className="navbar-user">Hello, {user.username}</span>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="navbar-link">
                Login
              </Link>
              <Link to="/register" className="navbar-link">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

