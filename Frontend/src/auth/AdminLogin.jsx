
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from "axios";

// Create axios instance with base URL
const api = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/auth`,
  withCredentials: true
});

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Step 1: Check admin email
  const handleEmailVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // First check if admin exists
      const checkRes = await api.post("/check-admin-email", { email });
      // console.log("Admin check response:", checkRes.data);
      
      if (!checkRes.data.found) {
        toast.error("Admin not found");
        setIsLoading(false);
        return;
      }
      
      // If admin exists, send OTP
      await api.post("/admin/send-otp", { email });
      setShowOtp(true);
      toast.success("OTP sent to your email");
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    }
    setIsLoading(false);
  };

  // Step 2: Verify OTP
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const res = await api.post("/admin/verify-otp", { email, otp });
      if ((res.data.message && res.data.message.includes("OTP verified")) || res.data.token) {
        toast.success("Admin verified");
        // Store the authentication token and admin status
        const token = res.data.token || 'admin-authenticated';
        localStorage.setItem('token', token);
        localStorage.setItem('isAdmin', 'true');
        
        // Set a flag to indicate we just logged in
        sessionStorage.setItem('justLoggedIn', 'true');
        
        // Check if there's a redirect URL in the location state
        const from = location.state?.from || '/admin';
        
        // Force a small delay to ensure state is updated
        setTimeout(() => {
          // Use navigate with replace to prevent going back to login
          navigate(from, { replace: true });
          // Force a reload to ensure all components get the updated auth state
          window.location.reload();
        }, 100);
      } else {
        toast.error("Invalid OTP");
      }
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || err.message));
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-xs"
      >
        <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-200">
          <div className="h-2 bg-gradient-to-r from-blue-600 to-blue-400"></div>
          <div className="p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-blue-800 mb-2">Admin Login</h2>
            </div>
        {!showOtp ? (
          <form onSubmit={handleEmailVerify} className="space-y-4">
            <div>
              <label htmlFor="adminEmail" className="block text-sm font-medium text-blue-900 mb-1">Email</label>
              <input
                type="email"
                id="adminEmail"
                name="adminEmail"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                placeholder="Enter admin email"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify Email'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpVerify} className="space-y-4">
            <div>
              <label htmlFor="adminOtp" className="block text-sm font-medium text-blue-900 mb-1">OTP</label>
              <input
                type="text"
                id="adminOtp"
                name="adminOtp"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800 placeholder-gray-400"
                placeholder="Enter OTP"
                required
              />
            </div>
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
            </form>
          )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLogin;
