import React from 'react';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import { Package, TrendingUp } from 'lucide-react';

const GroupWiseReport = () => {
    
  const chartOptions = {
    chart: { type: 'column', backgroundColor: 'transparent', height: 320 },
    title: { text: null },
    xAxis: {
      categories: ['Tablet', 'Capsule', 'Syrup', 'Injection', 'Gel'],
      lineColor: 'transparent',
    },
    yAxis: {
      title: { text: 'Stock Value (₹)' },
      gridLineDashStyle: 'Dash',
    },
    plotOptions: {
      column: {
        borderRadius: 5,
        colorByPoint: true,
        colors: ['#007242', '#F59E0B', '#3B82F6', '#EF4444', '#8B5CF6']
      }
    },
    credits: { enabled: false },
    series: [{
      name: 'Stock Value',
      data: [45000, 22000, 15000, 32000, 8000]
    }]
  };

  const salesOptions = {
    chart: { type: 'pie', backgroundColor: 'transparent', height: 320 },
    title: { text: null },
    plotOptions: {
      pie: {
        innerSize: '50%',
        depth: 45,
         dataLabels: {
            enabled: false
        },
        showInLegend: true
      }
    },
    credits: { enabled: false },
    series: [{
      name: 'Sales Share',
      data: [
        { name: 'Tablet', y: 60, color: '#007242' },
        { name: 'Capsule', y: 20, color: '#F59E0B' },
        { name: 'Syrup', y: 10, color: '#3B82F6' },
        { name: 'Others', y: 10, color: '#9CA3AF' }
      ]
    }]
  };

  const groups = [
    { name: 'Tablet', totalMeds: 145, stockValue: '₹ 45,000', sales: '₹ 12,000' },
    { name: 'Capsule', totalMeds: 89, stockValue: '₹ 22,000', sales: '₹ 8,500' },
    { name: 'Syrup', totalMeds: 42, stockValue: '₹ 15,000', sales: '₹ 4,200' },
    { name: 'Injection', totalMeds: 12, stockValue: '₹ 32,000', sales: '₹ 1,500' },
  ];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Group-Wise Analysis</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stock Value Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
            <Package size={18} className="text-accent" /> Stock Value Distribution
          </h3>
          <HighchartsReact highcharts={Highcharts} options={chartOptions} />
        </div>

        {/* Sales Distribution Card */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
           <h3 className="font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-highlight" /> Sales by Group
          </h3>
          <HighchartsReact highcharts={Highcharts} options={salesOptions} />
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex items-center justify-between">
           <h3 className="font-semibold text-gray-700 dark:text-white">Detailed Group Report</h3>
           <button className="text-xs text-accent font-bold hover:underline">Download CSV</button>
        </div>
        <table className="w-full text-left text-sm">
           <thead className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase">
             <tr>
               <th className="px-6 py-3">Group Name</th>
               <th className="px-6 py-3 text-center">Total Products</th>
               <th className="px-6 py-3 text-right">Current Stock Value</th>
               <th className="px-6 py-3 text-right">Total Sales</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
             {groups.map((g, i) => (
               <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                 <td className="px-6 py-3 font-medium text-gray-800 dark:text-white">{g.name}</td>
                 <td className="px-6 py-3 text-center text-gray-600 dark:text-gray-300">{g.totalMeds}</td>
                 <td className="px-6 py-3 text-right font-semibold text-accent">{g.stockValue}</td>
                 <td className="px-6 py-3 text-right font-semibold text-gray-800 dark:text-white">{g.sales}</td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>
    </div>
  );
};

export default GroupWiseReport;
