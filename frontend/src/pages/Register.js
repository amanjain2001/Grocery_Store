import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const Register = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpMessage, setOtpMessage] = useState('');
  const { register } = useAuth();
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
    try {
      const response = await axios.post(`${API_URL}/auth/send-otp`, {
        phone_number: phoneNumber
      });
      
      setOtpSent(true);
      // In production, OTP would be sent via SMS. For testing, it's shown here.
      setOtpMessage(`OTP generated! Your OTP is: ${response.data.otp} (This is for testing - in production, you'll receive it via SMS)`);
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send OTP');
      setOtpSent(false);
      setOtpMessage('');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setError('');
    setOtpMessage('');

    if (!otp || otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setVerifyingOtp(true);
    try {
      await axios.post(`${API_URL}/auth/verify-otp`, {
        phone_number: phoneNumber,
        otp: otp
      });
      
      setOtpVerified(true);
      setOtpMessage('Phone number verified successfully!');
      setError('');
    } catch (error) {
      setError(error.response?.data?.error || 'Invalid OTP');
      setOtpVerified(false);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpVerified) {
      setError('Please verify your phone number with OTP first');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const result = await register(username, email, password, 'user', phoneNumber, otp);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Register</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
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
                    setOtpVerified(false);
                    setOtp('');
                  }}
                  placeholder="+91-9876543210"
                  pattern="[+]?[0-9-]+"
                  required
                  disabled={otpVerified}
                />
              </div>
              {!otpSent && (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  className="btn btn-secondary"
                  disabled={sendingOtp || !phoneNumber.trim()}
                >
                  {sendingOtp ? 'Sending...' : 'Send OTP'}
                </button>
              )}
            </div>
            {otpMessage && (
              <div style={{ 
                marginTop: '10px', 
                padding: '12px', 
                backgroundColor: otpVerified ? '#d1e7dd' : '#fff3cd', 
                border: `2px solid ${otpVerified ? '#4CAF50' : '#ffc107'}`,
                borderRadius: '4px',
                fontSize: '14px',
                color: otpVerified ? '#0f5132' : '#856404',
                fontWeight: otpVerified ? 'normal' : '500'
              }}>
                {otpMessage}
              </div>
            )}
          </div>

          {otpSent && !otpVerified && (
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
                  type="button"
                  onClick={handleVerifyOTP}
                  className="btn btn-secondary"
                  disabled={verifyingOtp || otp.length !== 6}
                >
                  {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
              <small style={{ color: '#666', fontSize: '12px', display: 'block', marginTop: '5px' }}>
                ⏱️ OTP is valid for 10 minutes
              </small>
              <div style={{ 
                marginTop: '10px', 
                padding: '8px', 
                backgroundColor: '#e7f3ff', 
                border: '1px solid #2196F3',
                borderRadius: '4px',
                fontSize: '12px',
                color: '#0b5aa7'
              }}>
                💡 <strong>Note:</strong> In production, you'll receive the OTP via SMS. Currently showing for testing purposes.
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          {error && <div className="error">{error}</div>}
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="auth-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

