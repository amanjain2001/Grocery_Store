import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import './Cart.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Cart = () => {
  const { cart, updateQuantity, removeFromCart, clearCart } = useCart();
  const [items, setItems] = useState([]);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (cart.length > 0) {
      fetchItemDetails();
    } else {
      setItems([]);
    }
  }, [cart, isAuthenticated, navigate]);

  const fetchItemDetails = async () => {
    if (cart.length === 0) {
      setItems([]);
      return;
    }

    try {
      const itemDetails = await Promise.all(
        cart.map(async (cartItem) => {
          const response = await axios.get(`${API_URL}/items/${cartItem.item_id}`);
          return { ...cartItem, ...response.data };
        })
      );
      setItems(itemDetails);
    } catch (error) {
      console.error('Error fetching item details:', error);
      setItems([]);
    }
  };

  const handleUpdateQuantity = (itemId, newQuantity, oldQuantity) => {
    if (newQuantity <= 0) {
      const item = items.find(i => i.id === itemId);
      removeFromCart(itemId);
      showToast(`${item?.name || 'Item'} removed from cart`, 'info');
      return;
    }

    const item = items.find(i => i.id === itemId);
    if (newQuantity > item.stock) {
      showToast(`Only ${item.stock} items available in stock`, 'error');
      return;
    }

    updateQuantity(itemId, newQuantity);
    
    // Show notification based on whether quantity increased or decreased
    if (newQuantity > oldQuantity) {
      showToast(`Quantity updated: ${item.name} (${newQuantity})`, 'success');
    } else if (newQuantity < oldQuantity) {
      showToast(`Quantity updated: ${item.name} (${newQuantity})`, 'info');
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((total, item) => {
      const cartItem = cart.find(c => c.item_id === item.id);
      return total + (item.price * (cartItem?.quantity || 0));
    }, 0);
  };

  const calculateDeliveryFee = () => {
    const subtotal = calculateSubtotal();
    return subtotal < 250 ? 10 : 0;
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateDeliveryFee();
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!deliveryAddress.trim()) {
      setError('Please enter delivery address');
      return;
    }

    setLoading(true);

    try {
      const orderItems = cart.map(cartItem => ({
        item_id: cartItem.item_id,
        quantity: cartItem.quantity
      }));

      // Calculate delivery fee and totals before placing order
      const subtotal = calculateSubtotal();
      const deliveryFee = calculateDeliveryFee();
      
      await axios.post(`${API_URL}/orders`, {
        items: orderItems,
        delivery_address: deliveryAddress,
        delivery_fee: deliveryFee
      });

      // Calculate total before clearing cart
      const totalAmount = calculateTotal();
      clearCart();
      
      const orderMessage = deliveryFee > 0 
        ? `Order placed successfully! Total: ₹${totalAmount.toFixed(2)} (Subtotal: ₹${subtotal.toFixed(2)} + Delivery: ₹${deliveryFee.toFixed(2)}) 🎉`
        : `Order placed successfully! Total: ₹${totalAmount.toFixed(2)} 🎉`;
      showToast(orderMessage, 'success');
      
      // Navigate after a short delay to show the notification
      setTimeout(() => {
        navigate('/orders');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.error || 'Error placing order');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="container">
      <h1>Shopping Cart</h1>

      {(() => {
        // Check if cart has any items with quantity > 0
        const hasItems = cart.some(cartItem => cartItem.quantity > 0);
        
        if (!hasItems || items.length === 0) {
          return (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <button onClick={() => navigate('/')} className="btn btn-primary">
                Continue Shopping
              </button>
            </div>
          );
        }
        
        // Filter items to only show those with quantity > 0
        const activeItems = items.filter(item => {
          const cartItem = cart.find(c => c.item_id === item.id);
          return cartItem && cartItem.quantity > 0;
        });
        
        if (activeItems.length === 0) {
          return (
            <div className="empty-cart">
              <p>Your cart is empty</p>
              <button onClick={() => navigate('/')} className="btn btn-primary">
                Continue Shopping
              </button>
            </div>
          );
        }
        
        return (
        <div className="cart-content">
          <div className="cart-items">
            {activeItems.map(item => {
              const cartItem = cart.find(c => c.item_id === item.id);
              return (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-info">
                    <h3>{item.name}</h3>
                    <p className="cart-item-price">₹{item.price.toFixed(2)} each</p>
                    <p className="cart-item-stock">Stock: {item.stock}</p>
                  </div>
                  <div className="cart-item-controls">
                    <div className="quantity-controls">
                      <button
                        onClick={() => handleUpdateQuantity(item.id, (cartItem?.quantity || 0) - 1, cartItem?.quantity || 0)}
                        className="btn-quantity"
                      >
                        -
                      </button>
                      <span className="quantity">{cartItem?.quantity || 0}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.id, (cartItem?.quantity || 0) + 1, cartItem?.quantity || 0)}
                        className="btn-quantity"
                        disabled={(cartItem?.quantity || 0) >= item.stock}
                      >
                        +
                      </button>
                    </div>
                    <div className="cart-item-total">
                      ₹{((cartItem?.quantity || 0) * item.price).toFixed(2)}
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item.id);
                        showToast(`${item.name} removed from cart`, 'info');
                      }}
                      className="btn btn-danger"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-summary">
            <div className="card">
              <h2>Order Summary</h2>
              <div className="summary-row">
                <span>Subtotal:</span>
                <span>₹{calculateSubtotal().toFixed(2)}</span>
              </div>
              {calculateDeliveryFee() > 0 && (
                <div className="summary-row">
                  <span>Delivery Fee:</span>
                  <span>₹{calculateDeliveryFee().toFixed(2)}</span>
                </div>
              )}
              {calculateSubtotal() < 250 && calculateDeliveryFee() > 0 && (
                <div className="summary-row" style={{ fontSize: '12px', color: '#666', fontStyle: 'italic' }}>
                  <span>💡 Free delivery on orders above ₹250</span>
                </div>
              )}
              <div className="summary-row total">
                <span>Total:</span>
                <span>₹{calculateTotal().toFixed(2)}</span>
              </div>

              <form onSubmit={handleCheckout}>
                <div className="form-group">
                  <label>Delivery Address</label>
                  <textarea
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    required
                    placeholder="Enter your delivery address"
                  />
                </div>
                {error && <div className="error">{error}</div>}
                <button
                  type="submit"
                  className="btn btn-primary btn-block"
                  disabled={loading || !cart.some(cartItem => cartItem.quantity > 0)}
                >
                  {loading ? 'Placing Order...' : 'Place Order'}
                </button>
              </form>
            </div>
          </div>
        </div>
        );
      })()}
    </div>
  );
};

export default Cart;

