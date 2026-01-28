import React, { useState, useEffect } from 'react';
import { ShieldCheck, Banknote, BriefcaseMedical, AlertTriangle, ChevronRight, Download } from 'lucide-react';
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white tracking-tight">Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">A quick data overview of the inventory.</p>
        </div>
        <button className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary active:scale-95 transition-all shadow-sm">
          <span>Download Report</span>
          <Download size={16} />
        </button>
      </div>

      {/* Top Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        
        {/* Card 1: Inventory Status */}
        <div 
          onClick={() => navigate('/inventory/stats-history', { state: { type: 'products', title: 'Inventory Status History' } })}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform ${stats.inventoryStatus === 'Good' ? 'border-accent text-accent' : 'border-danger text-danger'}`}>
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.inventoryStatus}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Inventory Status</p>
          </div>
          <div className="bg-accent/10 py-2 px-4 flex items-center justify-center gap-1 text-accent text-sm font-medium hover:bg-accent/20 transition-colors">
            View Detailed Report <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 2: Revenue */}
        <div 
          onClick={() => navigate('/inventory/stats-history', { state: { type: 'value', title: 'Revenue History' } })}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border-2 border-highlight flex items-center justify-center text-highlight mb-3 group-hover:scale-110 transition-transform">
              <Banknote size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Rs. {stats.totalRevenue.toLocaleString()}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Revenue : This Month</p>
          </div>
          <div className="bg-highlight/10 py-2 px-4 flex items-center justify-center gap-1 text-highlight text-sm font-medium hover:bg-highlight/20 transition-colors">
            View Detailed Report <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 3: Medicines Available */}
        <div 
          onClick={() => navigate('/medicines/list')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border-2 border-info flex items-center justify-center text-info mb-3 group-hover:scale-110 transition-transform">
              <BriefcaseMedical size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.totalMedicines}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Medicines Available</p>
          </div>
          <div className="bg-info/10 py-2 px-4 flex items-center justify-center gap-1 text-info text-sm font-medium hover:bg-info/20 transition-colors">
            Visit Inventory <ChevronRight size={14} />
          </div>
        </div>

        {/* Card 4: Shortage */}
        <div 
          onClick={() => navigate('/inventory/low-stock')}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-full border-2 border-danger flex items-center justify-center text-danger mb-3 group-hover:scale-110 transition-transform">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{stats.shortageCount.toString().padStart(2, '0')}</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Medicine Shortage</p>
          </div>
          <div className="bg-danger/10 py-2 px-4 flex items-center justify-center gap-1 text-danger text-sm font-medium hover:bg-danger/20 transition-colors">
            Resolve Now <ChevronRight size={14} />
          </div>
        </div>
      </div>

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
        
        {/* Inventory Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-white">Inventory</h3>
            <button 
                onClick={() => navigate('/config/inventory')}
                className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
            >
                Go to Configuration <ChevronRight size={12} />
            </button>
          </div>
          <div className="flex justify-between items-center">
            <div 
                onClick={() => navigate('/medicines/list')}
                className="flex-1 border-r border-gray-100 dark:border-gray-700 pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalMedicines}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total no of Medicines</p>
            </div>
            <div 
                onClick={() => navigate('/medicines/groups')}
                className="flex-1 pl-4 text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalGroups}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Medicine Groups</p>
            </div>
          </div>
        </div>

        {/* Quick Report Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-white">Quick Report</h3>
            <span className="text-xs font-semibold text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">This Month</span>
          </div>
           <div className="flex justify-between items-center">
            <div 
                onClick={() => navigate('/reports/sales')}
                className="flex-1 border-r border-gray-100 dark:border-gray-700 pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.itemsSold}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Qty of Medicines Sold</p>
            </div>
            <div 
                onClick={() => navigate('/sales/invoices')}
                className="flex-1 pl-4 text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.monthlyInvoices}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Invoices Generated</p>
            </div>
          </div>
        </div>

        {/* My Pharmacy Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-white">My Pharmacy</h3>
            <button 
                onClick={() => navigate('/config/roles')}
                className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
            >
                Go to User Management <ChevronRight size={12} />
            </button>
          </div>
           <div className="flex justify-between items-center">
            <div 
                onClick={() => navigate('/purchase/suppliers')}
                className="flex-1 border-r border-gray-100 dark:border-gray-700 pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalSuppliers.toString().padStart(2, '0')}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total no of Suppliers</p>
            </div>
            <div 
                onClick={() => navigate('/config/roles')}
                className="flex-1 pl-4 text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">01</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total no of Users</p>
            </div>
          </div>
        </div>

        {/* Customers Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-2">
            <h3 className="font-bold text-gray-800 dark:text-white">Customers</h3>
             <button 
                onClick={() => navigate('/people/customers')}
                className="text-xs text-gray-400 hover:text-accent flex items-center gap-1 transition-colors cursor-pointer"
             >
                Go to Customers Page <ChevronRight size={12} />
             </button>
          </div>
           <div className="flex justify-between items-center">
            <div 
                onClick={() => navigate('/people/customers')}
                className="flex-1 border-r border-gray-100 dark:border-gray-700 pr-4 cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white">{stats.totalCustomers}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Total no of Customers</p>
            </div>
            <div 
                onClick={() => navigate('/reports/sales')}
                className="flex-1 pl-4 text-right cursor-pointer hover:opacity-80 transition-opacity"
            >
               <h4 className="text-2xl font-bold text-gray-800 dark:text-white truncate">{stats.featuredProduct}</h4>
               <p className="text-sm text-gray-500 dark:text-gray-400">Frequently bought Item</p>
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

