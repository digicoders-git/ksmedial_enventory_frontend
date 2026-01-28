import React, { useState } from 'react';
import { Package, AlertTriangle, TrendingDown, Layers, ArrowUpRight, ArrowDownRight, Filter, Download, Calendar, Search, X } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const InventoryReport = () => {
    const [showFilters, setShowFilters] = useState(false);
    const [dateRange, setDateRange] = useState({ start: '', end: '' });
    const [previewUrl, setPreviewUrl] = useState(null);

    // Mock Data for Inventory Report
    const stats = {
        totalItems: 1240,
        totalValue: 1540000,
        lowStock: 45,
        nearExpiry: 23
    };

    const categoryData = [
        { name: 'Tablets', stock: 850, value: 850000, percent: 55 },
        { name: 'Syrups', stock: 200, value: 320000, percent: 21 },
        { name: 'Injections', stock: 150, value: 280000, percent: 18 },
        { name: 'Surgicals', stock: 40, value: 90000, percent: 6 },
    ];

    const lowStockItems = [
        { name: 'Dolo 650', stock: 15, min: 50, supplier: 'Micro Labs' },
        { name: 'Azithral 500', stock: 8, min: 30, supplier: 'Alembic' },
        { name: 'Pan 40', stock: 20, min: 100, supplier: 'Alkem' },
    ];

    const expiryItems = [
        { name: 'Crosin Syrup', batch: 'B992', expiry: 'Jan 2024', stock: 10 },
        { name: 'Montek LC', batch: 'M221', expiry: 'Feb 2024', stock: 45 },
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
        doc.text('INVENTORY REPORT', pageWidth / 2, 15, { align: 'center' });
        
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
            ['Total Stock Value', `₹${(stats.totalValue/100000).toFixed(2)} Lakh`],
            ['Total Items', stats.totalItems.toString()],
            ['Low Stock Alerts', stats.lowStock.toString()],
            ['Near Expiry Items', stats.nearExpiry.toString()]
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

        // Category Breakdown Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Stock by Category', 14, yPos);
        yPos += 10;

        const categoryTableData = categoryData.map(cat => [
            cat.name,
            cat.stock.toString(),
            `₹${cat.value.toLocaleString('en-IN')}`,
            `${cat.percent}%`
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Category', 'Stock Qty', 'Value', 'Percentage']],
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

        yPos = doc.lastAutoTable.finalY + 15;

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        // Critical Low Stock Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(220, 38, 38); // Red color
        doc.text('⚠ Critical Low Stock Items', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;

        const lowStockTableData = lowStockItems.map(item => [
            item.name,
            item.stock.toString(),
            item.min.toString(),
            item.supplier
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Item Name', 'Current Stock', 'Min Level', 'Supplier']],
            body: lowStockTableData,
            theme: 'grid',
            headStyles: { 
                fillColor: [220, 38, 38],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 11
            },
            bodyStyles: { 
                fontSize: 10,
                textColor: [50, 50, 50]
            },
            columnStyles: {
                1: { textColor: [220, 38, 38], fontStyle: 'bold' }
            },
            alternateRowStyles: { 
                fillColor: [254, 242, 242] 
            },
            margin: { left: 14, right: 14 }
        });

        yPos = doc.lastAutoTable.finalY + 15;

        // Check if we need a new page
        if (yPos > pageHeight - 60) {
            doc.addPage();
            yPos = 20;
        }

        // Expiring Soon Section
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(234, 88, 12); // Orange color
        doc.text('⚠ Items Expiring Soon (30 Days)', 14, yPos);
        doc.setTextColor(0, 0, 0);
        yPos += 10;

        const expiryTableData = expiryItems.map(item => [
            item.name,
            item.batch,
            item.expiry,
            item.stock.toString()
        ]);

        autoTable(doc, {
            startY: yPos,
            head: [['Item Name', 'Batch No.', 'Expiry Date', 'Stock']],
            body: expiryTableData,
            theme: 'grid',
            headStyles: { 
                fillColor: [234, 88, 12],
                textColor: [255, 255, 255],
                fontStyle: 'bold',
                fontSize: 11
            },
            bodyStyles: { 
                fontSize: 10,
                textColor: [50, 50, 50]
            },
            columnStyles: {
                2: { textColor: [234, 88, 12], fontStyle: 'bold' }
            },
            alternateRowStyles: { 
                fillColor: [255, 247, 237] 
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
                'KS4PharmaNet - Inventory Management System',
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
                        <Package className="text-primary" /> Inventory Reports
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Comprehensive analysis of stock levels, valuation, and health.</p>
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
                                // Logic to apply filter would go here
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

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Stock Value</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{(stats.totalValue/100000).toFixed(2)} Lakh</h3>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg">
                            <Layers size={20} />
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Items</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalItems}</h3>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-lg">
                            <Package size={20} />
                        </div>
                    </div>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Low Stock Alerts</p>
                            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.lowStock}</h3>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                    </div>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Near Expiry</p>
                            <h3 className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{stats.nearExpiry}</h3>
                        </div>
                        <div className="p-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts & Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Valuation */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <h3 className="font-bold text-gray-800 dark:text-white mb-6 flex items-center gap-2">
                        <Layers size={18} className="text-gray-400 dark:text-gray-500" /> Stock by Category
                    </h3>
                    <div className="space-y-5">
                        {categoryData.map((cat) => (
                            <div key={cat.name}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{cat.name}</span>
                                    <span className="font-bold text-gray-900 dark:text-white">₹{cat.value.toLocaleString()} ({cat.percent}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                     <div 
                                        className="bg-primary h-2.5 rounded-full" 
                                        style={{ width: `${cat.percent}%` }}
                                     ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Critical Alerts */}
                <div className="space-y-6">
                    {/* Low Stock Table */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-red-600 dark:text-red-400 flex items-center gap-2">
                                <TrendingDown size={18} /> Critical Low Stock
                            </h3>
                            <button className="text-xs text-primary font-bold hover:underline">View All</button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
                                    <tr>
                                        <th className="px-3 py-2 rounded-l-lg">Item Name</th>
                                        <th className="px-3 py-2">Current</th>
                                        <th className="px-3 py-2 rounded-r-lg">Min Lvl</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {lowStockItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-200">{item.name}</td>
                                            <td className="px-3 py-3 font-bold text-red-600 dark:text-red-400">{item.stock}</td>
                                            <td className="px-3 py-3 text-gray-500 dark:text-gray-400">{item.min}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
                    </div>

                    {/* Expiry Table */}
                     <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
                         <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-orange-600 dark:text-orange-400 flex items-center gap-2">
                                <AlertTriangle size={18} /> Expiring Soon (30 Days)
                            </h3>
                            <button className="text-xs text-primary font-bold hover:underline">View All</button>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-750">
                                    <tr>
                                        <th className="px-3 py-2 rounded-l-lg">Item Name</th>
                                        <th className="px-3 py-2">Batch</th>
                                        <th className="px-3 py-2 rounded-r-lg">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {expiryItems.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-3 py-3 font-medium text-gray-700 dark:text-gray-200">{item.name}</td>
                                            <td className="px-3 py-3 font-mono text-gray-500 dark:text-gray-400 text-xs">{item.batch}</td>
                                            <td className="px-3 py-3 font-bold text-orange-600 dark:text-orange-400">{item.expiry}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                         </div>
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
                                download={`Inventory_Report_${new Date().toISOString().split('T')[0]}.pdf`}
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

export default InventoryReport;
