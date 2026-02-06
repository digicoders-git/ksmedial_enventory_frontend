import React, { useState, useEffect } from 'react';
import { Package, AlertTriangle, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Filter, Download, Calendar, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import api from '../../api/axios';

const InventoryReport = () => {
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        stats: {
            totalItems: 0,
            totalValue: 0,
            lowStock: 0,
            nearExpiry: 0
        },
        categoryData: [],
        lowStockItems: [],
        expiryItems: []
    });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (dateRange.start) params.append('startDate', dateRange.start);
                if (dateRange.end) params.append('endDate', dateRange.end);
                
                const response = await api.get(`/reports/inventory?${params.toString()}`);
                if (response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching inventory report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [dateRange]);

    const { stats, categoryData, lowStockItems, expiryItems } = data;

    const handleViewReport = () => {
        navigate('/reports/inventory/view');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-20 min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Package className="text-primary" /> Inventory Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Comprehensive analysis of stock levels, valuation, and health.</p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Calendar size={16} /> 
                        {dateRange.start ? `${dateRange.start} - ${dateRange.end || '...'}` : 'Filter Date'}
                    </button>
                     <button 
                        onClick={handleViewReport}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
                    >
                        <Download size={16} /> Preview & Download PDF
                    </button>
                </div>
            </div>

            {/* Date Filter Panel */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-end gap-4 animate-fade-in">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                        <input 
                            type="date" 
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                        <input 
                            type="date" 
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => {
                                // Logic to apply filter would go here
                                setShowFilters(false);
                            }}
                            className="px-4 py-2 bg-gray-800 dark:bg-primary text-white rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-secondary transition-colors"
                        >
                            Apply Filter
                        </button>
                        <button 
                            onClick={() => {
                                setDateRange({ start: '', end: '' });
                                setShowFilters(false);
                            }}
                            className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Clear Filter"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Stock Value</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{(stats.totalValue/100000).toFixed(2)} Lakh</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Layers size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Items</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalItems}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Package size={20} />
                        </div>
                    </div>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Low Stock Alerts</p>
                            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.lowStock}</h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Near Expiry</p>
                            <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.nearExpiry}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Valuation */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-gray-400 dark:text-gray-500" /> Stock by Category
                    </h3>
                    <div className="space-y-5">
                        {categoryData.map((cat) => (
                            <div key={cat.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">₹{cat.value.toLocaleString()} ({cat.percent}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                     <div 
                                        className="bg-primary h-2.5 rounded-full" 
                                        style={{ width: `${cat.percent}%` }}
                                     ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Critical Alerts */}
                <div className="space-y-6">
                    {/* Low Stock Table */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <TrendingDown size={18} /> Critical Low Stock
                            </h3>
                            <button className="text-xs text-primary font-bold hover:underline">View All</button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
                                    <tr>
                                        <th className="px-3 py-2 rounded-l-lg">Item Name</th>
                                        <th className="px-3 py-2">Current</th>
                                        <th className="px-3 py-2 rounded-r-lg">Min Lvl</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {lowStockItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-200">{item.name}</td>
                                            <td className="px-3 py-3 font-bold text-red-600 dark:text-red-400">{item.stock}</td>
                                            <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{item.min}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>

                    {/* Expiry Table */}
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                <AlertTriangle size={18} /> Expiring Soon (30 Days)
                            </h3>
                            <button className="text-xs text-primary font-bold hover:underline">View All</button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
                                    <tr>
                                        <th className="px-3 py-2 rounded-l-lg">Item Name</th>
                                        <th className="px-3 py-2">Batch</th>
                                        <th className="px-3 py-2 rounded-r-lg">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {expiryItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-200">{item.name}</td>
                                            <td className="px-3 py-3 font-mono text-gray-500 dark:text-gray-400 text-xs">{item.batch}</td>
                                            <td className="px-3 py-3 font-bold text-orange-600 dark:text-orange-400">{item.expiry}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default InventoryReport;
