import React, { useState, useEffect } from 'react';
import { Download, ArrowLeft, TrendingUp, Calendar, DollarSign, PieChart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';

const ViewProfitReport = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        financials: {
            revenue: 0,
            cogs: 0,
            grossProfit: 0,
            expenses: 0,
            netProfit: 0
        },
        margin: 0,
        categoryProfit: []
    });

    const currentDate = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric'
    });

    useEffect(() => {
        const fetchReportData = async () => {
             try {
                setLoading(true);
                const response = await api.get('/sales/profit');
                if (response.data.success) {
                    setData(response.data);
                }
            } catch (error) {
                console.error("Error fetching profit report:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchReportData();
    }, []);

    const { financials, categoryProfit } = data;

    const handleDownloadPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        let yPos = 20;

        // Header
        doc.setFillColor(0, 114, 66); // Primary Green
        doc.rect(0, 0, pageWidth, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFIT & LOSS STATEMENT', pageWidth / 2, 20, { align: 'center' });
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated on: ${currentDate}`, pageWidth / 2, 30, { align: 'center' });

        yPos = 50;

        // 1. Financial Overview
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('1. Financial Overview', 14, yPos);
        yPos += 10;
        
        const statsData = [
            ['Total Revenue', `Rs. ${financials.revenue.toLocaleString()}`],
            ['Cost of Goods Sold (COGS)', `Rs. ${financials.cogs.toLocaleString()}`],
            ['Gross Profit', `Rs. ${financials.grossProfit.toLocaleString()}`],
            ['Operating Expenses', `Rs. ${financials.expenses.toLocaleString()}`],
            ['Net Profit', `Rs. ${financials.netProfit.toLocaleString()}`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Amount']],
            body: statsData,
            theme: 'grid',
            headStyles: { fillColor: [0, 114, 66], textColor: 255 },
            styles: { fontSize: 10, cellPadding: 5 }
        });
        yPos = doc.lastAutoTable.finalY + 15;

        // 2. Category Profitability
        doc.text('2. Category Profitability', 14, yPos);
        yPos += 10;
        
        const categoryData = categoryProfit.map(cat => [
            cat.name,
            `Rs. ${cat.revenue.toLocaleString()}`,
            `Rs. ${cat.profit.toLocaleString()}`,
            `${cat.margin}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Revenue', 'Profit', 'Margin']],
            body: categoryData,
            theme: 'grid',
            headStyles: { fillColor: [0, 114, 66], textColor: 255 },
        });

        doc.save(`Profit_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50/50">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-[#007242]/20 border-t-[#007242] rounded-full animate-spin"></div>
                    <div className="mt-4 text-center font-semibold text-[#007242] animate-pulse">Loading Profit Report...</div>
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
                                        Profit Report Preview
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
                         <div className="absolute top-0 left-0 p-8 opacity-10">
                            <DollarSign size={120} />
                         </div>
                        <h1 className="text-4xl font-black tracking-tight mb-2 uppercase">Profit & Loss Statement</h1>
                        <p className="text-white/80 font-medium text-lg max-w-2xl mx-auto">Financial performance summary</p>
                        <div className="mt-8 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full text-sm font-medium">
                            <Calendar size={14} /> {currentDate}
                        </div>
                    </div>

                    <div className="p-12 space-y-12">
                        {/* 1. Financial Overview */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-2 border-b-2 border-gray-100">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">01</span>
                                Financial Overview
                            </h2>
                            <div className="grid grid-cols-2 gap-6 mb-6">
                                <div className="p-6 rounded-xl bg-green-50/50 border border-green-100">
                                    <p className="text-sm font-bold text-green-700 uppercase tracking-wider mb-2">Total Revenue</p>
                                    <p className="text-3xl font-black text-gray-900">₹{financials.revenue.toLocaleString()}</p>
                                </div>
                                <div className="p-6 rounded-xl bg-orange-50/50 border border-orange-100">
                                    <p className="text-sm font-bold text-orange-700 uppercase tracking-wider mb-2">Total COGS</p>
                                    <p className="text-3xl font-black text-gray-900">₹{financials.cogs.toLocaleString()}</p>
                                </div>
                            </div>
                             <div className="grid grid-cols-3 gap-4">
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Gross Profit</p>
                                    <p className="text-xl font-bold text-gray-900">₹{financials.grossProfit.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100 text-center">
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Expenses</p>
                                    <p className="text-xl font-bold text-gray-900">₹{financials.expenses.toLocaleString()}</p>
                                </div>
                                <div className="p-4 rounded-xl bg-green-100/50 border border-green-200 text-center">
                                    <p className="text-xs font-bold text-green-700 uppercase tracking-wider mb-1">Net Profit</p>
                                    <p className="text-xl font-black text-green-700">₹{financials.netProfit.toLocaleString()}</p>
                                </div>
                            </div>
                        </section>

                        {/* 2. Category Profitability */}
                        <section>
                            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3 pb-2 border-b-2 border-gray-100">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-bold">02</span>
                                Profitability by Category
                            </h2>
                            <div className="overflow-hidden rounded-xl border border-gray-200">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-semibold uppercase text-xs border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4 text-right">Revenue</th>
                                            <th className="px-6 py-4 text-right">Profit</th>
                                             <th className="px-6 py-4 text-right">Margin</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {categoryProfit.map((cat, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                                                <td className="px-6 py-4 text-right text-gray-600 font-mono">₹{cat.revenue.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-mono text-[#007242] font-bold">₹{cat.profit.toLocaleString()}</td>
                                                <td className="px-6 py-4 text-right font-bold">{cat.margin}%</td>
                                            </tr>
                                        ))}
                                        {categoryProfit.length === 0 && (
                                            <tr>
                                                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">No data available.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                    
                    {/* Footer */}
                    <div className="bg-gray-50 border-t border-gray-200 p-8 text-center text-xs text-gray-400 uppercase tracking-widest mt-auto">
                        KS4 PharmaNet &bull; Profit Report &bull; {currentDate}
                    </div>
                </div>
                 {/* Spacer for bottom scrolling */}
                 <div className="h-20"></div>
            </div>
        </div>
    );
};

export default ViewProfitReport;
