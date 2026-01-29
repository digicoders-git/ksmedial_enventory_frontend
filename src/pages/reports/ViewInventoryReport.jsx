import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, FileText, Calendar, Share2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';

const ViewInventoryReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        stats: { totalItems: 0, totalValue: 0, lowStock: 0, nearExpiry: 0 },
        categoryData: [],
        lowStockItems: [],
        expiryItems: []
    });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const response = await api.get('/products/report');
                if (response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching inventory report:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    const { stats, categoryData, lowStockItems, expiryItems } = data;
    const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPos = 20;

        // Branding Header
        doc.setFillColor(0, 114, 66); // Primary Green
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('INVENTORY REPORT', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${currentDate}`, pageWidth / 2, 30, { align: 'center' });

        yPos = 50;

        // 1. Overview
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Overview Statistics', 14, yPos);
        yPos += 10;
        
        const statsData = [
            ['Total Stock Value', `Rs. ${(stats.totalValue / 100000).toFixed(2)} Lakh`],
            ['Total Items', stats.totalItems.toString()],
            ['Low Stock Alerts', stats.lowStock.toString()],
            ['Near Expiry Items', stats.nearExpiry.toString()]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Value']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: [0, 114, 66], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 5 }
        });
        yPos = doc.lastAutoTable.finalY + 15;

        // 2. Category Breakdown
        doc.text('2. Stock by Category', 14, yPos);
        yPos += 10;
        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Stock Qty', 'Valuation', 'Percent']],
            body: categoryData.map(c => [c.name, c.stock, `Rs. ${c.value.toLocaleString()}`, `${c.percent}%`]),
            theme: 'striped',
            headStyles: { fillColor: [0, 114, 66] }
        });
        yPos = doc.lastAutoTable.finalY + 15;

        // 3. Low Stock Alerts
        if (lowStockItems.length > 0) {
            if (yPos > doc.internal.pageSize.height - 60) { doc.addPage(); yPos = 20; }
            doc.setTextColor(220, 38, 38);
            doc.text('3. Critical Low Stock Items', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 10;
            
            autoTable(doc, {
                startY: yPos,
                head: [['Item Name', 'Current Stock', 'Min Level', 'Supplier']],
                body: lowStockItems.map(i => [i.name, i.stock, i.min, i.supplier]),
                theme: 'grid',
                headStyles: { fillColor: [220, 38, 38] },
            });
            yPos = doc.lastAutoTable.finalY + 15;
        }

        // 4. Expiry Alerts
        if (expiryItems.length > 0) {
            if (yPos > doc.internal.pageSize.height - 60) { doc.addPage(); yPos = 20; }
            doc.setTextColor(234, 88, 12);
            doc.text('4. Items Expiring Soon (30 Days)', 14, yPos);
            doc.setTextColor(0, 0, 0);
            yPos += 10;

            autoTable(doc, {
                startY: yPos,
                head: [['Item Name', 'Batch', 'Expiry Date', 'Stock']],
                body: expiryItems.map(i => [i.name, i.batch, i.expiry, i.stock]),
                theme: 'grid',
                headStyles: { fillColor: [234, 88, 12] },
            });
        }

        doc.save(`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#007242]/20 border-t-[#007242] rounded-full animate-spin"></div>
                    <div className="mt-4 text-center font-semibold text-[#007242] animate-pulse">Loading Report...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F0F4F8] pb-12 animate-fade-in-up font-sans selection:bg-[#007242]/20">
            {/* Premium Header */}
            <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-gray-200/60 shadow-lg shadow-gray-200/40 transition-all duration-300">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="h-20 flex items-center justify-between">
                        {/* Left: Back & Title */}
                        <div className="flex items-center gap-5">
                            <button 
                                onClick={() => navigate(-1)} 
                                className="group p-2.5 bg-white border border-gray-200 rounded-xl hover:border-[#007242] hover:bg-[#007242]/5 text-gray-500 hover:text-[#007242] transition-all duration-300 shadow-sm hover:shadow-md active:scale-95"
                                title="Go Back"
                            >
                                <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            </button>
                            
                            <div>
                                <h1 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                    <span className="bg-gradient-to-br from-[#007242] to-[#00a862] text-transparent bg-clip-text">
                                        Inventory Report Preview
                                    </span>
                                    <span className="px-2.5 py-0.5 rounded-full bg-[#007242]/10 text-[#007242] text-[10px] font-bold uppercase tracking-wider border border-[#007242]/20">
                                        Live Preview
                                    </span>
                                </h1>
                                <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mt-0.5">
                                    <Calendar size={12} /> {currentDate} &bull; Generated by KS4 PharmaNet
                                </p>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleDownloadPDF} 
                                className="px-5 py-2.5 bg-gradient-to-r from-[#007242] to-[#00a862] text-white font-bold rounded-xl shadow-lg shadow-[#007242]/20 hover:shadow-[#007242]/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all flex items-center gap-2.5 group overflow-hidden relative"
                            >
                                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                                <Download size={18} className="relative z-10" /> 
                                <span className="relative z-10">Download PDF</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Container */}
            <div className="max-w-4xl mx-auto mt-8 px-4 sm:px-6">
                <div className="bg-white shadow-xl rounded-none sm:rounded-sm min-h-[1123px] w-full relative print:shadow-none print:w-full">
                    
                    {/* Report Header */}
                    <div className="bg-[#007242] text-white p-12 text-center relative overflow-hidden">
                         <div className="absolute top-0 right-0 p-8 opacity-10">
                            <FileText size={120} />
                         </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Inventory Report</h1>
                        <p className="text-white/80 font-medium text-lg max-w-2xl mx-auto">Comprehensive stock analysis and health check</p>
                        <div className="mt-8 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                            <Calendar size={14} /> {currentDate}
                        </div>
                    </div>

                    <div className="p-12 space-y-12">
                        {/* 1. Overview */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-2 border-b-2 border-gray-100">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">01</span>
                                Overview Statistics
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Items</p>
                                    <p className="text-2xl font-black text-gray-900">{stats.totalItems}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Value</p>
                                    <p className="text-2xl font-black text-gray-900">₹{(stats.totalValue / 100000).toFixed(2)} L</p>
                                </div>
                                <div className="p-4 rounded-xl bg-red-50 border border-red-100 text-center">
                                    <p className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1">Low Stock</p>
                                    <p className="text-2xl font-black text-red-600">{stats.lowStock}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-orange-50 border border-orange-100 text-center">
                                    <p className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-1">Near Expiry</p>
                                    <p className="text-2xl font-black text-orange-600">{stats.nearExpiry}</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Category Breakdown */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-2 border-b-2 border-gray-100">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">02</span>
                                Stock by Category
                            </h2>
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4">Category Name</th>
                                            <th className="px-6 py-4 text-center">Quantity</th>
                                            <th className="px-6 py-4 text-right">Valuation (₹)</th>
                                            <th className="px-6 py-4 text-right">Allocation</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {categoryData.map((cat, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                                                <td className="px-6 py-4 text-center text-gray-600">{cat.stock}</td>
                                                <td className="px-6 py-4 text-right font-mono text-gray-600">{cat.value.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-600">{cat.percent}%</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 3. Critical Low Stock */}
                        <section className="break-inside-avoid">
                            <h2 className="text-xl font-bold text-red-600 mb-6 flex items-center gap-3 pb-2 border-b-2 border-red-50">
                                <span className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center text-sm font-bold">03</span>
                                Critical Low Stock Items
                            </h2>
                            {lowStockItems.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border border-red-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-red-50/50 text-red-600 font-semibold uppercase text-xs border-b border-red-100">
                                            <tr>
                                                <th className="px-6 py-4">Item Name</th>
                                                <th className="px-6 py-4 text-center">Current Stock</th>
                                                <th className="px-6 py-4 text-center">Min Level</th>
                                                <th className="px-6 py-4">Supplier</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-red-50">
                                            {lowStockItems.slice(0, 15).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-red-50/10">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-red-600">{item.stock}</td>
                                                    <td className="px-6 py-4 text-center text-gray-500">{item.min}</td>
                                                    <td className="px-6 py-4 text-gray-500">{item.supplier}</td>
                                                </tr>
                                            ))}
                                            {lowStockItems.length > 15 && (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-4 text-center text-xs text-gray-400 italic">
                                                        ... and {lowStockItems.length - 15} more items
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                                    No critical stock alerts found. Good job!
                                </div>
                            )}
                        </section>

                         {/* 4. Expiring Soon */}
                         <section className="break-inside-avoid">
                            <h2 className="text-xl font-bold text-orange-600 mb-6 flex items-center gap-3 pb-2 border-b-2 border-orange-50">
                                <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center text-sm font-bold">04</span>
                                Expiring Soon (Next 30 Days)
                            </h2>
                            {expiryItems.length > 0 ? (
                                <div className="overflow-hidden rounded-xl border border-orange-100">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-orange-50/50 text-orange-600 font-semibold uppercase text-xs border-b border-orange-100">
                                            <tr>
                                                <th className="px-6 py-4">Item Name</th>
                                                <th className="px-6 py-4">Batch No.</th>
                                                <th className="px-6 py-4 text-center">Expiry Date</th>
                                                <th className="px-6 py-4 text-center">Stock</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-orange-50">
                                            {expiryItems.slice(0, 15).map((item, idx) => (
                                                <tr key={idx} className="hover:bg-orange-50/10">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                    <td className="px-6 py-4 font-mono text-xs text-gray-500">{item.batch}</td>
                                                    <td className="px-6 py-4 text-center font-bold text-orange-600">{item.expiry}</td>
                                                    <td className="px-6 py-4 text-center text-gray-600">{item.stock}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200 text-gray-500">
                                    No items expiring soon.
                                </div>
                            )}
                        </section>

                    </div>
                    
                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 p-8 text-center text-xs text-gray-400 uppercase tracking-widest mt-auto">
                        KS4 PharmaNet &bull; Inventory Management System &bull; {currentDate}
                    </div>
                </div>
                
                {/* Spacer for bottom scrolling */}
                <div className="h-20"></div>
            </div>
        </div>
    );
};

export default ViewInventoryReport;
