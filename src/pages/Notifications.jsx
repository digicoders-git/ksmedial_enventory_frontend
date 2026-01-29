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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Bell className="text-primary" /> Notifications
                        {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                {unreadCount} New
                            </span>
                        )}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Stay updated with important system alerts.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleMarkAllRead}
                        disabled={unreadCount === 0}
                        className="px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary/5 dark:hover:bg-primary/20 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check size={16} /> Mark all read
                    </button>
                    <button 
                        onClick={handleClearAll}
                        disabled={notifications.length === 0}
                        className="px-3 py-1.5 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Trash2 size={16} /> Clear all
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex overflow-x-auto pb-2 gap-2 border-b border-gray-100 dark:border-gray-700">
                {[
                    { id: 'all', label: 'All' },
                    { id: 'unread', label: 'Unread' },
                    { id: 'critical', label: 'Critical Alerts' },
                    { id: 'system', label: 'System Info' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2 rounded-lg text-sm font-bold whitespace-nowrap transition-all ${
                            activeTab === tab.id 
                                ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
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
                            className={`p-4 rounded-xl border flex items-start gap-4 transition-all hover:scale-[1.01] cursor-pointer group relative ${getBg(notif.type, notif.read)}`}
                            onClick={() => !notif.read && markAsRead(notif._id)}
                        >
                            <div className="mt-1 p-2 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                                {getIcon(notif.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h3 className={`font-bold ${notif.read ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>{notif.title}</h3>
                                    {!notif.read && (
                                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                                    )}
                                </div>
                                <p className={`text-sm mt-1 ${notif.read ? 'text-gray-500 dark:text-gray-500' : 'text-gray-700 dark:text-gray-300'}`}>{notif.message}</p>
                                <p className="text-xs text-gray-400 mt-2 font-medium flex items-center gap-1">
                                    <Clock size={12} /> {formatTime(notif.createdAt)}
                                </p>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="opacity-0 group-hover:opacity-100 absolute top-2 right-2 flex bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg p-1 shadow-sm transition-opacity">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); deleteNotification(notif._id); }}
                                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 size={16} />
                                </button>
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
