import React, { useState } from 'react';
import { RotateCcw, Search, FileText, User, ArrowRight, CheckCircle, AlertOctagon, X, Plus, History, Filter, Download, Eye, MoreVertical, Calendar, Printer, Edit2, Trash2 } from 'lucide-react';
import Swal from 'sweetalert2';

const PurchaseReturn = () => {
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [searchTerm, setSearchTerm] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    
    // --- CREATE RETURN STATE ---
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceData, setInvoiceData] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');

    // Mock Data for Return History (Debit Notes)
    const [returnHistory, setReturnHistory] = useState([
        { 
            id: 'DN-2024-001', 
            date: '2024-01-21', 
            supplier: 'Sun Pharma Distributors', 
            invoiceRef: 'PUR-2024-001', 
            amount: 2500.00, 
            status: 'Adjusted', 
            items: 2,
            gst: '27AABCU9603R1ZN',
            phone: '9876543210',
            address: '123, Industrial Area, Mumbai',
            reason: 'Damaged items received',
            itemsList: [
                { name: 'Amoxyclav 625', qty: 10, rate: 85.00, batch: 'AM-909', amount: 850 },
                { name: 'Pantop 40', qty: 37, rate: 45.00, batch: 'P-112', amount: 1650 }
            ]
        },
        { 
            id: 'DN-2024-002', 
            date: '2024-01-18', 
            supplier: 'Global Medicos', 
            invoiceRef: 'PUR-2024-003', 
            amount: 1200.00, 
            status: 'Pending', 
            items: 1,
            gst: '27AABCU9603R1ZN',
            phone: '9988776655',
            address: '789, Medical Hub, Delhi',
            reason: 'Expired stock',
            itemsList: [
                { name: 'Cetrizen 10mg', qty: 480, rate: 2.50, batch: 'CT-22', amount: 1200 }
            ]
        },
    ]);

    // Mock Database for Searching Purchase Invoice (to return items from)
    const mockPurchaseInvoices = [
        { 
            id: 'PUR-2024-001', 
            supplier: 'Sun Pharma Distributors', 
            date: '2024-01-20', 
            items: [
                { id: 201, name: 'Amoxyclav 625', qty: 50, rate: 85.00, batch: 'AM-909' },
                { id: 202, name: 'Pantop 40', qty: 100, rate: 45.00, batch: 'P-112' }
            ]
        },
        {
            id: 'PUR-2024-005',
            supplier: 'Alpha Drugs',
            date: '2024-01-12',
            items: [
                 { id: 203, name: 'Cetrizen 10mg', qty: 500, rate: 2.50, batch: 'CT-22' }
            ]
        }
    ];

    // --- METHODS ---

    const handleInvoiceSearch = (e) => {
        e.preventDefault();
        const found = mockPurchaseInvoices.find(inv => inv.id.toLowerCase() === invoiceSearch.toLowerCase());
        if (found) {
            setInvoiceData(found);
            setReturnItems([]);
            Swal.fire({
                icon: 'success',
                title: 'Invoice Found',
                text: `Loaded items from ${found.supplier}`,
                timer: 1000,
                showConfirmButton: false
            });
        } else {
            Swal.fire('Not Found', 'Purchase Invoice number not found.', 'error');
            setInvoiceData(null);
        }
    };

    const toggleReturnItem = (item) => {
        const exists = returnItems.find(r => r.id === item.id);
        if (exists) {
            setReturnItems(returnItems.filter(r => r.id !== item.id));
        } else {
            setReturnItems([...returnItems, { ...item, returnQty: 1 }]); 
        }
    };

    const updateReturnQty = (id, newQty, maxQty) => {
        if (newQty < 1 || newQty > maxQty) return;
        setReturnItems(returnItems.map(item => item.id === id ? { ...item, returnQty: newQty } : item));
    };

    const calculateRefund = () => {
        return returnItems.reduce((acc, item) => acc + (item.rate * item.returnQty), 0);
    };

    const processReturn = () => {
        if (returnItems.length === 0) {
            Swal.fire('Error', 'Please select at least one item to return.', 'warning');
            return;
        }

        Swal.fire({
            title: 'Create Debit Note?',
            text: `Total Value: ₹${calculateRefund().toFixed(2)}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Generate Debit Note',
            confirmButtonColor: '#4F46E5'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Success', 'Debit Note created successfully.', 'success');
                setView('list');
                setInvoiceData(null);
                setInvoiceSearch('');
                setReturnItems([]);
            }
        });
    };

    const handleView = (returnItem) => {
        setSelectedReturn(returnItem);
        setShowViewModal(true);
    };

    const handlePrint = (returnItem) => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Debit Note - ${returnItem.id}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1f2937; }
                    .invoice-container { max-width: 800px; margin: 0 auto; border: 2px solid #e5e7eb; }
                    .header { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 25px 30px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #B91C1C; }
                    .logo-section { display: flex; align-items: center; gap: 15px; }
                    .logo { width: 60px; height: 60px; background: white; border-radius: 8px; padding: 8px; }
                    .company-info { color: white; }
                    .company-name { font-size: 24px; font-weight: bold; margin-bottom: 3px; }
                    .company-tagline { font-size: 12px; opacity: 0.9; }
                    .doc-info { text-align: right; color: white; }
                    .doc-title { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
                    .doc-date { font-size: 11px; opacity: 0.9; }
                    .content { padding: 30px; }
                    .debit-header { background: #FEF2F2; padding: 20px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #EF4444; }
                    .debit-number { font-size: 26px; font-weight: bold; color: #1f2937; margin-bottom: 10px; }
                    .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin-bottom: 25px; }
                    .detail-item { padding: 15px; background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 6px; }
                    .detail-label { font-size: 10px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 6px; }
                    .detail-value { font-size: 14px; font-weight: 600; color: #1f2937; }
                    .items-section { margin-bottom: 25px; }
                    .section-title { font-size: 13px; font-weight: bold; color: #6B7280; text-transform: uppercase; margin-bottom: 15px; padding-bottom: 8px; border-bottom: 2px solid #E5E7EB; }
                    .items-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    .items-table th { background: #F9FAFB; padding: 10px; text-align: left; font-size: 11px; color: #6B7280; text-transform: uppercase; border-bottom: 2px solid #E5E7EB; }
                    .items-table td { padding: 10px; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
                    .total-section { background: linear-gradient(135deg, #EF4444 0%, #DC2626 100%); padding: 25px; border-radius: 8px; text-align: center; color: white; margin-top: 25px; }
                    .total-label { font-size: 12px; opacity: 0.9; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; }
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
                            <div class="doc-title">Debit Note</div>
                            <div class="doc-date">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at ${new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}</div>
                        </div>
                    </div>
                    <div class="content">
                        <div class="debit-header">
                            <div class="debit-number">${returnItem.id}</div>
                            <div style="color: #6B7280; font-size: 14px;">Date: ${returnItem.date} | Ref: ${returnItem.invoiceRef}</div>
                        </div>
                        <div class="details-grid">
                            <div class="detail-item">
                                <div class="detail-label">Supplier Name</div>
                                <div class="detail-value">${returnItem.supplier}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Phone Number</div>
                                <div class="detail-value">${returnItem.phone}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">GST Number</div>
                                <div class="detail-value">${returnItem.gst}</div>
                            </div>
                            <div class="detail-item">
                                <div class="detail-label">Status</div>
                                <div class="detail-value">${returnItem.status}</div>
                            </div>
                            <div class="detail-item" style="grid-column: 1 / -1;">
                                <div class="detail-label">Supplier Address</div>
                                <div class="detail-value">${returnItem.address}</div>
                            </div>
                            <div class="detail-item" style="grid-column: 1 / -1;">
                                <div class="detail-label">Reason for Return</div>
                                <div class="detail-value">${returnItem.reason}</div>
                            </div>
                        </div>
                        <div class="items-section">
                            <div class="section-title">📦 Returned Items</div>
                            <table class="items-table">
                                <thead>
                                    <tr>
                                        <th>Item Name</th>
                                        <th>Batch</th>
                                        <th>Qty</th>
                                        <th>Rate</th>
                                        <th style="text-align: right;">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${returnItem.itemsList.map(item => `
                                        <tr>
                                            <td><strong>${item.name}</strong></td>
                                            <td>${item.batch}</td>
                                            <td>${item.qty}</td>
                                            <td>₹${item.rate.toFixed(2)}</td>
                                            <td style="text-align: right;"><strong>₹${item.amount.toFixed(2)}</strong></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                        <div class="total-section">
                            <div class="total-label">Total Debit Amount</div>
                            <div class="total-amount">₹${returnItem.amount.toLocaleString('en-IN')}</div>
                        </div>
                        <div class="footer">
                            <p><strong>Printed on:</strong> ${new Date().toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}</p>
                            <p>This is a computer-generated document and does not require a signature.</p>
                            <p style="margin-top: 10px; color: #EF4444; font-weight: bold;">KS4 PharmaNet © ${new Date().getFullYear()}</p>
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

    const handleEdit = (returnItem) => {
        setEditFormData({
            ...returnItem,
            date: returnItem.date,
            supplier: returnItem.supplier,
            amount: returnItem.amount,
            status: returnItem.status,
            reason: returnItem.reason
        });
        setSelectedReturn(returnItem);
        setShowEditModal(true);
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        setReturnHistory(returnHistory.map(item => 
            item.id === selectedReturn.id ? { ...item, ...editFormData } : item
        ));
        setShowEditModal(false);
        Swal.fire({
            title: 'Updated!',
            text: 'Debit note has been updated successfully.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        });
    };

    const handleDelete = (returnItem) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete debit note ${returnItem.id}? This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                setReturnHistory(returnHistory.filter(item => item.id !== returnItem.id));
                Swal.fire({
                    title: 'Deleted!',
                    text: 'Debit note has been deleted successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        });
    };

    // --- RENDER HELPERS ---
    const getStatusStyle = (status) => {
        return status === 'Adjusted' || status === 'Refunded' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-orange-100 text-orange-700 border-orange-200';
    };

    const filteredReturns = returnHistory.filter(item => 
        item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.supplier.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <>
            <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <RotateCcw className="text-primary" /> Purchase Return (Debit Note)
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage returns to suppliers and track debit notes.</p>
                    </div>
                    <div className="flex gap-2">
                        {view === 'list' ? (
                            <button 
                                onClick={() => setView('create')}
                                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary shadow-md active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Plus size={18} /> New Debit Note
                            </button>
                        ) : (
                             <button 
                                onClick={() => setView('list')}
                                className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm active:scale-95 transition-all flex items-center gap-2"
                            >
                                <History size={18} /> View History
                            </button>
                        )}
                    </div>
                </div>

                {/* VIEW: LIST HISTORY */}
                {view === 'list' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Stats */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Debit Notes</p>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹3,700.00</h3>
                                    <div className="flex items-center gap-1 text-red-500 text-xs font-medium mt-1">
                                        <RotateCcw size={14} /> {returnHistory.length} Returns
                                    </div>
                                </div>
                                <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                                    <FileText size={24} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Pending Adjustments</p>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹1,200.00</h3>
                                    <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mt-1">
                                        <AlertOctagon size={14} /> 1 Pending
                                    </div>
                                </div>
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                                    <History size={24} />
                                </div>
                            </div>
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Adjusted Amount</p>
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹2,500.00</h3>
                                    <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-1">
                                        <CheckCircle size={14} /> Completed
                                    </div>
                                </div>
                                <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                                    <CheckCircle size={24} />
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex gap-4">
                                <div className="relative flex-1 max-w-md">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                                    <input 
                                        type="text" 
                                        placeholder="Search debit note, supplier..." 
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Debit Note #</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Supplier</th>
                                            <th className="px-6 py-4">Inv Ref</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {filteredReturns.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{item.id}</td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{item.date}</td>
                                                <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{item.supplier}</td>
                                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">{item.invoiceRef}</td>
                                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">₹{item.amount.toFixed(2)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getStatusStyle(item.status)}`}>
                                                        {item.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            onClick={() => handleView(item)}
                                                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all" 
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handlePrint(item)}
                                                            className="p-1.5 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-all" 
                                                            title="Print Debit Note"
                                                        >
                                                            <Printer size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleEdit(item)}
                                                            className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-all" 
                                                            title="Edit"
                                                        >
                                                            <Edit2 size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(item)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all" 
                                                            title="Delete"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredReturns.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                                    No debit notes found matching your criteria.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: CREATE RETURN */}
                {view === 'create' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Search Section */}
                         <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                            <FileText size={48} className="text-gray-200 dark:text-gray-700 mb-4" />
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">Locate Purchase Invoice</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-md">Enter the original Purchase Invoice number to fetch items for return.</p>
                            
                            <form onSubmit={handleInvoiceSearch} className="flex gap-2 w-full max-w-md relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                                <input 
                                    type="text" 
                                    placeholder="e.g. PUR-2024-001" 
                                    value={invoiceSearch}
                                    onChange={(e) => setInvoiceSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono uppercase text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                />
                                <button type="submit" className="px-6 py-3 bg-gray-800 dark:bg-gray-700 text-white font-bold rounded-xl hover:bg-black dark:hover:bg-gray-600 active:scale-95 transition-all">
                                    Fetch
                                </button>
                            </form>
                        </div>

                        {/* Result Section */}
                        {invoiceData && (
                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-up">
                                {/* Invoice Info Header */}
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-between items-center">
                                    <div>
                                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">Invoice #{invoiceData.id}</h3>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <User size={14} /> {invoiceData.supplier} &bull; {invoiceData.date}
                                        </p>
                                    </div>
                                    <button onClick={() => setInvoiceData(null)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="p-6">
                                    <h4 className="font-bold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                                        <AlertOctagon size={18} className="text-orange-500" /> Select Items to Return
                                    </h4>
                                    
                                    <div className="space-y-3">
                                        {invoiceData.items.map((item) => {
                                            const isSelected = returnItems.find(r => r.id === item.id);
                                            return (
                                                <div key={item.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group
                                                    ${isSelected ? 'border-primary bg-green-50 dark:bg-green-900/20' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-gray-300 dark:hover:border-gray-600'}`}>
                                                    
                                                    <div className="flex items-center gap-4">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={!!isSelected}
                                                            onChange={() => toggleReturnItem(item)}
                                                            className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-primary focus:ring-primary cursor-pointer"
                                                        />
                                                        <div>
                                                            <p className="font-bold text-gray-800 dark:text-white">{item.name}</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Batch: {item.batch} | Rate: ₹{item.rate}</p>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="flex items-center gap-4 animate-fade-in">
                                                            <div className="flex items-center bg-white dark:bg-gray-700 border border-primary/30 rounded-lg h-9">
                                                                <button onClick={() => updateReturnQty(item.id, isSelected.returnQty - 1, item.qty)} className="px-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-primary h-full font-bold">-</button>
                                                                <span className="w-10 text-center text-sm font-bold text-gray-800 dark:text-white">{isSelected.returnQty}</span>
                                                                <button onClick={() => updateReturnQty(item.id, isSelected.returnQty + 1, item.qty)} className="px-3 hover:bg-green-50 dark:hover:bg-green-900/20 text-primary h-full font-bold">+</button>
                                                            </div>
                                                            <div className="text-right w-24">
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">Debit Amount</p>
                                                                <p className="font-bold text-primary">₹{(item.rate * isSelected.returnQty).toFixed(2)}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-6 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                                    <div className="w-full md:w-1/2">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Reason for Return</label>
                                        <textarea 
                                            rows="2" 
                                            placeholder="e.g. Expired, Damaged, Wrong Item ordered..." 
                                            value={reason}
                                            onChange={(e) => setReason(e.target.value)}
                                            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                        ></textarea>
                                    </div>
                                    
                                    <div className="w-full md:w-auto text-right">
                                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Debit Value</p>
                                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">₹{calculateRefund().toFixed(2)}</h2>
                                        <button 
                                            onClick={processReturn}
                                            disabled={returnItems.length === 0}
                                            className="w-full md:w-auto px-8 py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            <RotateCcw size={18} /> Create Debit Note
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* View Modal */}
            {showViewModal && selectedReturn && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="relative bg-red-500 h-24">
                            <button 
                                onClick={() => setShowViewModal(false)} 
                                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full backdrop-blur-sm"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-10 left-8 p-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md">
                                <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center text-red-600 dark:text-red-400">
                                    <RotateCcw size={40} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-12 px-8 pb-8 overflow-y-auto">
                            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedReturn.id}</h3>
                            <div className="flex gap-2 mt-2">
                                <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold border ${getStatusStyle(selectedReturn.status)}`}>
                                    {selectedReturn.status}
                                </span>
                                <span className="px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                    Ref: {selectedReturn.invoiceRef}
                                </span>
                            </div>

                            <div className="mt-6 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><User size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Supplier</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedReturn.supplier}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">GST: {selectedReturn.gst}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><Calendar size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Return Date</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedReturn.date}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><AlertOctagon size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Reason</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedReturn.reason}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="bg-gray-50 dark:bg-gray-700 p-2 rounded-lg text-gray-500 dark:text-gray-400"><FileText size={18} /></div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wide">Items Returned</p>
                                        <p className="text-sm font-medium text-gray-800 dark:text-white">{selectedReturn.items} Items</p>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                <div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Total Debit Amount</p>
                                    <p className="text-xl font-black text-red-600 dark:text-red-400">₹{selectedReturn.amount.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => handlePrint(selectedReturn)}
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

            {/* Edit Debit Note Modal */}
            {showEditModal && editFormData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 rounded-t-2xl">
                            <h3 className="font-bold text-gray-800 dark:text-white text-lg">Edit Debit Note - {selectedReturn.id}</h3>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md dark:shadow-none">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <form id="edit-return-form" onSubmit={handleEditSubmit} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Return Date</label>
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
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Debit Amount (₹)</label>
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
                                            <option value="Adjusted">Adjusted</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Refunded">Refunded</option>
                                        </select>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Reason for Return</label>
                                        <textarea 
                                            rows="3"
                                            value={editFormData.reason}
                                            onChange={(e) => setEditFormData({...editFormData, reason: e.target.value})}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                            placeholder="e.g. Damaged, Expired, Wrong Item..."
                                        ></textarea>
                                    </div>
                                </div>
                            </form>
                        </div>
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl sticky bottom-0 z-10">
                            <button onClick={() => setShowEditModal(false)} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 text-sm">Cancel</button>
                            <button type="submit" form="edit-return-form" className="px-8 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm">Update Debit Note</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PurchaseReturn;
