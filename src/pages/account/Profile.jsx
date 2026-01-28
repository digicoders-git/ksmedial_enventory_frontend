import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, X, Briefcase, Calendar, Upload } from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { updateShop } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  
  const [user, setUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'Administrator',
    location: '',
    joinDate: new Date().toISOString(),
    bio: '',
    avatar: ''
  });

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get('/profile');
      if (data.success) {
        const u = data.user;
        setUser(u);
        // Split name for form
        const nameParts = u.name ? u.name.split(' ') : ['',''];
        setFormData({
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: u.email || '',
            phone: u.phone || '',
            bio: u.bio || ''
        });
      }
    } catch (error) {
      console.error(error);
      Swal.fire('Error', 'Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    try {
        const fullName = `${formData.firstName} ${formData.lastName}`.trim();
        const payload = {
            name: fullName,
            email: formData.email,
            phone: formData.phone,
            bio: formData.bio
        };

        const { data } = await api.put('/profile', payload);
        
        if (data.success) {
            setUser(data.user);
            setIsEditing(false);
            Swal.fire({
                title: 'Success',
                text: 'Profile updated successfully!',
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Update failed', 'error');
    }
  };

  const handleImageClick = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('avatar', file);

    try {
        Swal.fire({
            title: 'Uploading...',
            text: 'Please wait while we update your profile picture',
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const { data } = await api.post('/profile/upload-avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        if (data.success) {
            setUser(prev => ({ ...prev, avatar: data.avatar }));
            updateShop({ image: data.avatar }); // Sync with Sidebar
            Swal.fire({
                icon: 'success',
                title: 'Uploaded!',
                text: 'Profile picture updated.',
                timer: 1500,
                showConfirmButton: false
            });
        }
    } catch (error) {
        console.error(error);
        const errMsg = error.response?.data?.message || 'Image upload failed';
        Swal.fire('Error', errMsg, 'error');
    }
  };

  if (loading) {
    return <div className="p-10 text-center">Loading profile...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in-up pb-10">
      {/* Header / Cover */}
      <div className="relative h-48 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className="absolute bottom-6 left-8 z-10">
          <h1 className="text-3xl font-black text-white tracking-tight">My Profile</h1>
          <p className="text-gray-200 font-medium opacity-90">Manage your personal information and preferences</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 -mt-16 px-4">
        
        {/* Left Col: Profile Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700 p-6 flex flex-col items-center text-center relative z-10">
          <div className="relative group">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
              alt="Profile" 
              className="w-32 h-32 rounded-full border-4 border-white dark:border-gray-800 shadow-md object-cover bg-gray-200"
            />
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
            />
            <button 
                onClick={handleImageClick}
                className="absolute bottom-0 right-0 p-2 bg-accent text-white rounded-full shadow-lg hover:bg-teal-700 transition-colors cursor-pointer"
                title="Change Profile Picture"
            >
              <Camera size={18} />
            </button>
          </div>
          
          <h2 className="mt-4 text-xl font-bold text-gray-800 dark:text-gray-100">{user.name}</h2>
          <span className="px-3 py-1 mt-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase rounded-full tracking-wider">
            {user.role}
          </span>
          
          <div className="w-full mt-6 space-y-4 border-t border-gray-200 dark:border-gray-700 pt-6 text-left">
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Mail size={18} className="text-accent" />
              <span className="text-sm">{user.email}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Phone size={18} className="text-accent" />
              <span className="text-sm">{user.phone}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <MapPin size={18} className="text-accent" />
              <span className="text-sm">{user.location || 'Location not set'}</span>
            </div>
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Briefcase size={18} className="text-accent" />
              <span className="text-sm">{user.shopName || 'KS4 PharmaNet Inc.'}</span>
            </div>
             <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400">
              <Calendar size={18} className="text-accent" />
              <span className="text-sm">Member since {new Date(user.joinDate).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        {/* Right Col: Edit Form & Stats */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Stats Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center group hover:shadow-md transition-all">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <Briefcase size={20} />
                </div>
                {/* Placeholder Stats - Ideally fetch from dashboard stats */}
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">Active</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Account</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center group hover:shadow-md transition-all">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <User size={20} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">Verified</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Status</p>
             </div>
             <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center group hover:shadow-md transition-all">
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-full mb-2 group-hover:scale-110 transition-transform">
                    <Calendar size={20} />
                </div>
                <h3 className="text-2xl font-black text-gray-800 dark:text-white">{new Date(user.joinDate).getFullYear()}</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Member Year</p>
             </div>
          </div>

          {/* Edit Form */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-gray-800 dark:text-white">Profile Information</h3>
              <button 
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isEditing 
                  ? 'bg-accent text-white hover:bg-teal-700' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {isEditing ? <><Save size={16} /> Save Changes</> : 'Edit Profile'}
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">First Name</label>
                <input 
                  type="text" 
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-60 focus:ring-2 focus:ring-accent outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Last Name</label>
                 <input 
                  type="text" 
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-60 focus:ring-2 focus:ring-accent outline-none"
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Email Address</label>
                 <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-60 focus:ring-2 focus:ring-accent outline-none"
                />
              </div>
               <div className="space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                 <input 
                  type="text" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-60 focus:ring-2 focus:ring-accent outline-none"
                />
              </div>
              <div className="col-span-1 md:col-span-2 space-y-2">
                <label className="text-xs font-bold text-gray-500 uppercase">Bio</label>
                <textarea 
                  rows="3"
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange} 
                  disabled={!isEditing}
                  placeholder="Tell us about yourself..."
                  className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-100 disabled:opacity-60 focus:ring-2 focus:ring-accent outline-none resize-none"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;
