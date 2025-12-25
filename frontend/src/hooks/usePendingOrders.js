import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const usePendingOrders = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const { isAuthenticated, isShopkeeper } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !isShopkeeper) {
      setPendingCount(0);
      return;
    }

    const fetchPendingOrders = async () => {
      try {
        const response = await axios.get(`${API_URL}/shopkeeper/orders`);
        const pending = response.data.filter(order => order.status === 'pending').length;
        setPendingCount(pending);
      } catch (error) {
        console.error('Error fetching pending orders:', error);
      }
    };

    fetchPendingOrders();
    // Refresh every 10 seconds to get new orders
    const interval = setInterval(fetchPendingOrders, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated, isShopkeeper]);

  return pendingCount;
};

