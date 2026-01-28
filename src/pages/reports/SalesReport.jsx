import React, { useState } from 'react';
import { BarChart2, TrendingUp, Calendar, Download, CreditCard, DollarSign, User, ArrowUpRight, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const SalesReport = () => {

    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [previewUrl, setPreviewUrl] = useState(null);

    // Mock Data
    const summary = {
        totalSales: 450000,
        totalOrders: 1250,
        avgOrderValue: 360,
        growth: 12.5
    };

    const paymentMethods = [
        { method: 'Cash', amount: 120000, count: 450, color: 'bg-green-500' },
        { method: 'UPI / QR', amount: 280000, count: 700, color: 'bg-blue-500' },
        { method: 'Card', amount: 50000, count: 100, color: 'bg-purple-500' },
    ];

    const topProducts = [
        { name: 'Dolo 650', sold: 1200, revenue: 36000 },
        { name: 'Azithral 500', sold: 450, revenue: 51750 },
        { name: 'Shelcal 500', sold: 300, revenue: 27000 },
        { name: 'Pan 40', sold: 800, revenue: 88000 },
        { name: 'Becosules', sold: 600, revenue: 24000 },
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
        doc.text('SALES REPORT', pageWidth / 2, 15, { align: 'center' });
        
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

        // Overview Statistics Section
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Overview Statistics', 14, yPos);
        yPos += 10;

        // Stats boxes
        const statsData = [
            ['Total Sales', `₹${(summary.totalSales/1000).toFixed(1)}k`],
            ['Total Orders', summary.totalOrders.toString()],
            ['Avg Order Value', `₹${summary.avgOrderValue}`],
            ['Growth', `+${summary.growth}%`]
        ];

        autoTable(doc, {
            startY: yPos,
            head: [['Metric', 'Value']],
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

        // Payment Modes Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Payment Modes', 14, yPos);
        yPos += 10;

        const paymentTableData = paymentMethods.map(pm => [
            pm.method,
            `₹${pm.amount.toLocaleString('en-IN')}`,
            pm.count.toString(),
            `${((pm.amount / summary.totalSales) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Method', 'Revenue', 'Transactions', 'Share']],
            body: paymentTableData,
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

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        // Top Products Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Top Performing Products', 14, yPos);
        yPos += 10;

        const productTableData = topProducts.map(prod => [
            prod.name,
            prod.sold.toString(),
            `₹${prod.revenue.toLocaleString('en-IN')}`,
            `${((prod.revenue / summary.totalSales) * 100).toFixed(1)}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Product Name', 'Units Sold', 'Revenue', 'Contribution']],
            body: productTableData,
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

        // Footer on last page
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
                'KS4PharmaNet - Sales Analysis Report',
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
                        <BarChart2 className="text-primary" /> Sales Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Analyze sales performance, trends, and revenue sources.</p>
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

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 dark:opacity-5">
                        <DollarSign size={64} />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Sales</p>
                    <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">₹{(summary.totalSales/1000).toFixed(1)}k</h3>
                    <div className="flex items-center gap-1 text-green-500 dark:text-green-400 text-sm font-bold mt-2">
                        <TrendingUp size={16} /> +{summary.growth}%
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Orders</p>
                     <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">{summary.totalOrders}</h3>
                     <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">In selected period</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Avg Order Value</p>
                     <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">₹{summary.avgOrderValue}</h3>
                     <p className="text-gray-400 dark:text-gray-500 text-xs mt-2">Per transaction</p>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                     <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">New Customers</p>
                     <h3 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">45</h3>
                     <div className="flex items-center gap-1 text-green-500 dark:text-green-400 text-sm font-bold mt-2">
                        <ArrowUpRight size={16} /> +5%
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Visual Chart Placeholder */}
                <div className="col-span-1 lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6">Sales Trend (Daily)</h3>
                    <div className="h-64 flex items-end justify-between gap-2">
                        {[40, 65, 45, 80, 55, 90, 70, 85, 60, 75, 50, 95, 80, 60].map((h, i) => (
                            <div key={i} className="w-full bg-blue-50 dark:bg-gray-700 rounded-t-lg relative group">
                                <div 
                                    className="absolute bottom-0 w-full bg-primary rounded-t-lg transition-all duration-500 group-hover:bg-secondary" 
                                    style={{ height: `${h}%` }}
                                ></div>
                                <div className="opacity-0 group-hover:opacity-100 absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-800 dark:bg-gray-700 text-white text-xs py-1 px-2 rounded pointer-events-none transition-opacity">
                                    ₹{h * 1000}
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-4 text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wider">
                        <span>1st</span>
                        <span>5th</span>
                        <span>10th</span>
                        <span>15th</span>
                        <span>20th</span>
                        <span>25th</span>
                        <span>30th</span>
                    </div>
                </div>

                {/* Payment Breakdown */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <CreditCard size={18} className="text-gray-400 dark:text-gray-500" /> Payment Modes
                    </h3>
                    <div className="space-y-6">
                        {paymentMethods.map((pm) => (
                            <div key={pm.method}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-3 h-3 rounded-full ${pm.color}`}></div>
                                        <span className="font-medium text-gray-700 dark:text-gray-300 text-sm">{pm.method}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 dark:text-white text-sm">₹{pm.amount.toLocaleString()}</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2">
                                    <div className={`h-2 rounded-full ${pm.color}`} style={{ width: `${(pm.amount / summary.totalSales) * 100}%` }}></div>
                                </div>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">{pm.count} Transactions</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Top Products Table */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="font-bold text-gray-800 dark:text-white mb-4">Top Performing Products</h3>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
                            <tr>
                                <th className="px-4 py-3 rounded-l-lg">Product Name</th>
                                <th className="px-4 py-3 text-right">Units Sold</th>
                                <th className="px-4 py-3 text-right">Revenue</th>
                                <th className="px-4 py-3 rounded-r-lg text-right">Contribution</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {topProducts.map((prod, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-white">{prod.name}</td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{prod.sold}</td>
                                    <td className="px-4 py-3 text-right font-bold text-primary">₹{prod.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">{((prod.revenue / summary.totalSales) * 100).toFixed(1)}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
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
                                download={`Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`}
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

export default SalesReport;
