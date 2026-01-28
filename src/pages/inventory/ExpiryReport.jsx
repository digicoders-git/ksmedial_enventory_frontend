import React, { useState, useEffect } from 'react';
import { ArrowLeft, Download, Printer, FileText, Calendar, AlertTriangle, CheckCircle, Share2, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ExpiryReport = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mock Data (matches ExpiryManagement for consistency)
  const batches = [
    { id: 1, name: 'Dolo 650', batch: 'B001', exp: '2023-10-15', stock: 150, status: 'Expired', cost: 4500, category: 'Tablet', supplier: 'Micro Labs' },
    { id: 2, name: 'Azithral 500', batch: 'AZ-99', exp: '2024-02-10', stock: 45, status: 'Near Expiry', cost: 5100, category: 'Tablet', supplier: 'Alembic' },
    { id: 3, name: 'Crosin Syrup', batch: 'C-22', exp: '2023-11-01', stock: 12, status: 'Expired', cost: 780, category: 'Syrup', supplier: 'GSK' },
    { id: 4, name: 'Pan 40', batch: 'P-404', exp: '2024-05-20', stock: 300, status: 'Safe', cost: 3600, category: 'Tablet', supplier: 'Alkem' },
    { id: 5, name: 'Montek LC', batch: 'M-11', exp: '2024-01-25', stock: 80, status: 'Near Expiry', cost: 14400, category: 'Tablet', supplier: 'Sun Pharma' },
    { id: 6, name: 'Telma 40', batch: 'T-55', exp: '2023-12-01', stock: 0, status: 'Expired', cost: 0, category: 'Tablet', supplier: 'Glenmark' },
    { id: 7, name: 'Shelcal 500', batch: 'S-88', exp: '2024-03-15', stock: 100, status: 'Near Expiry', cost: 8000, category: 'Tablet', supplier: 'Torrent' },
  ];

  const totalExpiredValue = batches.filter(b => b.status === 'Expired').reduce((acc, curr) => acc + curr.cost, 0);
  const totalNearExpiryValue = batches.filter(b => b.status === 'Near Expiry').reduce((acc, curr) => acc + curr.cost, 0);
  const totalStockValue = batches.reduce((acc, curr) => acc + curr.cost, 0);

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    Swal.fire({
      icon: 'success',
      title: 'Report Downloaded',
      text: 'The expiry report has been saved as PDF.',
      timer: 2000,
      showConfirmButton: false
    });
  };

  return (
    <div className="animate-fade-in-up max-w-[1200px] mx-auto pb-10 print:fixed print:inset-0 print:z-[9999] print:bg-white print:w-full print:h-auto print:overflow-visible print:m-0 print:p-8">
      
      {/* Header Actions (Hidden in Print) */}
      <div className="flex justify-between items-center mb-8 print:hidden">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors font-medium"
        >
          <ArrowLeft size={20} /> Back to Inventory
        </button>
        <div className="flex gap-3">
            <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2">
               <Mail size={16} /> Email
            </button>
            <button 
              onClick={handlePrint}
              className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 font-medium text-sm flex items-center gap-2"
            >
               <Printer size={16} /> Print
            </button>
            <button 
              onClick={handleDownload}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary font-medium text-sm flex items-center gap-2 shadow-sm active:scale-95 transition-all"
            >
               <Download size={16} /> Download PDF
            </button>
        </div>
      </div>

      {/* Report Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden print:shadow-none print:border-none">
        
        {/* Report Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50/30 print:bg-white">
           <div className="flex justify-between items-start">
              <div className="flex items-start gap-4">
                 <div className="p-3 bg-red-100 text-red-600 rounded-xl print:border print:border-red-200">
                    <FileText size={32} />
                 </div>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Expiry Analysis Report</h1>
                    <p className="text-gray-500 mt-1">Detailed breakdown of stock expiry status and valuation.</p>
                 </div>
              </div>
              <div className="text-right">
                 <p className="text-sm text-gray-500 font-medium">Report Generated On</p>
                 <p className="text-lg font-bold text-gray-800">{currentDate.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                 <p className="text-sm text-gray-400 mt-1">{currentDate.toLocaleTimeString()}</p>
              </div>
           </div>
        </div>

        {/* Executive Summary Cards */}
        <div className="p-8 grid grid-cols-3 gap-6 print:grid-cols-3 print:gap-4">
           {/* Card 1 */}
           <div className="p-6 rounded-xl bg-red-50 border border-red-100 print:border-gray-200">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-white rounded-lg shadow-sm text-red-600">
                    <AlertTriangle size={24} />
                 </div>
                 <span className="text-xs font-bold bg-white px-2 py-1 rounded text-red-600">CRITICAL</span>
              </div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Expired Value</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{totalExpiredValue.toLocaleString()}</h3>
              <p className="text-sm text-red-600 mt-2 font-medium flex items-center gap-1">
                 {batches.filter(b => b.status === 'Expired').length} Items require disposal
              </p>
           </div>

           {/* Card 2 */}
           <div className="p-6 rounded-xl bg-orange-50 border border-orange-100 print:border-gray-200">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-white rounded-lg shadow-sm text-orange-600">
                    <Calendar size={24} />
                 </div>
                 <span className="text-xs font-bold bg-white px-2 py-1 rounded text-orange-600">ATTENTION</span>
              </div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Near Expiry (90 Days)</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{totalNearExpiryValue.toLocaleString()}</h3>
              <p className="text-sm text-orange-600 mt-2 font-medium flex items-center gap-1">
                 {batches.filter(b => b.status === 'Near Expiry').length} Items expiring soon
              </p>
           </div>

           {/* Card 3 */}
           <div className="p-6 rounded-xl bg-green-50 border border-green-100 print:border-gray-200">
              <div className="flex justify-between items-start mb-4">
                 <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                    <CheckCircle size={24} />
                 </div>
                 <span className="text-xs font-bold bg-white px-2 py-1 rounded text-green-600">HEALTHY</span>
              </div>
              <p className="text-gray-500 text-sm font-medium uppercase tracking-wider">Total Inventory Evaluated</p>
              <h3 className="text-3xl font-bold text-gray-800 mt-1">₹{totalStockValue.toLocaleString()}</h3>
              <p className="text-sm text-green-600 mt-2 font-medium flex items-center gap-1">
                 {batches.length} Total Batches
              </p>
           </div>
        </div>

        {/* Detailed Table */}
        <div className="px-8 pb-8">
           <h3 className="font-bold text-gray-800 text-lg mb-4 flex items-center gap-2">
              <FileText size={20} className="text-gray-400" /> itemized Breakdown
           </h3>
           <div className="border border-gray-200 rounded-xl overflow-hidden">
               <table className="w-full text-left text-sm">
                   <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 uppercase font-bold text-xs">
                       <tr>
                           <th className="px-6 py-4">Batch ID</th>
                           <th className="px-6 py-4">Medicine Name</th>
                           <th className="px-6 py-4">Supplier</th>
                           <th className="px-6 py-4 text-center">Expiry Date</th>
                           <th className="px-6 py-4 text-center">Stock</th>
                           <th className="px-6 py-4 text-right">Valuation</th>
                           <th className="px-6 py-4 text-center">Status</th>
                       </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-200">
                       {batches.sort((a, b) => new Date(a.exp) - new Date(b.exp)).map((batch, index) => (
                           <tr key={batch.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                               <td className="px-6 py-3 font-mono text-gray-600">{batch.batch}</td>
                               <td className="px-6 py-3 font-bold text-gray-800">{batch.name} <span className="text-xs font-normal text-gray-400 ml-1">({batch.category})</span></td>
                               <td className="px-6 py-3 text-gray-600">{batch.supplier}</td>
                               <td className="px-6 py-3 text-center font-medium">
                                   <span className={batch.status === 'Expired' ? 'text-red-600' : batch.status === 'Near Expiry' ? 'text-orange-600' : 'text-gray-600'}>
                                      {batch.exp}
                                   </span>
                               </td>
                               <td className="px-6 py-3 text-center text-gray-700">{batch.stock}</td>
                               <td className="px-6 py-3 text-right font-bold text-gray-700">₹{batch.cost.toLocaleString()}</td>
                               <td className="px-6 py-3 text-center">
                                   <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                       batch.status === 'Expired' 
                                       ? 'bg-red-50 text-red-700 border-red-200' 
                                       : batch.status === 'Near Expiry' 
                                       ? 'bg-orange-50 text-orange-700 border-orange-200' 
                                       : 'bg-green-50 text-green-700 border-green-200'
                                   }`}>
                                       {batch.status}
                                   </span>
                               </td>
                           </tr>
                       ))}
                   </tbody>
               </table>
           </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-6 border-t border-gray-200 text-center">
             <p className="text-xs text-gray-400">Inventory Management System • Generated by Admin User</p>
        </div>

      </div>
    </div>
  );
};

export default ExpiryReport;
