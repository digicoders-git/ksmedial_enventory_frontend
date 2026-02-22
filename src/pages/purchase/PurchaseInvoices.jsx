import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, FileText, Eye, Download, Printer, MoreVertical, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, Plus, Truck, AlertCircle, Edit2, Trash2, X, ChevronLeft, ChevronRight, File } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const PurchaseInvoices = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [editFormData, setEditFormData] = useState(null);

    // Filter & Pagination States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);

    const [invoices, setInvoices] = useState([]);
    const [stats, setStats] = useState({
        totalPurchasesAmount: 0,
        pendingAmount: 0,
        unpaidCount: 0,
        totalInvoices: 0
    });
    const [loading, setLoading] = useState(true);

    const fetchInvoices = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/purchases', {
                params: {
                    pageNumber: currentPage,
                    pageSize: itemsPerPage,
                    keyword: searchTerm,
                    startDate: startDate,
                    endDate: endDate,
                    status: statusFilter !== 'All' ? statusFilter : undefined
                }
            });

            if(data.success) {
                const mappedInvoices = data.purchases.map(p => ({
                    mongoId: p._id,
                    id: p.invoiceNumber,
                    date: (p.purchaseDate && !isNaN(new Date(p.purchaseDate).getTime())) ? new Date(p.purchaseDate).toISOString().split('T')[0] : 'N/A',
                    supplier: p.supplierId?.name || 'Unknown Supplier',
                    amount: p.grandTotal,
                    items: p.items.length,
                    status: p.status || 'Received',
                    payment: p.paymentStatus,
                    gst: p.supplierId?.gstNumber || 'N/A',
                    address: p.supplierId?.address || 'N/A',
                    phone: p.supplierId?.phone || 'N/A',
                    invoiceFile: p.invoiceFile
                }));
                setInvoices(mappedInvoices);
                setTotalPages(data.pages);
                setTotalEntries(data.total);
                if (data.stats) setStats(data.stats);
            }
        } catch (error) {
            console.error("Failed to fetch purchases", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, startDate, endDate, statusFilter]);

    useEffect(() => {
        fetchInvoices();
    }, [fetchInvoices]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Received': return 'bg-green-100 text-green-700 border-green-200';
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const getPaymentStyle = (payment) => {
        switch(payment) {
            case 'Paid': return 'text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100';
            case 'Pending': return 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100';
            case 'Partial': return 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100';
            default: return 'text-gray-500';
        }
    }

    const handleView = (invoice) => {
        navigate(`/purchase/invoices/view/${invoice.mongoId}`);
    };

    const handlePrint = (invoice) => {
        navigate(`/purchase/invoices/view/${invoice.mongoId}?autoPrint=true`);
    };

    const handleEdit = (invoice) => {
        setEditFormData({
            ...invoice,
            status: invoice.status,
            payment: invoice.payment
        });
        setSelectedInvoice(invoice);
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put(`/purchases/${selectedInvoice.mongoId}`, {
                status: editFormData.status,
                paymentStatus: editFormData.payment
            });

            if (data.success) {
                setShowEditModal(false);
                fetchInvoices();
                Swal.fire({
                    title: 'Updated!',
                    text: 'Invoice has been updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
             Swal.fire('Error', 'Failed to update invoice', 'error');
        }
    };

    const handleDelete = (invoice) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete invoice ${invoice.id}? This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { data } = await api.delete(`/purchases/${invoice.mongoId}`);
                    if (data.success) {
                        fetchInvoices();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Invoice has been deleted successfully.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete invoice', 'error');
                }
            }
        });
    };

    const handleClearAll = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "All purchase invoices will be deleted. This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Clear All!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { data } = await api.delete('/purchases/clear');
                    if (data.success) {
                        fetchInvoices();
                        Swal.fire({
                            title: 'Cleared!',
                            text: 'All invoices have been deleted.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to clear invoices', 'error');
                }
            }
        });
    };

    const handleExport = () => {
        Swal.fire({
            title: 'Export Data',
            text: 'Export functionality will be implemented soon.',
            icon: 'info',
            confirmButtonColor: '#4F46E5'
        });
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <div className="space-y-6 animate-fade-in-up pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                            <div className="p-2 bg-primary/10 rounded-2xl">
                                <Truck className="text-primary" size={32} />
                            </div>
                            Purchase Invoices
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium pl-1">Manage and track all supplier purchases and stock entries.</p>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Purchases</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{stats.totalPurchasesAmount.toLocaleString()}</h3>
                            <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-1">
                                <ArrowUpRight size={14} /> Overall Received
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Truck size={24} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Payments</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{stats.pendingAmount.toLocaleString()}</h3>
                             <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mt-1">
                                <AlertCircle size={14} /> {stats.unpaidCount} Invoices Pending
                            </div>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                             <Clock size={24} />
                        </div>
                    </div>

                     <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Invoices</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{stats.totalInvoices}</h3>
                             <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-1">
                                <FileText size={14} /> All time
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                             <FileText size={24} />
                        </div>
                    </div>
                </div>

                {/* Filters & Actions Toolbox */}
                <div className="space-y-4">
                    {/* Top Row: Search & Actions */}
                    <div className="flex flex-col xl:flex-row gap-4 xl:items-center justify-between">
                        <div className="relative w-full xl:w-1/2">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by invoice no, supplier, or batch..." 
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            <button 
                                onClick={handleExport}
                                className="w-full sm:w-auto px-6 py-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                <Download size={18} strokeWidth={2.5} /> Export List
                            </button>
                            <button 
                                onClick={handleClearAll}
                                className="w-full sm:w-auto px-6 py-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-rose-100 dark:hover:bg-rose-900/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                            >
                                <Trash2 size={18} strokeWidth={2.5} /> Clear All
                            </button>
                            <button 
                                onClick={() => navigate('/purchase/create-order')} 
                                className="w-full sm:w-auto px-8 py-4 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} strokeWidth={3} /> Create Purchase Order
                            </button>
                        </div>
                    </div>

                    {/* Bottom Row: Filters Hub */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col xl:flex-row items-center justify-between gap-6">
                        {/* Status Hub */}
                        <div className="flex items-center gap-2 w-full xl:w-auto">
                            <div className="flex items-center bg-gray-50/80 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 w-full xl:w-auto overflow-x-auto no-scrollbar">
                                {['All', 'Received', 'Pending', 'Cancelled'].map((status) => (
                                    <button
                                        key={status}
                                        onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                                        className={`flex-1 xl:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all whitespace-nowrap
                                            ${statusFilter === status 
                                                ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-lg shadow-gray-200 dark:shadow-none scale-105' 
                                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white dark:hover:bg-gray-700'}`}
                                    >
                                        {status}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Date Range Hub */}
                        <div className="flex flex-col lg:flex-row items-center gap-4 w-full xl:w-auto">
                            <div className="hidden xl:block h-10 w-px bg-gray-100 dark:bg-gray-700 mx-2"></div>
                            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap lg:mr-2">Date Range:</span>
                                <div className="flex flex-col sm:flex-row items-center gap-2 bg-gray-50/80 dark:bg-gray-900/50 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 w-full lg:w-auto">
                                    <div className="flex items-center gap-2 w-full sm:w-auto">
                                        <div className="relative flex-1 sm:flex-none">
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input 
                                                type="datetime-local" 
                                                value={startDate}
                                                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                                className="w-full sm:w-48 pl-9 pr-2 py-2.5 bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl text-[11px] font-black text-gray-800 dark:text-white uppercase outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            />
                                        </div>
                                        <span className="text-gray-400 dark:text-gray-600 font-black text-[10px] hidden sm:block">TO</span>
                                        <div className="relative flex-1 sm:flex-none">
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input 
                                                type="datetime-local" 
                                                value={endDate}
                                                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                                className="w-full sm:w-48 pl-9 pr-2 py-2.5 bg-white dark:bg-gray-800 border border-transparent dark:border-gray-700 rounded-xl text-[11px] font-black text-gray-800 dark:text-white uppercase outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            />
                                        </div>
                                    </div>
                                    {(startDate || endDate) && (
                                        <button 
                                            onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                                            className="w-full sm:w-auto p-2.5 bg-white dark:bg-gray-800 text-red-500 hover:text-red-600 rounded-xl shadow-sm transition-all active:scale-95 border border-red-100 dark:border-red-900/30 flex items-center justify-center"
                                            title="Reset Filter"
                                        >
                                            <X size={16} strokeWidth={3} />
                                            <span className="sm:hidden text-[10px] font-black uppercase tracking-widest ml-2">Clear Filter</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
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
                                    <th className="px-6 py-4">Supplier</th>
                                    <th className="px-6 py-4 text-center">Items</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Invoice</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {loading ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-20 text-center">
                                            <div className="flex flex-col items-center gap-3">
                                                 <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                 <span className="text-gray-500 font-medium">Loading invoices...</span>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    invoices.map((inv) => (
                                        <tr key={inv.mongoId} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                            <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{inv.id}</td>
                                            <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">{inv.date}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">
                                                <div>
                                                    <p>{inv.supplier}</p>
                                                    <p className="text-[10px] text-gray-400 font-normal">GST: {inv.gst}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{inv.items}</td>
                                            <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">₹{inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                            <td className="px-6 py-4">
                                                <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border ${getPaymentStyle(inv.payment)}`}>
                                                    {inv.payment}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(inv.status)}`}>
                                                    {inv.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {inv.invoiceFile ? (
                                                    <a 
                                                        href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${inv.invoiceFile}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800 rounded-lg text-[10px] font-black uppercase hover:bg-emerald-100 transition-all"
                                                        title="View Uploaded Invoice"
                                                    >
                                                        <File size={14} /> View
                                                    </a>
                                                ) : (
                                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">None</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        onClick={() => handleView(inv)}
                                                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                                        title="View Details"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handlePrint(inv)}
                                                        className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all" 
                                                        title="Print Invoice"
                                                    >
                                                        <Printer size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleEdit(inv)}
                                                        className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" 
                                                        title="Edit Invoice"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDelete(inv)}
                                                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                                        title="Delete Invoice"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                                {!loading && invoices.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500 font-medium">
                                            No invoices found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-6 border-t border-gray-100 dark:border-gray-700 flex flex-col lg:flex-row items-center justify-between gap-6 bg-gray-50/50 dark:bg-gray-800/50">
                         <div className="text-sm text-gray-500 dark:text-gray-400 font-medium order-2 lg:order-1">
                            Showing <span className="font-black text-gray-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-black text-gray-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalEntries)}</span> of <span className="font-black text-gray-800 dark:text-white">{totalEntries}</span> entries
                         </div>
                         
                         <div className="flex items-center gap-2 order-1 lg:order-2">
                             <button 
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                            >
                                <ChevronLeft size={18} strokeWidth={2.5} />
                             </button>
                             
                             <div className="flex items-center gap-1.5">
                                 {Array.from({ length: totalPages }, (_, i) => {
                                     const pg = i + 1;
                                     if (totalPages <= 7 || (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1))) {
                                         return (
                                            <button
                                                key={pg}
                                                onClick={() => paginate(pg)}
                                                className={`min-w-[40px] h-10 rounded-xl text-sm font-black transition-all flex items-center justify-center shadow-sm active:scale-95
                                                    ${currentPage === pg
                                                        ? 'bg-primary text-white shadow-primary/20 scale-110'
                                                        : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:border-primary/50 border border-gray-100 dark:border-gray-700'
                                                    }`}
                                            >
                                                {pg}
                                            </button>
                                         );
                                     } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                                         return <span key={pg} className="px-1 text-gray-400 font-black">...</span>;
                                     }
                                     return null;
                                 })}
                             </div>
                             <button 
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2.5 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                            >
                                <ChevronRight size={18} strokeWidth={2.5} />
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* Edit Invoice Modal */}
            {showEditModal && editFormData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in text-left">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Update Invoice Status</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm transition-all hover:rotate-90">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                            <div className="mb-6 bg-primary/5 dark:bg-primary/10 p-4 rounded-xl border border-primary/10">
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Invoice No</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{selectedInvoice.id}</span>
                                </div>
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">Supplier</span>
                                    <span className="font-bold text-gray-900 dark:text-white text-right">{selectedInvoice.supplier}</span>
                                </div>
                            </div>

                            <form id="edit-invoice-form" onSubmit={handleEditSubmit} className="space-y-6">
                                <div className="space-y-4">
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Purchase Status</label>
                                        <select 
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium text-sm text-gray-800 dark:text-white"
                                        >
                                            <option value="Received">Received</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5 text-left">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Payment Status</label>
                                        <select 
                                            value={editFormData.payment}
                                            onChange={(e) => setEditFormData({...editFormData, payment: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none font-medium text-sm text-gray-800 dark:text-white"
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Partial">Partial</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 text-sm transition-all">Cancel</button>
                            <button type="submit" form="edit-invoice-form" className="px-8 py-2.5 rounded-xl bg-primary text-white font-black hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm">Update Invoice</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PurchaseInvoices;
