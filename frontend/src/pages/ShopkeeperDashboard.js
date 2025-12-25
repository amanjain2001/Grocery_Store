import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './ShopkeeperDashboard.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ShopkeeperDashboard = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    image_url: ''
  });
  const [error, setError] = useState('');
  const { isAuthenticated, isShopkeeper } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !isShopkeeper) {
      navigate('/login');
      return;
    }
    fetchItems();
  }, [isAuthenticated, isShopkeeper, navigate]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/shopkeeper/items`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setError('Error fetching items');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingItem) {
        await axios.put(`${API_URL}/shopkeeper/items/${editingItem.id}`, formData);
      } else {
        await axios.post(`${API_URL}/shopkeeper/items`, formData);
      }

      setShowModal(false);
      setEditingItem(null);
      setFormData({
        name: '',
        description: '',
        price: '',
        category: '',
        stock: '',
        image_url: ''
      });
      fetchItems();
    } catch (error) {
      setError(error.response?.data?.error || 'Error saving item');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      category: item.category || '',
      stock: item.stock.toString(),
      image_url: item.image_url || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/shopkeeper/items/${id}`);
      fetchItems();
    } catch (error) {
      setError(error.response?.data?.error || 'Error deleting item');
    }
  };

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      category: '',
      stock: '',
      image_url: ''
    });
    setShowModal(true);
  };

  if (!isAuthenticated || !isShopkeeper) {
    return null;
  }

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Shopkeeper Dashboard</h1>
        <div className="dashboard-actions">
          <Link to="/shopkeeper/orders" className="btn btn-secondary">
            View Orders
          </Link>
          <button onClick={handleAddNew} className="btn btn-primary">
            Add New Item
          </button>
        </div>
      </div>

      {error && <div className="error">{error}</div>}

      {loading ? (
        <div className="loading">Loading items...</div>
      ) : (
        <div className="items-table">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-items">No items found. Add your first item!</td>
                </tr>
              ) : (
                items.map(item => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.name}</td>
                    <td className="description-cell">{item.description || '-'}</td>
                    <td>{item.category || '-'}</td>
                    <td>₹{parseFloat(item.price).toFixed(2)}</td>
                    <td>{item.stock}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(item)}
                        className="btn btn-secondary btn-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="btn btn-danger btn-sm"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <div className="modal-header">
              <h2>{editingItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={() => setShowModal(false)} className="close-btn">
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Category</label>
                <input
                  type="text"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  placeholder="e.g., Fruits, Vegetables, Dairy"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Price *</label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Stock *</label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleInputChange}
                    min="0"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  name="image_url"
                  value={formData.image_url}
                  onChange={handleInputChange}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              {error && <div className="error">{error}</div>}
              <div className="modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopkeeperDashboard;

