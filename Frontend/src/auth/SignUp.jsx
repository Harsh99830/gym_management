import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { sendOTP, verifyOTP } from '../utils/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from 'axios';

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
    otp: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const navigate = useNavigate();

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [otpCountdown]);

  const startOtpCountdown = () => {
    setOtpCountdown(60); // 60 seconds countdown
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.mobile) newErrors.mobile = 'Mobile number is required';
    else if (!/^[0-9]{10}$/.test(formData.mobile)) newErrors.mobile = 'Mobile number must be 10 digits';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (showOtpField && !formData.otp) newErrors.otp = 'OTP is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    
    // Basic validation before sending OTP
    if (!formData.email) {
      toast.error('Please enter your email');
      return;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      toast.error('Please enter a valid email');
      return;
    }
    if (!formData.mobile || !/^[0-9]{10}$/.test(formData.mobile)) {
      toast.error('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setIsLoading(true);
      await sendOTP(formData.email);
      
      // Save user data to local storage temporarily
      const userData = {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        password: formData.password
      };
      localStorage.setItem('tempUser', JSON.stringify(userData));
      
      // Redirect to OTP verification page
      navigate('/verify-otp', { 
        state: { 
          email: formData.email,
          from: 'signup' 
        } 
      });
      
    } catch (error) {
      toast.error(error.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpCountdown > 0) return;
    
    try {
      setIsLoading(true);
      await sendOTP(formData.email);
      
      startOtpCountdown();
      toast.success('OTP resent successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to resend OTP');
    } finally {
      setIsLoading(false);
    }
  };

  // This will now be handled in the OTP verification page
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    handleSendOtp(e);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-blue-800 mb-2">Create Account</h2>
              <p className="text-blue-600">Join our fitness community today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-blue-900 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border ${errors.name ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400`}
                  placeholder="Enter your full name"
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-blue-900 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border ${errors.email ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400`}
                  placeholder="Enter your email"
                  required
                />
                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label htmlFor="mobile" className="block text-sm font-medium text-blue-900 mb-1">
                  Mobile Number
                </label>
                <input
                  type="tel"
                  id="mobile"
                  name="mobile"
                  value={formData.mobile}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border ${errors.mobile ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400`}
                  placeholder="Enter your 10-digit mobile number"
                  maxLength="10"
                  required
                />
                {errors.mobile && <p className="mt-1 text-sm text-red-500">{errors.mobile}</p>}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-blue-900 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border ${errors.password ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400`}
                  placeholder="Enter your password"
                  required
                />
                {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-blue-900 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 bg-white border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400`}
                  placeholder="Confirm your password"
                  required
                />
                {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
              </div>

              {showOtpField ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="otp" className="block text-sm font-medium text-blue-900 mb-1">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      className={`w-full px-4 py-3 bg-white border ${errors.otp ? 'border-red-500' : 'border-gray-200'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400`}
                      placeholder="Enter 6-digit OTP"
                      maxLength="6"
                      required
                    />
                    {errors.otp && <p className="mt-1 text-sm text-red-500">{errors.otp}</p>}
                    <div className="mt-2 text-sm text-blue-600">
                      Didn't receive OTP?{' '}
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpCountdown > 0}
                        className="text-blue-700 hover:text-blue-900 font-medium disabled:opacity-50"
                      >
                        {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : 'Resend OTP'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </button>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-blue-600">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-blue-700 hover:text-blue-900 hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUp;