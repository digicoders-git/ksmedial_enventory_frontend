import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Swal from 'sweetalert2';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await login(username, password);
      Swal.fire({
        icon: 'success',
        title: 'Login Successful',
        text: 'Redirecting to your dashboard...',
        timer: 1500,
        showConfirmButton: false
      });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Invalid username or password');
      Swal.fire({
        icon: 'error',
        title: 'Login Failed',
        text: err.message || 'Please check your credentials'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 font-sans relative">
       {/* Decorative Background */}
       <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-gray-100 -z-10"></div>
       <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-teal-600 via-emerald-400 to-teal-600"></div>

      <div className="bg-white p-8 md:p-12 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-gray-100 w-full max-w-[420px] transition-all transform hover:scale-[1.01]">
        
        {/* Logo Section */}
        <div className="text-center mb-10">
          <div className="inline-block p-4 rounded-3xl bg-teal-50 mb-4 ring-1 ring-teal-100 shadow-inner">
             <img src="/KS2-Logo.png" alt="Logo" className="w-20 h-20 object-contain" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 tracking-tight uppercase">Inventory Login</h2>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm animate-shake">
            <AlertCircle size={18} />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Shop Username (ID)</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors">
                <User size={18} />
              </div>
              <input 
                required
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your shop ID" 
                className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:text-gray-400 placeholder:font-normal"
              />
            </div>
          </div>

          <div className="space-y-1.5">
             <label className="text-xs font-black text-gray-500 uppercase tracking-widest ml-1">Secure Password</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-teal-600 transition-colors">
                <Lock size={18} />
              </div>
              <input 
                required
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full pl-11 pr-11 py-3.5 bg-gray-50/50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 focus:bg-white outline-none transition-all text-sm font-bold placeholder:text-gray-400 placeholder:font-normal"
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-teal-600 transition-colors p-2"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-teal-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-teal-700 active:scale-[0.98] transition-all shadow-xl shadow-teal-500/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-6 group"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                Sign In Securely
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
