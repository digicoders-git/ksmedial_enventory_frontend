import React, { useState, useEffect } from 'react';
import { 
    ShieldCheck, Banknote, BriefcaseMedical, AlertTriangle, 
    ChevronRight, Download, LayoutDashboard, Truck, 
    Clock, Package, FileText, ArrowRight, AlertCircle,
    Boxes, ShoppingCart, History
} from 'lucide-react';
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
    monthlyRevenue: new Array(12).fill(0),
    pendingGrnStats: {
        totalPending: 0,
        ageing: [],
        supplierBreakup: [],
        invoiceQueue: []
    },
    orderWorkflow: {
        total: 0, picking: 0, onHold: 0, billing: 0, 
        packing: 0, shipping: 0, problemQueue: 0, 
        delivered: 0, dailyOrders: 0, last7DaysTrend: [0, 0, 0, 0, 0, 0, 0]
    },
    agedMedicines: {
        count: 0,
        list: []
    }
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

      {/* Online Order Workflow Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-2 overflow-x-auto no-scrollbar">
        <div className="flex items-center min-w-max gap-1">
            <div className="px-4 py-2 border-r border-gray-100 dark:border-gray-700">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total Orders</p>
                <div className="flex items-center gap-2">
                    <ShoppingCart size={14} className="text-blue-500" />
                    <span className="text-sm font-black text-gray-800 dark:text-white">{stats.orderWorkflow.total}</span>
                </div>
            </div>
            {[
                { label: 'Picking', count: stats.orderWorkflow.picking, icon: Boxes, color: 'text-emerald-500' },
                { label: 'On Hold', count: stats.orderWorkflow.onHold, icon: Clock, color: 'text-amber-500' },
                { label: 'Billing', count: stats.orderWorkflow.billing, icon: FileText, color: 'text-blue-500' },
                { label: 'Packing', count: stats.orderWorkflow.packing, icon: Package, color: 'text-indigo-500' },
                { label: 'Shipping', count: stats.orderWorkflow.shipping, icon: Truck, color: 'text-purple-500' },
                { label: 'Problem IQ', count: stats.orderWorkflow.problemQueue, icon: AlertCircle, color: 'text-rose-500' }
            ].map((step, idx) => (
                <div key={idx} className="px-4 py-2 border-r last:border-0 border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">{step.label}</p>
                    <div className="flex items-center gap-2">
                        <step.icon size={14} className={step.color} />
                        <span className="text-sm font-black text-gray-800 dark:text-white">{step.count}</span>
                    </div>
                </div>
            ))}
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

        {/* Outbound Queues Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Outbound Queues</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Order Processing Workflow</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
              <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Live</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Picking', count: stats.orderWorkflow.picking, icon: Boxes, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20' },
              { label: 'On Hold', count: stats.orderWorkflow.onHold, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/20' },
              { label: 'Billing', count: stats.orderWorkflow.billing, icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' },
              { label: 'Packing', count: stats.orderWorkflow.packing, icon: Package, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
              { label: 'Shipping', count: stats.orderWorkflow.shipping, icon: Truck, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
              { label: 'Problem Q', count: stats.orderWorkflow.problemQueue, icon: AlertCircle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-900/20' }
            ].map((q, i) => (
              <div 
                key={i} 
                onClick={() => navigate('/sales/online-orders')}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all cursor-pointer group"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${q.bg} group-hover:scale-110 transition-transform`}>
                  <q.icon size={18} className={q.color} />
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">{q.label}</p>
                  <h4 className="text-xl font-black text-gray-800 dark:text-white leading-none mt-1">{(q.count || 0).toString().padStart(2, '0')}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Ageing Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
            <div>
              <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Stock Ageing</h3>
              <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Older than 28 Days</p>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center border border-rose-100 dark:border-rose-800/50">
              <History size={18} className="text-rose-500" />
            </div>
          </div>
          
          {stats.agedMedicines.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center py-8">
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center text-emerald-500 mb-4">
                <ShieldCheck size={32} />
              </div>
              <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">All Stock Fresh</p>
              <p className="text-xs text-gray-400 mt-1 font-medium">No aged inventory detected.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.agedMedicines.list.slice(0, 5).map((med, idx) => (
                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-gray-50 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-900/20 hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm transition-all">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-bold text-gray-800 dark:text-white truncate uppercase">{med.name}</h4>
                    <p className="text-[10px] text-rose-500 font-bold mt-0.5">{med.days} Days Old</p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm font-black text-gray-800 dark:text-white">{med.qty}</p>
                    <p className="text-[9px] font-bold text-gray-400 uppercase">Units</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <button 
            onClick={() => navigate('/inventory/stock')}
            className="w-full mt-6 py-3 bg-gray-50 dark:bg-gray-900 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            View Full Inventory <ArrowRight size={14} />
          </button>
        </div>

        {/* Order Analytics Charts Section */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 lg:col-span-2">
          
          {/* Order Status Distribution - Donut Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Order Status</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Distribution</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center border border-blue-100 dark:border-blue-800/50">
                <ShoppingCart size={18} className="text-blue-500" />
              </div>
            </div>
            <div className="min-h-[280px]">
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  chart: { type: 'pie', backgroundColor: 'transparent', height: 280 },
                  title: { text: null },
                  tooltip: { pointFormat: '<b>{point.y}</b> Orders ({point.percentage:.1f}%)' },
                  plotOptions: {
                    pie: {
                      innerSize: '65%',
                      depth: 45,
                      dataLabels: { 
                        enabled: true, 
                        format: '{point.name}: {point.y}',
                        style: { fontSize: '10px', fontWeight: 'bold' }
                      },
                      showInLegend: false
                    }
                  },
                  series: [{
                    name: 'Orders',
                    colorByPoint: true,
                    data: [
                      { name: 'Picking', y: stats.orderWorkflow.picking, color: '#10B981' },
                      { name: 'On Hold', y: stats.orderWorkflow.onHold, color: '#F59E0B' },
                      { name: 'Billing', y: stats.orderWorkflow.billing, color: '#3B82F6' },
                      { name: 'Packing', y: stats.orderWorkflow.packing, color: '#6366F1' },
                      { name: 'Shipping', y: stats.orderWorkflow.shipping, color: '#8B5CF6' },
                      { name: 'Problem Q', y: stats.orderWorkflow.problemQueue, color: '#EF4444' }
                    ]
                  }],
                  credits: { enabled: false }
                }} 
              />
            </div>
          </div>

          {/* Daily Order Trend - Area Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Order Trend</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Last 7 Days</p>
              </div>
              <div className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50">
                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">{stats.orderWorkflow.dailyOrders} Today</span>
              </div>
            </div>
            <div className="min-h-[280px]">
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  chart: { type: 'areaspline', backgroundColor: 'transparent', height: 280 },
                  title: { text: null },
                  xAxis: {
                    categories: (() => {
                      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                      const labels = [];
                      for (let i = 6; i >= 0; i--) {
                        const d = new Date();
                        d.setDate(d.getDate() - i);
                        labels.push(days[d.getDay()]);
                      }
                      return labels;
                    })(),
                    labels: { style: { fontSize: '10px', fontWeight: 'bold' } }
                  },
                  yAxis: {
                    title: { text: 'Orders' },
                    gridLineDashStyle: 'Dash'
                  },
                  tooltip: {
                    shared: true,
                    valueSuffix: ' orders'
                  },
                  plotOptions: {
                    areaspline: {
                      fillOpacity: 0.2,
                      marker: { radius: 4 }
                    }
                  },
                  series: [{
                    name: 'Orders',
                    data: stats.orderWorkflow.last7DaysTrend || [0, 0, 0, 0, 0, 0, 0],
                    color: '#0D9488',
                    fillColor: {
                      linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
                      stops: [
                        [0, 'rgba(13, 148, 136, 0.3)'],
                        [1, 'rgba(13, 148, 136, 0.05)']
                      ]
                    }
                  }],
                  credits: { enabled: false }
                }} 
              />
            </div>
          </div>

          {/* Order Fulfillment Funnel */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
              <div>
                <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">Fulfillment</h3>
                <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">Workflow Funnel</p>
              </div>
              <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center border border-purple-100 dark:border-purple-800/50">
                <Truck size={18} className="text-purple-500" />
              </div>
            </div>
            <div className="min-h-[280px]">
              <HighchartsReact 
                highcharts={Highcharts} 
                options={{
                  chart: { type: 'column', backgroundColor: 'transparent', height: 280 },
                  title: { text: null },
                  xAxis: {
                    categories: ['Picking', 'Billing', 'Packing', 'Shipping', 'Delivered'],
                    labels: { 
                      style: { fontSize: '9px', fontWeight: 'bold' },
                      rotation: -45
                    }
                  },
                  yAxis: {
                    title: { text: 'Orders' },
                    gridLineDashStyle: 'Dash'
                  },
                  tooltip: {
                    pointFormat: '<b>{point.y}</b> orders'
                  },
                  plotOptions: {
                    column: {
                      borderRadius: 6,
                      colorByPoint: true,
                      colors: ['#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#22C55E']
                    }
                  },
                  series: [{
                    name: 'Stage',
                    data: [
                      stats.orderWorkflow.picking,
                      stats.orderWorkflow.billing,
                      stats.orderWorkflow.packing,
                      stats.orderWorkflow.shipping,
                      stats.orderWorkflow.delivered
                    ]
                  }],
                  legend: { enabled: false },
                  credits: { enabled: false }
                }} 
              />
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

        {/* GRN & Supplier Stats - Dynamic Section */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:col-span-2">
            
            {/* 1. GRN Ageing (Column Chart) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest leading-none">
                        GRN Ageing Trend
                    </h3>
                    <span className="text-[10px] font-black bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg">
                        HOURS SINCE PURCHASE
                    </span>
                </div>
                <div className="flex-1 min-h-[300px]">
                    <HighchartsReact 
                        highcharts={Highcharts} 
                        options={{
                            chart: { type: 'column', backgroundColor: 'transparent', height: 300 },
                            title: { text: null },
                            xAxis: {
                                categories: stats.pendingGrnStats?.ageing.map(a => a.name) || [],
                                crosshair: true,
                                labels: { style: { fontSize: '10px', fontWeight: '800' } }
                            },
                            yAxis: {
                                min: 0,
                                title: { text: 'Invoices' },
                                gridLineDashStyle: 'Dash'
                            },
                            tooltip: { headerFormat: '<span style="font-size:10px">{point.key}</span><table>', pointFormat: '<tr><td style="color:{series.color};padding:0">{series.name}: </td><td style="padding:0"><b>{point.y}</b></td></tr>', footerFormat: '</table>', shared: true, useHTML: true },
                            plotOptions: {
                                column: {
                                    pointPadding: 0.2,
                                    borderWidth: 0,
                                    borderRadius: 4,
                                    colorByPoint: true,
                                    colors: ['#10B981', '#34D399', '#FBBF24', '#F87171', '#EF4444']
                                }
                            },
                            series: [{
                                name: 'Pending Invoices',
                                data: stats.pendingGrnStats?.ageing.map(a => a.y) || []
                            }],
                            credits: { enabled: false }
                        }} 
                    />
                </div>
            </div>

            {/* 2. Pending GRN Breakup (Pie Chart) */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest leading-none">
                        GRN Supplier Distribution
                    </h3>
                    <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-lg">
                        {stats.pendingGrnStats?.totalPending || 0} TOTAL PENDING
                    </span>
                </div>
                <div className="flex-1 min-h-[300px]">
                    <HighchartsReact 
                        highcharts={Highcharts} 
                        options={{
                            chart: { type: 'pie', backgroundColor: 'transparent', height: 300 },
                            title: { text: null },
                            tooltip: { pointFormat: '<b>{point.y}</b> Invoices' },
                            plotOptions: {
                                pie: {
                                    allowPointSelect: true,
                                    cursor: 'pointer',
                                    dataLabels: { enabled: true, format: '{point.name}: {point.y}', style: { fontSize: '10px' } },
                                    borderWidth: 0,
                                    innerSize: '60%'
                                }
                            },
                            series: [{
                                name: 'Suppliers',
                                colorByPoint: true,
                                data: stats.pendingGrnStats?.supplierBreakup || []
                            }],
                            credits: { enabled: false }
                        }} 
                    />
                </div>
            </div>

            {/* 3. Pending GRN Queue (Full Width) */}
            <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-hidden flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-amber-500" />
                        <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest">
                            Pending Stock Receiving (Invoices)
                        </h3>
                    </div>
                    <button 
                        onClick={() => navigate('/purchase/grn/add')}
                        className="text-[10px] font-black text-blue-600 dark:text-blue-400 hover:underline uppercase tracking-widest"
                    >
                        + Add New GRN
                    </button>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-700/50 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="py-3 px-4">Invoice / Date</th>
                                <th className="py-3 px-4">Supplier</th>
                                <th className="py-3 px-4 text-center">Items</th>
                                <th className="py-3 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {stats.pendingGrnStats?.invoiceQueue.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="py-20 text-center text-gray-400 dark:text-gray-500 font-bold italic">
                                        No pending GRNs at the moment.
                                    </td>
                                </tr>
                            ) : (
                                stats.pendingGrnStats?.invoiceQueue.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-colors group">
                                        <td className="py-4 px-4">
                                            <p className="font-black text-gray-800 dark:text-gray-200 text-xs tracking-tight">{inv.invoiceNumber}</p>
                                            <p className="text-[10px] text-gray-400 font-medium">{new Date(inv.date).toLocaleDateString()}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/30 transition-colors">
                                                    <Truck size={12} className="text-gray-500 dark:text-gray-400 group-hover:text-blue-600" />
                                                </div>
                                                <span className="text-xs font-bold text-gray-600 dark:text-gray-300">{inv.supplier}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-center">
                                            <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-[10px] font-black uppercase tracking-tighter">
                                                {inv.items} SKUs
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button 
                                                onClick={() => navigate('/purchase/grn/add', { 
                                                    state: { 
                                                        purchaseId: inv.id,
                                                        supplierId: inv.supplierId
                                                    } 
                                                })}
                                                className="p-2 bg-blue-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95 shadow-lg shadow-blue-200"
                                                title="Receive Stock"
                                            >
                                                <ArrowRight size={14} strokeWidth={3} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

