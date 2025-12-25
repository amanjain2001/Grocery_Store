import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import AuthPrompt from '../components/AuthPrompt';
import './Home.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Home = () => {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const { isAuthenticated } = useAuth();
  const { addToCart, cart } = useCart();
  const { showToast } = useToast();

  useEffect(() => {
    fetchItems();
    fetchCategories();
  }, [selectedCategory, searchTerm]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory) params.category = selectedCategory;
      if (searchTerm) params.search = searchTerm;

      const response = await axios.get(`${API_URL}/items`, { params });
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await axios.get(`${API_URL}/categories`);
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddToCart = (item) => {
    if (!isAuthenticated) {
      setShowAuthPrompt(true);
      return;
    }

    // Check stock before adding
    const existingItem = cart.find(cartItem => cartItem.item_id === item.id);
    if (existingItem && existingItem.quantity >= item.stock) {
      showToast('Cannot add more items. Stock limit reached.', 'error');
      return;
    }

    addToCart(item);
    showToast(`${item.name} added to cart! 🛒`, 'success');
  };

  return (
    <div className="container">
      <div className="home-header">
        <h1>Welcome to Grocery Store</h1>
        <p>Shop fresh groceries delivered to your door</p>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search items..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="">All Categories</option>
          {categories.map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : items.length === 0 ? (
        <div className="no-items">No items found</div>
      ) : (
        <div className="grid">
          {items.map(item => (
            <div key={item.id} className="item-card">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} />
              ) : (
                <div className="item-placeholder">🛒</div>
              )}
              <div className="item-card-content">
                <h3>{item.name}</h3>
                {item.description && <p>{item.description}</p>}
                <div className="item-price">₹{item.price.toFixed(2)}</div>
                <div className="item-stock">Stock: {item.stock}</div>
                <button
                  onClick={() => handleAddToCart(item)}
                  className="btn btn-primary"
                  disabled={item.stock === 0}
                >
                  {item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
      {showAuthPrompt && <AuthPrompt onClose={() => setShowAuthPrompt(false)} />}
    </div>
  );
};

export default Home;

