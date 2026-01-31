import React, { useEffect, useState } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Clock, Trash2, Check, Loader2 } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import Swal from 'sweetalert2';

const Notifications = () => {
    const { 
        notifications, 
        unreadCount, 
        loading, 
        fetchNotifications, 
        markAsRead, 
        markAllAsRead, 
        deleteNotification, 
        clearAll 
    } = useNotifications();

    const [activeTab, setActiveTab] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, [fetchNotifications]);

    const getIcon = (type) => {
        switch (type) {
            case 'critical': return <AlertTriangle className="text-red-500" />;
            case 'warning': return <Clock className="text-orange-500" />;
            case 'success': return <CheckCircle className="text-green-500" />;
            default: return <Info className="text-blue-500" />;
        }
    };

    const getBg = (type, read) => {
        if (read) return 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 opacity-75';
        switch (type) {
            case 'critical': return 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30 shadow-sm';
            case 'warning': return 'bg-orange-50 dark:bg-orange-900/10 border-orange-200 dark:border-orange-900/30 shadow-sm';
            default: return 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/30 shadow-sm';
        }
    };

    const formatTime = (date) => {
        if (!date) return '';
        const now = new Date();
        const diff = now - new Date(date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} mins ago`;
        if (hours < 24) return `${hours} hours ago`;
        if (days === 1) return 'Yesterday';
        if (days < 7) return `${days} days ago`;
        return new Date(date).toLocaleDateString();
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        Swal.fire({
            icon: 'success',
            title: 'Marked all as read',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000
        });
    };

    const handleClearAll = async () => {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "You want to clear all notifications?",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, clear all!'
        });

        if (result.isConfirmed) {
            await clearAll();
            Swal.fire('Cleared!', 'Your notifications have been cleared.', 'success');
        }
    };

    // Filtering
    const filteredNotifications = notifications.filter(n => {
        if (activeTab === 'unread') return !n.read;
        if (activeTab === 'critical') return n.type === 'critical';
        if (activeTab === 'system') return n.type === 'info' || n.type === 'success';
        return true;
    });

    if (loading && notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <Loader2 className="animate-spin text-primary" size={48} />
                <p className="mt-4 text-gray-500 font-medium animate-pulse">Loading updates...</p>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="p-4 bg-primary/10 rounded-2xl shadow-sm border border-primary/20 relative">
                        <Bell className="text-primary" size={28} strokeWidth={2.5} />
                        {unreadCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-gray-900 animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none flex items-center gap-3">
                            Notifications
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Stay updated with important system alerts.</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <button 
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="flex-1 xl:flex-none px-5 py-3 text-[11px] font-black uppercase tracking-widest text-primary bg-primary/5 hover:bg-primary/10 dark:hover:bg-primary/20 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
                    >
                        <Check size={18} strokeWidth={3} /> Mark Read
                    </button>
                    <button 
                        onClick={handleClearAll}
                        disabled={notifications.length === 0}
                        className="flex-1 xl:flex-none px-5 py-3 text-[11px] font-black uppercase tracking-widest text-red-500 bg-red-50/50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
                    >
                        <Trash2 size={18} strokeWidth={3} /> Clear All
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="bg-gray-50/50 dark:bg-gray-800/10 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-800 flex overflow-x-auto no-scrollbar gap-2">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: 'Unread' },
                    { id: 'critical', label: 'Critical' },
                    { id: 'system', label: 'System' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 min-w-[100px] xl:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                        ${activeTab === tab.id 
                            ? 'bg-gray-800 dark:bg-primary text-white shadow-lg shadow-black/10 scale-105' 
                            : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100'}`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Notification List */}
            <div className="space-y-4">
                {filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notif) => (
                        <div 
                            key={notif._id} 
                            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start gap-4 transition-all hover:shadow-md cursor-pointer group relative ${getBg(notif.type, notif.read)}`}
                            onClick={() => !notif.read && markAsRead(notif._id)}
                        >
                            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-black/5">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1 w-full">
                                <div className="flex justify-between items-start gap-4">
                                    <h3 className={`font-bold leading-snug ${notif.read ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                                        {notif.title}
                                    </h3>
                                    <div className="flex items-center gap-2 shrink-0">
                                        {!notif.read && (
                                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse"></span>
                                        )}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all xl:opacity-0 xl:group-hover:opacity-100"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className={`text-sm mt-1.5 leading-relaxed ${notif.read ? 'text-gray-400 dark:text-gray-500' : 'text-gray-600 dark:text-gray-300'}`}>
                                    {notif.message}
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                                        <Clock size={12} strokeWidth={3} /> {formatTime(notif.createdAt)}
                                    </p>
                                    {!notif.read && (
                                        <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest flex items-center gap-1">
                                            <Check size={12} strokeWidth={3} /> Tap to read
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 border-dashed animate-fade-in">
                        <div className="mx-auto w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                            <Bell size={24} className="text-gray-300 dark:text-gray-500" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white">No Notifications</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm">You have no {activeTab === 'all' ? '' : activeTab} notifications at the moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Notifications;
