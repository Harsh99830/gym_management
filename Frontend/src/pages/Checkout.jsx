import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiCheckCircle, FiTag, FiCreditCard, FiUser, FiMail, FiPhone, FiCheck, FiLoader } from 'react-icons/fi';
import { motion } from 'framer-motion';
import { createCashfreeSession } from '../utils/payment';
import { getCouponByCode } from '../utils/api';
import { toast } from 'react-hot-toast';
import { Input, Button } from 'antd';

// Function to load Cashfree script
const loadCashfreeScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }

    // If already loaded, resolve immediately
    if (window.Cashfree) {
      resolve();
      return;
    }

    // If script is already being loaded, wait for it
    if (window.cashfreeScriptLoading) {
      const checkInterval = setInterval(() => {
        if (window.Cashfree) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
      return;
    }

    // Mark script as loading
    window.cashfreeScriptLoading = true;
    
    const script = document.createElement('script');
    script.id = 'cashfree-script';
    script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
    script.async = true;
    
    script.onload = () => {
      window.cashfreeScriptLoading = false;
      console.log('Cashfree script loaded successfully');
      resolve();
    };
    
    script.onerror = (error) => {
      window.cashfreeScriptLoading = false;
      console.error('Failed to load Cashfree script:', error);
      reject(new Error('Failed to load payment processor'));
    };
    
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { plan } = location.state || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  if (!plan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No Plan Selected</h2>
          <p className="text-gray-600 mb-6">Please select a plan to proceed to checkout.</p>
          <Button 
            type="primary" 
            onClick={() => navigate('/plan')}
            className="w-full sm:w-auto"
          >
            View Plans
          </Button>
        </div>
      </div>
    );
  }

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setIsApplyingCoupon(true);
    setCouponError('');

    try {
      const coupon = await getCouponByCode(couponCode.trim().toUpperCase());
      
      let discountAmount = 0;
      let finalAmount = plan.amount;
      
      if (coupon.discountType === 'percentage') {
        discountAmount = Math.round((plan.amount * parseFloat(coupon.discount)) / 100);
        finalAmount = plan.amount - discountAmount;
      } else {
        discountAmount = parseFloat(coupon.discount);
        finalAmount = Math.max(0, plan.amount - discountAmount);
      }

      setAppliedCoupon({
        ...coupon,
        discountAmount,
        finalAmount,
        originalAmount: plan.amount
      });

      toast.success(`Coupon applied! You saved ₹${discountAmount.toLocaleString()}`);
    } catch (error) {
      console.error('Error applying coupon:', error);
      setCouponError(error.message || 'Invalid or expired coupon code');
      toast.error('Invalid or expired coupon code');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  useEffect(() => {
    // Load Cashfree script when component mounts
    loadCashfreeScript();
  }, []);

  const processPayment = async () => {
    if (!plan) return;
    
    setIsProcessing(true);
    
    try {
      // Ensure Cashfree script is loaded
      await loadCashfreeScript();
      
      // Get user data from localStorage
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Calculate final amount (after any applied coupon)
      const finalAmount = appliedCoupon?.finalAmount || plan.amount;
      
      // Prepare payment data
      const orderId = 'order_' + Date.now();
      const orderAmount = finalAmount; // Use the final amount after discount
      const customerName = userData?.name || 'Guest User';
      const customerEmail = userData?.email || 'guest@example.com';
      const customerPhone = userData?.mobile || '9999999999';
      const returnUrl = window.location.origin + '/payment-status';
      
      console.log('Order amount after discount:', orderAmount);

      console.log('Creating payment session...');
      
      // Create payment session
      const response = await createCashfreeSession({
        orderId,
        orderAmount,
        customerName,
        customerEmail,
        customerPhone,
        returnUrl,
        planId: plan._id,
        planType: plan.planType || 'membership',
        planAmount: plan.amount, // Original amount before discount
        planDuration: plan.duration || 1,
        couponCode: appliedCoupon?.code || plan.couponCode || '',
        discountAmount: appliedCoupon?.discountAmount || 0, // Pass discount amount
        finalAmount: orderAmount // Pass final amount after discount
      });

      console.log('Payment session created:', response);
      
      if (!response || !response.paymentSessionId) {
        throw new Error('Invalid response from payment server');
      }

      // Ensure Cashfree is available
      if (!window.Cashfree) {
        throw new Error('Payment processor not available');
      }

      console.log('Initializing payment checkout...');
      
      // Initialize Cashfree payment for v3
      const cashfree = new window.Cashfree({
        mode: 'sandbox' // or 'production' for live environment
      });
      
      // Create Checkout form
      const checkoutOptions = {
        paymentSessionId: response.paymentSessionId,
        redirectTarget: '_self', // or '_blank' to open in new tab
        onSuccess: (data) => {
          console.log('Payment successful', data);
          // The actual success handling is done in PaymentStatus component
        },
        onFailure: (data) => {
          console.error('Payment failed', data);
          toast.error('Payment failed. Please try again.');
          setIsProcessing(false);
        },
        onClose: () => {
          console.log('Payment window closed');
          setIsProcessing(false);
        }
      };
      
      // Start payment
      cashfree.checkout(checkoutOptions);

    } catch (error) {
      console.error('Error during payment:', error);
      toast.error(error.message || 'Failed to process payment');
      setIsProcessing(false);
    }
  };

  const handleGetStarted = async () => {
    if (!plan) {
      toast.error('No plan selected');
      navigate('/plan');
      return;
    }
    
    await processPayment();
  };

  const finalAmount = appliedCoupon ? appliedCoupon.finalAmount : plan.amount;
  const discountAmount = appliedCoupon?.discountAmount || 0;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-6 transition-colors"
        >
          <FiArrowLeft className="mr-2" /> Back to Plans
        </button>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-8">Complete Your Purchase</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Order Summary */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-900">{plan.name}</h3>
                        <p className="text-sm text-gray-500">
                          {plan.duration} {plan.duration > 1 ? 'months' : 'month'} membership
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">₹{plan.amount.toLocaleString()}</p>
                        {plan.duration > 1 && (
                          <p className="text-xs text-gray-500">
                            ₹{(plan.amount / plan.duration).toFixed(2)}/month
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Coupon Section */}
                    <div className="pt-4 mt-4 border-t border-gray-200">
                      {!appliedCoupon ? (
                        <div className="flex gap-2">
                          <div className="flex-1">
                            <Input
                              prefix={<FiTag className="text-gray-400" />}
                              placeholder="Enter coupon code"
                              value={couponCode}
                              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                              className="flex-1 uppercase"
                              size="large"
                              onPressEnter={handleApplyCoupon}
                              disabled={isApplyingCoupon || !!appliedCoupon}
                              style={{ textTransform: 'uppercase' }}
                            />
                          </div>
                          <Button 
                            onClick={handleApplyCoupon}
                            loading={isApplyingCoupon}
                            className="whitespace-nowrap"
                          >
                            Apply
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center bg-green-50 p-3 rounded-md">
                          <div className="flex items-center">
                            <FiCheckCircle className="text-green-500 mr-2" />
                            <span className="text-sm text-green-700">
                              Coupon {appliedCoupon.code} applied (-₹{discountAmount.toLocaleString()})
                            </span>
                          </div>
                          <button 
                            onClick={() => setAppliedCoupon(null)}
                            className="text-sm text-green-600 hover:text-green-800"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {couponError && (
                        <p className="mt-1 text-sm text-red-600">{couponError}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Payment Method
                <div className="bg-gray-50 rounded-lg p-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Method</h2>
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="p-4 bg-white border-b border-gray-200 flex items-center">
                      <FiCreditCard className="text-blue-500 mr-3" />
                      <span className="font-medium">Credit/Debit Card</span>
                    </div>
                    <div className="p-4 bg-gray-50">
                      <p className="text-sm text-gray-500">
                        You'll be redirected to a secure payment page to complete your purchase.
                      </p>
                    </div>
                  </div>
                </div> */}
              </div>
              
              {/* Order Total */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6 sticky top-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Order Total</h2>
                  
                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subtotal</span>
                      <span>₹{plan.amount.toLocaleString()}</span>
                    </div>
                    
                    {appliedCoupon && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-₹{discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="border-t border-gray-200 pt-3 mt-3">
                      <div className="flex justify-between font-medium text-gray-900">
                        <span>Total</span>
                        <div className="text-right">
                          <div className="text-xl">₹{finalAmount.toLocaleString()}</div>
                          {plan.duration > 1 && (
                            <div className="text-sm text-gray-500">
                              ₹{(finalAmount / plan.duration).toFixed(2)}/month
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    type="primary" 
                    size="large" 
                    block
                    onClick={handleGetStarted}
                    loading={isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 h-12"
                    icon={!isProcessing && <FiCheckCircle className="text-lg" />}
                  >
                    {isProcessing ? 'Processing...' : 'Checkout'}
                  </Button>
                  
                  <p className="mt-4 text-xs text-gray-500 text-center">
                    By completing your purchase, you agree to our Terms of Service and Privacy Policy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
