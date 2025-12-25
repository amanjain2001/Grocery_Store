import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { formatToIST } from '../utils/dateUtils';
import './ShopkeeperOrders.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ShopkeeperOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // all, pending, processing, delivered, cancelled
  const { isAuthenticated, isShopkeeper } = useAuth();
  const navigate = useNavigate();

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated || !isShopkeeper) {
      console.log('Not authenticated or not shopkeeper');
      return;
    }
    
    try {
      setError('');
      console.log('Fetching orders from:', `${API_URL}/shopkeeper/orders`);
      const response = await axios.get(`${API_URL}/shopkeeper/orders`);
      console.log('Orders response:', response.data);
      setOrders(response.data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      console.error('Error response:', error.response);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to fetch orders';
      setError(errorMessage);
      setOrders([]);
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401 || error.response?.status === 403) {
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isShopkeeper, navigate]);

  useEffect(() => {
    if (!isAuthenticated || !isShopkeeper) {
      navigate('/login');
      return;
    }
    
    fetchOrders();
    // Refresh orders every 10 seconds to get new orders
    const interval = setInterval(fetchOrders, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isShopkeeper, navigate, fetchOrders]);

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`${API_URL}/shopkeeper/orders/${orderId}/status`, {
        status: newStatus
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      alert(error.response?.data?.error || 'Error updating order status');
    }
  };

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter);

  const pendingCount = orders.filter(o => o.status === 'pending').length;

  if (!isAuthenticated || !isShopkeeper) {
    return null;
  }

  return (
    <div className="container">
      <div className="orders-header">
        <h1>Orders Management</h1>
        <div className="orders-stats">
          <div className="stat-card pending">
            <span className="stat-label">Pending Orders</span>
            <span className="stat-value">{pendingCount}</span>
          </div>
        </div>
      </div>

      <div className="filter-tabs">
        <button
          className={filter === 'all' ? 'active' : ''}
          onClick={() => setFilter('all')}
        >
          All ({orders.length})
        </button>
        <button
          className={filter === 'pending' ? 'active' : ''}
          onClick={() => setFilter('pending')}
        >
          Pending ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          className={filter === 'processing' ? 'active' : ''}
          onClick={() => setFilter('processing')}
        >
          Processing ({orders.filter(o => o.status === 'processing').length})
        </button>
        <button
          className={filter === 'delivered' ? 'active' : ''}
          onClick={() => setFilter('delivered')}
        >
          Delivered ({orders.filter(o => o.status === 'delivered').length})
        </button>
        <button
          className={filter === 'cancelled' ? 'active' : ''}
          onClick={() => setFilter('cancelled')}
        >
          Cancelled ({orders.filter(o => o.status === 'cancelled').length})
        </button>
      </div>

      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
          <button onClick={fetchOrders} className="btn btn-primary">
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading">Loading orders...</div>
      ) : filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p>{orders.length === 0 ? 'No orders found. Orders will appear here when customers place them.' : `No ${filter === 'all' ? '' : filter} orders found`}</p>
        </div>
      ) : (
        <div className="orders-list">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card shopkeeper-order">
              <div className="order-header">
                <div>
                  <h3>Order #{order.id}</h3>
                  <p className="order-date">
                    Placed on {formatToIST(order.created_at)}
                  </p>
                  <p className="order-customer">
                    Customer: {order.username} ({order.email})
                  </p>
                  {order.phone_number && (
                    <p className="order-phone">
                      📞 Contact: <a href={`tel:${order.phone_number}`} className="phone-link">{order.phone_number}</a>
                    </p>
                  )}
                </div>
                <div className="order-status-section">
                  <span className={`status-badge status-${order.status}`}>
                    {order.status}
                  </span>
                  <div className="status-actions">
                    {order.status === 'pending' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'processing')}
                          className="btn btn-secondary btn-sm"
                        >
                          Mark Processing
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'cancelled')}
                          className="btn btn-danger btn-sm"
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {order.status === 'processing' && (
                      <button
                        onClick={() => updateOrderStatus(order.id, 'delivered')}
                        className="btn btn-primary btn-sm"
                      >
                        Mark Delivered
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="order-items">
                <h4>Items:</h4>
                {order.items && order.items.length > 0 ? (
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Price</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.name || `Item ${item.item_id}`}</td>
                          <td>{item.quantity}</td>
                          <td>₹{parseFloat(item.price).toFixed(2)}</td>
                          <td>₹{(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p>No items in this order</p>
                )}
              </div>

              <div className="order-footer">
                <div className="order-address">
                  <strong>Delivery Address:</strong> {order.delivery_address}
                </div>
                <div className="order-summary">
                  {order.items && order.items.length > 0 && (
                    <div className="order-breakdown">
                      <div className="breakdown-row">
                        <span>Items Subtotal:</span>
                        <span>₹{order.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0).toFixed(2)}</span>
                      </div>
                      {order.delivery_fee && parseFloat(order.delivery_fee) > 0 && (
                        <div className="breakdown-row delivery-fee">
                          <span>Delivery Charges:</span>
                          <span>₹{parseFloat(order.delivery_fee).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="order-total">
                    <strong>Total: ₹{parseFloat(order.total_amount).toFixed(2)}</strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ShopkeeperOrders;

