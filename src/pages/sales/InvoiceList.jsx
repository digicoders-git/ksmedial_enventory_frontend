import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, FileText, Eye, Download, Printer, MoreVertical, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight, Edit3, Trash2, RotateCcw, Plus } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';
import KS2Logo from '/KS2-Logo.png'; 

const InvoiceList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalInvoices: 0 });
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Fetch Invoices from Backend
    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/sales', {
                params: {
                    keyword: searchTerm,
                    status: statusFilter,
                    pageNumber: currentPage,
                    limit: itemsPerPage
                }
            });

            if (data.success) {
                setInvoices(data.sales);
                setTotalPages(data.pages);
                setTotalItems(data.total);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching invoices:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, statusFilter, currentPage, itemsPerPage]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // Check for pre-filled customer search from navigation
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const customerName = params.get('customerName');
        if (customerName) {
            setSearchTerm(customerName);
            setCurrentPage(1);
        }
    }, [location.search]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Paid': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            case 'Returned': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Partial': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

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
            text: `Are you sure you want to delete invoice ${id}? This will restore stock for its items.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { data } = await api.delete(`/sales/${id}`);
                    if (data.success) {
                        Swal.fire('Deleted!', 'Invoice has been removed and stock restored.', 'success');
                        fetchInvoices();
                    }
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'Delete failed', 'error');
                }
                setActiveDropdown(null);
            }
        });
    };

    const handleEdit = (id) => {
        setActiveDropdown(null);
        navigate(`/sales/pos/edit/${id}`);
    };

    // Calculate display info for pagination
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + invoices.length - 1, totalItems);

    // Report Helpers
    const fetchAllForReport = async () => {
        try {
            const { data } = await api.get('/sales', {
                params: { keyword: searchTerm, status: statusFilter, limit: 1000 }
            });
            return data.sales;
        } catch (error) {
            console.error(error);
            return [];
        }
    };

    const handleDownloadReport = async () => {
        Swal.fire({ title: 'Generating Report...', didOpen: () => Swal.showLoading() });
        const allData = await fetchAllForReport();
        Swal.close();

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const img = new Image();
        img.src = KS2Logo;
        
        img.onload = () => {
            doc.addImage(img, 'PNG', 14, 10, 40, 18);
            doc.setFontSize(22);
            doc.setTextColor(31, 41, 55);
            doc.setFont('helvetica', 'bold');
            doc.text('SALES SUMMARY REPORT', pageWidth - 14, 25, { align: 'right' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - 14, 32, { align: 'right' });

            doc.setDrawColor(240);
            doc.setFillColor(249, 250, 251);
            doc.roundedRect(14, 45, pageWidth - 28, 20, 2, 2, 'FD');

            const reportTotalRevenue = allData.reduce((acc, inv) => acc + inv.totalAmount, 0);

            doc.setFontSize(10);
            doc.text('TOTAL INVOICES', 20, 53);
            doc.text('TOTAL REVENUE', 80, 53);
            doc.text('RECORDS SHOWN', 140, 53);

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(stats.totalCount.toString(), 20, 60);
            doc.text(`Rs. ${reportTotalRevenue.toLocaleString()}`, 80, 60);
            doc.text(allData.length.toString(), 140, 60);

            const tableColumn = ["Invoice No", "Date", "Customer", "Items", "Amount", "Payment", "Status"];
            const tableRows = allData.map(inv => [
                inv.invoiceNumber,
                new Date(inv.createdAt).toLocaleDateString(),
                inv.customerName || 'Walk-in',
                inv.items.reduce((acc, i) => acc + i.quantity, 0),
                `Rs. ${inv.totalAmount.toFixed(2)}`,
                inv.paymentMethod,
                inv.status
            ]);

            autoTable(doc, {
                startY: 75,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [0, 114, 66], textColor: [255, 255, 255] },
                margin: { top: 75 }
            });

            doc.save(`sales_report_${new Date().toISOString().split('T')[0]}.pdf`);
        };
    };

    const handleExport = async () => {
        const allData = await fetchAllForReport();
        const headers = ["Invoice No,Date,Customer,Total Qty,Amount,Payment,Status"];
        const rows = allData.map(inv => 
            `${inv.invoiceNumber},${new Date(inv.createdAt).toLocaleDateString()},"${inv.customerName}",${inv.items.reduce((acc, i) => acc + i.quantity, 0)},${inv.totalAmount},${inv.paymentMethod},${inv.status}`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `sales_${Date.now()}.csv`;
        link.click();
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Invoices</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">History of all dynamic sales transactions.</p>
                </div>
                <div className="flex gap-2">
                     <button onClick={handleDownloadReport} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 font-bold shadow-sm">
                        <FileText size={16} className="text-red-500" /> PDF
                    </button>
                     <button onClick={handleExport} className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2">
                        <Download size={16} /> Export
                    </button>
                    <button onClick={() => navigate('/sales/pos')} className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-primary/90 shadow-md flex items-center gap-2">
                        <Plus size={16} /> New Bill
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Revenue</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{stats.totalRevenue.toLocaleString()}</h3>
                        <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-1">
                            <ArrowUpRight size={14} /> Total Paid
                        </div>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Payments</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{stats.pendingAmount.toLocaleString()}</h3>
                         <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mt-1">
                            <Clock size={14} /> Outstanding
                        </div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                         <Clock size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Invoices</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalCount}</h3>
                         <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-1">
                            <FileText size={14} /> Recorded
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                         <FileText size={24} />
                    </div>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center px-5 py-5">
                <div className="relative w-full xl:w-96">
                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search invoice or customer..." 
                     value={searchTerm}
                     onChange={(e) => handleSearchChange(e.target.value)}
                     className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm text-gray-700 dark:text-white placeholder:text-gray-400 font-medium"
                   />
                </div>
                
                <div className="flex items-center gap-1.5 bg-gray-100/50 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 w-full xl:w-auto overflow-x-auto no-scrollbar">
                    {['All', 'Paid', 'Pending', 'Cancelled', 'Returned'].map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={`flex-1 xl:flex-none px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                ${statusFilter === status 
                                    ? 'bg-white dark:bg-gray-600 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' 
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                    <div className={loading ? 'opacity-50 transition-opacity' : ''}>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-900 dark:text-gray-200 font-black uppercase text-[10px] tracking-widest">
                                <tr>
                                    <th className="px-6 py-5">Invoice No</th>
                                    <th className="px-6 py-5">Date</th>
                                    <th className="px-6 py-5">Customer</th>
                                    <th className="px-6 py-5 text-center">Items</th>
                                    <th className="px-6 py-5">Amount</th>
                                    <th className="px-6 py-5">Payment</th>
                                    <th className="px-6 py-5">Status</th>
                                    <th className="px-6 py-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {invoices.map((inv) => (
                                    <tr key={inv._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{inv.invoiceNumber}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{inv.customerName || 'Walk-in'}</td>
                                        <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{inv.items.length}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">₹{inv.totalAmount.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{inv.paymentMethod}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase ${getStatusStyle(inv.status)} dark:bg-opacity-20`}>
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button onClick={() => navigate(`/sales/invoices/view/${inv._id}`)} className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => navigate(`/sales/invoices/view/${inv._id}?autoPrint=true`)} className="p-1.5 text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-lg">
                                                    <Printer size={16} />
                                                </button>
                                                <div className="relative">
                                                    <button onClick={() => setActiveDropdown(activeDropdown === inv._id ? null : inv._id)} className="p-1.5 text-gray-400 hover:text-gray-800 rounded-lg">
                                                        <MoreVertical size={16} />
                                                    </button>
                                                    {activeDropdown === inv._id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                                                            <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 py-1">
                                                                <button onClick={() => handleEdit(inv._id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                                                    <Edit3 size={14} /> Edit
                                                                </button>
                                                                <button onClick={() => navigate(`/sales/return?invId=${inv._id}`)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 transition-colors">
                                                                    <RotateCcw size={14} /> Return
                                                                </button>
                                                                <button onClick={() => handleDelete(inv._id)} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">
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
                            </tbody>
                        </table>
                        {loading && (
                           <div className="absolute inset-x-0 top-1/2 flex justify-center">
                               <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent"></div>
                           </div>
                        )}
                        {!loading && invoices.length === 0 && (
                            <div className="py-12 text-center text-gray-400">No invoices found matching criteria.</div>
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalItems > 0 && (
                  <div className="px-6 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                        
                        {/* Info & Limit Selector */}
                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
                            <p className="text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1">
                                Showing <span className="font-black text-gray-800 dark:text-gray-200">{startIndex}</span> - <span className="font-black text-gray-800 dark:text-gray-200">{endIndex}</span> of <span className="font-black text-gray-800 dark:text-gray-200">{totalItems}</span> invoices
                            </p>
                            
                            <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm order-1 sm:order-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Show:</label>
                                <select 
                                    value={itemsPerPage}
                                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                                    className="bg-transparent border-none text-sm font-black text-primary outline-none cursor-pointer focus:ring-0 p-0"
                                >
                                    {[5, 10, 20, 50, 100].map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                        </div>

                        {/* Page Numbers */}
                        <div className="flex items-center gap-1.5 sm:gap-2">
                           <button 
                                onClick={() => goToPage(currentPage - 1)} 
                                disabled={currentPage === 1} 
                                className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                                title="Previous Page"
                           >
                               <ChevronLeft size={18} strokeWidth={2.5} />
                           </button>

                           <div className="flex items-center gap-1 sm:gap-1.5">
                               {[...Array(totalPages)].map((_, i) => {
                                   const pg = i + 1;
                                   // Logic to show limited pages with ellipsis if needed
                                   if (totalPages <= 7 || (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1))) {
                                       return (
                                           <button 
                                               key={i} 
                                               onClick={() => goToPage(pg)} 
                                               className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shadow-sm active:scale-95
                                                   ${currentPage === pg 
                                                       ? 'bg-primary text-white shadow-primary/20 scale-105' 
                                                       : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50 border border-gray-200 dark:border-gray-600'}`}
                                           >
                                               {pg}
                                           </button>
                                       );
                                   } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                                       return <span key={i} className="px-1 text-gray-400 font-black">...</span>;
                                   }
                                   return null;
                               })}
                           </div>

                           <button 
                                onClick={() => goToPage(currentPage + 1)} 
                                disabled={currentPage === totalPages} 
                                className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                                title="Next Page"
                           >
                               <ChevronRight size={18} strokeWidth={2.5} />
                           </button>
                        </div>
                    </div>
                  </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceList;
