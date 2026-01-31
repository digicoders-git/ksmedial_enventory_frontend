import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download, FileText, ClipboardList } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';

const ViewStockOut = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLog = async () => {
        try {
            setLoading(true);
            // Since our backend returns logs, and we don't have a "bulk log" view yet,
            // we'll fetch this specific log and maybe some related ones if they share the same timestamp (simulated grouping)
            const { data } = await api.get('/products/logs'); // Fetching all logs and filtering for now
            if (data.success) {
                const targetLog = data.logs.find(l => l._id === id);
                if (targetLog) {
                    // Try to find other logs created at the same time (within 2 seconds) to group them as one "session"
                    const sessionLogs = data.logs.filter(l => 
                        Math.abs(new Date(l.date) - new Date(targetLog.date)) < 2000 &&
                        l.reason === targetLog.reason
                    );

                    setData({
                        id: targetLog._id.slice(-8).toUpperCase(),
                        date: new Date(targetLog.date).toLocaleString(),
                        reason: targetLog.reason,
                        note: targetLog.note || 'No additional remarks',
                        items: sessionLogs.map((l, idx) => ({
                            id: idx + 1,
                            name: l.productName || 'Unknown Product',
                            batch: l.batchNumber || 'N/A',
                            qty: l.quantity,
                            price: 0, // Manual adjustments might not have price in log
                            total: 0
                        }))
                    });
                }
            }
        } catch (error) {
            console.error("Error fetching stock out log:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchLog();
  }, [id]);

  const handleDownloadPDF = () => {
    if (!data) return;
    const doc = new jsPDF();
    // Simplified PDF generation for now
    doc.text('STOCK ISSUE NOTE', 105, 20, { align: 'center' });
    doc.text(`Voucher No: ${data.id}`, 20, 40);
    doc.text(`Date: ${data.date}`, 20, 50);
    doc.text(`Reason: ${data.reason}`, 20, 60);
    
    const tableColumn = ["#", "Item Name", "Batch", "Qty"];
    const tableRows = data.items.map(i => [i.id, i.name, i.batch, i.qty]);
    
    autoTable(doc, {
        startY: 70,
        head: [tableColumn],
        body: tableRows,
        theme: 'grid'
    });
    
    doc.save(`StockOut_${data.id}.pdf`);
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-fade-in print:p-0 print:bg-white">
      
      {/* Action Header */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/inventory/stock-out');
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md font-bold active:scale-95"
        >
            <ArrowLeft size={18} strokeWidth={2.5} /> 
            <span className="uppercase text-xs tracking-widest">Back to List</span>
        </button>
        
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
            >
                <Download size={18} /> Download PDF
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:shadow-lg hover:bg-secondary transition-all"
            >
                <Printer size={18} /> Print Voucher
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex flex-col gap-4">
                    <img src="/KS2-Logo.png" alt="Logo" className="h-16 w-auto object-contain brightness-0 invert" />
                    <div className="space-y-1.5 text-sm text-gray-300">
                        <h2 className="text-xl font-bold text-white">KS Pharma Net</h2>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-primary"/> 123, Health Avenue, Medical District</div>
                    </div>
                </div>

                <div className="text-right w-full md:w-auto">
                    <h1 className="text-4xl font-black text-white/20 uppercase tracking-tight leading-none mb-2">Issue Note</h1>
                    <div className="text-xl font-bold text-white">#{data.id}</div>
                    <div className="mt-4 text-sm text-gray-400 font-medium whitespace-nowrap">
                        Issued: <span className="text-white font-bold">{data.date}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Info Grid */}
        <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12 border-b border-gray-50">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Stock Out Reason</h3>
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-red-50 text-red-600 rounded-xl">
                        <ClipboardList size={24} />
                    </div>
                    <div>
                        <div className="text-lg font-bold text-gray-900">{data.reason}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold tracking-widest mt-1">Movement Type: OUT</div>
                    </div>
                </div>
            </div>
            
            <div className="md:text-right">
                 <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Remarks / Note</h3>
                 <p className="text-sm text-gray-600 italic">"{data.note}"</p>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-8 md:px-12 py-8">
            <div className="border rounded-xl overflow-hidden border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-900 font-bold uppercase text-xs tracking-wider">
                            <th className="py-4 px-6 w-16 text-center">#</th>
                            <th className="py-4 px-6 w-1/2">Medicine Name</th>
                            <th className="py-4 px-6">Batch Number</th>
                            <th className="py-4 px-6 text-center">Qty Issued</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {data.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6 text-center text-gray-500 font-medium">{index + 1}</td>
                                <td className="py-4 px-6 font-semibold text-gray-800">{item.name}</td>
                                <td className="py-4 px-6 text-gray-600 font-mono text-xs">{item.batch}</td>
                                <td className="py-4 px-6 text-center text-gray-900 font-bold">{item.qty}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-8 md:p-12 flex flex-col md:flex-row justify-between items-center gap-8 border-t border-gray-100">
             <div className="text-xs text-gray-500 max-w-sm">
                <p className="font-bold text-gray-900 text-sm mb-1 uppercase tracking-wider">Official Document</p>
                <p>This is a computer-generated stock adjustment record. It serves as an internal voucher for inventory movement.</p>
             </div>

             <div className="flex gap-12">
                 <div className="text-center">
                    <div className="h-12 w-32 border-b border-gray-300 mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Store In-Charge</p>
                 </div>
                 <div className="text-center">
                    <div className="h-12 w-32 border-b border-gray-300 mb-2"></div>
                    <p className="text-[10px] font-black uppercase text-gray-400">Authorized By</p>
                 </div>
             </div>
        </div>
      </div>

      <style>{`
          @media print {
              @page { margin: 1cm; size: auto; }
              body { background: white; }
              button { display: none !important; }
              .bg-gradient-to-r { 
                background: #111827 !important; 
                -webkit-print-color-adjust: exact !important;
                color: white !important;
              }
              .text-white { color: white !important; }
              .text-gray-300 { color: #d1d5db !important; }
          }
      `}</style>
    </div>
  );
};

export default ViewStockOut;
