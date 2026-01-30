import React, { useState, useMemo } from 'react';
import { Package, AlertTriangle, RefreshCcw, DollarSign, Activity, TrendingUp, FileText } from 'lucide-react';
import { AdjustStockModal, StockCheckModal } from './InventoryModals';
import { useNavigate } from 'react-router-dom';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { useInventory } from '../../context/InventoryContext';

const InventoryDashboard = () => {
  const navigate = useNavigate();
  const {  stats: contextStats, inventory, transactions, loading } = useInventory();

  // Compute additional dashboard-specific stats dynamically from Context data
  const dashboardStats = useMemo(() => {
     // Category Distribution
     const categoryMap = {};
     inventory.forEach(item => {
         const cat = item.category || 'Uncategorized';
         categoryMap[cat] = (categoryMap[cat] || 0) + 1;
     });
     const categoryDistribution = Object.keys(categoryMap).map(key => ({
         name: key,
         y: categoryMap[key]
     }));

     // Weekly Movement (Mocking logic based on transactions for now, ideally backend aggregates this)
     // For demo/dynamic feel, we can calculate from 'transactions' if they have dates
     // Assuming transactions has recent history.
     const last7Days = [...Array(7)].map((_, i) => {
         const d = new Date();
         d.setDate(d.getDate() - i);
         return d.toISOString().split('T')[0];
     }).reverse();

     const stockIn = [0, 0, 0, 0, 0, 0, 0];
     const stockOut = [0, 0, 0, 0, 0, 0, 0];

     transactions.forEach(tx => {
         const txDate = new Date(tx.date).toISOString().split('T')[0];
         const index = last7Days.indexOf(txDate);
         if (index !== -1) {
             if (tx.type === 'IN') stockIn[index] += tx.totalQty;
             if (tx.type === 'OUT') stockOut[index] += tx.totalQty;
         }
     });

     return {
         ...contextStats,
         categoryDistribution,
         weeklyMovement: { stockIn, stockOut },
         recentTransactions: transactions.slice(0, 10),
         pendingRx: 0, // Placeholder or fetch from PrescriptionContext if available
         xAxisCategories: last7Days.map(d => new Date(d).toLocaleDateString('en-US', { weekday: 'short' }))
     };
  }, [contextStats, inventory, transactions]);

  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [showCheckModal, setShowCheckModal] = useState(false);

  // Highcharts Options for Stock Movement Trends
  const movementChartOptions = {
    chart: {
      type: 'areaspline',
      backgroundColor: 'transparent',
      height: 300,
      style: { fontFamily: 'Inter, sans-serif' }
    },
    title: { text: null },
    credits: { enabled: false },
    xAxis: {
      categories: dashboardStats.xAxisCategories,
      gridLineWidth: 0,
       lineColor: '#e5e7eb',
      labels: { style: { color: '#9ca3af', fontWeight: 'bold' } }
    },
    yAxis: {
      title: { text: null },
      gridLineColor: '#f3f4f6',
      labels: { style: { color: '#9ca3af' } }
    },
    tooltip: {
      shared: true,
      backgroundColor: '#ffffff',
      borderWidth: 0,
      borderRadius: 12,
      shadow: true
    },
    plotOptions: {
      areaspline: {
        fillOpacity: 0.1,
        lineWidth: 3,
        marker: { enabled: false, states: { hover: { enabled: true } } }
      }
    },
    series: [{
      name: 'Stock In',
      data: dashboardStats.weeklyMovement.stockIn,
      color: '#10b981' // Emerald-500
    }, {
      name: 'Stock Out',
      data: dashboardStats.weeklyMovement.stockOut,
      color: '#f97316' // Orange-500
    }]
  };

  // Highcharts Options for Category Distribution
  const pieColors = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899'];
  const categoryChartOptions = {
    chart: {
      type: 'pie',
      backgroundColor: 'transparent',
      height: 300,
      style: { fontFamily: 'Inter, sans-serif' }
    },
    title: { text: null },
    credits: { enabled: false },
    tooltip: { pointFormat: '{series.name}: <b>{point.y} ({point.percentage:.1f}%)</b>' },
    accessibility: { point: { valueSuffix: '%' } },
    plotOptions: {
      pie: {
        allowPointSelect: true,
        cursor: 'pointer',
        dataLabels: { enabled: false },
        showInLegend: true,
        innerSize: '60%',
        borderWidth: 0,
        colors: pieColors
      }
    },
    legend: {
      itemStyle: { color: '#6b7280', fontSize: '11px', fontWeight: 'bold' },
      layout: 'vertical',
      align: 'right',
      verticalAlign: 'middle'
    },
    series: [{
      name: 'Category',
      colorByPoint: true,
      data: dashboardStats.categoryDistribution.length > 0 ? dashboardStats.categoryDistribution : [{ name: 'No Data', y: 1, color: '#f3f4f6' }]
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
    <>
    <div className="space-y-6 animate-fade-in-up pb-10">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Inventory Dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Real-time stock analytics and control center</p>
        </div>
        <div className="flex gap-2">
            <button className="p-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl text-gray-500 hover:text-primary transition-all shadow-sm">
                <RefreshCcw size={18} />
            </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Total Products & Stock */}
        <div 
            onClick={() => navigate('/inventory/stats-history', { state: { type: 'products', title: 'Product History' } })}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <Package size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                <Package size={20} />
            </div>
            <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full uppercase">Items</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Total Products</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{dashboardStats.totalProducts}</h3>
            <p className="text-[11px] text-blue-500 font-bold mt-1 flex items-center gap-1">
                <TrendingUp size={12} /> {dashboardStats.totalStockUnits.toLocaleString()} In Stock
            </p>
          </div>
        </div>

        {/* Card 2: Stock Value */}
        <div 
            onClick={() => navigate('/inventory/stats-history', { state: { type: 'value', title: 'Stock Value History' } })}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <DollarSign size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400">
                <DollarSign size={20} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full uppercase">Value</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Net Valuation</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">₹{Number(dashboardStats.totalStockValue).toLocaleString()}</h3>
            <p className="text-[11px] text-emerald-500 font-bold mt-1">Live Market Rate</p>
          </div>
        </div>

        {/* Card 3: Prescriptions */}
        <div 
            onClick={() => navigate('/inventory/stats-history', { state: { type: 'prescriptions', title: 'Prescription History' } })}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <FileText size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">
                <FileText size={20} />
            </div>
             <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full uppercase">Rx</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Pending Rx</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{dashboardStats.pendingRx.toString().padStart(2, '0')}</h3>
            <p className="text-[11px] text-orange-500 font-bold mt-1 flex items-center gap-1">
                <Activity size={12} /> {dashboardStats.pendingRx} New Requests
            </p>
          </div>
        </div>

        {/* Card 4: Alerts */}
        <div 
            onClick={() => navigate('/inventory/stats-history', { state: { type: 'alerts', title: 'Stock Alerts History' } })}
            className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
             <AlertTriangle size={100} />
          </div>
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
                <AlertTriangle size={20} />
            </div>
             <span className="text-[10px] font-black text-red-600 bg-red-50 px-2 py-0.5 rounded-full uppercase">Urgent</span>
          </div>
          <div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">Stock Alerts</p>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{dashboardStats.lowStockItems + dashboardStats.outOfStockItems}</h3>
            <p className="text-[11px] text-red-500 font-bold mt-1">Low: {dashboardStats.lowStockItems} | Out: {dashboardStats.outOfStockItems}</p>
          </div>
        </div>

        {/* Card 5: Movement */}
        <div 
            className="bg-gradient-to-br from-gray-800 to-gray-900 dark:from-gray-750 dark:to-gray-850 p-5 rounded-2xl shadow-lg flex flex-col justify-between group overflow-hidden relative"
        >
           <div className="absolute -right-4 -top-4 opacity-10 group-hover:rotate-12 transition-transform duration-700">
             <Activity size={80} color="white" />
          </div>
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="p-2.5 rounded-xl bg-white/10 text-emerald-400 backdrop-blur-md">
                <Activity size={20} />
            </div>
             <span className="text-[10px] font-black text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full uppercase">Status</span>
          </div>
          <div className="relative z-10">
            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">System Health</p>
            <h3 className="text-xl font-black text-white mt-0.5 tracking-tight">
              {dashboardStats.lowStockItems + dashboardStats.outOfStockItems > 10 ? 'ATTENTION' : 'OPTIMIZED'}
            </h3>
            <div className="flex items-center gap-2 mt-2">
                <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] transition-all duration-1000"
                      style={{ width: `${Math.max(10, 100 - (dashboardStats.lowStockItems + dashboardStats.outOfStockItems) * 2)}%` }}
                    ></div>
                </div>
                <span className="text-[10px] font-black text-emerald-400">{Math.max(10, 100 - (dashboardStats.lowStockItems + dashboardStats.outOfStockItems) * 2)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Analytics Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Movement chart */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
           <div className="flex items-center justify-between mb-6">
             <div>
                <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">Stock Movement Trends</h3>
                <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Weekly In/Out Visualization</p>
             </div>
             <div className="flex gap-1 bg-gray-50 dark:bg-gray-700 p-1 rounded-xl">
                 <button className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase bg-white dark:bg-gray-800 shadow-sm text-primary">Weekly</button>
                 <button className="px-3 py-1.5 rounded-lg text-[10px] font-black uppercase text-gray-400 hover:text-gray-600 transition-all">Monthly</button>
             </div>
           </div>
           <HighchartsReact highcharts={Highcharts} options={movementChartOptions} />
        </div>

        {/* Category breakdown and quick actions */}
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
               <h3 className="font-black text-gray-800 dark:text-white mb-6 uppercase tracking-tight text-center">Category Distribution</h3>
               <HighchartsReact highcharts={Highcharts} options={categoryChartOptions} />
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="font-black text-gray-800 dark:text-white mb-4 uppercase tracking-tight">System Controls</h3>
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => setShowAdjustModal(true)}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600 group"
                >
                   <RefreshCcw size={22} className="group-hover:rotate-180 transition-transform duration-500" />
                   <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">Adjust Stock</span>
                </button>
                <button 
                  onClick={() => setShowCheckModal(true)}
                  className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-all flex flex-col items-center gap-2 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600 group"
                >
                   <Package size={22} className="group-hover:scale-110 transition-transform" />
                   <span className="text-[10px] font-black uppercase tracking-widest line-clamp-1">Stock Check</span>
                </button>
                 <button 
                  onClick={() => navigate('/medicines/prescriptions')}
                  className="p-4 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-none transition-all flex flex-col items-center gap-2 col-span-2 group relative overflow-hidden"
                >
                   <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 skew-x-12"></div>
                   <FileText size={22} />
                   <span className="text-[10px] font-black uppercase tracking-widest">Verify Medical Prescriptions</span>
                </button>
              </div>
            </div>
        </div>
      </div>

      {/* Movement List (Refined) */}
       <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-hidden relative">
          <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">Live Stock Transactions</h3>
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Real-time ledger updates</p>
                </div>
                <button onClick={() => navigate('/inventory/stats-history')} className="text-[10px] font-black uppercase text-blue-600 hover:underline">View All Activities</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {dashboardStats.recentTransactions.length > 0 ? dashboardStats.recentTransactions.slice(0, 6).map(tx => (
               <div key={tx.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors">
                 <div className="flex items-center gap-3">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] shadow-sm ${tx.type === 'IN' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-red-50 dark:bg-red-900/20 text-red-600'}`}>
                     {tx.type}
                   </div>
                   <div>
                     <p className="text-sm font-black text-gray-800 dark:text-white line-clamp-1 tracking-tight">
                       {tx.items[0]?.name}{tx.items.length > 1 ? ` +${tx.items.length - 1} more` : ''}
                     </p>
                     <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase">
                        {tx.totalQty} Units &bull; <span className="text-primary">{tx.source || tx.reason}</span> &bull; {new Date(tx.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </p>
                   </div>
                 </div>
                 <div className={`w-2 h-2 rounded-full animate-pulse ${tx.type === 'IN' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
               </div>
             )) : (
                <div className="col-span-3 text-center text-gray-400 py-10 font-bold uppercase text-xs border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-3xl">
                    <Activity size={32} className="mx-auto mb-2 opacity-20" />
                    No recent movement recorded
                </div>
             )}
          </div>
       </div>

    </div>

      {/* Modals - Placed outside the animated container to prevent stacking context issues */}
      {showAdjustModal && <AdjustStockModal isOpen={showAdjustModal} onClose={() => setShowAdjustModal(false)} />}
      {showCheckModal && <StockCheckModal isOpen={showCheckModal} onClose={() => setShowCheckModal(false)} />}
    </>
  );
};

export default InventoryDashboard;
