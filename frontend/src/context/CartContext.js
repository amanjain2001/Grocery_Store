import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cart]);

  const addToCart = (item) => {
    setCart(prevCart => {
      const existingItem = prevCart.find(cartItem => cartItem.item_id === item.id);
      
      if (existingItem) {
        // Check if we can add more
        if (existingItem.quantity >= item.stock) {
          alert('Cannot add more items. Stock limit reached.');
          return prevCart;
        }
        return prevCart.map(cartItem =>
          cartItem.item_id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      } else {
        return [...prevCart, { item_id: item.id, name: item.name, price: item.price, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setCart(prevCart =>
      prevCart.map(cartItem =>
        cartItem.item_id === itemId
          ? { ...cartItem, quantity: newQuantity }
          : cartItem
      )
    );
  };

  const removeFromCart = (itemId) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item_id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('cart');
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    getCartItemCount
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

