import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AuthPrompt.css';

const AuthPrompt = ({ onClose }) => {
  const navigate = useNavigate();

  const handleLogin = () => {
    onClose();
    navigate('/login');
  };

  const handleRegister = () => {
    onClose();
    navigate('/register');
  };

  return (
    <div className="auth-prompt-overlay" onClick={onClose}>
      <div className="auth-prompt-modal" onClick={(e) => e.stopPropagation()}>
        <div className="auth-prompt-header">
          <h2>Login Required</h2>
          <button className="auth-prompt-close" onClick={onClose}>×</button>
        </div>
        <div className="auth-prompt-content">
          <p>Please login or register to add items to your cart.</p>
        </div>
        <div className="auth-prompt-actions">
          <button className="btn btn-secondary" onClick={handleLogin}>
            Login
          </button>
          <button className="btn btn-primary" onClick={handleRegister}>
            Register
          </button>
          <button className="btn btn-cancel" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPrompt;

