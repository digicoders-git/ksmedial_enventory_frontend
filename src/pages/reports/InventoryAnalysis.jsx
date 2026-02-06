import React, { useState, useEffect } from 'react';
import api from '../../api/axios'; // Adjust path if needed
import { 
    AlertTriangle, 
    ArrowRight, 
    Calendar, 
    Clock, 
    Package, 
    TrendingDown, 
    TrendingUp, 
    Activity,
    Info
} from 'lucide-react';

const InventoryAnalysis = () => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await api.get('/reports/analysis');
                if (response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching analysis:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-400">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mb-4"></div>
                <p className="font-medium animate-pulse">Analyzing Inventory Dynamics...</p>
            </div>
        );
    }

    if (!data) return <div className="p-10 text-center">Failed to load analysis.</div>;

    const { incomingAnalysis, agingAnalysis, stats } = data;

    return (
        <div className="animate-fade-in-up space-y-8 pb-10">
            {/* Header */}
            <div>
                 <h1 className="text-2xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                    <Activity className="text-indigo-500" /> Inventory Analytics Dashboard
                 </h1>
                 <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm font-medium">Real-time insights on Stock Age, Movement, and Restocking Quality.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Aged Stock (&gt;30 Days)</p>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">{stats.totalAgedItems} <span className="text-xs font-medium text-gray-400">items</span></h3>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Dead Stock</p>
                        <h3 className="text-2xl font-black text-red-600 dark:text-red-400 mt-1">{stats.deadStockItems} <span className="text-xs font-medium text-gray-400">items (0 Sales)</span></h3>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-500">
                        <AlertTriangle size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Slow Movers</p>
                        <h3 className="text-2xl font-black text-yellow-600 dark:text-yellow-400 mt-1">{stats.slowMovingItems} <span className="text-xs font-medium text-gray-400">items (&lt;10 Sales)</span></h3>
                    </div>
                    <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl text-yellow-500">
                        <TrendingDown size={24} />
                    </div>
                </div>
            </div>

            {/* SECTION 1: Incoming Stock Analysis (Today's Arrivals) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-750/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                             <TrendingUp size={20} className="text-emerald-500" /> Today's Arrivals Analysis
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Reviewing performance of SKUs received today.</p>
                    </div>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                        {incomingAnalysis.length} Items Received
                    </span>
                </div>
                
                {incomingAnalysis.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Stock Age</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Sales (30 Days)</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Actionable Insight</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {incomingAnalysis.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                                                item.isOldStock 
                                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                            }`}>
                                                {item.ageDays} Days Old
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-800 dark:text-gray-200">{item.soldLast30} Units</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             {item.isOldStock && item.soldLast30 === 0 ? (
                                                 <span className="text-red-500 text-xs font-bold flex items-center justify-center gap-1"><AlertTriangle size={14}/> Restocking Dead Stock!</span>
                                             ) : item.isOldStock && item.soldLast30 < 10 ? (
                                                 <span className="text-orange-500 text-xs font-bold flex items-center justify-center gap-1"><Info size={14}/> Restocking Slow Mover</span>
                                             ) : item.soldLast30 > 50 ? (
                                                 <span className="text-emerald-500 text-xs font-bold flex items-center justify-center gap-1"><TrendingUp size={14}/> Good Move</span>
                                             ) : (
                                                 <span className="text-gray-400 text-xs font-medium">-</span>
                                             )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 text-center text-gray-400">
                        <Package size={40} className="mx-auto mb-2 opacity-20" />
                        <p>No stock received today to analyze.</p>
                    </div>
                )}
            </div>

             {/* SECTION 2: General Aging Analysis */}
             <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-750/50">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white flex items-center gap-2">
                             <Clock size={20} className="text-orange-500" /> Aging Inventory Report
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Items older than 30 days and their movement.</p>
                    </div>
                    <span className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-xs font-bold text-gray-600 dark:text-gray-300">
                        Top {agingAnalysis.length} Items (Dead/Slow)
                    </span>
                </div>
                
                {agingAnalysis.length > 0 ? (
                    <div className="overflow-x-auto">
                         <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-750 text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider">Product</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Current Stock</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Age</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Sales (30 Days)</th>
                                    <th className="px-6 py-3 font-bold text-xs uppercase tracking-wider text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {agingAnalysis.map((item) => (
                                    <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.sku}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-700 dark:text-gray-300">
                                            {item.stock}
                                        </td>
                                        <td className="px-6 py-4 text-center font-medium text-gray-600 dark:text-gray-400">
                                            {item.ageDays} Days
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-black text-gray-800 dark:text-gray-200">{item.soldLast30}</span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                             {item.status === 'Dead' ? (
                                                 <span className="px-3 py-1 rounded-full bg-red-100 text-red-600 text-[10px] font-black uppercase tracking-widest">Dead Stock</span>
                                             ) : item.status === 'Slow' ? (
                                                  <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-600 text-[10px] font-black uppercase tracking-widest">Slow Moving</span>
                                             ) : (
                                                  <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[10px] font-black uppercase tracking-widest">Active</span>
                                             )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-10 text-center text-gray-400">
                        <Activity size={40} className="mx-auto mb-2 opacity-20" />
                        <p>Inventory healthy. No aged items found.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InventoryAnalysis;
