import React, { useState, useEffect } from 'react';
import { Search, Filter, FileText, Eye, Download, Printer, MoreVertical, Calendar, ArrowUpRight, ArrowDownRight, CheckCircle, Clock, Plus, Truck, AlertCircle, Edit2, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const PurchaseInvoices = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [editFormData, setEditFormData] = useState(null);

    // Filter & Pagination States
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(5);

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        try {
            const { data } = await api.get('/purchases');
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
                    itemsList: p.items.map(i => ({
                         name: i.productId?.name, 
                         qty: i.quantity,
                         rate: i.purchasePrice,
                         amount: i.amount
                    }))
                }));
                setInvoices(mappedInvoices);
            }
        } catch (error) {
            console.error("Failed to fetch purchases", error);
            // Swal.fire('Error', 'Failed to load invoices', 'error'); 
        } finally {
            setLoading(false);
        }
    };

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
            case 'Unpaid': return 'text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100';
            case 'Partial': return 'text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100';
            default: return 'text-gray-500';
        }
    }

    const handleView = (invoice) => {
        setSelectedInvoice(invoice);
        setShowViewModal(true);
    };

    const handlePrint = (invoice) => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Purchase Invoice - ${invoice.id}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1f2937; }
                    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #e5e7eb; }
                    .header { background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 25px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #4338CA; }
                    .logo-section { display: flex; align-items: center; gap: 15px; }
                    .logo { width: 60px; height: 60px; background: white; border-radius: 8px; padding: 8px; }
                    .company-info { color: white; }
                    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 3px; }
                    .company-tagline { font-size: 12px; opacity: 0.9; }
                    .doc-info { text-align: right; color: white; }
                    .doc-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                    .doc-date { font-size: 11px; opacity: 0.9; }
                    .content { padding: 30px; }
                    .invoice-header { background: #F9FAFB; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #4F46E5; }
                    .invoice-number { font-size: 26px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
                    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
                    .detail-item { padding: 15px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; }
                    .detail-label { font-size: 10px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 6px; }
                    .detail-value { font-size: 14px; font-weight: 600; color: #1f2937; }
                    .total-section { background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%); padding: 25px; border-radius: 8px; text-align: center; color: white; margin-top: 25px; }
                    .total-label { font-size: 12px; opacity: 0.9; margin-bottom: 8px; }
                    .total-amount { font-size: 36px; font-weight: bold; }
                    .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #E5E7EB; text-align: center; color: #6B7280; font-size: 11px; }
                    @media print { body { padding: 0; } .invoice-container { border: none; } }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <div class="header">
                        <div class="logo-section">
                            <img src="/KS2-Logo.png" alt="KS2 Logo" class="logo" />
                            <div class="company-info">
                                <div class="company-name">KS4 PharmaNet</div>
                                <div class="company-tagline">Pharmacy Management System</div>
                            </div>
                        </div>
                        <div class="doc-info">
                            <div class="doc-title">Purchase Invoice</div>
                            <div class="doc-date">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                        </div>
                    </div>
                    <div class="content">
                        <div class="invoice-header">
                            <div class="invoice-number">${invoice.id}</div>
                            <div style="color: #6B7280; font-size: 14px;">Date: ${invoice.date}</div>
                        </div>
                        <div class="details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Supplier Name</div>
                                <div class="detail-value">${invoice.supplier}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Phone Number</div>
                                <div class="detail-value">${invoice.phone}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">GST Number</div>
                                <div class="detail-value">${invoice.gst}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Total Items</div>
                                <div class="detail-value">${invoice.items} Items</div>
                            </div>
                            <div class="detail-item" style="grid-column: 1 / -1;">
                                <div class="detail-label">Supplier Address</div>
                                <div class="detail-value">${invoice.address}</div>
                            </div>
                        </div>
                        <div class="total-section">
                            <div class="total-label">Total Amount</div>
                            <div class="total-amount">₹${invoice.amount.toLocaleString('en-IN')}</div>
                        </div>
                        <div class="footer">
                            <p><strong>Printed on:</strong> ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            <p>This is a computer-generated document and does not require a signature.</p>
                            <p style="margin-top: 10px; color: #4F46E5; font-weight: bold;">KS4 PharmaNet © ${new Date().getFullYear()}</p>
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    const handleEdit = (invoice) => {
        setEditFormData({
            ...invoice,
            date: invoice.date,
            supplier: invoice.supplier,
            amount: invoice.amount,
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
                paymentStatus: editFormData.payment,
                // notes: editFormData.notes 
            });

            if (data.success) {
                setInvoices(invoices.map(inv => 
                    inv.id === selectedInvoice.id ? { ...inv, ...editFormData } : inv
                ));
                setShowEditModal(false);
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
                        setInvoices(invoices.filter(inv => inv.id !== invoice.id));
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

    const handleExport = () => {
        Swal.fire({
            title: 'Export Data',
            text: 'Export functionality will be implemented soon.',
            icon: 'info',
            confirmButtonColor: '#4F46E5'
        });
    };

    const filteredInvoices = invoices.filter(inv => {
        const matchesSearch = inv.supplier.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              inv.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || inv.status === statusFilter;
        
        let matchesDate = true;
        if (startDate && endDate) {
            matchesDate = new Date(inv.date) >= new Date(startDate) && new Date(inv.date) <= new Date(endDate);
        } else if (startDate) {
            matchesDate = new Date(inv.date) >= new Date(startDate);
        } else if (endDate) {
            matchesDate = new Date(inv.date) <= new Date(endDate);
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    const totalPurchase = invoices.filter(i => i.status === 'Received').reduce((acc, curr) => acc + curr.amount, 0);
    const pendingAmount = invoices.filter(i => i.payment === 'Unpaid' || i.payment === 'Partial').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <>
            <div className="space-y-6 animate-fade-in-up pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <Truck className="text-primary" size={28} />
                            Purchase Invoices
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage and track all supplier purchases and stock entries.</p>
                    </div>
                    <div className="flex gap-2">
                         <button 
                            onClick={handleExport}
                            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 flex items-center gap-2 transition-colors font-medium"
                        >
                            <Download size={16} /> Export
                        </button>
                        <button 
                            onClick={() => navigate('/inventory/stock-in')} 
                            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary shadow-md active:scale-95 transition-all flex items-center gap-2"
                        >
                            <Plus size={18} /> New Purchase
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Purchases</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{totalPurchase.toLocaleString()}</h3>
                            <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-1">
                                <ArrowUpRight size={14} /> +8% this month
                            </div>
                        </div>
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                            <Truck size={24} />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Payments</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{pendingAmount.toLocaleString()}</h3>
                             <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mt-1">
                                <AlertCircle size={14} /> {invoices.filter(i => i.payment === 'Unpaid').length} Invoices Unpaid
                            </div>
                        </div>
                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                             <Clock size={24} />
                        </div>
                    </div>

                     <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Invoices</p>
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{invoices.length}</h3>
                             <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-1">
                                <FileText size={14} /> All time
                            </div>
                        </div>
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
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
                         placeholder="Search invoice no, supplier name..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                       />
                    </div>
                    
                    <div className="flex items-center gap-3 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        {['All', 'Received', 'Pending', 'Cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap
                                    ${statusFilter === status 
                                        ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-md' 
                                        : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                            >
                                {status}
                            </button>
                        ))}
                        
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">From:</span>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <span className="text-sm text-gray-500 dark:text-gray-400">To:</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            {(startDate || endDate) && (
                                <button 
                                    onClick={() => { setStartDate(''); setEndDate(''); }}
                                    className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Clear Date Filter"
                                >
                                    <X size={16} />
                                </button>
                            )}
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
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {currentItems.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{inv.id}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{inv.date}</td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{inv.supplier}</td>
                                        <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-300">{inv.items}</td>
                                        <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">₹{inv.amount.toFixed(2)}</td>
                                        <td className="px-6 py-4">
                                            <span className={`text-xs font-bold ${getPaymentStyle(inv.payment)}`}>
                                                {inv.payment}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(inv.status)}`}>
                                                {inv.status}
                                            </span>
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
                                ))}
                                {filteredInvoices.length === 0 && (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                            No invoices found matching your criteria.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                         <div className="text-sm text-gray-500 dark:text-gray-400">
                            Showing <span className="font-medium text-gray-800 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-800 dark:text-white">{Math.min(indexOfLastItem, filteredInvoices.length)}</span> of <span className="font-medium text-gray-800 dark:text-white">{filteredInvoices.length}</span> entries
                         </div>
                         
                         <div className="flex items-center gap-2">
                             <button 
                                onClick={() => paginate(currentPage - 1)}
                                disabled={currentPage === 1}
                                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft size={16} />
                             </button>
                             
                             {Array.from({ length: totalPages }, (_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => paginate(i + 1)}
                                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors
                                        ${currentPage === i + 1
                                            ? 'bg-primary text-white shadow-md shadow-primary/20'
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent hover:border-gray-200 dark:hover:border-gray-600'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                             ))}

                             <button 
                                onClick={() => paginate(currentPage + 1)}
                                disabled={currentPage === totalPages}
                                className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight size={16} />
                             </button>
                         </div>
                    </div>
                </div>
            </div>

            {/* View Invoice Modal */}
            {showViewModal && selectedInvoice && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="relative bg-primary h-24">
                            <button 
                                onClick={() => setShowViewModal(false)} 
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-sm"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-10 left-8 p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                                <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-center text-primary">
                                    <FileText size={40} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-12 px-8 pb-8 overflow-y-auto">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedInvoice.id}</h3>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getStatusStyle(selectedInvoice.status)}`}>
                                    {selectedInvoice.status}
                                </span>
                                <span className={`text-xs font-bold ${getPaymentStyle(selectedInvoice.payment)}`}>
                                    {selectedInvoice.payment}
                                </span>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><Truck size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Supplier</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedInvoice.supplier}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">GST: {selectedInvoice.gst}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Invoice Date</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedInvoice.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><FileText size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Items</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedInvoice.items} Items</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Amount</p>
                                    <p className="text-xl font-black text-primary">₹{selectedInvoice.amount.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handlePrint(selectedInvoice)}
                                        className="px-4 py-2 bg-primary text-white text-sm font-bold rounded-xl hover:bg-secondary transition-colors flex items-center gap-2 shadow-lg shadow-primary/20"
                                    >
                                        <Printer size={16} />
                                        Print
                                    </button>
                                    <button className="px-4 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-gray-600 transition-colors">
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Invoice Modal */}
            {showEditModal && editFormData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 rounded-t-2xl">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Edit Invoice - {selectedInvoice.id}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md dark:shadow-none">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="edit-invoice-form" onSubmit={handleEditSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Invoice Date</label>
                                        <input 
                                            type="date" 
                                            value={editFormData.date}
                                            onChange={(e) => setEditFormData({...editFormData, date: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Supplier Name</label>
                                        <input 
                                            type="text" 
                                            value={editFormData.supplier}
                                            onChange={(e) => setEditFormData({...editFormData, supplier: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Amount (₹)</label>
                                        <input 
                                            type="number" 
                                            step="0.01"
                                            value={editFormData.amount}
                                            onChange={(e) => setEditFormData({...editFormData, amount: parseFloat(e.target.value)})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Status</label>
                                        <select 
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white"
                                        >
                                            <option value="Received">Received</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Payment Status</label>
                                        <select 
                                            value={editFormData.payment}
                                            onChange={(e) => setEditFormData({...editFormData, payment: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white"
                                        >
                                            <option value="Paid">Paid</option>
                                            <option value="Unpaid">Unpaid</option>
                                            <option value="Partial">Partial</option>
                                        </select>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl sticky bottom-0 z-10">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 text-sm">Cancel</button>
                            <button type="submit" form="edit-invoice-form" className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm">Update Invoice</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PurchaseInvoices;
