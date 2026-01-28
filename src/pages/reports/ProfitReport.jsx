import React, { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, PieChart, Activity, Calendar, Download, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ProfitReport = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [previewUrl, setPreviewUrl] = useState(null);

    // Mock Financial Data
    const financials = {
        revenue: 450000,
        cogs: 320000, // Cost of Goods Sold
        grossProfit: 130000,
        expenses: 25000, // Rent, Salary, Utilities
        netProfit: 105000
    };

    const margin = ((financials.netProfit / financials.revenue) * 100).toFixed(1);

    const categoryProfit = [
        { name: 'Tablets', revenue: 250000, profit: 80000, margin: 32 },
        { name: 'Syrups', revenue: 120000, profit: 30000, margin: 25 },
        { name: 'Injections', revenue: 50000, profit: 15000, margin: 30 },
        { name: 'Surgicals', revenue: 30000, profit: 5000, margin: 16 },
    ];

    // PDF Export Function
    const handleExportPDF = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;
        let yPos = 20;

        // Header
        doc.setFillColor(0, 114, 66); // Primary color
        doc.rect(0, 0, pageWidth, 35, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('PROFIT & LOSS STATEMENT', pageWidth / 2, 15, { align: 'center' });
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const currentDate = new Date().toLocaleDateString('en-IN', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        let subTitle = `Generated on: ${currentDate}`;
        if (dateRange.start && dateRange.end) {
            subTitle += ` | Period: ${dateRange.start} to ${dateRange.end}`;
        }
        
        doc.text(subTitle, pageWidth / 2, 25, { align: 'center' });

        yPos = 45;

        // Financial Overview Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Financial Overview', 14, yPos);
        yPos += 10;

        // Overview boxes
        const statsData = [
            ['Total Revenue', `₹${financials.revenue.toLocaleString('en-IN')}`],
            ['Cost of Goods Sold (COGS)', `₹${financials.cogs.toLocaleString('en-IN')}`],
            ['Operating Expenses', `₹${financials.expenses.toLocaleString('en-IN')}`],
            ['Net Profit', `₹${financials.netProfit.toLocaleString('en-IN')}`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Item', 'Amount']],
            body: statsData,
            theme: 'grid',
            headStyles: { 
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 11
            },
            bodyStyles: { 
                fontSize: 10,
                textColor: [50, 50, 50]
            },
            alternateRowStyles: { 
                fillColor: [245, 247, 250] 
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Category Breakdown Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Category Profitability', 14, yPos);
        yPos += 10;

        const categoryTableData = categoryProfit.map(cat => [
            cat.name,
            `₹${cat.revenue.toLocaleString('en-IN')}`,
            `₹${cat.profit.toLocaleString('en-IN')}`,
            `${cat.margin}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Revenue', 'Profit', 'Margin']],
            body: categoryTableData,
            theme: 'grid',
            headStyles: { 
                fillColor: [79, 70, 229],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 11
            },
            bodyStyles: { 
                fontSize: 10,
                textColor: [50, 50, 50]
            },
            alternateRowStyles: { 
                fillColor: [245, 247, 250] 
            },
            margin: { left: 14, right: 14 }
        });

        // Footer
        const totalPages = doc.internal.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(128, 128, 128);
            doc.text(
                `Page ${i} of ${totalPages}`,
                pageWidth / 2,
                pageHeight - 10,
                { align: 'center' }
            );
            doc.text(
                'KS4PharmaNet - Profitability Report',
                14,
                pageHeight - 10
            );
        }

        // Generate Blob URL for Preview
        const pdfBlob = doc.output('bloburl');
        setPreviewUrl(pdfBlob);
    };

    return (
        <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <TrendingUp className="text-primary" /> Profit & Loss Analysis
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Detailed insight into margins, costs, and net profitability.</p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={() => setShowFilters(!showFilters)}
                        className={`px-4 py-2 border rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showFilters ? 'bg-gray-100 dark:bg-gray-700 border-gray-400 dark:border-gray-600 text-gray-800 dark:text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    >
                        <Calendar size={16} /> 
                        {dateRange.start ? `${dateRange.start} - ${dateRange.end || '...'}` : 'Filter Date'}
                    </button>
                     <button 
                        onClick={handleExportPDF}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary flex items-center gap-2 shadow-md transition-all hover:shadow-lg"
                    >
                        <Download size={16} /> Preview & Download PDF
                    </button>
                </div>
            </div>

            {/* Date Filter Panel */}
            {showFilters && (
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-wrap items-end gap-4 animate-fade-in">
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                        <input 
                            type="date" 
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                        <input 
                            type="date" 
                            className="px-3 py-2 border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        />
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={() => {
                                setShowFilters(false);
                            }}
                            className="px-4 py-2 bg-gray-800 dark:bg-primary text-white rounded-lg text-sm font-medium hover:bg-black dark:hover:bg-secondary transition-colors"
                        >
                            Apply Filter
                        </button>
                        <button 
                            onClick={() => {
                                setDateRange({ start: '', end: '' });
                                setShowFilters(false);
                            }}
                            className="px-3 py-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                            title="Clear Filter"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Profit Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                 {/* Revenue */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">₹{financials.revenue.toLocaleString()}</h3>
                     <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full">
                        <div className="bg-blue-500 h-1.5 rounded-full w-full"></div>
                    </div>
                </div>

                {/* COGS */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Cost of Goods (COGS)</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">₹{financials.cogs.toLocaleString()}</h3>
                     <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full">
                        <div className="bg-orange-400 h-1.5 rounded-full" style={{ width: `${(financials.cogs/financials.revenue)*100}%` }}></div>
                    </div>
                </div>

                {/* Expenses */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Operating Expenses</p>
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-2">₹{financials.expenses.toLocaleString()}</h3>
                    <div className="w-full bg-gray-100 dark:bg-gray-700 h-1.5 mt-4 rounded-full">
                        <div className="bg-red-400 h-1.5 rounded-full" style={{ width: `${(financials.expenses/financials.revenue)*100}%` }}></div>
                    </div>
                </div>

                {/* Net Profit */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-700 p-6 rounded-2xl shadow-lg shadow-green-200 dark:shadow-green-900/20 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-green-100 text-xs font-bold uppercase tracking-wider">Net Profit</p>
                        <h3 className="text-3xl font-bold mt-2">₹{financials.netProfit.toLocaleString()}</h3>
                        <p className="mt-1 text-sm bg-white/20 inline-block px-2 py-0.5 rounded font-medium">Net Margin: {margin}%</p>
                    </div>
                    <div className="absolute -bottom-4 -right-4 text-white/10">
                        <DollarSign size={100} />
                    </div>
                </div>
            </div>

            {/* Detailed Analysis Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Visual Waterfall (Simplified) */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Profit Waterfall</h3>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-gray-600 dark:text-gray-300">Revenue</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-blue-500 w-full flex items-center px-3 text-white text-xs font-bold">
                                    ₹{financials.revenue.toLocaleString()}
                                </div>
                            </div>
                        </div>

                         <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-gray-600 dark:text-gray-300">COGS</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-orange-400 opacity-30 w-full"></div>
                                <div className="absolute top-0 left-0 h-full bg-orange-500 flex items-center px-3 text-white text-xs font-bold" style={{ width: `${(financials.cogs/financials.revenue)*100}%` }}>
                                    - ₹{financials.cogs.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-gray-600 dark:text-gray-300">Expenses</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-red-400 opacity-30 w-full"></div>
                                <div className="absolute top-0 left-0 h-full bg-red-500 flex items-center px-3 text-white text-xs font-bold" style={{ width: `${(financials.expenses/financials.revenue)*100}%` }}>
                                    - ₹{financials.expenses.toLocaleString()}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            <span className="w-24 text-sm font-bold text-green-700 dark:text-green-400">Net Profit</span>
                            <div className="flex-1 bg-gray-100 dark:bg-gray-700 h-8 rounded-lg overflow-hidden relative border-2 border-green-500 border-dashed">
                                 <div className="absolute top-0 left-0 h-full bg-green-500 flex items-center px-3 text-white text-xs font-bold" style={{ width: `${(financials.netProfit/financials.revenue)*100}%` }}>
                                    = ₹{financials.netProfit.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Category Margins */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <PieChart size={18} className="text-gray-400 dark:text-gray-500" /> Category Margins
                    </h3>
                    <div className="space-y-6">
                        {categoryProfit.map((cat) => (
                            <div key={cat.name}>
                                <div className="flex justify-between items-center mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{cat.name}</span>
                                    <span className={`text-sm font-bold ${cat.margin > 25 ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'}`}>
                                        {cat.margin}% Margin
                                    </span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5">
                                    <div 
                                        className={`h-1.5 rounded-full ${cat.margin > 25 ? 'bg-green-500' : 'bg-orange-500'}`} 
                                        style={{ width: `${cat.margin}%` }}
                                    ></div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Profit: ₹{cat.profit.toLocaleString()}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PDF Preview Modal */}
            {previewUrl && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 print:hidden animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-scale-in">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                                <Download size={20} className="text-primary" /> Report Preview
                            </h3>
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                            >
                                <X size={20} className="text-gray-500" />
                            </button>
                        </div>
                        
                        <div className="flex-1 bg-gray-100 p-4 overflow-hidden relative">
                            <iframe 
                                src={previewUrl} 
                                className="w-full h-full rounded-xl shadow-inner border border-gray-200"
                                title="PDF Preview"
                            />
                        </div>

                        <div className="p-4 border-t bg-white flex justify-end gap-3">
                            <button 
                                onClick={() => setPreviewUrl(null)}
                                className="px-5 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                Close
                            </button>
                            <a 
                                href={previewUrl} 
                                download={`Profit_Report_${new Date().toISOString().split('T')[0]}.pdf`}
                                className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-secondary hover:shadow-xl transition-all flex items-center gap-2"
                                onClick={() => setPreviewUrl(null)}
                            >
                                <Download size={18} /> Download Final PDF
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfitReport;
