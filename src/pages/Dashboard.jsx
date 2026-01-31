import React, { useState, useEffect } from 'react';
import { ShieldCheck, Banknote, BriefcaseMedical, AlertTriangle, ChevronRight, Download, LayoutDashboard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    inventoryStatus: "Loading...",
    totalRevenue: 0,
    totalMedicines: 0,
    shortageCount: 0,
    totalGroups: 0,
    itemsSold: 0,
    monthlyInvoices: 0,
    totalSuppliers: 0,
    totalCustomers: 0,
    featuredProduct: "N/A",
    monthlyRevenue: new Array(12).fill(0)
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('ks_shop_token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
        const response = await fetch(`${apiBase}/dashboard/stats`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (error) {
        console.error("Dashboard stats fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartOptions = {
    // ... chart options remain same ...
    chart: {
      type: 'spline',
      backgroundColor: 'transparent',
      height: 280,
    },
    title: {
      text: null
    },
    xAxis: {
      categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
      lineColor: 'transparent',
      tickColor: 'transparent',
    },
    yAxis: {
      title: {
        text: 'Revenue (₹)'
      },
      gridLineDashStyle: 'Dash',
      gridLineColor: '#E5E7EB',
    },
    tooltip: {
      shared: true,
      backgroundColor: '#fff',
      borderColor: '#f0f0f0',
      shadow: true,
    },
    plotOptions: {
      spline: {
        marker: {
          radius: 4,
          lineColor: '#0D9488',
          lineWidth: 2,
          fillColor: '#fff'
        },
        lineWidth: 3,
        color: '#0D9488'
      }
    },
    credits: {
      enabled: false
    },
    series: [{
      name: 'Revenue',
      data: stats.monthlyRevenue
    }]
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-2xl shadow-sm border border-emerald-100 dark:border-emerald-800/50">
            <LayoutDashboard size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">
              Main Dashboard
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">A quick data overview of the inventory.</p>
          </div>
        </div>
        <button className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black uppercase tracking-widest text-[11px] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
          <Download size={18} strokeWidth={3} /> Download Report
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Inventory Status */}
        <div 
          onClick={() => navigate('/inventory/stats-history', { state: { type: 'products', title: 'Inventory Status History' } })}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stats.inventoryStatus === 'Good' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50 text-rose-600'}`}>
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">{stats.inventoryStatus}</h3>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Inventory Status</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 border-t border-gray-100 dark:border-gray-700">
            View Analysis <ChevronRight size={14} strokeWidth={3} />
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div 
          onClick={() => navigate('/inventory/stats-history', { state: { type: 'value', title: 'Revenue History' } })}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl border border-amber-100 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 mb-4 group-hover:scale-110 transition-transform">
              <Banknote size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">₹{stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Monthly Revenue</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 border-t border-gray-100 dark:border-gray-700">
            View Analytics <ChevronRight size={14} strokeWidth={3} />
          </div>
        </div>

        {/* Card 3: Medicines Available */}
        <div 
          onClick={() => navigate('/medicines/list')}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl border border-blue-100 dark:border-blue-800/50 bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
              <BriefcaseMedical size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">{stats.totalMedicines}</h3>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Medicines In Stock</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border-t border-gray-100 dark:border-gray-700">
            View Inventory <ChevronRight size={14} strokeWidth={3} />
          </div>
        </div>

        {/* Card 4: Shortage */}
        <div 
          onClick={() => navigate('/inventory/low-stock')}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-2xl border border-rose-100 dark:border-rose-800/50 bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-rose-600 mb-4 group-hover:scale-110 transition-transform">
              <AlertTriangle size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">{stats.shortageCount.toString().padStart(2, '0')}</h3>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Low Stock Alerts</p>
          </div>
          <div className="bg-gray-50 dark:bg-gray-900/50 py-3 px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400 border-t border-gray-100 dark:border-gray-700">
            Resolve Now <ChevronRight size={14} strokeWidth={3} />
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Inventory Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Inventory Glance</h3>
            <button 
                onClick={() => navigate('/config/inventory')}
                className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest hover:opacity-70 flex items-center gap-1 transition-all"
            >
                Config <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div 
                onClick={() => navigate('/medicines/list')}
                className="w-full flex-1 sm:border-r border-gray-100 dark:border-gray-700 pr-0 sm:pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">{stats.totalMedicines}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Total SKU Count</p>
            </div>
            <div 
                onClick={() => navigate('/medicines/groups')}
                className="w-full flex-1 pl-0 sm:pl-4 text-left sm:text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">{stats.totalGroups}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Medicine Categories</p>
            </div>
          </div>
        </div>

        {/* Quick Report Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Monthly Sales</h3>
            <span className="text-[10px] font-black text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg uppercase tracking-widest border border-amber-100 dark:border-amber-800/50">Trends</span>
          </div>
           <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div 
                onClick={() => navigate('/reports/sales')}
                className="w-full flex-1 sm:border-r border-gray-100 dark:border-gray-700 pr-0 sm:pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">{stats.itemsSold}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Units Dispatched</p>
            </div>
            <div 
                onClick={() => navigate('/sales/invoices')}
                className="w-full flex-1 pl-0 sm:pl-4 text-left sm:text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">{stats.monthlyInvoices}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Sales Records</p>
            </div>
          </div>
        </div>

        {/* My Pharmacy Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Team & Partners</h3>
            <button 
                onClick={() => navigate('/config/roles')}
                className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest hover:opacity-70 flex items-center gap-1 transition-all"
            >
                Users <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
           <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div 
                onClick={() => navigate('/purchase/suppliers')}
                className="w-full flex-1 sm:border-r border-gray-100 dark:border-gray-700 pr-0 sm:pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">{stats.totalSuppliers.toString().padStart(2, '0')}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Active Suppliers</p>
            </div>
            <div 
                onClick={() => navigate('/config/roles')}
                className="w-full flex-1 pl-0 sm:pl-4 text-left sm:text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">01</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Registered Staff</p>
            </div>
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
            <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Base & Products</h3>
             <button 
                onClick={() => navigate('/people/customers')}
                className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest hover:opacity-70 flex items-center gap-1 transition-all"
             >
                Clients <ChevronRight size={12} strokeWidth={3} />
             </button>
          </div>
           <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div 
                onClick={() => navigate('/people/customers')}
                className="w-full flex-1 sm:border-r border-gray-100 dark:border-gray-700 pr-0 sm:pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none">{stats.totalCustomers}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Active Customers</p>
            </div>
            <div 
                onClick={() => navigate('/reports/sales')}
                className="w-full flex-1 pl-0 sm:pl-4 text-left sm:text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-3xl font-black text-gray-800 dark:text-white leading-none truncate">{stats.featuredProduct}</h4>
               <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mt-2">Top Performer</p>
            </div>
          </div>
        </div>

        {/* Revenue Analytics Chart - Spans Full Width */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
           <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-800 dark:text-white">Revenue Analytics</h3>
            <select className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 outline-none">
              <option>Yearly</option>
              <option>Monthly</option>
              <option>Weekly</option>
            </select>
          </div>
          <div className="w-full">
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

