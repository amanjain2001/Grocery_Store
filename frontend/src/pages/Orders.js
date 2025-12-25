import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatToIST } from '../utils/dateUtils';
import './Orders.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    fetchOrders();
  }, [isAuthenticated, navigate]);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_URL}/orders`);
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container">
      <h1>My Orders</h1>

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : orders.length === 0 ? (
        <div className="no-orders">
          <p>You have no orders yet</p>
          <button onClick={() => navigate('/')} className="btn btn-primary">
            Start Shopping
          </button>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p className="order-date">
                    Placed on {formatToIST(order.created_at)}
                  </p>
                </div>
                <div className="order-status">
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                </div>
              </div>

              <div className="order-items">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>{item.name || `Item ${item.item_id}`}</span>
                      <span>Qty: {item.quantity}</span>
                      <span>₹{(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <p>No items in this order</p>
                )}
              </div>

              <div className="order-footer">
                <div className="order-address">
                  <strong>Delivery Address:</strong> {order.delivery_address}
                </div>
                <div className="order-total">
                  <strong>Total: ₹{parseFloat(order.total_amount).toFixed(2)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Orders;

