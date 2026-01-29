import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Calendar, Download, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

const ProfitReport = () => {
    const navigate = useNavigate();
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [loading, setLoading] = useState(true);

    const [data, setData] = useState({
        financials: {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            expenses: 0,
            netProfit: 0
        },
        margin: 0,
        categoryProfit: []
    });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                let query = '?';
                if (dateRange.start) query += `startDate=${dateRange.start}&`;
                if (dateRange.end) query += `endDate=${dateRange.end}`;

                const response = await api.get(`/sales/profit${query}`);
                if (response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching profit report:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [dateRange]);

    const { financials, margin, categoryProfit } = data;

    const handleViewReport = () => {
        navigate('/reports/profit/view');
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
                        <TrendingUp className="text-primary" /> Profit & Loss Analysis
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Detailed insight into margins, costs, and net profitability.</p>
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

            {/* Profit Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Revenue */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">₹{financials.revenue.toLocaleString()}</h3>
                     <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full">
                        <div className="bg-blue-500 h-1.5 rounded-full w-full"></div>
                    </div>
                </div>

                {/* COGS */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Cost of Goods (COGS)</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">₹{financials.cogs.toLocaleString()}</h3>
                     <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full">
                        <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${financials.revenue > 0 ? (financials.cogs/financials.revenue)*100 : 0}%` }}></div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Operating Expenses</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">₹{financials.expenses.toLocaleString()}</h3>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full">
                        <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${financials.revenue > 0 ? (financials.expenses/financials.revenue)*100 : 0}%` }}></div>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-green-200 dark:shadow-green-900/20 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-green-100 text-xs font-bold uppercase tracking-wider">Net Profit</p>
                        <h3 className="text-3xl font-bold mt-2">₹{financials.netProfit.toLocaleString()}</h3>
                        <p className="mt-1 text-sm bg-white/20 inline-block px-2 py-0.5 rounded font-medium">Net Margin: {margin}%</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 text-white/10">
                        <DollarSign size={100} />
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Waterfall (Simplified) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Profit Waterfall</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-gray-600 dark:text-gray-300">Revenue</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-blue-500 w-full flex items-center px-3 text-white text-xs font-bold">
                                    ₹{financials.revenue.toLocaleString()}
                                </div>
                            </div>
                        </div>

                         <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-gray-600 dark:text-gray-300">COGS</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-orange-400 opacity-30 w-full"></div>
                                <div className="absolute top-0 left-0 h-full bg-orange-500 flex items-center px-3 text-white text-xs font-bold" style={{ width: `${financials.revenue > 0 ? (financials.cogs/financials.revenue)*100 : 0}%` }}>
                                    - ₹{financials.cogs.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-gray-600 dark:text-gray-300">Expenses</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-red-400 opacity-30 w-full"></div>
                                <div className="absolute top-0 left-0 h-full bg-red-500 flex items-center px-3 text-white text-xs font-bold" style={{ width: `${financials.revenue > 0 ? (financials.expenses/financials.revenue)*100 : 0}%` }}>
                                    - ₹{financials.expenses.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-green-700 dark:text-green-400">Net Profit</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative border-2 border-green-500 border-dashed">
                                 <div className="absolute top-0 left-0 h-full bg-green-500 flex items-center px-3 text-white text-xs font-bold" style={{ width: `${financials.revenue > 0 ? (financials.netProfit/financials.revenue)*100 : 0}%` }}>
                                    = ₹{financials.netProfit.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Margins */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <PieChart size={18} className="text-gray-400 dark:text-gray-500" /> Category Margins
                    </h3>
                    <div className="space-y-6">
                        {categoryProfit.map((cat) => (
                            <div key={cat.name}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{cat.name}</span>
                                    <span className={`text-sm font-bold ${cat.margin > 25 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        {cat.margin}% Margin
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${cat.margin > 25 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                        style={{ width: `${Math.min(parseFloat(cat.margin), 100)}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Profit: ₹{cat.profit.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfitReport;
