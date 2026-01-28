import React, { useState } from 'react';
import { Store, Save, Upload, MapPin, Phone, Mail, Globe, CreditCard } from 'lucide-react';
import Swal from 'sweetalert2';

const GeneralSettings = () => {
    const [storeData, setStoreData] = useState({
        name: 'Pharma One',
        tagline: 'Your Trusted Pharmacy Partner',
        address: '123, Healthcare Avenue, Medica City',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400001',
        phone: '+91 9876543210',
        email: 'contact@pharmaone.com',
        website: 'www.pharmaone.com',
        gstin: '27ABCDE1234F1Z5',
        dlNo: 'MH-MZ2-123456'
    });

    const handleChange = (e) => {
        setStoreData({ ...storeData, [e.target.name]: e.target.value });
    };

    const handleSave = () => {
        Swal.fire({
            icon: 'success',
            title: 'Settings Saved',
            text: 'General settings have been updated successfully.',
            timer: 1500,
            showConfirmButton: false
        });
    };

    return (
        <div className="animate-fade-in-up max-w-5xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Store className="text-primary" /> General Store Settings
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage your store profile, contact info, and business details.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Logo & Branding */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-center transition-colors">
                        <div className="w-32 h-32 mx-auto bg-gray-50 dark:bg-gray-700 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 flex items-center justify-center mb-4 relative group">
                            <img src="/KS2-Logo.png" alt="Store Logo" className="w-full h-full object-contain p-2 rounded-full" />
                            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                <Upload className="text-white" size={24} />
                            </div>
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-white">{storeData.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Store Logo</p>
                        <button className="mt-4 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors w-full">
                            Change Logo
                        </button>
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
                                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono uppercase text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Drug License No.</label>
                                <input 
                                    type="text" 
                                    name="dlNo"
                                    value={storeData.dlNo} 
                                    onChange={handleChange}
                                    className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-mono uppercase text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-colors"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Form */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">Business Details</h3>
                    
                    <div className="space-y-4">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Store Name</label>
                                <div className="relative mt-1">
                                    <Store size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        type="text" 
                                        name="name"
                                        value={storeData.name}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all" 
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
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all" 
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
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all" 
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
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                />
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">State</label>
                                <input 
                                    type="text" 
                                    name="state" 
                                    value={storeData.state} 
                                    onChange={handleChange} 
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
                                />
                             </div>
                             <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Pincode</label>
                                <input 
                                    type="text" 
                                    name="pincode" 
                                    value={storeData.pincode} 
                                    onChange={handleChange} 
                                    className="w-full mt-1 px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" 
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all" 
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
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white transition-all" 
                                    />
                                </div>
                             </div>
                         </div>
                         
                         <div className="pt-6 flex justify-end">
                             <button 
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center gap-2"
                             >
                                <Save size={18} /> Save Changes
                             </button>
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GeneralSettings;
