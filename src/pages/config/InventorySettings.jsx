import React, { useState, useEffect } from 'react';
import { Package, Bell, Save, AlertTriangle, Barcode, Edit2, X } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const InventorySettings = () => {
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    
    // Initial State structure matches backend model defaults
    const [settings, setSettings] = useState({
        lowStockThreshold: 10,
        expiryAlertDays: 60,
        enableNegativeStock: false,
        barcodePrefix: 'MED',
        printLabels: true
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/profile');
            if (data.success && data.user.inventorySettings) {
                setSettings(data.user.inventorySettings);
            }
        } catch (error) {
            console.error("Error fetching inventory settings:", error);
            // Silent error mostly, as defaults will show
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        const name = e.target.name;
        
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const payload = {
                inventorySettings: settings 
            };

            const { data } = await api.put('/profile', payload);

            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Updated',
                    text: 'Inventory settings updated successfully.',
                    confirmButtonColor: '#0D9488',
                    timer: 1500,
                    showConfirmButton: false
                });
                setIsEditing(false); // Disable editing after save
            }
        } catch (error) {
             Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Failed to update settings.'
            });
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
        fetchSettings(); // Revert to server state
    };

    if (loading) {
         return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto space-y-6 pb-10">
             {/* Header */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl shadow-sm border border-primary/20">
                        <Package className="text-primary" size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">
                            Inventory Settings
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Configure stock alerts, defaults, and operational rules.</p>
                    </div>
                </div>
                 {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="w-full sm:w-auto px-6 py-3 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                        <Edit2 size={16} strokeWidth={3} /> Edit Settings
                    </button>
                )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors flex flex-col">
                <div className="p-6 space-y-8 flex-1">
                    
                    {/* Alerts Section */}
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                            <Bell className="text-orange-500" size={20} /> Alerts & Notifications
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Low Stock Threshold</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        name="lowStockThreshold"
                                        value={settings.lowStockThreshold}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">UNITS</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">Products falling below this quantity will trigger an alert.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Expiry Warning (Days)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        name="expiryAlertDays"
                                        value={settings.expiryAlertDays}
                                        onChange={handleChange}
                                        disabled={!isEditing}
                                        className="w-full px-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold text-gray-800 dark:text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed" 
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 uppercase tracking-widest">DAYS</span>
                                </div>
                                <p className="text-[10px] text-gray-400 font-medium">Warning period before a batch expires.</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700"></div>

                    {/* General Rules */}
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                            <Barcode className="text-blue-500" size={20} /> Barcode & Identification
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Default Barcode Prefix</label>
                                <input 
                                    type="text" 
                                    name="barcodePrefix"
                                    value={settings.barcodePrefix}
                                    onChange={handleChange}
                                    disabled={!isEditing}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg uppercase text-gray-800 dark:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed" 
                                />
                             </div>
                             
                             <div className="flex items-center gap-4 mt-6">
                                <label className={`flex items-center gap-3 group ${isEditing ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}>
                                    <div className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${settings.printLabels ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}>
                                        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${settings.printLabels ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                    </div>
                                    <input type="checkbox" name="printLabels" checked={settings.printLabels} onChange={handleChange} disabled={!isEditing} className="hidden" />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary transition-colors">Auto-print Labels on Stock Entry</span>
                                </label>
                             </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 dark:border-gray-700"></div>

                     {/* Policy */}
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg mb-4 flex items-center gap-2">
                            <AlertTriangle className="text-red-500" size={20} /> Stock Policy
                        </h3>
                        
                        <label className={`flex items-center gap-3 group p-4 border border-gray-200 dark:border-gray-700 rounded-xl transition-all ${isEditing ? 'hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-900/30 cursor-pointer' : 'cursor-not-allowed opacity-70'}`}>
                             <input type="checkbox" name="enableNegativeStock" checked={settings.enableNegativeStock} onChange={handleChange} disabled={!isEditing} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                             <div>
                                 <span className="font-bold text-gray-800 dark:text-white block">Allow Negative Stock (Billing)</span>
                                 <span className="text-xs text-gray-500 dark:text-gray-400 block">If enabled, you can bill items even if the system shows 0 stock. Stock will go into negative.</span>
                             </div>
                        </label>
                    </div>

                </div>

                {isEditing && (
                    <div className="bg-gray-50 dark:bg-gray-750/50 p-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-gray-100 dark:border-gray-700">
                        <button 
                            onClick={handleCancel}
                            className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-gray-700 text-gray-700 dark:text-white font-black uppercase tracking-widest text-[11px] rounded-xl border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all flex items-center justify-center gap-2"
                        >
                            <X size={18} strokeWidth={3} /> Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            className="w-full sm:w-auto px-8 py-3.5 bg-primary text-white font-black uppercase tracking-widest text-[11px] rounded-xl hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                        >
                            <Save size={18} strokeWidth={3} /> Save Settings
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventorySettings;
