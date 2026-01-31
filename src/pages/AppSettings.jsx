import React, { useState, useEffect } from 'react';
import { 
    Cpu, Moon, Sun, Globe, Database, RotateCw, 
    Bell, Printer, Save, Smartphone, Layout, 
    Monitor, Shield, Keyboard, Zap, Wifi, Loader2
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../api/axios';
import { useTheme } from '../context/ThemeContext';

const AppSettings = () => {
    const { mode, changeMode } = useTheme();
    const [activeTab, setActiveTab] = useState('appearance');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    // Settings State
    const [settings, setSettings] = useState({
        density: 'comfortable',
        language: 'en-US',
        currency: 'INR',
        dateFormat: 'DD-MM-YYYY',
        enableSound: true,
        emailAlerts: true,
        pushNotifications: true,
        printerType: 'thermal-3inch',
        autoPrint: true,
        scannerMode: 'keyboard'
    });

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const { data } = await api.get('/profile');
                if (data.success && data.user.appSettings) {
                    setSettings(data.user.appSettings);
                }
            } catch (error) {
                console.error('Error fetching settings:', error);
            } finally {
                setFetching(false);
            }
        };
        fetchSettings();
    }, []);

    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const { data } = await api.put('/profile', { appSettings: settings });
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Settings Saved',
                    text: 'Application preferences updated successfully',
                    timer: 1500,
                    showConfirmButton: false,
                    toast: true,
                    position: 'top-end'
                });
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            Swal.fire({
                icon: 'error',
                title: 'Save Failed',
                text: error.response?.data?.message || 'Failed to update settings'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleBackup = () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ ...settings, theme: mode }, null, 2));
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute("href", dataStr);
        downloadAnchorNode.setAttribute("download", "app_settings_backup.json");
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
        
        Swal.fire({
            icon: 'success',
            title: 'Backup Created',
            text: 'Settings backup downloaded successfully',
            timer: 2000,
            showConfirmButton: false,
            toast: true,
            position: 'top-end'
        });
    };

    const handleReset = async () => {
        const result = await Swal.fire({
            title: 'Reset All Settings?',
            text: "This will restore default preferences. This action cannot be undone.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, Reset Defaults'
        });

        if (result.isConfirmed) {
            const defaultSettings = {
                language: 'en-US',
                currency: 'INR',
                dateFormat: 'DD-MM-YYYY',
                enableSound: true,
                emailAlerts: true,
                pushNotifications: true,
                printerType: 'thermal-3inch',
                autoPrint: true,
                scannerMode: 'keyboard',
                density: 'comfortable'
            };
            
            try {
                const { data } = await api.put('/profile', { appSettings: defaultSettings });
                if (data.success) {
                    setSettings(defaultSettings);
                    changeMode('light'); 
                    Swal.fire('Reset!', 'Settings restored to defaults.', 'success');
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to reset settings', 'error');
            }
        }
    };

    const tabs = [
        { id: 'appearance', label: 'Appearance', icon: <Monitor size={18} /> },
        { id: 'regional', label: 'Regional', icon: <Globe size={18} /> },
        { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
        { id: 'hardware', label: 'Hardware', icon: <Printer size={18} /> },
        { id: 'system', label: 'System', icon: <Database size={18} /> },
    ];

    if (fetching) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="mt-4 text-gray-500 font-medium">Loading settings...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-6xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl shadow-sm border border-primary/20">
                        <Cpu className="text-primary" size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">
                            Application Settings
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Configure app behavior, appearance, and connectivity.</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                     <button 
                        onClick={handleReset}
                        className="w-full sm:w-auto px-6 py-3 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all shadow-sm active:scale-95"
                    >
                        Reset Defaults
                    </button>
                </div>
            </div>

            {/* Layout Container */}
            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-1.5 flex lg:flex-col overflow-x-auto no-scrollbar gap-1 lg:sticky lg:top-6">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 lg:flex-none min-w-[120px] lg:min-w-0 flex items-center gap-3 px-5 py-3.5 text-[11px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap
                                    ${activeTab === tab.id 
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-[1.02]' 
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-primary dark:hover:text-primary'}`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 space-y-6">
                    
                    {/* Appearance Tab */}
                    {activeTab === 'appearance' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <Layout className="text-primary" size={20} /> Interface Customization
                            </h3>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-3">Theme Preference</label>
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { id: 'light', label: 'Light Mode', icon: <Sun size={24} />, activeColor: 'ring-amber-400 text-amber-500 bg-amber-50 dark:bg-amber-900/20' },
                                            { id: 'dark', label: 'Dark Mode', icon: <Moon size={24} />, activeColor: 'ring-indigo-500 text-indigo-400 bg-gray-800 border-gray-700' },
                                            { id: 'system', label: 'System Default', icon: <Cpu size={24} />, activeColor: 'ring-blue-500 text-blue-500 bg-blue-50 dark:bg-blue-900/20' }
                                        ].map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => changeMode(theme.id)}
                                                className={`p-4 rounded-2xl border flex flex-col items-center gap-2 transition-all outline-none
                                                    ${mode === theme.id 
                                                        ? `ring-2 border-transparent ${theme.activeColor}` 
                                                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                                            >
                                                {theme.icon}
                                                <span className="text-xs font-bold">{theme.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-3">Layout Density</label>
                                    <div className="flex gap-4">
                                         <button 
                                            onClick={() => handleChange('density', 'comfortable')}
                                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${settings.density === 'comfortable' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            Comfortable
                                        </button>
                                        <button 
                                            onClick={() => handleChange('density', 'compact')}
                                            className={`flex-1 py-3 px-4 rounded-xl border text-sm font-medium transition-all ${settings.density === 'compact' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            Compact
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Compact mode reduces padding to show more data in tables.</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Regional Tab */}
                    {activeTab === 'regional' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <Globe className="text-blue-500" size={20} /> Regional Settings
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Display Language</label>
                                    <select 
                                        value={settings.language}
                                        onChange={(e) => handleChange('language', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                                    >
                                        <option value="en-US">English (United States)</option>
                                        <option value="en-IN">English (India)</option>
                                        <option value="hi-IN">Hindi (हिंदी)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Currency Symbol</label>
                                    <select 
                                        value={settings.currency}
                                        onChange={(e) => handleChange('currency', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                                    >
                                        <option value="INR">Indian Rupee (₹)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date Format</label>
                                    <select 
                                        value={settings.dateFormat}
                                        onChange={(e) => handleChange('dateFormat', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                                    >
                                        <option value="DD-MM-YYYY">DD-MM-YYYY (22-01-2024)</option>
                                        <option value="MM-DD-YYYY">MM-DD-YYYY (01-22-2024)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-22)</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Notifications Tab */}
                    {activeTab === 'notifications' && (
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
                            <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <Bell className="text-orange-500" size={20} /> Notification Preferences
                            </h3>
                            <div className="space-y-4">
                                {[
                                    { id: 'enableSound', label: 'Sound Alerts', desc: 'Play a sound for new notifications and errors' },
                                    { id: 'pushNotifications', label: 'Push Notifications', desc: 'Show browser popups even when tab is inactive' },
                                    { id: 'emailAlerts', label: 'Email Reports', desc: 'Receive daily stock and sales reports via email' }
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 transition-colors">
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white text-sm">{item.label}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                                        </div>
                                        <div 
                                            onClick={() => handleToggle(item.id)}
                                            className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings[item.id] ? 'bg-primary' : 'bg-gray-200 dark:bg-gray-600'}`}
                                        >
                                            <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${settings[item.id] ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                         </div>
                    )}

                    {/* Hardware Tab */}
                    {activeTab === 'hardware' && (
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 animate-fade-in transition-colors">
                             <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                <Printer className="text-indigo-500" size={20} /> Peripherals & Hardware
                            </h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Printer Format</label>
                                    <select 
                                        value={settings.printerType}
                                        onChange={(e) => handleChange('printerType', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                                    >
                                        <option value="thermal-3inch">Thermal Receipt (3 inch)</option>
                                        <option value="thermal-2inch">Thermal Receipt (2 inch)</option>
                                        <option value="a4">Laser/Inkjet (A4)</option>
                                        <option value="a5">Laser/Inkjet (A5)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Scanner Input Mode</label>
                                    <select 
                                        value={settings.scannerMode}
                                        onChange={(e) => handleChange('scannerMode', e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-600 rounded-lg outline-none focus:border-primary text-sm text-gray-800 dark:text-white"
                                    >
                                        <option value="keyboard">Keyboard Emulation (Default)</option>
                                        <option value="serial">Serial Port (COM)</option>
                                    </select>
                                </div>
                            </div>

                             <div className="mt-6 flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/30 rounded-xl border border-gray-200 dark:border-gray-600">
                                <div>
                                    <p className="font-bold text-gray-800 dark:text-white text-sm">Auto-Print on Save</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Automatically trigger print dialog after saving an invoice.</p>
                                </div>
                                <div 
                                    onClick={() => handleToggle('autoPrint')}
                                    className={`w-12 h-6 rounded-full p-1 cursor-pointer transition-colors duration-300 ${settings.autoPrint ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-gray-600'}`}
                                >
                                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-300 ${settings.autoPrint ? 'translate-x-6' : 'translate-x-0'}`}></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* System Tab */}
                    {activeTab === 'system' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors">
                                <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                                    <Database className="text-green-600" size={20} /> Data Management
                                </h3>
                                <div className="space-y-4">
                                     <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 text-blue-600 dark:text-blue-400">
                                                <RotateCw size={20} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-gray-800 dark:text-white text-sm">Cloud Synchronization</h4>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Last synced: Just now</p>
                                            </div>
                                        </div>
                                        <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Wifi size={12} /> Connected
                                        </span>
                                    </div>
                                    <button 
                                        onClick={handleBackup}
                                        className="w-full py-2.5 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl text-sm font-bold transition-all"
                                    >
                                        Back Up Data Now
                                    </button>
                                </div>
                            </div>

                             <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-red-50 dark:border-red-900/20 transition-colors">
                                <h3 className="font-bold text-red-600 dark:text-red-500 mb-4 flex items-center gap-2">
                                    <Shield size={20} /> Danger Zone
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                                    Resetting these settings will clear all local cache. This does not delete cloud data.
                                </p>
                                <button 
                                    onClick={handleReset}
                                    className="px-6 py-2.5 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30 rounded-xl text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/20 hover:border-red-200 transition-all w-full md:w-auto"
                                >
                                    Reset Application Settings
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Action Footer */}
                    <div className="flex justify-end pt-6">
                         <button 
                            onClick={handleSave}
                            disabled={loading}
                            className={`w-full sm:w-auto px-10 py-4 bg-primary text-white text-[11px] font-black uppercase tracking-widest rounded-xl shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3
                                ${loading ? 'opacity-70 cursor-wait' : 'hover:bg-secondary active:scale-95'}`}
                        >
                            {loading ? <RotateCw size={20} className="animate-spin" /> : <Save size={20} strokeWidth={3} />}
                            {loading ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default AppSettings;
