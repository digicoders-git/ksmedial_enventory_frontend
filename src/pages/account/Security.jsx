import React, { useState, useEffect } from 'react';
import { Shield, Key, Smartphone, Lock, Monitor } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const Security = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [loading, setLoading] = useState(true);
  const [passwordForm, setPasswordForm] = useState({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
  });
  const [sessions, setSessions] = useState([]);

  useEffect(() => {
      fetchSecuritySettings();
  }, []);

  const fetchSecuritySettings = async () => {
      try {
          const { data } = await api.get('/security');
          if (data.success) {
              setTwoFactor(data.twoFactorEnabled);
              setSessions(data.sessions || []);
          }
      } catch (error) {
          console.error('Error fetching security settings:', error);
      } finally {
          setLoading(false);
      }
  };

  const handlePasswordChange = (e) => {
      const { name, value } = e.target;
      setPasswordForm(prev => ({ ...prev, [name]: value }));
  };

  const submitPasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
        Swal.fire('Error', 'New passwords do not match', 'error');
        return;
    }

    if (passwordForm.newPassword.length < 6) {
        Swal.fire('Error', 'Password must be at least 6 characters', 'error');
        return;
    }

    try {
        const { data } = await api.put('/security/password', {
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword
        });

        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Password Updated',
                text: data.message,
                confirmButtonColor: '#0D9488'
            });
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        }
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to update password', 'error');
    }
  };

  const handleTwoFactor = async () => {
    try {
        const { data } = await api.put('/security/2fa');
        if (data.success) {
            setTwoFactor(data.enabled);
            Swal.fire({
                icon: data.enabled ? 'success' : 'info',
                title: data.enabled ? '2FA Enabled' : '2FA Disabled',
                text: data.message,
                confirmButtonColor: '#0D9488'
            });
        }
    } catch (error) {
        Swal.fire('Error', 'Failed to update 2FA settings', 'error');
    }
  };

  if (loading) {
      return <div className="p-8 text-center">Loading security settings...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
          <Shield className="text-accent" /> Security Settings
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your account security and authentication methods.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Change Password */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
            <Key size={18} className="text-gray-400" /> Change Password
          </h2>
          <form onSubmit={submitPasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Current Password</label>
              <input 
                type="password" 
                name="currentPassword"
                value={passwordForm.currentPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••" 
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 focus:ring-2 focus:ring-accent outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">New Password</label>
              <input 
                type="password" 
                name="newPassword"
                value={passwordForm.newPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••" 
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 focus:ring-2 focus:ring-accent outline-none" 
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Confirm New Password</label>
              <input 
                type="password" 
                name="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="••••••••" 
                required
                className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 focus:ring-2 focus:ring-accent outline-none" 
              />
            </div>
            <button type="submit" className="w-full py-2 bg-gray-900 dark:bg-gray-700 text-white rounded-lg hover:bg-black dark:hover:bg-gray-600 font-medium transition-colors">
              Update Password
            </button>
          </form>
        </div>

        {/* 2FA & Devices */}
        <div className="space-y-6">
          
          {/* 2FA */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Smartphone size={18} className="text-gray-400" /> 2-Factor Authentication
                  </h2>
                  <p className="text-xs text-gray-500 mt-1">Add an extra layer of security to your account.</p>
                </div>
                <div onClick={handleTwoFactor} className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors ${twoFactor ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                   <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform ${twoFactor ? 'translate-x-6' : 'translate-x-0'}`}></div>
                </div>
             </div>
             {twoFactor && (
               <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-900/30 rounded-lg flex items-start gap-3">
                  <Lock size={16} className="text-green-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-green-700 dark:text-green-400">2FA is Enabled</p>
                    <p className="text-xs text-green-600 dark:text-green-500">Your account is protected with mobile authentication.</p>
                  </div>
               </div>
             )}
          </div>

          {/* Active Sessions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
              <Monitor size={18} className="text-gray-400" /> Active Sessions
            </h2>
            <div className="space-y-4">
                {sessions.map((session, index) => (
                    <div key={index} className={`flex items-center justify-between ${index !== sessions.length - 1 ? 'pb-3 border-b border-gray-100 dark:border-gray-700' : ''}`}>
                        <div className="flex items-center gap-3">
                        <Monitor className={session.isCurrent ? "text-accent" : "text-gray-400"} />
                        <div>
                            <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{session.device}</p>
                            {session.isCurrent ? (
                                <p className="text-xs text-green-500 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Online Now</p>
                            ) : (
                                <p className="text-xs text-gray-400">Last active: Recently</p>
                            )}
                        </div>
                        </div>
                        <div className="text-right">
                        <p className="text-xs text-gray-500 dark:text-gray-400">{session.location}</p>
                        <p className="text-xs text-gray-400">{session.ip}</p>
                        {!session.isCurrent && (
                            <button className="text-xs text-red-500 font-medium hover:underline ml-2">Revoke</button>
                        )}
                        </div>
                    </div>
                ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Security;
