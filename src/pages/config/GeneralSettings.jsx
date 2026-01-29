import React, { useState, useEffect } from 'react';
import { Store, Save, Upload, MapPin, Phone, Mail, Globe, CreditCard, User, Edit2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const GeneralSettings = () => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [storeData, setStoreData] = useState({
        shopName: '',
        ownerName: '',
        tagline: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        website: '',
        gstin: '',
        dlNo: '',
        avatar: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/profile');
            if (data.success) {
                const user = data.user;
                setStoreData({
                    shopName: user.shopName || '',
                    ownerName: user.name || '',
                    tagline: user.tagline || '',
                    address: user.address || '',
                    city: user.city || '',
                    state: user.state || '',
                    pincode: user.pincode || '',
                    phone: user.phone || '',
                    email: user.email || '',
                    website: user.website || '',
                    gstin: user.gstin || '',
                    dlNo: user.dlNo || '',
                    avatar: user.avatar || ''
                });
            }
        } catch (error) {
            console.error("Error fetching settings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setStoreData({ ...storeData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            const payload = {
                shopName: storeData.shopName,
                name: storeData.ownerName,
                email: storeData.email,
                phone: storeData.phone,
                tagline: storeData.tagline,
                website: storeData.website,
                address: storeData.address,
                city: storeData.city,
                state: storeData.state,
                pincode: storeData.pincode,
                gstin: storeData.gstin,
                dlNo: storeData.dlNo,
            };

            const { data } = await api.put('/profile', payload);
            
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Settings Saved',
                    text: 'General settings have been updated successfully.',
                    timer: 1500,
                    showConfirmButton: false
                });
                setIsEditing(false); // Disable editing mode after save
                fetchSettings(); 
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to save settings', 'error');
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchSettings(); // Revert changes
    };

    const handleImageUpload = async (e) => {
        if (!isEditing) return; // Prevent upload if not editing

        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('avatar', file);

        try {
            const { data } = await api.post('/profile/upload-avatar', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (data.success) {
                setStoreData(prev => ({ ...prev, avatar: data.avatar }));
                Swal.fire('Success', 'Logo updated successfully', 'success');
            }
        } catch (error) {
           Swal.fire('Error', 'Failed to upload logo', 'error');
        }
    };

    if (loading) {
         return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-5xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Store className="text-primary" /> General Store Settings
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your store profile, contact info, and business details.</p>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-2"
                    >
                        <Edit2 size={16} /> Edit Settings
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Logo & Branding */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors">
                        <div className={`w-32 h-32 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4 relative group overflow-hidden ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}>
                            {storeData.avatar ? (
                                <img src={storeData.avatar} alt="Store Logo" className="w-full h-full object-cover rounded-full" />
                            ) : (
                                <Store size={40} className="text-gray-400" />
                            )}
                            
                            {isEditing && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <label htmlFor="logo-upload" className="cursor-pointer">
                                        <Upload className="text-white" size={24} />
                                    </label>
                                </div>
                            )}
                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={!isEditing} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{storeData.shopName || 'Store Name'}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Store Logo</p>
                        
                        {isEditing && (
                            <label htmlFor="logo-upload" className="mt-4 block w-full px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer">
                                Change Logo
                            </label>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                        <h4 className="font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                            <CreditCard size={18} className="text-primary" /> Legal Info
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">GSTIN</label>
                                <input 
                                    type="text" 
                                    name="gstin"
                                    value={storeData.gstin} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono uppercase text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Drug License No.</label>
                                <input 
                                    type="text" 
                                    name="dlNo"
                                    value={storeData.dlNo} 
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono uppercase text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex flex-col h-full">
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">Business Details</h3>
                    
                    <div className="space-y-4 flex-1">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Store Name</label>
                                <div className="relative mt-1">
                                    <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        name="shopName"
                                        value={storeData.shopName}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                        placeholder="E.g. Pharma One"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tagline</label>
                                <input 
                                    type="text" 
                                    name="tagline"
                                    value={storeData.tagline}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                    placeholder="Your business slogan"
                                />
                            </div>
                         </div>
                         
                         {/* Owner Name */}
                         <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner Name</label>
                             <div className="relative mt-1">
                                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="ownerName"
                                    value={storeData.ownerName}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                            </div>
                         </div>

                         <div>
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Address Line</label>
                             <div className="relative mt-1">
                                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="text" 
                                    name="address"
                                    value={storeData.address}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                            </div>
                         </div>

                         <div className="grid grid-cols-3 gap-4">
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                                <input 
                                    type="text" 
                                    name="city" 
                                    value={storeData.city} 
                                    onChange={handleChange} 
                                    disabled={!isEditing}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                                <input 
                                    type="text" 
                                    name="state" 
                                    value={storeData.state} 
                                    onChange={handleChange} 
                                    disabled={!isEditing}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pincode</label>
                                <input 
                                    type="text" 
                                    name="pincode" 
                                    value={storeData.pincode} 
                                    onChange={handleChange} 
                                    disabled={!isEditing}
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                             </div>
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Contact Number</label>
                                <div className="relative mt-1">
                                    <Phone size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        name="phone"
                                        value={storeData.phone}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                    />
                                </div>
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                                <div className="relative mt-1">
                                    <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={storeData.email}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                    />
                                </div>
                             </div>
                         </div>

                          <div>
                             <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Website</label>
                             <div className="relative mt-1">
                                 <Globe size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                 <input 
                                     type="text" 
                                     name="website" 
                                     value={storeData.website} 
                                     onChange={handleChange} 
                                     disabled={!isEditing}
                                     className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                     placeholder="www.yourpharmacy.com"
                                 />
                             </div>
                          </div>
                         
                         {isEditing && (
                             <div className="pt-6 flex justify-end gap-3 mt-auto">
                                 <button 
                                    onClick={handleCancel}
                                    className="px-6 py-2.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-bold rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center gap-2"
                                 >
                                    <X size={18} /> Cancel
                                 </button>
                                 <button 
                                    onClick={handleSave}
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                                 >
                                    <Save size={18} /> Save Changes
                                 </button>
                             </div>
                         )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
