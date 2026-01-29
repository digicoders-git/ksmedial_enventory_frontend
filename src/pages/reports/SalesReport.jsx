import React, { useState, useEffect } from 'react';
import { BarChart2, TrendingUp, Calendar, Download, CreditCard, DollarSign, ArrowUpRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const SalesReport = () => {
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        summary: {
            totalSales: 0,
            totalOrders: 0,
            avgOrderValue: 0,
            growth: 0
        },
        paymentMethods: [],
        topProducts: [],
        salesTrend: []
    });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                // Construct query string if dates are provided
                let query = '?';
                if (dateRange.start) query += `startDate=${dateRange.start}&`;
                if (dateRange.end) query += `endDate=${dateRange.end}`;

                const response = await api.get(`/sales/report${query}`);
                if (response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching sales report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [dateRange]); // Refetch when date range changes (if applied)

    const { summary, paymentMethods, topProducts, salesTrend } = data;

    const handleViewReport = () => {
        navigate('/reports/sales/view');
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
                        <BarChart2 className="text-primary" /> Sales Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Analyze sales performance, trends, and revenue sources.</p>
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
                                // Trigger refetch by updating state (already handled by useEffect dependency)
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

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
                        <DollarSign size={64} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Sales</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">₹{(summary.totalSales/1000).toFixed(1)}k</h3>
                    <div className="flex items-center gap-1 text-green-500 dark:text-green-400 text-sm font-bold mt-2">
                        <TrendingUp size={16} /> +{summary.growth}%
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Orders</p>
                     <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{summary.totalOrders}</h3>
                     <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">In selected period</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Order Value</p>
                     <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">₹{summary.avgOrderValue}</h3>
                     <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">Per transaction</p>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Revenue Growth</p>
                     <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">+{summary.growth}%</h3>
                     <div className="flex items-center gap-1 text-green-500 dark:text-green-400 text-sm font-bold mt-2">
                        <ArrowUpRight size={16} /> vs last month
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Chart Placeholder */}
                <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Sales Trend (Daily)</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {salesTrend.map((day, i) => {
                            // Calculate height relative to max, assume max is somewhat larger than largest value
                            const maxVal = Math.max(...salesTrend.map(d => d.amount), 1000); 
                            const heightPercent = Math.max((day.amount / maxVal) * 100, 5); // Min 5% height

                            return (
                                <div key={i} className="w-full bg-blue-50 dark:bg-gray-700 rounded-t-lg relative group">
                                    <div 
                                        className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500 group-hover:bg-secondary" 
                                        style={{ height: `${heightPercent}%` }}
                                    ></div>
                                    <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
                                        {day.date}: ₹{day.amount}
                                    </div>
                                </div>
                            );
                        })}
                         {salesTrend.length === 0 && <div className="text-center w-full text-gray-400">No trend data available</div>}
                    </div>
                     <div className="flex justify-between mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                        {salesTrend.length > 0 ? (
                            <>
                                <span>{salesTrend[0]?.date}</span>
                                <span>{salesTrend[salesTrend.length - 1]?.date}</span>
                            </>
                        ) : (
                                <span>No Data</span>
                        )}
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-400 dark:text-gray-500" /> Payment Modes
                    </h3>
                    <div className="space-y-6">
                        {paymentMethods.map((pm) => (
                            <div key={pm.method}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${pm.color}`}></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{pm.method}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">₹{pm.amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${pm.color}`} style={{ width: `${summary.totalSales > 0 ? (pm.amount / summary.totalSales) * 100 : 0}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{pm.count} Transactions</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Top Performing Products</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Product Name</th>
                                <th className="px-4 py-3 text-right">Units Sold</th>
                                <th className="px-4 py-3 text-right">Revenue</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">Contribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {topProducts.map((prod, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{prod.name}</td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{prod.sold}</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">₹{prod.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{summary.totalSales > 0 ? ((prod.revenue / summary.totalSales) * 100).toFixed(1) : 0}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default SalesReport;
