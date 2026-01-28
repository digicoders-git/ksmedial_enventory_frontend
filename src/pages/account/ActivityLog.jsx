import React, { useState, useEffect } from 'react';
import { Activity, User, Settings, Database, AlertCircle, LogIn, FileText, Search, Calendar, Shield } from 'lucide-react';
import api from '../../api/axios';

const ActivityLog = () => {
  const [filter, setFilter] = useState('All');
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchActivities();
  }, [filter]); // Re-fetch when filter changes

  const fetchActivities = async () => {
    try {
        setLoading(true);
        const { data } = await api.get(`/activity?type=${filter}&pageNumber=${page}`);
        if(data.activities) {
             setActivities(data.activities);
        }
    } catch (error) {
        console.error("Failed to load activities", error);
    } finally {
        setLoading(false);
    }
  };

  const getIcon = (type) => {
      switch(type) {
          case 'Auth': return <LogIn size={16} />;
          case 'Settings': return <Settings size={16} />;
          case 'System': return <Database size={16} />;
          case 'Profile': return <User size={16} />;
          case 'Inventory': return <FileText size={16} />;
          case 'Security': return <Shield size={16} />;
          default: return <Activity size={16} />;
      }
  };

  const getColor = (type) => {
    switch(type) {
        case 'Auth': return 'text-green-500 bg-green-100 dark:bg-green-900/20';
        case 'Settings': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
        case 'System': return 'text-purple-500 bg-purple-100 dark:bg-purple-900/20';
        case 'Profile': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
        case 'Inventory': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
        default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Activity className="text-accent" /> Activity Log
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Track all recent activities and system events.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input type="text" placeholder="Search logs..." className="pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-accent" />
           </div>
           <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
             <Calendar size={16} /> Filter Date
           </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-2 overflow-x-auto">
          {['All', 'Auth', 'Settings', 'System', 'Inventory', 'Profile'].map(tab => (
            <button 
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                filter === tab 
                ? 'bg-accent text-white shadow-md shadow-accent/20' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="divide-y divide-gray-50 dark:divide-gray-700">
          {loading ? (
              <div className="p-8 text-center text-gray-500">Loading activities...</div>
          ) : activities.length > 0 ? (
            activities.map((log) => (
                <div key={log._id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-750/50 transition-colors flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getColor(log.type)} bg-opacity-20`}>
                    {getIcon(log.type)}
                </div>
                <div className="flex-1">
                    <div className="flex justify-between items-start">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        <span className="font-bold text-gray-900 dark:text-white mr-1">{log.user}</span> 
                        {log.action}
                    </p>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{formatDate(log.createdAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{log.type} Event • IP: {log.ip || 'N/A'}</p>
                    {log.details && <p className="text-xs text-gray-400 italic mt-1">{log.details}</p>}
                </div>
                </div>
            ))
          ) : (
              <div className="p-8 text-center text-gray-500">No activity logs found.</div>
          )}
        </div>
        
        <div className="p-4 border-t border-gray-100 dark:border-gray-700 text-center">
          <button className="text-sm text-accent font-bold hover:underline">Load More Logs</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;
