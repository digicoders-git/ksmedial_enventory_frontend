import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { RotateCcw, Search, FileText, User, ArrowRight, CheckCircle, AlertOctagon, X, Plus, History, Filter, Download, Eye, MoreVertical, Calendar, Printer, Edit2, Trash2, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const PurchaseReturn = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [searchTerm, setSearchTerm] = useState('');
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedReturn, setSelectedReturn] = useState(null);
    const [editFormData, setEditFormData] = useState(null);
    
    // --- LIST STATE ---
    const [returnHistory, setReturnHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage] = useState(10);
    const [totalEntries, setTotalEntries] = useState(0);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [stats, setStats] = useState({
        totalReturnsAmount: 0,
        pendingAdjustmentCount: 0,
        totalReturns: 0
    });

    // --- CREATE RETURN STATE ---
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceData, setInvoiceData] = useState(null);
    const [searchResults, setSearchResults] = useState([]); // Store multiple search matches
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');

    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState('');

    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);

    const fetchReturns = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/purchase-returns', {
                params: {
                    pageNumber: currentPage,
                    pageSize: itemsPerPage,
                    keyword: searchTerm,
                    startDate: startDate,
                    endDate: endDate
                }
            });
            if (data.success) {
                setReturnHistory(data.returns);
                setTotalPages(data.pages);
                setTotalEntries(data.total);
                if (data.stats) {
                    setStats(data.stats);
                }
            }
        } catch (error) {
            console.error("Error fetching returns:", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm, startDate, endDate]);

    const fetchSuppliers = useCallback(async () => {
        try {
             // Assuming your existing suppliers endpoint supports returning a simple list or all items
             // If not, we might need pagination or a specific 'all' query logic.
             // For now, let's try fetching without pagination params if supported, or large limit.
            const { data } = await api.get('/suppliers?limit=1000'); 
            if (data.success) {
                setSuppliers(data.suppliers);
            }
        } catch (error) {
            console.error("Failed to fetch suppliers", error);
        }
    }, []);

    useEffect(() => {
        if (view === 'list') {
            fetchReturns();
        }
        if (view === 'create') {
            fetchSuppliers();
        }
    }, [fetchReturns, fetchSuppliers, view]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (invoiceSearch.trim().length > 1) {
                setSearchLoading(true);
                try {
                    const { data } = await api.get('/purchases', {
                        params: { keyword: invoiceSearch, pageSize: 8 }
                    });
                    if (data.success) {
                        setSuggestions(data.purchases);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error("Error fetching suggestions:", error);
                } finally {
                    setSearchLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [invoiceSearch]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.relative.flex-1')) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // --- METHODS ---

    const handleInvoiceSearch = async (e, purchaseFromSuggestion = null) => {
        if (e) e.preventDefault();
        const trimmedSearch = purchaseFromSuggestion ? purchaseFromSuggestion.invoiceNumber : invoiceSearch.trim();
        if (!trimmedSearch) return;

        setShowSuggestions(false);

        try {
            console.log("Searching for invoice:", trimmedSearch);
            
            let purchaseToUse = null;

            if (purchaseFromSuggestion) {
                purchaseToUse = purchaseFromSuggestion;
            } else {
                const { data } = await api.get('/purchases', {
                    params: { keyword: trimmedSearch }
                });

                if (data.success && data.purchases && data.purchases.length > 0) {
                    const exactMatch = data.purchases.find(p => p.invoiceNumber.toLowerCase() === trimmedSearch.toLowerCase());
                    
                    if (exactMatch) {
                        purchaseToUse = exactMatch;
                    } else if (data.purchases.length === 1) {
                         purchaseToUse = data.purchases[0];
                    } else {
                        // Multiple matches found - show selection list
                        setSearchResults(data.purchases);
                        setInvoiceData(null);
                        setReturnItems([]);
                        Swal.fire({
                            title: 'Multiple Matches Found',
                            text: `Found ${data.purchases.length} invoices matching "${trimmedSearch}". Please select one below.`,
                            icon: 'info',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        return; // Stop here, let user select from list
                    }
                }
            }

            if (purchaseToUse) {
                // Fetch full purchase details
                const detailRes = await api.get(`/purchases/${purchaseToUse._id}`);
                
                if (detailRes.data.success) {
                    const purchaseData = detailRes.data.purchase;

                    setInvoiceData(purchaseData);
                    setReturnItems([]);
                    setInvoiceSearch(purchaseData.invoiceNumber);
                    
                    if (purchaseData.supplierId) {
                         Swal.fire({
                            icon: 'success',
                            title: 'Invoice Found',
                            text: `Loaded items from ${purchaseData.supplierId.name || 'Unknown Supplier'}`,
                            timer: 1000,
                            showConfirmButton: false
                        });
                        setSelectedSupplier('');
                    } else {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Orphan Invoice',
                            text: 'This invoice has no active supplier. Please select a supplier manually below.',
                            timer: 2000
                        });
                        setSelectedSupplier('');
                    }
                }
            } else {
                Swal.fire('Not Found', 'No purchase found matching your search.', 'error');
                setInvoiceData(null);
            }
        } catch (error) {
            console.error("Search Error:", error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to search invoice';
            Swal.fire('Error', errorMsg, 'error');
        }
    };

    const toggleReturnItem = (item) => {
        const itemObj = item.productId || item;
        const exists = returnItems.find(r => r.productId === (itemObj._id || itemObj.id));
        if (exists) {
            setReturnItems(returnItems.filter(r => r.productId !== (itemObj._id || itemObj.id)));
        } else {
            setReturnItems([...returnItems, { 
                productId: itemObj._id || itemObj.id, 
                name: itemObj.name,
                batchNumber: item.batchNumber, 
                purchasePrice: item.purchasePrice,
                returnQuantity: 1,
                maxQty: item.receivedQty || item.quantity || 0
            }]); 
        }
    };

    const updateReturnQty = (productId, newQty, maxQty) => {
        let qty = newQty === '' ? '' : parseInt(newQty);
        
        if (qty !== '') {
            if (qty < 0) qty = 0;
            if (qty > maxQty) {
                Swal.fire('Limit Exceeded', `Maximum returnable quantity is ${maxQty}`, 'warning');
                qty = maxQty;
            }
        }
        
        setReturnItems(returnItems.map(item => item.productId === productId ? { ...item, returnQuantity: qty } : item));
    };

    const handleSelectSearchResult = (purchase) => {
        setSearchResults([]); // Clear results
        handleInvoiceSearch(null, purchase); // Load selected purchase
    };

    const calculateRefund = () => {
        return returnItems.reduce((acc, item) => acc + (item.purchasePrice * item.returnQuantity), 0);
    };

    const processReturn = async () => {
        // Use invoice supplier logic OR manual selection
        const finalSupplierId = invoiceData?.supplierId?._id || selectedSupplier;
        
        if (!finalSupplierId) {
             Swal.fire('Error', 'Missing Supplier Information. Please select a supplier to continue.', 'error');
             return;
        }

        // Validate items
        const invalidItems = returnItems.filter(i => !i.returnQuantity || i.returnQuantity <= 0);
        if (invalidItems.length > 0) {
             Swal.fire('Invalid Quantity', 'Please ensure all selected items have a valid return quantity greater than 0.', 'error');
             return;
        }

        if (returnItems.length === 0) {
            Swal.fire('Error', 'Please select at least one item to return.', 'warning');
            return;
        }

        const totalValue = calculateRefund();

        Swal.fire({
            title: 'Create Debit Note?',
            text: `Total Value: ₹${totalValue.toFixed(2)}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Generate Debit Note',
            confirmButtonColor: '#4F46E5'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const returnNumber = `DN-${Date.now().toString().slice(-6)}`;
                    const payload = {
                        purchaseId: invoiceData._id,
                        supplierId: finalSupplierId,
                        items: returnItems.map(i => ({
                            productId: i.productId,
                            batchNumber: i.batchNumber,
                            returnQuantity: i.returnQuantity,
                            purchasePrice: i.purchasePrice,
                            amount: i.purchasePrice * i.returnQuantity
                        })),
                        totalAmount: totalValue,
                        reason: reason,
                        returnNumber: returnNumber
                    };

                    const { data } = await api.post('/purchase-returns', payload);

                    if (data.success) {
                        const newReturn = data.purchaseReturn || data.data; // Handle various response formats
                        
                        Swal.fire({
                            title: 'Success', 
                            text: 'Debit Note created. Generating copy...', 
                            icon: 'success',
                            timer: 1500,
                            showConfirmButton: false
                        });

                        if (newReturn?._id) {
                            setTimeout(() => {
                                navigate(`/purchase/return/view/${newReturn._id}?autoPrint=true`);
                            }, 1500);
                        } else {
                            setView('list');
                            setInvoiceData(null);
                            setInvoiceSearch('');
                            setReturnItems([]);
                            setReason('');
                            setSelectedSupplier('');
                            fetchReturns();
                        }
                    }
                } catch (error) {
                    console.error("Create Return Error: ", error);
                    const errorMsg = error.response?.data?.message || 'Failed to create return';
                    const errorDetails = error.response?.data?.details;
                    
                    Swal.fire({
                        title: 'Error', 
                        html: errorDetails ? `${errorMsg}<br/><br/><small>${errorDetails.join('<br/>')}</small>` : errorMsg,
                        icon: 'error'
                    });
                }
            }
        });
    };

    const handleView = (returnId) => {
        navigate(`/purchase/return/view/${returnId}`);
    };

    const handlePrint = (returnItem) => {
        navigate(`/purchase/return/view/${returnItem._id}?autoPrint=true`);
    };

    const handleEdit = (returnItem) => {
        setEditFormData({
            ...returnItem,
            status: returnItem.status,
            reason: returnItem.reason
        });
        setSelectedReturn(returnItem);
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.put(`/purchase-returns/${selectedReturn._id}`, {
                status: editFormData.status,
                reason: editFormData.reason
            });

            if (data.success) {
                setShowEditModal(false);
                fetchReturns();
                Swal.fire({
                    title: 'Updated!',
                    text: 'Debit note has been updated successfully.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update debit note', 'error');
        }
    };

    const handleDelete = (returnId, returnNumber) => {
        Swal.fire({
            title: 'Are you sure?',
            text: `Do you want to delete debit note ${returnNumber}? This action cannot be undone!`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#EF4444',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, delete it!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { data } = await api.delete(`/purchase-returns/${returnId}`);
                    if (data.success) {
                        fetchReturns();
                        Swal.fire({
                            title: 'Deleted!',
                            text: 'Debit note has been deleted successfully.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete debit note', 'error');
                }
            }
        });
    };

    // --- RENDER HELPERS ---
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Adjusted': return 'bg-green-100 text-green-700 border-green-200';
            case 'Refunded': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Pending': return 'bg-orange-100 text-orange-700 border-orange-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <>
            <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto pb-10">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                            <div className="p-2 bg-red-500/10 rounded-2xl">
                                <RotateCcw className="text-red-500" size={32} />
                            </div>
                            Purchase Returns
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium pl-1">Generate debit notes and manage supplier returns effectively.</p>
                    </div>
                    <div>
                         <button 
                            onClick={() => setView(view === 'list' ? 'create' : 'list')}
                            className={`px-6 py-3.5 rounded-2xl text-sm font-black uppercase tracking-wide transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg
                                ${view === 'list' 
                                    ? 'bg-primary text-white hover:bg-secondary shadow-primary/20' 
                                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-100 dark:border-gray-700 shadow-sm'}`}
                        >
                            {view === 'list' ? <><Plus size={18} /> New Debit Note</> : <><History size={18} /> View History</>}
                        </button>
                    </div>
                </div>

                {/* Stats Section */}
                {view === 'list' && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Returned</p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{stats.totalReturnsAmount.toLocaleString()}</h3>
                                <div className="flex items-center gap-1 text-red-500 text-[10px] font-bold mt-1 uppercase">
                                    <AlertOctagon size={12} /> Total Debit Value
                                </div>
                            </div>
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl">
                                <RotateCcw size={24} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">Pending Adjustments</p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.pendingAdjustmentCount}</h3>
                                <div className="flex items-center gap-1 text-orange-500 text-[10px] font-bold mt-1 uppercase">
                                    <Clock size={12} /> Needs Verification
                                </div>
                            </div>
                            <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl">
                                <AlertOctagon size={24} />
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                            <div>
                                <p className="text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest">Total Debit Notes</p>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-1">{stats.totalReturns}</h3>
                                <div className="flex items-center gap-1 text-blue-500 text-[10px] font-bold mt-1 uppercase">
                                    <FileText size={12} /> All Records
                                </div>
                            </div>
                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                                <FileText size={24} />
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: LIST HISTORY */}
                {view === 'list' && (
                    <div className="space-y-6 animate-fade-in">
                        {/* Filters & Actions Toolbox */}
                        <div className="space-y-4">
                            {/* Top Row: Search & Actions */}
                            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                                <div className="relative w-full lg:w-1/2">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by debit note number or supplier..." 
                                        value={searchTerm}
                                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                        className="w-full pl-12 pr-4 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                                    />
                                </div>
                                <div className="flex items-center gap-3 w-full lg:w-auto">
                                    <button 
                                        className="flex-1 lg:flex-none px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm"
                                    >
                                        <Download size={18} /> Export List
                                    </button>
                                </div>
                            </div>

                            {/* Date Range Filters */}
                            <div className="bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                <div className="flex flex-col sm:flex-row items-center gap-3">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest whitespace-nowrap">Filter by Date:</span>
                                    <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
                                        <div className="relative flex-1">
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input 
                                                type="datetime-local" 
                                                value={startDate}
                                                onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                                                className="w-full pl-9 pr-2 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] font-black text-gray-800 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            />
                                        </div>
                                        <span className="text-gray-400 dark:text-gray-600 font-black text-[10px]">TO</span>
                                        <div className="relative flex-1">
                                            <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" />
                                            <input 
                                                type="datetime-local" 
                                                value={endDate}
                                                onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                                                className="w-full pl-9 pr-2 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] font-black text-gray-800 dark:text-white outline-none cursor-pointer focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
                                            />
                                        </div>
                                        {(startDate || endDate) && (
                                            <button 
                                                onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                                                className="p-2.5 bg-white dark:bg-gray-800 text-red-500 hover:text-red-600 rounded-xl shadow-sm transition-all active:scale-95 border border-red-100 dark:border-red-900/30 flex items-center justify-center"
                                                title="Clear Date Filter"
                                            >
                                                <X size={16} strokeWidth={3} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                                        <tr>
                                            <th className="px-6 py-4">Debit Note #</th>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Supplier</th>
                                            <th className="px-6 py-4">Ref Invoice</th>
                                            <th className="px-6 py-4">Amount</th>
                                            <th className="px-6 py-4">Status</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                        {loading ? (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-20 text-center">
                                                     <div className="flex flex-col items-center gap-3">
                                                         <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                                         <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Fetching records...</span>
                                                     </div>
                                                </td>
                                            </tr>
                                        ) : (
                                            returnHistory.map((item) => (
                                                <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                                    <td className="px-6 py-4 font-black text-gray-900 dark:text-white uppercase antialiased">{item.returnNumber}</td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-medium">{new Date(item.returnDate).toLocaleDateString()}</td>
                                                    <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-100">{item.supplierId?.name || 'Unknown'}</td>
                                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{item.purchaseId?.invoiceNumber || 'N/A'}</td>
                                                    <td className="px-6 py-4 font-black text-primary">₹{item.totalAmount.toLocaleString()}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                                                            {item.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button 
                                                                onClick={() => handleView(item._id)}
                                                                className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all" 
                                                                title="View"
                                                            >
                                                                <Eye size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handlePrint(item)}
                                                                className="p-2 text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-xl transition-all" 
                                                                title="Print"
                                                            >
                                                                <Printer size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleEdit(item)}
                                                                className="p-2 text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-xl transition-all" 
                                                                title="Update"
                                                            >
                                                                <Edit2 size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDelete(item._id, item.returnNumber)}
                                                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all" 
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                        {!loading && returnHistory.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-6 py-16 text-center">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <History size={40} className="text-gray-300 dark:text-gray-600" />
                                                        <p className="text-gray-500 dark:text-gray-400 font-bold uppercase tracking-widest text-xs">No return records found</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Displaying <span className="text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalEntries)}</span> of {totalEntries}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => paginate(currentPage - 1)} disabled={currentPage === 1} className="p-2 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all"><ChevronLeft size={16} /></button>
                                    <div className="flex items-center gap-1">
                                        {[...Array(totalPages)].map((_, i) => (
                                            <button key={i+1} onClick={() => paginate(i+1)} className={`w-9 h-9 rounded-xl text-xs font-black transition-all ${currentPage === i+1 ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{i+1}</button>
                                        ))}
                                    </div>
                                    <button onClick={() => paginate(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-30 transition-all"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* VIEW: CREATE RETURN */}
                {view === 'create' && (
                    <div className="space-y-8 animate-fade-in max-w-4xl mx-auto">
                        {/* Search Section */}
                         <div className="bg-white dark:bg-gray-800 p-10 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                                <FileText size={40} className="text-primary" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Locate Purchase Invoice</h3>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-8 max-w-md font-medium">Enter the original Purchase Invoice number to fetch items for return. This will automatically deduct stock upon generation.</p>
                            
                            <form onSubmit={handleInvoiceSearch} className="flex gap-2 w-full max-w-lg relative">
                                <div className="relative flex-1">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
                                    <input 
                                        type="text" 
                                        placeholder="Search by Invoice, SKU or Medicine Name..." 
                                        value={invoiceSearch}
                                        onChange={(e) => setInvoiceSearch(e.target.value)}
                                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                                        className="w-full pl-12 pr-4 py-4 bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all font-bold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-inner text-lg"
                                    />
                                    
                                    {/* Suggestions Dropdown */}
                                    {showSuggestions && suggestions.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-fade-in text-left">
                                            <div className="max-h-80 overflow-y-auto">
                                                {suggestions.map((p) => (
                                                    <div 
                                                        key={p._id}
                                                        onClick={() => handleInvoiceSearch(null, p)}
                                                        className="px-5 py-3 hover:bg-gray-50 dark:hover:bg-gray-750 cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0"
                                                    >
                                                        <div className="flex justify-between items-start">
                                                            <div>
                                                                <p className="font-black text-gray-900 dark:text-white text-sm uppercase">#{p.invoiceNumber}</p>
                                                                <p className="text-xs text-primary font-bold">{p.supplierId?.name || 'Unknown Supplier'}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(p.purchaseDate).toLocaleDateString()}</p>
                                                                <p className="text-xs font-black text-gray-900 dark:text-white">₹{p.grandTotal.toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-1">
                                                            {p.items.slice(0, 3).map((it, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-[9px] font-black rounded uppercase">
                                                                    {it.productName || it.skuId}
                                                                </span>
                                                            ))}
                                                            {p.items.length > 3 && <span className="text-[9px] text-gray-400 font-bold">+{p.items.length - 3} more</span>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {searchLoading && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                            <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                                        </div>
                                    )}
                                </div>
                                <button type="submit" className="px-8 py-4 bg-gray-900 dark:bg-gray-700 text-white font-black rounded-2xl hover:bg-black dark:hover:bg-gray-600 active:scale-95 transition-all outline-none uppercase tracking-widest text-xs h-[60px]">
                                    Fetch
                                </button>
                            </form>
                        </div>

                        {/* Search Results List (Multiple Matches) */}
                        {!invoiceData && searchResults.length > 0 && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in mb-8">
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750/50 flex justify-between items-center">
                                    <h3 className="font-black text-gray-900 dark:text-white text-lg flex items-center gap-2">
                                        <Search size={20} className="text-primary" /> 
                                        Found {searchResults.length} Matching Invoices
                                    </h3>
                                    <button onClick={() => setSearchResults([])} className="text-gray-400 hover:text-red-500">
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
                                    {searchResults.map(p => (
                                        <div key={p._id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors flex flex-col sm:flex-row justify-between items-center gap-4">
                                            <div className="flex-1 text-left">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <span className="font-black text-lg text-gray-800 dark:text-white">#{p.invoiceNumber}</span>
                                                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 text-[10px] font-bold rounded uppercase">
                                                        {new Date(p.purchaseDate).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                                    <User size={14} className="text-primary" /> {p.supplierId?.name || 'Unknown Supplier'}
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {p.items.filter(i => 
                                                        i.productName?.toLowerCase().includes(invoiceSearch.toLowerCase()) || 
                                                        i.skuId?.toLowerCase().includes(invoiceSearch.toLowerCase())
                                                    ).map((it, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 border border-yellow-100 dark:border-yellow-900/30 text-[10px] font-bold rounded uppercase">
                                                            {it.productName} (Qty: {it.receivedQty})
                                                        </span>
                                                    ))}
                                                    {p.items.length > 5 && <span className="text-[10px] text-gray-400 flex items-center">+{p.items.length - 5} more</span>}
                                                </div>
                                            </div>
                                            <div className="text-right flex flex-col items-end gap-3">
                                                <div className="font-black text-xl text-primary">₹{p.grandTotal.toLocaleString()}</div>
                                                <button 
                                                    onClick={() => handleSelectSearchResult(p)}
                                                    className="px-6 py-2 bg-gray-900 dark:bg-gray-700 text-white text-xs font-bold uppercase rounded-xl hover:bg-primary transition-colors flex items-center gap-2"
                                                >
                                                    Select <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Result Section */}
                        {invoiceData && (
                            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-up text-left">
                                {/* Invoice Info Header */}
                                <div className="p-8 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750/50 flex justify-between items-center text-left">
                                    <div className="text-left w-full">
                                        <div className="flex items-center gap-3">
                                            <span className="px-3 py-1 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-lg">Source Invoice</span>
                                            <h3 className="font-black text-gray-900 dark:text-white text-xl">#{invoiceData.invoiceNumber}</h3>
                                        </div>
                                        
                                        {!invoiceData.supplierId ? (
                                            <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl animate-pulse">
                                                <p className="text-red-500 font-bold text-xs uppercase tracking-wide flex items-center gap-2 mb-2">
                                                    <AlertOctagon size={16} /> Missing Supplier Data
                                                </p>
                                                <select 
                                                    value={selectedSupplier} 
                                                    onChange={(e) => setSelectedSupplier(e.target.value)}
                                                    className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-800 dark:text-white outline-none focus:ring-2 focus:ring-red-500/20"
                                                >
                                                    <option value="">-- Select Supplier Manually --</option>
                                                    {suppliers.map(sup => (
                                                        <option key={sup._id} value={sup._id}>{sup.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1.5 font-medium">
                                                <User size={14} className="text-primary" /> {invoiceData.supplierId.name} &bull; <Calendar size={14} className="text-primary" /> {new Date(invoiceData.purchaseDate).toLocaleDateString()}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={() => setInvoiceData(null)} className="ml-4 text-gray-400 hover:text-red-500 dark:hover:text-red-400 bg-white dark:bg-gray-700 p-2 rounded-xl shadow-sm transition-all hover:rotate-90">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 text-left">
                                    <div className="flex items-center justify-between mb-6">
                                        <h4 className="font-black text-gray-800 dark:text-white flex items-center gap-2 uppercase tracking-wide text-sm">
                                            <AlertOctagon size={18} className="text-orange-500" /> Select Items to Return
                                        </h4>
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">{returnItems.length} Items Selected</span>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        {invoiceData.items.map((item) => {
                                            const itemObj = item.productId || item;
                                            const isSelected = returnItems.find(r => r.productId === (itemObj._id || itemObj.id));
                                            return (
                                                <div key={item._id} className={`p-5 rounded-2xl border transition-all flex items-center justify-between group
                                                    ${isSelected 
                                                        ? 'border-primary bg-primary/5 dark:bg-primary/10 shadow-lg shadow-primary/5' 
                                                        : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-750 hover:border-gray-200 dark:hover:border-gray-600'}`}>
                                                    
                                                    <div className="flex items-center gap-5">
                                                        <div 
                                                            onClick={() => toggleReturnItem(item)}
                                                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer
                                                                ${isSelected ? 'bg-primary border-primary' : 'border-gray-200 dark:border-gray-600 bg-transparent'}`}
                                                        >
                                                            {isSelected && <CheckCircle size={14} className="text-white" />}
                                                        </div>
                                                        <div className="text-left" onClick={() => toggleReturnItem(item)}>
                                                            <p className="font-black text-gray-900 dark:text-white text-base">{itemObj.name || 'Unknown'}</p>
                                                            <div className="flex items-center gap-3 mt-1">
                                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Batch: {item.batchNumber}</span>
                                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Rate: ₹{item.purchasePrice}</span>
                                                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase">Input Stock: {item.receivedQty || item.quantity || 0}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {isSelected && (
                                                        <div className="flex items-center gap-6 animate-fade-in pl-6 border-l border-primary/20">
                                                            <div className="flex items-center bg-white dark:bg-gray-800 border border-primary/20 p-1 rounded-xl h-11 w-32">
                                                                <button 
                                                                    onClick={() => updateReturnQty(itemObj._id || itemObj.id, (parseInt(isSelected.returnQuantity) || 0) - 1, item.receivedQty || item.quantity || 0)} 
                                                                    className="w-8 h-full flex items-center justify-center hover:bg-primary/10 text-primary transition-all rounded-lg font-black text-lg"
                                                                >
                                                                    -
                                                                </button>
                                                                <input 
                                                                    type="number"
                                                                    min="0"
                                                                    max={item.receivedQty || item.quantity || 0}
                                                                    value={isSelected.returnQuantity}
                                                                    onChange={(e) => updateReturnQty(itemObj._id || itemObj.id, e.target.value, item.receivedQty || item.quantity || 0)}
                                                                    className="flex-1 w-full h-full text-center font-black text-gray-900 dark:text-white bg-transparent outline-none border-x border-dashed border-gray-200 dark:border-gray-700 appearance-none text-sm"
                                                                />
                                                                <button 
                                                                    onClick={() => updateReturnQty(itemObj._id || itemObj.id, (parseInt(isSelected.returnQuantity) || 0) + 1, item.receivedQty || item.quantity || 0)} 
                                                                    className="w-8 h-full flex items-center justify-center hover:bg-primary/10 text-primary transition-all rounded-lg font-black text-lg"
                                                                >
                                                                    +
                                                                </button>
                                                            </div>
                                                            <div className="text-right w-28 shrink-0">
                                                                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase leading-none mb-1.5">Debit Amount</p>
                                                                <p className="font-black text-primary text-lg">₹{(item.purchasePrice * isSelected.returnQuantity).toLocaleString()}</p>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="p-8 bg-gray-50 dark:bg-gray-750/50 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-10 items-start md:items-end justify-between">
                                    <div className="w-full md:w-1/2 text-left">
                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block mb-3">Reason for Return</label>
                                        <div className="space-y-3">
                                            <select 
                                                value={reason}
                                                onChange={(e) => setReason(e.target.value)}
                                                className="w-full p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold transition-all shadow-sm text-gray-800 dark:text-white"
                                            >
                                                <option value="">-- Select Reason --</option>
                                                {[
                                                    'Supply Damage', 'Expired SKU', 'Batch Mismatch', 'MRP Issue', 
                                                    'Item Recalled', 'Non Moving', 'Out of PO', 'Pack Size Issue', 
                                                    'Received Less Than Invoice', 'Temperature Issue', 'Wrong SKU', 
                                                    'Wrong Rate', 'Wrong GST', 'Near Expiry', 'Manufacturing Defect'
                                                ].map(r => (
                                                    <option key={r} value={r}>{r}</option>
                                                ))}
                                            </select>
                                            
                                            {/* Optional details box if needed, or just keep select */}
                                        </div>
                                    </div>
                                    
                                    <div className="w-full md:w-auto text-right">
                                        <p className="text-gray-400 dark:text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Grand Refund Total</p>
                                        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-6">₹{calculateRefund().toLocaleString()}</h2>
                                        <button 
                                            onClick={processReturn}
                                            disabled={returnItems.length === 0}
                                            className="w-full md:w-auto px-10 py-4 bg-primary text-white font-black rounded-2xl hover:bg-secondary shadow-xl shadow-primary/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 uppercase tracking-widest text-xs"
                                        >
                                            <RotateCcw size={20} /> Generate Debit Note
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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in text-left">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden max-h-[90vh] flex flex-col">
                        {/* Modal Header Decoration */}
                        <div className="relative bg-red-600 h-32 shrink-0">
                            <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-red-500 opacity-90"></div>
                            <button 
                                onClick={() => setShowViewModal(false)} 
                                className="absolute top-6 right-6 text-white/80 hover:text-white bg-black/20 hover:bg-black/40 p-2.5 rounded-2xl backdrop-blur-sm transition-all z-10"
                            >
                                <X size={20} />
                            </button>
                            <div className="absolute -bottom-12 left-10 p-1.5 bg-white dark:bg-gray-800 rounded-3xl shadow-xl">
                                <div className="w-24 h-24 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center text-red-600 dark:text-red-400">
                                    <RotateCcw size={48} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="pt-16 px-10 pb-10 overflow-y-auto custom-scrollbar">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                                <div>
                                    <h3 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter">{selectedReturn.returnNumber}</h3>
                                    <div className="flex gap-2 mt-2">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusStyle(selectedReturn.status)}`}>
                                            Status: {selectedReturn.status}
                                        </span>
                                        <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600">
                                            Ref: {selectedReturn.purchaseId?.invoiceNumber}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-left sm:text-right">
                                    <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none mb-1">Return Issued On</p>
                                    <p className="text-base font-bold text-gray-800 dark:text-white">{new Date(selectedReturn.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                                </div>
                            </div>

                            <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-700 pb-2">Supplier Details</h4>
                                    <div className="flex items-start gap-4">
                                        <div className="bg-primary/5 dark:bg-primary/10 p-3 rounded-2xl text-primary"><User size={20} /></div>
                                        <div>
                                            <p className="text-base font-bold text-gray-800 dark:text-white">{selectedReturn.supplierId?.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{selectedReturn.supplierId?.phone}</p>
                                            <p className="text-[10px] text-primary font-black uppercase tracking-wider mt-1.5 bg-primary/5 px-2 py-0.5 rounded-md inline-block">GST: {selectedReturn.supplierId?.gstNumber}</p>
                                        </div>
                                    </div>
                                    <div className="pl-14">
                                         <p className="text-xs text-gray-500 dark:text-gray-400 italic leading-relaxed">"{selectedReturn.supplierId?.address}"</p>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] border-b border-gray-100 dark:border-gray-700 pb-2">Internal Note</h4>
                                    <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 border border-orange-100/50 dark:border-orange-900/30 rounded-2xl">
                                        <div className="flex gap-3">
                                            <AlertOctagon size={16} className="text-orange-500 shrink-0" />
                                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                {selectedReturn.reason || 'No specific return reason provided.'}
                                            </p>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Itemized Table */}
                            <div className="mt-10">
                                <h4 className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-4">Returned Inventory</h4>
                                <div className="border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-750 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                                            <tr>
                                                <th className="px-5 py-3">Product</th>
                                                <th className="px-5 py-3">Batch</th>
                                                <th className="px-5 py-3 text-center">Qty</th>
                                                <th className="px-5 py-3 text-right">Debit Amt</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {selectedReturn.items.map((item, idx) => (
                                                <tr key={idx} className="bg-white dark:bg-gray-800">
                                                    <td className="px-5 py-4 font-bold text-gray-800 dark:text-gray-200">{item.productId?.name}</td>
                                                    <td className="px-5 py-4 font-mono text-xs text-gray-500 dark:text-gray-400 uppercase">{item.batchNumber}</td>
                                                    <td className="px-5 py-4 text-center font-black text-gray-700 dark:text-gray-300">{item.returnQuantity}</td>
                                                    <td className="px-5 py-4 text-right font-black text-red-600 dark:text-red-400">₹{item.amount.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                            
                            <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-gray-50 dark:bg-gray-750/50 -mx-10 px-10 pb-2">
                                <div className="py-4">
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-[0.2em] leading-none mb-2">Total Adjusted Value</p>
                                    <p className="text-4xl font-black text-gray-900 dark:text-white tracking-tighter">₹{selectedReturn.totalAmount.toLocaleString()}</p>
                                </div>
                                <div className="flex gap-3 py-4 w-full sm:w-auto">
                                    <button 
                                        onClick={() => handlePrint(selectedReturn)}
                                        className="flex-1 sm:flex-none px-8 py-3.5 bg-gray-900 dark:bg-gray-700 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-black transition-all flex items-center justify-center gap-3 shadow-xl"
                                    >
                                        <Printer size={18} /> Print Voucher
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && editFormData && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md animate-fade-in text-left">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-3xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 overflow-hidden">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-750/50">
                            <div>
                                <h3 className="font-black text-gray-900 dark:text-white text-xl uppercase tracking-tighter">Modify Debit Note</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Ref: {selectedReturn.returnNumber}</p>
                            </div>
                            <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white transition-all p-2 rounded-xl bg-white dark:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-600 hover:rotate-90">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-8">
                             <form id="edit-return-form" onSubmit={handleEditSubmit} className="space-y-6 text-left">
                                <div className="space-y-6">
                                     <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block ml-1">Current Status</label>
                                        <select 
                                            value={editFormData.status}
                                            onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700 rounded-2xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none font-bold text-sm text-gray-800 dark:text-white transition-all appearance-none cursor-pointer"
                                        >
                                            <option value="Pending">🕒 Pending Review</option>
                                            <option value="Adjusted">✅ Adjusted in A/C</option>
                                            <option value="Refunded">💸 Amount Refunded</option>
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest block ml-1">Update Reason</label>
                                        <textarea 
                                            rows="4"
                                            placeholder="Update the return reason or add internal notes..."
                                            value={editFormData.reason}
                                            onChange={(e) => setEditFormData({...editFormData, reason: e.target.value})}
                                            className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-750 border border-gray-100 dark:border-gray-700 rounded-2xl outline-none font-bold text-sm text-gray-800 dark:text-white resize-none transition-all shadow-inner focus:ring-4 focus:ring-primary/10 placeholder:text-gray-400"
                                        ></textarea>
                                    </div>
                                </div>
                             </form>
                        </div>
                        <div className="p-8 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-750/50">
                            <button onClick={() => setShowEditModal(false)} className="px-6 py-3.5 rounded-2xl border border-gray-100 dark:border-gray-700 text-gray-500 font-bold hover:bg-white dark:hover:bg-gray-700 text-xs uppercase tracking-widest transition-all">Discard</button>
                            <button type="submit" form="edit-return-form" className="px-10 py-3.5 rounded-2xl bg-primary text-white font-black hover:bg-secondary shadow-xl shadow-primary/20 active:scale-95 transition-all text-xs uppercase tracking-widest">Submit Update</button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default PurchaseReturn;
