import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const { login, sendLoginOTP, isShopkeeper } = useAuth();
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setOtpMessage('');

    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }

    setSendingOtp(true);
    const result = await sendLoginOTP(phoneNumber);
    setSendingOtp(false);

    if (result.success) {
      setOtpSent(true);
      // In production, OTP would be sent via SMS. For testing, it's shown here.
      setOtpMessage(`OTP generated! Your OTP is: ${result.data.otp || 'Check console'} (This is for testing - in production, you'll receive it via SMS)`);
      setError('');
    } else {
      setError(result.error);
      setOtpSent(false);
      setOtpMessage('');
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setOtpMessage('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    const result = await login(phoneNumber, otp);
    setVerifyingOtp(false);

    if (result.success) {
      if (isShopkeeper) {
        navigate('/shopkeeper');
      } else {
        navigate('/');
      }
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Login</h2>
        
        {!otpSent ? (
          <form onSubmit={handleSendOTP}>
            <div className="form-group">
              <label>Phone Number *</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      setOtpSent(false);
                      setOtp('');
                    }}
                    placeholder="+91-9876543210"
                    pattern="[+]?[0-9-]+"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-secondary"
                  disabled={sendingOtp || !phoneNumber.trim()}
                >
                  {sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            {otpMessage && (
              <div style={{ 
                marginTop: '10px', 
                padding: '12px', 
                backgroundColor: '#fff3cd', 
                border: '2px solid #ffc107',
                borderRadius: '4px',
                fontSize: '14px',
                color: '#856404',
                fontWeight: '500'
              }}>
                {otpMessage}
              </div>
            )}
          </form>
        ) : (
          <form onSubmit={handleLogin}>
            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="tel"
                value={phoneNumber}
                disabled
                style={{ backgroundColor: '#f5f5f5' }}
              />
            </div>
            <div className="form-group">
              <label>Enter OTP *</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Enter 6-digit OTP"
                    maxLength="6"
                    pattern="[0-9]{6}"
                    required
                    style={{ fontSize: '18px', letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={verifyingOtp || otp.length !== 6}
                >
                  {verifyingOtp ? 'Logging in...' : 'Login'}
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                ⏱️ OTP is valid for 10 minutes
              </small>
              <div style={{ 
                marginTop: '10px', 
                padding: '10px', 
                backgroundColor: '#e7f3ff', 
                border: '1px solid #2196F3',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#0b5aa7'
              }}>
                💡 <strong>Note:</strong> Currently in testing mode - OTP is displayed here. In production, you'll receive it via SMS on your phone.
              </div>
            </div>
            {error && <div className="error">{error}</div>}
            <button
              type="button"
              onClick={() => {
                setOtpSent(false);
                setOtp('');
                setOtpMessage('');
                setError('');
              }}
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '10px' }}
            >
              Change Phone Number
            </button>
          </form>
        )}

        <p className="auth-link">
          Don't have an account? <Link to="/register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

