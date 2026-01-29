import React, { useState, useEffect } from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Package, TrendingUp, Download, Table } from 'lucide-react';
import api from '../../api/axios';

const GroupWiseReport = () => {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState([]);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/sales/groups');
        if (data.success) {
          setReportData(data.report);
        }
      } catch (error) {
        console.error("Error fetching group report:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, []);

  const downloadCSV = () => {
    const headers = ['Group Name', 'Total Products', 'Stock Value', 'Total Sales'];
    const rows = reportData.map(g => [
      g.name,
      g.totalItems,
      g.stockValue.toFixed(2),
      g.totalSales.toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Group_Wise_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Prepare Chart Data
  const categories = reportData.map(d => d.name);
  const stockValues = reportData.map(d => d.stockValue);
  const salesData = reportData.map(d => ({ name: d.name, y: d.totalSales }));

  const chartOptions = {
    chart: { type: 'column', backgroundColor: 'transparent', height: 350 },
    title: { text: null },
    xAxis: {
      categories: categories,
      lineColor: 'transparent',
      labels: { style: { color: '#9CA3AF' } } 
    },
    yAxis: {
      title: { text: 'Stock Value (₹)', style: { color: '#9CA3AF' } },
      gridLineDashStyle: 'Dash',
      gridLineColor: '#F3F4F6',
      labels: { style: { color: '#9CA3AF' } }
    },
    plotOptions: {
      column: {
        borderRadius: 8,
        colorByPoint: true,
        colors: ['#007242', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6', '#10B981', '#6366F1']
      }
    },
    credits: { enabled: false },
    legend: { enabled: false },
    tooltip: {
        backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderRadius: 8,
        shadow: true,
        style: { color: '#374151' },
        pointFormat: '<b>{point.y:,.2f}</b>'
    },
    series: [{
      name: 'Stock Value',
      data: stockValues
    }]
  };

  const salesOptions = {
    chart: { type: 'pie', backgroundColor: 'transparent', height: 350 },
    title: { text: null },
    plotOptions: {
      pie: {
        innerSize: '60%',
        depth: 45,
        dataLabels: {
             enabled: true,
             format: '{point.name}: {point.percentage:.1f} %',
             style: { color: '#6B7280', fontSize: '10px', textOutline: 'none' }
        },
        showInLegend: true
      }
    },
    credits: { enabled: false },
    legend: {
        itemStyle: { color: '#6B7280', fontWeight: '500' }
    },
    tooltip: {
         backgroundColor: '#FFFFFF',
        borderColor: '#E5E7EB',
        borderRadius: 8,
        shadow: true,
        pointFormat: '<b>₹{point.y:,.2f}</b>'
    },
    series: [{
      name: 'Sales Share',
      data: salesData
    }]
  };

  if (loading) {
      return (
          <div className="flex items-center justify-center min-h-[60vh]">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
      );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-7xl mx-auto pb-10">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Table className="text-primary" /> Group-Wise Analytics
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Breakdown of inventory value and sales performance by category.</p>
            </div>
            <button 
                onClick={downloadCSV}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
                <Download size={16} /> Download CSV
            </button>
       </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Stock Value Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <Package size={18} className="text-orange-500" /> Stock Valuation by Group
          </h3>
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>

        {/* Sales Distribution Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-gray-700 dark:text-white mb-6 flex items-center gap-2 border-b border-gray-100 dark:border-gray-700 pb-3">
            <TrendingUp size={18} className="text-blue-500" /> Sales Performance Share
          </h3>
          <HighchartsReact highcharts={Highcharts} options={salesOptions} />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 flex items-center justify-between">
           <h3 className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
               <Table size={16} className="text-gray-400" /> Detailed Data
           </h3>
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold text-xs tracking-wider">
                <tr>
                <th className="px-6 py-4">Group Name</th>
                <th className="px-6 py-4 text-center">Total Products</th>
                <th className="px-6 py-4 text-right">Stock Valuation</th>
                <th className="px-6 py-4 text-right">Total Revenue</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {reportData.map((g, i) => (
                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">{g.name}</td>
                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">
                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-bold">{g.totalItems}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-medium text-orange-600 dark:text-orange-400">₹{g.stockValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-[#007242] dark:text-green-400">₹{g.totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
        {reportData.length === 0 && (
             <div className="p-12 text-center text-gray-500 font-medium">No data available to display.</div>
        )}
      </div>
    </div>
  );
};

export default GroupWiseReport;
