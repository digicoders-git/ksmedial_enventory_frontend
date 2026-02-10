import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, Filter, FileText, Eye, Download, Printer, 
    MoreVertical, Calendar, ArrowUpRight, CheckCircle, 
    Clock, XCircle, ChevronLeft, ChevronRight, Edit3, 
    Trash2, RotateCcw, Plus, CreditCard, User, Box, Archive
} from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import api from '../../api/axios';
import KS2Logo from '/KS2-Logo.png'; 
import moment from 'moment';

const InvoiceList = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Data State
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalRevenue: 0, pendingAmount: 0, totalCount: 0 });
    
    // Filter State
    const [filters, setFilters] = useState({
        keyword: '',
        status: 'All',
        paymentMethod: 'All',
        startDate: '',
        endDate: ''
    });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Fetch Invoices
    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const params = {
                pageNumber: currentPage,
                limit: itemsPerPage,
                keyword: filters.keyword,
                status: filters.status !== 'All' ? filters.status : undefined,
                paymentMethod: filters.paymentMethod !== 'All' ? filters.paymentMethod : undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined
            };

            const { data } = await api.get('/sales', { params });

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
            Swal.fire({
                icon: 'error',
                title: 'Data Load Error',
                text: 'Failed to fetch invoice data. Please try again.'
            });
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, filters]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    // Handle initial navigation params (e.g., direct link from customer view)
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const customerName = params.get('customerName');
        if (customerName) {
            setFilters(prev => ({ ...prev, keyword: customerName }));
        }
    }, [location.search]);

    // Handlers
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Reset to first page on filter change
    };

    const clearFilters = () => {
        setFilters({
            keyword: '',
            status: 'All',
            paymentMethod: 'All',
            startDate: '',
            endDate: ''
        });
        setCurrentPage(1);
    };

    const handleDelete = async (id) => {
        const result = await Swal.fire({
            title: 'Delete Invoice?',
            text: `Are you sure you want to delete invoice ${id}? This will restore stock for its items.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        });

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
    };

    const handleUpdateStatus = async (invoice) => {
        const { value: status } = await Swal.fire({
            title: 'Update Status',
            input: 'select',
            inputOptions: {
                'Paid': 'Paid (Received)',
                'Pending': 'Pending (Outstanding)',
                'Cancelled': 'Cancelled (Void)',
                'Returned': 'Returned'
            },
            inputValue: invoice.status,
            showCancelButton: true,
            confirmButtonText: 'Update'
        });

        if (status && status !== invoice.status) {
            try {
                const { data } = await api.put(`/sales/${invoice._id}`, { status });
                if (data.success) {
                    Swal.fire('Updated!', 'Invoice status updated successfully.', 'success');
                    fetchInvoices();
                } else {
                    Swal.fire('Error', data.message || 'Update failed', 'error');
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to update status', 'error');
            }
        }
    };

    // Reporting
    // Reporting
    const fetchAllForReport = async () => {
        try {
            const params = {
                limit: 1000, 
                keyword: filters.keyword,
                status: filters.status !== 'All' ? filters.status : undefined,
                paymentMethod: filters.paymentMethod !== 'All' ? filters.paymentMethod : undefined,
                startDate: filters.startDate || undefined,
                endDate: filters.endDate || undefined
            };
            const { data } = await api.get('/sales', { params });
            return data.sales || [];
        } catch {
            return [];
        }
    };

    const handleDownloadPDF = async () => {
        Swal.fire({ title: 'Generating PDF...', didOpen: () => Swal.showLoading() });
        const allData = await fetchAllForReport();
        Swal.close();

        if (!allData.length) {
            Swal.fire('Info', 'No data to export', 'info');
            return;
        }

        const doc = new jsPDF();
        
        // Header
        doc.setFontSize(18);
        doc.text('Sales Invoice Report', 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${moment().format('LLL')}`, 14, 26);
        
        // Table
        const tableColumn = ["Invoice No", "Date", "Customer", "Items", "Amount", "Method", "Status"];
        const tableRows = allData.map(inv => [
            inv.invoiceNumber,
            moment(inv.createdAt).format('DD MMM YYYY'),
            inv.customerName || 'Walk-in',
            inv.items.length,
            `Rs. ${inv.totalAmount.toFixed(2)}`,
            inv.paymentMethod,
            inv.status
        ]);

        autoTable(doc, {
            startY: 35,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [13, 148, 136] }, // Teal color
        });

        doc.save(`sales_report_${moment().format('YYYY-MM-DD')}.pdf`);
    };

    const handleExportCSV = async () => {
        const allData = await fetchAllForReport();
        if (!allData.length) return;

        const headers = ["Invoice No,Date,Customer,Total Qty,Amount,Payment,Status"];
        const rows = allData.map(inv => 
            `${inv.invoiceNumber},${moment(inv.createdAt).format('YYYY-MM-DD')},"${inv.customerName}",${inv.items.length},${inv.totalAmount},${inv.paymentMethod},${inv.status}`
        );
        const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
        const link = document.createElement("a");
        link.href = encodeURI(csvContent);
        link.download = `sales_export_${moment().format('YYYY-MM-DD')}.csv`;
        link.click();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Paid': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'Pending': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Cancelled': return 'text-red-600 bg-red-50 border-red-200';
            case 'Returned': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(startIndex + invoices.length - 1, totalItems);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Sales Invoices</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage and view all sales transactions.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <button onClick={handleDownloadPDF} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all shadow-sm">
                        <FileText size={18} />
                    </button>
                    <button onClick={handleExportCSV} className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-all shadow-sm">
                        <Download size={18} />
                    </button>
                    <button onClick={() => navigate('/sales/pos')} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200 dark:shadow-none transition-all">
                        <Plus size={18} /> New Bill
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Revenue</p>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">₹{stats.totalRevenue?.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Total Invoices</p>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">{stats.totalCount}</h3>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl">
                        <FileText size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Outstanding</p>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-1">₹{stats.pendingAmount?.toLocaleString()}</h3>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl">
                        <Clock size={24} />
                    </div>
                </div>
            </div>

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Search</label>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                            <input 
                                type="text"
                                name="keyword"
                                placeholder="Invoice # or Customer"
                                value={filters.keyword}
                                onChange={handleFilterChange}
                                className="w-full pl-8 pr-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Date Range</label>
                        < div className="flex gap-2">
                            <input 
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                             <input 
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full px-2 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Status</label>
                        <select 
                            name="status"
                            value={filters.status}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Paid">Paid</option>
                            <option value="Pending">Pending</option>
                            <option value="Returned">Returned</option>
                            <option value="Cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Payment</label>
                        <select 
                            name="paymentMethod"
                            value={filters.paymentMethod}
                            onChange={handleFilterChange}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-xs outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                            <option value="All">All Methods</option>
                            <option value="Cash">Cash</option>
                            <option value="Card">Card</option>
                            <option value="UPI">UPI</option>
                            <option value="Credit">Credit</option>
                        </select>
                    </div>

                    <div className="flex gap-2">
                        <button onClick={() => setCurrentPage(1)} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                            Filter
                        </button>
                        <button onClick={clearFilters} className="px-3 bg-gray-100 hover:bg-gray-200 text-gray-600 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all">
                            Clear
                        </button>
                    </div>
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto min-h-[300px]">
                    <div className={loading ? 'opacity-50 pointer-events-none' : ''}>
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/80 dark:bg-gray-900/20 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">Invoice Details</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4 text-center">Items</th>
                                    <th className="px-6 py-4 text-right">Amount</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-xs text-gray-600 dark:text-gray-300">
                                {invoices.length === 0 && !loading ? (
                                    <tr>
                                        <td colSpan="6" className="py-20 text-center text-gray-400 font-medium">
                                            No invoices found matching your criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-all group">
                                            <td className="px-6 py-4">
                                                <p className="font-black text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                    {inv.invoiceNumber}
                                                    {moment().diff(moment(inv.createdAt), 'hours') < 24 && (
                                                        <span className="text-[8px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-black uppercase">New</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center gap-2 text-[10px] text-gray-400 mt-1 font-bold">
                                                    <Calendar size={10} />
                                                    {moment(inv.createdAt).format('DD MMM YYYY, h:mm A')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-500 font-black">
                                                        {inv.customerName?.charAt(0) || 'W'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 dark:text-gray-200">{inv.customerName || 'Walk-in'}</p>
                                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5">{inv.customerPhone || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-md font-bold">
                                                    <Box size={12} /> {inv.items.length}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{inv.totalAmount.toLocaleString()}</p>
                                                <p className="text-[10px] text-gray-400 font-bold mt-0.5 flex items-center justify-end gap-1">
                                                    <CreditCard size={10} /> {inv.paymentMethod}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-tight border ${getStatusColor(inv.status)}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex justify-end items-center gap-1 relative">
                                                    <button 
                                                        onClick={() => navigate(`/sales/invoices/view/${inv._id}`)}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-emerald-600 transition-all"
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => navigate(`/sales/invoices/view/${inv._id}?autoPrint=true`)}
                                                        className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white transition-all"
                                                        title="Print Invoice"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    
                                                    <div className="relative">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); setActiveDropdown(activeDropdown === inv._id ? null : inv._id); }}
                                                            className={`p-1.5 rounded-lg transition-all ${activeDropdown === inv._id ? 'bg-gray-100 text-gray-800' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-800'}`}
                                                        >
                                                            <MoreVertical size={16} />
                                                        </button>
                                                        
                                                        {activeDropdown === inv._id && (
                                                            <>
                                                                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                                                                <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-20 py-1 overflow-hidden animate-scale-up">
                                                                    <button 
                                                                        onClick={() => { setActiveDropdown(null); handleUpdateStatus(inv); }}
                                                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                                    >
                                                                        <CheckCircle size={14} /> Update Status
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { setActiveDropdown(null); navigate(`/sales/pos/edit/${inv._id}`); }}
                                                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                                                    >
                                                                        <Edit3 size={14} /> Edit Order
                                                                    </button>
                                                                    <button 
                                                                        onClick={() => { setActiveDropdown(null); navigate(`/sales/return?invId=${inv._id}`); }}
                                                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-all"
                                                                    >
                                                                        <RotateCcw size={14} /> Return Items
                                                                    </button>
                                                                    <div className="h-px bg-gray-100 dark:bg-gray-700 my-1"></div>
                                                                    <button 
                                                                        onClick={() => handleDelete(inv._id)}
                                                                        className="w-full flex items-center gap-2 px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
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
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalItems > 0 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
                        <p className="text-xs font-bold text-gray-500 order-2 sm:order-1">
                            Showing <span className="text-gray-800 dark:text-white">{startIndex}-{endIndex}</span> of <span className="text-gray-800 dark:text-white">{totalItems}</span>
                        </p>
                        
                        <div className="flex items-center gap-3 order-1 sm:order-2">
                             <select 
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-xs font-bold rounded-lg px-2 py-1.5 outline-none focus:ring-1 focus:ring-emerald-500"
                            >
                                <option value={10}>10 / page</option>
                                <option value={20}>20 / page</option>
                                <option value={50}>50 / page</option>
                                <option value={100}>100 / page</option>
                            </select>

                            <div className="flex items-center gap-1">
                                <button 
                                    onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                                    disabled={currentPage === 1}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <span className="text-xs font-black min-w-[20px] text-center">{currentPage}</span>
                                <button 
                                    onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 transition-all"
                                >
                                    <ChevronRight size={16} />
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
