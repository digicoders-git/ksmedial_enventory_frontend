import React, { useState, useMemo } from 'react';
import { Search, Filter, FileText, Eye, Download, Printer, MoreVertical, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Edit3, Trash2, RotateCcw, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 

const InvoiceList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [activeDropdown, setActiveDropdown] = useState(null);
    const location = React.useMemo(() => window.location, []);

    // Check for pre-filled customer search from navigation
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const customerName = params.get('customerName');
        if (customerName) {
            setSearchTerm(customerName);
            setCurrentPage(1);
        }
    }, [location.search]);

    // Mock Data
    const invoices = [
        { id: 'INV-2024-001', date: '2024-01-22', customer: 'Rahul Sharma', amount: 1250.00, items: 3, status: 'Paid', payment: 'UPI' },
        { id: 'INV-2024-002', date: '2024-01-22', customer: 'Priya Verma', amount: 450.50, items: 1, status: 'Paid', payment: 'Cash' },
        { id: 'INV-2024-003', date: '2024-01-21', customer: 'Amit Singh', amount: 3200.00, items: 8, status: 'Pending', payment: 'Credit' },
        { id: 'INV-2024-004', date: '2024-01-20', customer: 'Walk-in Customer', amount: 150.00, items: 1, status: 'Paid', payment: 'Cash' },
        { id: 'INV-2024-005', date: '2024-01-19', customer: 'Sneha Gupta', amount: 890.00, items: 4, status: 'Cancelled', payment: '-' },
        { id: 'INV-2024-006', date: '2024-01-18', customer: 'Rohan Das', amount: 2100.00, items: 5, status: 'Paid', payment: 'Card' },
        { id: 'INV-2024-007', date: '2024-01-18', customer: 'Kavita Iyer', amount: 550.00, items: 2, status: 'Paid', payment: 'UPI' },
        { id: 'INV-2024-008', date: '2024-01-17', customer: 'Arjun Reddy', amount: 4300.00, items: 10, status: 'Pending', payment: 'Credit' },
        { id: 'INV-2024-009', date: '2024-01-16', customer: 'Meera Nair', amount: 120.00, items: 1, status: 'Paid', payment: 'Cash' },
        { id: 'INV-2024-010', date: '2024-01-15', customer: 'Suresh Raina', amount: 980.00, items: 3, status: 'Cancelled', payment: '-' },
        { id: 'INV-2024-011', date: '2024-01-14', customer: 'Anjali Devi', amount: 2750.00, items: 6, status: 'Paid', payment: 'Card' },
        { id: 'INV-2024-012', date: '2024-01-13', customer: 'Vikram Singh', amount: 600.00, items: 2, status: 'Paid', payment: 'UPI' },
        { id: 'INV-2024-013', date: '2024-01-12', customer: 'Pooja Hegde', amount: 3400.00, items: 9, status: 'Pending', payment: 'Credit' },
        { id: 'INV-2024-014', date: '2024-01-11', customer: 'Rajesh Khanna', amount: 180.00, items: 1, status: 'Paid', payment: 'Cash' },
        { id: 'INV-2024-015', date: '2024-01-10', customer: 'Simran Kaur', amount: 1100.00, items: 3, status: 'Paid', payment: 'UPI' },
    ];

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Filter & Pagination Logic
    const { paginatedInvoices, totalPages, paginationInfo, filteredAll } = useMemo(() => {
        // Step 1: Filter
        let filtered = invoices.filter(inv => {
            const matchesSearch = inv.customer.toLowerCase().includes(searchTerm.toLowerCase()) || inv.id.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
            return matchesSearch && matchesStatus;
        });

        // Step 2: Pagination
        const totalItems = filtered.length;
        const totalPgs = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filtered.slice(startIndex, endIndex);

        return {
            paginatedInvoices: paginatedItems,
            filteredAll: filtered,
            totalPages: totalPgs,
            paginationInfo: {
                totalItems,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, totalItems),
                currentPage
            }
        };
    }, [invoices, searchTerm, statusFilter, currentPage, itemsPerPage]);

    // Handlers
    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleStatusChange = (status) => {
        setStatusFilter(status);
        setCurrentPage(1);
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Delete Invoice?',
            text: `Are you sure you want to delete invoice ${id}? This action cannot be undone.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                // In a real app, you would call an API here
                Swal.fire('Deleted!', 'Invoice has been removed from records.', 'success');
                setActiveDropdown(null);
            }
        });
    };

    const handleEdit = (id) => {
        Swal.fire({
            title: 'Edit Invoice',
            text: `Navigating to edit mode for ${id}...`,
            icon: 'info',
            timer: 1000,
            showConfirmButton: false
        });
        setActiveDropdown(null);
        navigate(`/sales/pos/edit/${id}`);
    };

    const totalSales = invoices.filter(i => i.status === 'Paid').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = invoices.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0);

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        
        // Helper to add Logo
        const img = new Image();
        img.src = KS2Logo;
        
        img.onload = () => {
            // Logo
            doc.addImage(img, 'PNG', 14, 10, 45, 20);

            // Company Info
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('KS Pharma Net', 14, 40);
            
            // Header
            doc.setFontSize(24);
            doc.setTextColor(31, 41, 55); // Gray-800
            doc.setFont('helvetica', 'bold');
            doc.text('SALES SUMMARY REPORT', pageWidth - 14, 25, { align: 'right' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 14, 32, { align: 'right' });
            doc.text(`Filtered by Status: ${statusFilter}`, pageWidth - 14, 37, { align: 'right' });

            // Summary Stats Section
            doc.setDrawColor(240);
            doc.setFillColor(249, 250, 251); // Gray-50
            doc.roundedRect(14, 50, pageWidth - 28, 25, 2, 2, 'FD');

            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('TOTAL INVOICES', 20, 60);
            doc.text('TOTAL REVENUE', 80, 60);
            doc.text('PENDING AMOUNT', 140, 60);

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(filteredAll.length.toString(), 20, 68);
            doc.text(`Rs. ${filteredAll.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, 80, 68);
            doc.text(`Rs. ${filteredAll.filter(i => i.status === 'Pending').reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, 140, 68);

            // Table
            const tableColumn = ["Invoice No", "Date", "Customer", "Items", "Amount", "Payment", "Status"];
            const tableRows = filteredAll.map(inv => [
                inv.id,
                inv.date,
                inv.customer,
                inv.items,
                `Rs. ${inv.amount.toFixed(2)}`,
                inv.payment,
                inv.status
            ]);

            autoTable(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [31, 41, 55], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    4: { halign: 'right' },
                    6: { halign: 'center' },
                },
                margin: { left: 14, right: 14 },
            });

            // Footer
            const pageCount = doc.internal.getNumberOfPages();
            doc.setFontSize(8);
            for(let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.text(`Page ${i} of ${pageCount}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
            }

            doc.save(`sales_report_${statusFilter}_${new Date().toISOString().split('T')[0]}.pdf`);
        };
        
        img.onerror = () => {
            doc.text('SALES SUMMARY REPORT', 14, 22);
            doc.save('sales_report.pdf');
        }
    };

    const handleExport = () => {
        const headers = ["Invoice No,Date,Customer,Items,Amount,Payment,Status"];
        const rows = filteredAll.map(inv => 
            `${inv.id},${inv.date},"${inv.customer}",${inv.items},${inv.amount},${inv.payment},${inv.status}`
        );
        
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `sales_invoices_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Invoices</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">History of all sales transactions and bills.</p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={handleDownloadReport}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold shadow-sm"
                     >
                        <FileText size={16} className="text-red-500" /> Sales Report PDF
                    </button>
                     <button 
                        onClick={handleExport}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2"
                     >
                        <Download size={16} /> Export CSV
                    </button>
                    <button 
                        onClick={() => navigate('/sales/pos')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-md active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={16} /> New Bill
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{totalSales.toLocaleString()}</h3>
                        <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-1">
                            <ArrowUpRight size={14} /> +12% this week
                        </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Payments</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{pendingAmount.toLocaleString()}</h3>
                         <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mt-1">
                            <Clock size={14} /> 3 Invoices
                        </div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                         <Clock size={24} />
                    </div>
                </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Invoices</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{invoices.length}</h3>
                         <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-1">
                            <FileText size={14} /> Since inception
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                         <FileText size={24} />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search invoice no, customer name..." 
                     value={searchTerm}
                     onChange={(e) => handleSearchChange(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-700 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                   />
                </div>
                
                <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto">
                    {['All', 'Paid', 'Pending', 'Cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                ${statusFilter === status 
                                    ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >
                            {status}
                        </button>
                    ))}
                    
                    <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 whitespace-nowrap bg-white dark:bg-gray-800">
                        <Calendar size={16} /> Date Range
                    </button>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Invoice No</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Customer</th>
                                <th className="px-6 py-4 text-center">Items</th>
                                <th className="px-6 py-4">Amount</th>
                                <th className="px-6 py-4">Payment</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {paginatedInvoices.map((inv) => (
                                <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{inv.id}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{inv.date}</td>
                                    <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{inv.customer}</td>
                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{inv.items}</td>
                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">₹{inv.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.payment}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(inv.status)} dark:bg-opacity-20`}>
                                            {inv.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`/sales/invoices/view/${inv.id}`)}
                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/sales/invoices/view/${inv.id}`)}
                                                className="p-1.5 text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all" 
                                                title="Print Invoice"
                                            >
                                                <Printer size={16} />
                                            </button>
                                            
                                            {/* More Options Dropdown */}
                                            <div className="relative">
                                                <button 
                                                    onClick={() => setActiveDropdown(activeDropdown === inv.id ? null : inv.id)}
                                                    className={`p-1.5 rounded-lg transition-all ${activeDropdown === inv.id ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700'}`}
                                                    title="More Options"
                                                >
                                                    <MoreVertical size={16} />
                                                </button>
                                                
                                                {activeDropdown === inv.id && (
                                                    <>
                                                        <div 
                                                            className="fixed inset-0 z-10" 
                                                            onClick={() => setActiveDropdown(null)}
                                                        ></div>
                                                        <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 py-1 animate-scale-up">
                                                            <button 
                                                                onClick={() => handleEdit(inv.id)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                            >
                                                                <Edit3 size={14} /> Edit
                                                            </button>
                                                            <button 
                                                                onClick={() => navigate(`/sales/return?invId=${inv.id}`)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors"
                                                            >
                                                                <RotateCcw size={14} /> Return
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(inv.id)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                            >
                                                                <Trash2 size={14} /> Delete
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                        No invoices found matching your criteria.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {paginationInfo.totalItems > 0 && (
                  <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      {/* Items Info */}
                      <div className="flex items-center gap-4">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Showing <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                          <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                          <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> items
                        </p>
                        
                        {/* Items per page selector */}
                        <div className="flex items-center gap-2">
                          <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(e.target.value)}
                            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                          </select>
                        </div>
                      </div>

                      {/* Page Navigation */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          {/* Previous Button */}
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            title="Previous Page"
                          >
                            <ChevronLeft size={18} />
                          </button>

                          {/* Page Numbers */}
                          <div className="flex items-center gap-1">
                            {/* First Page */}
                            {currentPage > 2 && (
                              <>
                                <button
                                  onClick={() => goToPage(1)}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                >
                                  1
                                </button>
                                {currentPage > 3 && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
                              </>
                            )}

                            {/* Previous Page */}
                            {currentPage > 1 && (
                              <button
                                onClick={() => goToPage(currentPage - 1)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                              >
                                {currentPage - 1}
                              </button>
                            )}

                            {/* Current Page */}
                            <button
                              className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-white shadow-sm"
                            >
                              {currentPage}
                            </button>

                            {/* Next Page */}
                            {currentPage < totalPages && (
                              <button
                                onClick={() => goToPage(currentPage + 1)}
                                className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                              >
                                {currentPage + 1}
                              </button>
                            )}

                            {/* Last Page */}
                            {currentPage < totalPages - 1 && (
                              <>
                                {currentPage < totalPages - 2 && (
                                  <span className="px-2 text-gray-400">...</span>
                                )}
                                <button
                                  onClick={() => goToPage(totalPages)}
                                  className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                                >
                                  {totalPages}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Next Button */}
                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                            title="Next Page"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;
