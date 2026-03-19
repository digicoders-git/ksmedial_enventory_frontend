import React, { useState, useEffect, useRef } from 'react';
import { 
    ShieldCheck, Banknote, BriefcaseMedical, AlertTriangle, 
    ChevronRight, Download, LayoutDashboard, Truck, 
    Clock, Package, FileText, ArrowRight, AlertCircle,
    Boxes, ShoppingCart, History, TrendingUp, Box, Activity,
    CheckCircle2, XCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
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

    // Helper for Queue Bar Charts (from Advanced Dashboard)
    const getQueueChartOptions = (title, data, color) => ({
        chart: { type: 'column', height: 180, backgroundColor: 'transparent' },
        title: { text: null },
        xAxis: {
            categories: data?.categories || ['0-3', '3-6', '6-12', '12-24', '24-36', '>48'],
            labels: { style: { fontSize: '9px', fontWeight: 'bold', color: '#9CA3AF' } },
            lineWidth: 0,
            tickWidth: 0
        },
        yAxis: {
            title: { text: null },
            gridLineDashStyle: 'Dash',
            gridLineColor: '#E5E7EB',
            labels: { style: { fontSize: '9px', color: '#9CA3AF' } }
        },
        plotOptions: {
            column: {
                borderRadius: 4,
                color: color,
                dataLabels: { enabled: true, style: { fontSize: '9px' } }
            }
        },
        credits: { enabled: false },
        legend: { enabled: false },
        series: [{ name: title, data: data?.data || [] }],
        tooltip: {
            backgroundColor: '#FFF',
            borderColor: '#E5E7EB',
            borderRadius: 8,
            style: { color: '#374151' },
            headerFormat: '<span style="font-size: 10px">{point.key} Hrs</span><br/>',
            pointFormat: '<b>{point.y}</b> Orders'
        }
    });

  const reportRef = useRef(null);

  const handleDownloadReport = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = stats?.monthlyRevenue || [];
    const totalRevenue = monthlyData.reduce((a, b) => a + b, 0);
    const shopName = JSON.parse(localStorage.getItem('ks_shop_info') || '{}')?.name || 'KS Medical';
    const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

    const rows = months.map((m, i) => `
      <tr style="border-bottom:1px solid #f0f0f0">
        <td style="padding:8px 16px;font-weight:600;color:#374151">${m}</td>
        <td style="padding:8px 16px;text-align:right;font-weight:700;color:${monthlyData[i] > 0 ? '#059669' : '#9CA3AF'}">
          ₹${(monthlyData[i] || 0).toLocaleString('en-IN')}
        </td>
      </tr>`).join('');

    const html = `
      <html><head><title>Monthly Revenue Report</title></head>
      <body style="font-family:Arial,sans-serif;margin:0;padding:32px;background:#f9fafb">
        <div style="max-width:600px;margin:auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)">
          <div style="background:#007242;padding:24px 32px">
            <h1 style="margin:0;color:#fff;font-size:22px">${shopName}</h1>
            <p style="margin:4px 0 0;color:#a7f3d0;font-size:13px">Monthly Revenue Report &mdash; Generated on ${today}</p>
          </div>
          <div style="padding:24px 32px">
            <table style="width:100%;border-collapse:collapse">
              <thead>
                <tr style="background:#f3f4f6">
                  <th style="padding:10px 16px;text-align:left;font-size:11px;text-transform:uppercase;color:#6B7280;letter-spacing:1px">Month</th>
                  <th style="padding:10px 16px;text-align:right;font-size:11px;text-transform:uppercase;color:#6B7280;letter-spacing:1px">Revenue</th>
                </tr>
              </thead>
              <tbody>${rows}</tbody>
              <tfoot>
                <tr style="background:#f0fdf4">
                  <td style="padding:12px 16px;font-weight:800;color:#065f46;font-size:15px">Total (Yearly)</td>
                  <td style="padding:12px 16px;text-align:right;font-weight:800;color:#065f46;font-size:15px">₹${totalRevenue.toLocaleString('en-IN')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #e5e7eb">
            <p style="margin:0;font-size:11px;color:#9CA3AF">This report is auto-generated. For queries contact your administrator.</p>
          </div>
        </div>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Revenue_Report_${new Date().getFullYear()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up pb-10">
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
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Real-time inventory & order analytics.</p>
          </div>
        </div>
        <button onClick={handleDownloadReport} className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black uppercase tracking-widest text-[11px] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95">
          <Download size={18} strokeWidth={3} /> Download Report
        </button>
      </div>

      {/* 1. Top Cards Grid (Restored) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Card 1: Inventory Status */}
        <div 
          onClick={() => navigate('/inventory/stats-history', { state: { type: 'critical_stock', title: 'Critical Stock Alerts', threshold: stats.alertThreshold } })}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        >
          <div className="p-6 flex flex-col items-center text-center">
            <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${stats.inventoryStatus === 'Good' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800/50 text-emerald-600' : 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800/50 text-rose-600'}`}>
              <ShieldCheck size={28} strokeWidth={2.5} />
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-white">{stats.inventoryStatus}</h3>
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Inventory Status</p>
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
        </div>
      </div>

      {/* 1.5. Daily Closing Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 animate-fade-in-up delay-100">
        <h2 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
            <Activity size={20} className="text-emerald-500" /> Today's Collection (Closing Summary)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
             {stats.dailyClosingStats && Object.entries(stats.dailyClosingStats).map(([mode, amount]) => (
                <div key={mode} className="p-4 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 flex flex-col items-center justify-center text-center hover:bg-white hover:shadow-md transition-all duration-300">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{mode}</span>
                    <span className="text-xl font-black text-gray-800 dark:text-white">
                        ₹{amount.toLocaleString()}
                    </span>
                </div>
             ))}
             <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/50 flex flex-col items-center justify-center text-center shadow-sm">
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">Total Today</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">
                    ₹{stats.dailyClosingStats ? Object.values(stats.dailyClosingStats).reduce((a, b) => a + b, 0).toLocaleString() : 0}
                </span>
             </div>
        </div>
      </div>

     {/* 2. Order Workflow Grid */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-5 flex items-center gap-2">
          <ShoppingCart size={16} /> Order Status Overview
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-4 gap-4">
            {[
                { label: 'Pending',            count: stats.orderWorkflow.pending,            icon: Clock,         border: 'border-l-gray-400',    bg: 'bg-gray-50 dark:bg-gray-700/30',       num: 'text-gray-700 dark:text-gray-100',    icon_c: 'text-gray-400' },
                { label: 'Confirmed',          count: stats.orderWorkflow.confirmed,          icon: CheckCircle2,  border: 'border-l-blue-500',    bg: 'bg-blue-50 dark:bg-blue-900/20',       num: 'text-blue-700 dark:text-blue-300',    icon_c: 'text-blue-500' },
                { label: 'Unallocated',        count: stats.orderWorkflow.unallocated,        icon: AlertCircle,   border: 'border-l-orange-400',  bg: 'bg-orange-50 dark:bg-orange-900/20',   num: 'text-orange-600 dark:text-orange-300',icon_c: 'text-orange-400' },
                { label: 'Picking',            count: stats.orderWorkflow.picking,            icon: Boxes,         border: 'border-l-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-900/20', num: 'text-emerald-700 dark:text-emerald-300',icon_c: 'text-emerald-500' },
                { label: 'Picklist Generated', count: stats.orderWorkflow.picklistGenerated,  icon: FileText,      border: 'border-l-teal-500',    bg: 'bg-teal-50 dark:bg-teal-900/20',       num: 'text-teal-700 dark:text-teal-300',    icon_c: 'text-teal-500' },
                { label: 'Quality Check',      count: stats.orderWorkflow.qualityCheck,       icon: ShieldCheck,   border: 'border-l-cyan-500',    bg: 'bg-cyan-50 dark:bg-cyan-900/20',       num: 'text-cyan-700 dark:text-cyan-300',    icon_c: 'text-cyan-500' },
                { label: 'Billing',            count: stats.orderWorkflow.billing,            icon: FileText,      border: 'border-l-sky-500',     bg: 'bg-sky-50 dark:bg-sky-900/20',         num: 'text-sky-700 dark:text-sky-300',      icon_c: 'text-sky-500' },
                { label: 'Packing',            count: stats.orderWorkflow.packing,            icon: Package,       border: 'border-l-indigo-500',  bg: 'bg-indigo-50 dark:bg-indigo-900/20',   num: 'text-indigo-700 dark:text-indigo-300',icon_c: 'text-indigo-500' },
                { label: 'Scan & Ship',        count: stats.orderWorkflow.scannedForShipping, icon: Activity,      border: 'border-l-violet-500',  bg: 'bg-violet-50 dark:bg-violet-900/20',   num: 'text-violet-700 dark:text-violet-300',icon_c: 'text-violet-500' },
                { label: 'Shipped',            count: stats.orderWorkflow.shipping,           icon: Truck,         border: 'border-l-purple-500',  bg: 'bg-purple-50 dark:bg-purple-900/20',   num: 'text-purple-700 dark:text-purple-300',icon_c: 'text-purple-500' },
                { label: 'Delivered',          count: stats.orderWorkflow.delivered,          icon: CheckCircle2,  border: 'border-l-green-500',   bg: 'bg-green-50 dark:bg-green-900/20',     num: 'text-green-700 dark:text-green-300',  icon_c: 'text-green-500' },
                { label: 'On Hold',            count: stats.orderWorkflow.onHold,             icon: Clock,         border: 'border-l-amber-500',   bg: 'bg-amber-50 dark:bg-amber-900/20',     num: 'text-amber-700 dark:text-amber-300',  icon_c: 'text-amber-500' },
                { label: 'Problem Queue',      count: stats.orderWorkflow.problemQueue,       icon: AlertCircle,   border: 'border-l-rose-500',    bg: 'bg-rose-50 dark:bg-rose-900/20',       num: 'text-rose-700 dark:text-rose-300',    icon_c: 'text-rose-500' },
                { label: 'Cancelled',          count: stats.orderWorkflow.cancelled,          icon: XCircle,       border: 'border-l-red-500',     bg: 'bg-red-50 dark:bg-red-900/20',         num: 'text-red-700 dark:text-red-300',      icon_c: 'text-red-500' },
            ].map((step, idx) => (
                <div key={idx} className={`${step.bg} ${step.border} border-l-4 rounded-xl p-4 flex items-center gap-4`}>
                    <div className={`p-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                        <step.icon size={22} className={step.icon_c} />
                    </div>
                    <div>
                        <p className={`text-3xl font-black leading-none ${step.num}`}>{step.count}</p>
                        <p className="text-xs font-bold text-gray-400 mt-1 leading-tight">{step.label}</p>
                    </div>
                </div>
            ))}
            {/* Total Orders - Last */}
            <div className="bg-primary/10 dark:bg-primary/20 border-l-4 border-l-primary rounded-xl p-4 flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
                    <ShoppingCart size={22} className="text-primary" />
                </div>
                <div>
                    <p className="text-3xl font-black leading-none text-primary">{stats.orderWorkflow.total}</p>
                    <p className="text-xs font-bold text-primary/60 mt-1 leading-tight">Total Orders</p>
                </div>
            </div>
        </div>
      </div>

      {/* 3. Advanced Charts Section (Merged from Images) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Orders Breakup - Pie Chart */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="mb-4 flex justify-between items-center">
                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Orders Breakup</h3>
                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-gray-500">Total: {stats.orderWorkflow.total}</span>
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={{
                        chart: { type: 'pie', height: 200, backgroundColor: 'transparent' },
                        title: { text: null },
                        plotOptions: {
                            pie: {
                                innerSize: '60%',
                                dataLabels: { enabled: false },
                                showInLegend: true
                            }
                        },
                        legend: {
                            layout: 'vertical',
                            align: 'right',
                            verticalAlign: 'middle',
                            itemStyle: { fontSize: '10px', fontWeight: 'bold' }
                        },
                        credits: { enabled: false },
                        series: [{
                            name: 'Orders',
                            data: [
                                { name: 'Picking', y: stats.orderWorkflow.picking, color: '#10B981' },
                                { name: 'On Hold', y: stats.orderWorkflow.onHold, color: '#F59E0B' },
                                { name: 'Billing', y: stats.orderWorkflow.billing, color: '#3B82F6' },
                                { name: 'Packing', y: stats.orderWorkflow.packing, color: '#6366F1' },
                                { name: 'Shipping', y: stats.orderWorkflow.shipping, color: '#8B5CF6' },
                                { name: 'Problem', y: stats.orderWorkflow.problemQueue, color: '#EF4444' }
                            ]
                        }]
                    }}
                />
            </div>

            {/* Order Ageing - Bar Chart */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Order Ageing</h3>
                    <p className="text-[10px] text-gray-400">Total Orders: {stats.orderWorkflow.total}</p>
                </div>
                 <HighchartsReact
                    highcharts={Highcharts}
                    options={getQueueChartOptions('Order Ageing', stats.queueStats?.all, '#0D9488')}
                />
            </div>

             {/* Sales Return - Bar Chart */}
             <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="mb-4">
                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">Sales Return Queue</h3>
                    <p className="text-[10px] text-gray-400">Returns: {stats.queueStats?.returns?.total || 0}</p>
                </div>
                <HighchartsReact
                    highcharts={Highcharts}
                    options={getQueueChartOptions('Sales Returns', stats.queueStats?.returns, '#6366F1')}
                />
            </div>
      </div>

      {/* 4. Outbound Queues Grid (From Images) */}
      <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Truck size={20} /> Outbound Queues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                    { title: 'Rapid Orders Queue', data: stats.queueStats?.rapid, color: '#06B6D4' },
                    { title: 'On Hold Queue', data: stats.queueStats?.onHold, color: '#F59E0B' },
                    { title: 'Picking Queue', data: stats.queueStats?.picking, color: '#10B981' },
                    { title: 'Quality Check Queue', data: stats.queueStats?.qualityCheck, color: '#8B5CF6' },
                    { title: 'Packing Queue', data: stats.queueStats?.packing, color: '#6366F1' },
                    { title: 'Shipping Queue', data: stats.queueStats?.shipping, color: '#3B82F6' },
                    { title: 'Problem Queue', data: stats.queueStats?.problem, color: '#EF4444' },
                    { title: 'Bulk Invoicing Queue', data: stats.queueStats?.billing, color: '#EC4899' },
                ].map((queue, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xs text-gray-700 dark:text-gray-300">{queue.title}</h3>
                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">
                                Total: {queue.data?.total || 0}
                            </span>
                        </div>
                        <HighchartsReact highcharts={Highcharts} options={getQueueChartOptions(queue.title, queue.data, queue.color)} />
                    </div>
                ))}
            </div>
      </div>



      {/* 4.5 Supplier & Purchase Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Supplier Analytics Charts */}
            <div className="xl:col-span-2 space-y-6">
                
                {/* 1. Operational Liability (Goods not yet Received) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Truck size={20} className="text-indigo-500" /> Pending Goods Verification (Operational)
                    </h3>
                    <div className="h-[250px]">
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={{
                                chart: { type: 'column', backgroundColor: 'transparent', height: 250 },
                                title: { text: null },
                                xAxis: {
                                    categories: stats.pendingGrnStats?.supplierBreakup.map(s => s.name) || [],
                                    labels: { style: { fontSize: '10px', fontWeight: 'bold' } }
                                },
                                yAxis: {
                                    title: { text: null }, 
                                    gridLineDashStyle: 'Dash'
                                },
                                tooltip: {
                                    shared: true,
                                    headerFormat: '<b>{point.key}</b><br/>',
                                    pointFormat: 'Pending Invoices: <b>{point.count}</b><br/>Total Value: <b>₹{point.y}</b>'
                                },
                                plotOptions: {
                                    column: {
                                        borderRadius: 4,
                                        color: '#6366F1',
                                        dataLabels: { enabled: true, format: '₹{point.y:.0f}', style: { fontSize: '9px' } }
                                    }
                                },
                                series: [{
                                    name: 'Pending Goods Value',
                                    data: stats.pendingGrnStats?.supplierBreakup.map(s => ({ y: s.amount, count: s.y })) || []
                                }],
                                credits: { enabled: false },
                                legend: { enabled: false }
                            }}
                        />
                    </div>
                </div>

                {/* 2. Financial Liability (Goods Received, Payment Pending) */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-black text-gray-800 dark:text-white mb-4 flex items-center gap-2">
                        <Banknote size={20} className="text-rose-500" /> Outstanding Payments (Financial Liability)
                    </h3>
                    <div className="h-[250px]">
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={{
                                chart: { type: 'column', backgroundColor: 'transparent', height: 250 },
                                title: { text: null },
                                xAxis: {
                                    categories: stats.pendingGrnStats?.financialLiability?.map(s => s.name) || [],
                                    labels: { style: { fontSize: '10px', fontWeight: 'bold' } }
                                },
                                yAxis: {
                                    title: { text: null },
                                    gridLineDashStyle: 'Dash'
                                },
                                tooltip: {
                                    shared: true,
                                    headerFormat: '<b>{point.key}</b><br/>',
                                    pointFormat: 'Unpaid Invoices: <b>{point.count}</b><br/>Payable Amount: <b>₹{point.y}</b>'
                                },
                                plotOptions: {
                                    column: {
                                        borderRadius: 4,
                                        color: '#F43F5E',
                                        dataLabels: { enabled: true, format: '₹{point.y:.0f}', style: { fontSize: '9px' } }
                                    }
                                },
                                series: [{
                                    name: 'Outstanding Payment',
                                    data: stats.pendingGrnStats?.financialLiability?.map(s => ({ y: s.amount, count: s.y })) || []
                                }],
                                credits: { enabled: false },
                                legend: { enabled: false }
                            }}
                        />
                    </div>
                </div>

            </div>

            {/* Pending Invoices List */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-black text-gray-800 dark:text-white flex items-center gap-2">
                        <FileText size={20} className="text-amber-500" /> Pending Invoices
                    </h3>
                    <span className="bg-amber-100 text-amber-700 px-2 py-1 rounded-md text-xs font-bold">
                        {stats.pendingGrnStats?.totalPending} Pending
                    </span>
                </div>
               
                <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[300px] custom-scrollbar">
                    {stats.pendingGrnStats?.invoiceQueue.length > 0 ? (
                        stats.pendingGrnStats.invoiceQueue.map((invoice) => (
                            <div key={invoice.id} className="group p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:border-amber-200 dark:hover:border-amber-900 bg-gray-50 dark:bg-gray-700/30 hover:bg-amber-50 dark:hover:bg-amber-900/10 transition-all cursor-pointer"
                                 onClick={() => navigate(`/purchase/grn/waitlist`)}>
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">{invoice.supplier}</span>
                                    <span className="font-black text-amber-600 dark:text-amber-500 text-sm">₹{invoice.amount?.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs text-gray-400 dark:text-gray-500">
                                    <span className="font-mono bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-600">
                                        #{invoice.invoiceNumber}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock size={10} /> {new Date(invoice.date).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-400">
                            <ShieldCheck size={40} className="mb-2 opacity-50" />
                            <p className="text-sm">No Pending Invoices</p>
                        </div>
                    )}
                </div>
            </div>
      </div>

      {/* 5. Inbound Queues Grid (From Images) */}
      <div>
            <h2 className="text-lg font-black text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Box size={20} /> Inbound Queues
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {[
                    { title: 'Overall Inbound', data: stats.queueStats?.inbound?.overall, color: '#14B8A6' },
                    { title: 'Pending Invoices', data: stats.queueStats?.inbound?.pendingInvoices, color: '#F97316' },
                    { title: 'Physical Validation', data: stats.queueStats?.inbound?.physicalValidation, color: '#8B5CF6' },
                    { title: 'GRN Queue', data: stats.queueStats?.inbound?.grn, color: '#0EA5E9' }
                ].map((queue, idx) => (
                    <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-xs text-gray-700 dark:text-gray-300">{queue.title}</h3>
                            <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-500">
                                Total: {queue.data?.total || 0}
                            </span>
                        </div>
                        <HighchartsReact highcharts={Highcharts} options={getQueueChartOptions(queue.title, queue.data, queue.color)} />
                    </div>
                ))}
            </div>
      </div>

      {/* 6. GRN Analytics */}
      <div className="pb-20">
            {/* GRN Ageing Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 flex flex-col h-full">
                <div className="flex justify-between items-center mb-6 border-b border-gray-50 dark:border-gray-700 pb-4">
                    <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest leading-none">
                        GRN Ageing Trend
                    </h3>
                    <span className="text-[10px] font-black bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-2 py-1 rounded-lg">
                        HOURS SINCE PURCHASE
                    </span>
                </div>
                <div className="flex-1 min-h-[280px]">
                    <HighchartsReact 
                        highcharts={Highcharts} 
                        options={{
                            chart: { type: 'column', backgroundColor: 'transparent', height: 280 },
                            title: { text: null },
                            xAxis: {
                                categories: stats.pendingGrnStats?.ageing.map(a => a.name) || [],
                                labels: { style: { fontSize: '10px', fontWeight: '800' } }
                            },
                            yAxis: {
                                min: 0,
                                title: { text: null },
                                gridLineDashStyle: 'Dash'
                            },
                            tooltip: { shared: true },
                            plotOptions: {
                                column: {
                                    borderRadius: 4,
                                    colorByPoint: true,
                                    colors: ['#10B981', '#34D399', '#FBBF24', '#F87171', '#EF4444']
                                }
                            },
                            series: [{
                                name: 'Invoices',
                                data: stats.pendingGrnStats?.ageing.map(a => a.y) || []
                            }],
                            credits: { enabled: false }
                        }} 
                    />
                </div>
            </div>
      </div>
    </div>
  );
};

export default Dashboard;
