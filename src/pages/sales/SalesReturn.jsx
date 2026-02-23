import React, { useState, useMemo, useEffect, useCallback } from 'react';
import api from '../../api/axios';
import { RotateCcw, Search, FileText, User, ArrowRight, CheckCircle, AlertOctagon, X, Plus, Printer, Eye, Calendar, MoreVertical, ChevronLeft, ChevronRight, Upload } from 'lucide-react';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 

const SalesReturn = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('list'); // 'list' or 'create'
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    const fetchReturns = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/sales/returns', {
                params: {
                    keyword: searchTerm,
                    startDate,
                    endDate,
                    page: currentPage,
                    limit: itemsPerPage
                }
            });
            if (data.success) {
                setReturns(data.returns);
                setTotalPages(data.pages);
                setTotalItems(data.total);
            }
        } catch (error) {
            console.error("Error fetching returns:", error);
        } finally {
            setLoading(false);
        }
    }, [searchTerm, startDate, endDate, currentPage, itemsPerPage]);

    useEffect(() => {
        if (view === 'list') fetchReturns();
    }, [view, fetchReturns]);

    // Check for pre-filled ID from navigation
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const preId = params.get('invId');
        if (preId) {
            setInvoiceSearch(preId);
            setView('create');
            // Programmatically trigger search
            handleInvoiceSearch(null, preId);
        }
    }, []);

    // ... Create Return Logic ...
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceSuggestions, setInvoiceSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [invoiceData, setInvoiceData] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');
    const [returnInvoiceFile, setReturnInvoiceFile] = useState(null);

    // Fetch Suggestions for Invoice
    useEffect(() => {
        const fetchSuggestions = async () => {
            if (invoiceSearch.trim().length < 2) {
                setInvoiceSuggestions([]);
                return;
            }
            try {
                const { data } = await api.get('/sales', {
                    params: { keyword: invoiceSearch, limit: 5 }
                });
                if (data.success) {
                    setInvoiceSuggestions(data.sales);
                }
            } catch (error) {
                console.error("Error fetching invoice suggestions:", error);
            }
        };

        const timer = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timer);
    }, [invoiceSearch]);

    // Search Invoice Logic
    const handleInvoiceSearch = async (e, directId = null) => {
        if (e) e.preventDefault();
        const search = directId || invoiceSearch.trim();
        if (!search) return;
        
        try {
            if (!directId) Swal.fire({ title: 'Searching...', didOpen: () => Swal.showLoading() });
            const { data } = await api.get(`/sales/${search}`);
            if (!directId) Swal.close();
            
            if (data.success) {
                const sale = data.sale;
                setInvoiceData({
                    id: sale.invoiceNumber,
                    dbId: sale._id,
                    customer: sale.customerName || 'Walk-in',
                    date: new Date(sale.createdAt).toLocaleDateString(),
                    items: sale.items.map(item => ({
                        id: item._id,
                        productId: item.productId._id,
                        name: item.name,
                        qty: item.quantity,
                        price: item.price,
                        tax: item.tax || 0,
                        sku: item.productId?.sku || 'N/A'
                    }))
                });
                setReturnItems([]);
            }
        } catch (error) {
            Swal.close();
            Swal.fire('Not Found', 'No invoice matches this Number or ID.', 'error');
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
        return returnItems.reduce((acc, item) => {
            const itemTax = (item.price * item.returnQty * (item.tax / 100));
            return acc + (item.price * item.returnQty) + itemTax;
        }, 0);
    };

    const handleFullReturn = () => {
        if (!invoiceData) return;
        const allItems = invoiceData.items.map(item => ({ ...item, returnQty: item.qty }));
        setReturnItems(allItems);
    };

    const processReturn = async () => {
        if (returnItems.length === 0) {
            Swal.fire('Error', 'Please select at least one item to return.', 'warning');
            return;
        }

        if (!reason) {
            Swal.fire('Error', 'Please select a return reason.', 'warning');
            return;
        }

        if (!returnInvoiceFile) {
            Swal.fire('Invoice Required', 'Please upload the return invoice file before confirming the return.', 'error');
            return;
        }

        const finalReason = reason === 'Other' 
            ? document.getElementById('customReasonInput')?.value || 'Unspecified Other' 
            : reason;

        const refundAmount = calculateRefund();

        Swal.fire({
            title: 'Confirm Return?',
            text: `Refund Amount: Rs. ${refundAmount.toFixed(2)}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Process Refund',
            confirmButtonColor: '#dc2626'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'Processing...', didOpen: () => Swal.showLoading() });

                    const formData = new FormData();
                    formData.append('saleId', invoiceData.dbId);
                    formData.append('items', JSON.stringify(returnItems.map(item => ({
                        productId: item.productId,
                        name: item.name,
                        quantity: item.returnQty,
                        price: item.price,
                        tax: item.tax,
                        subtotal: item.price * item.returnQty
                    }))));
                    formData.append('totalAmount', refundAmount);
                    formData.append('reason', finalReason);
                    formData.append('status', 'Putaway_Pending');
                    if (returnInvoiceFile) {
                        formData.append('invoiceFile', returnInvoiceFile);
                    }

                    const { data } = await api.post('/sales/returns', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    Swal.close();

                    if (data.success) {
                        Swal.fire('Processed', `Sales return created successfully.`, 'success');
                        setView('list');
                        setInvoiceData(null);
                        setInvoiceSearch('');
                        setReturnItems([]);
                        setReason('');
                        setReturnInvoiceFile(null);
                        setCurrentPage(1); 
                        fetchReturns();
                    }
                } catch (error) {
                    Swal.close();
                    Swal.fire('Error', error.response?.data?.message || 'Failed to process return', 'error');
                }
            }
        });
    };

    const handleClearAll = () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "All sales returns will be deleted. This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Clear All!',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    Swal.fire({ title: 'Clearing...', didOpen: () => Swal.showLoading() });
                    const { data } = await api.delete('/sales/returns/clear');
                    Swal.close();
                    if (data.success) {
                        fetchReturns();
                        Swal.fire({
                            title: 'Cleared!',
                            text: 'All sales returns have been deleted.',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                    }
                } catch (error) {
                    Swal.close();
                    Swal.fire('Error', 'Failed to clear sales returns', 'error');
                }
            }
        });
    };

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const allReturnsForReport = returns; // In a full app, maybe fetchAllForReport

        const img = new Image();
        img.src = KS2Logo;
        
        img.onload = () => {
            doc.addImage(img, 'PNG', 14, 10, 45, 20);
            doc.setFontSize(11);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text('KS Pharma Net', 14, 40);
            
            doc.setFontSize(24);
            doc.setTextColor(220, 38, 38); // Red-600
            doc.setFont('helvetica', 'bold');
            doc.text('SALES RETURN REPORT', pageWidth - 14, 25, { align: 'right' });
            
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth - 14, 32, { align: 'right' });

            // Summary Box
            doc.setDrawColor(254, 242, 242);
            doc.setFillColor(254, 242, 242);
            doc.roundedRect(14, 50, pageWidth - 28, 25, 2, 2, 'FD');

            doc.setFontSize(10);
            doc.setTextColor(153, 27, 27);
            doc.text('TOTAL RETURNS', 20, 60);
            doc.text('TOTAL REFUNDED AMOUNT', pageWidth / 2, 60, { align: 'center' });

            doc.setFontSize(14);
            doc.setTextColor(0);
            doc.setFont('helvetica', 'bold');
            doc.text(totalItems.toString(), 20, 68);
            const totalRefundValue = allReturnsForReport.reduce((acc, curr) => acc + curr.totalAmount, 0);
            doc.text(`Rs. ${totalRefundValue.toLocaleString()}`, pageWidth / 2, 68, { align: 'center' });

            // Table
            const tableColumn = ["Return ID", "Invoice ID", "Date", "Customer", "Amount", "Status"];
            const tableRows = allReturnsForReport.map(ret => [
                ret.returnNumber,
                ret.invoiceNumber,
                new Date(ret.createdAt).toLocaleDateString(),
                ret.customerName || 'Walk-in',
                `Rs. ${ret.totalAmount.toFixed(2)}`,
                ret.status
            ]);

            autoTable(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255] },
                margin: { left: 14, right: 14 },
            });

            doc.save(`sales_return_report_${new Date().toISOString().split('T')[0]}.pdf`);
        };
    };

    // Pagination & List View Logic
    const { paginatedReturns, paginationInfo } = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;

        return {
            paginatedReturns: returns, // Already filtered and paginated from backend
            paginationInfo: {
                totalItems,
                startIndex: totalItems > 0 ? startIndex + 1 : 0,
                endIndex: Math.min(endIndex, totalItems),
                currentPage
            }
        };
    }, [returns, totalItems, currentPage, itemsPerPage]);

    // Handlers
    const handleSearchChange = (value) => {
        setSearchTerm(value);
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

    if (view === 'create') {
        return (
            <div className="animate-fade-in-up space-y-6 max-w-5xl mx-auto pb-10">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            <RotateCcw className="text-red-500" /> New Sales Return
                        </h1>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Create a credit note for returned items.</p>
                    </div>
                    <button onClick={() => setView('list')} className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600">
                        Cancel
                    </button>
                </div>

                {/* Step 1: Search */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center">
                    <FileText size={40} className="text-gray-200 dark:text-gray-700 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Find Original Invoice</h3>
                    <div className="flex flex-col w-full max-w-md relative mt-4">
                        <form onSubmit={handleInvoiceSearch} className="flex gap-2 w-full relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search Invoice, Customer or Item Name..." 
                                value={invoiceSearch}
                                onFocus={() => setShowSuggestions(true)}
                                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                                onChange={(e) => setInvoiceSearch(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all font-mono uppercase text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                            />
                            <button type="submit" className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 active:scale-95 transition-all">Find</button>
                        </form>

                        {/* Suggestions Dropdown */}
                        {showSuggestions && invoiceSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[100] max-h-80 overflow-y-auto text-left animate-fade-in-up">
                                {invoiceSuggestions.map(inv => (
                                    <div 
                                        key={inv._id}
                                        onClick={() => {
                                            setInvoiceSearch(inv.invoiceNumber);
                                            setShowSuggestions(false);
                                            handleInvoiceSearch(null, inv.invoiceNumber);
                                        }}
                                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors group"
                                    >
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="font-bold text-sm text-gray-800 dark:text-gray-100 group-hover:text-red-600 transition-colors">{inv.invoiceNumber}</p>
                                            <span className="text-[10px] font-bold text-gray-400">{new Date(inv.createdAt).toLocaleDateString()}</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 flex items-center gap-1">
                                            <User size={10} /> {inv.customerName || 'Walk-in'}
                                        </p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                                            {inv.items?.map(i => i.name).join(', ')}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Step 2: Select Items */}
                {invoiceData && (
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-between items-center">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Invoice #{invoiceData.id}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                    <User size={14} /> {invoiceData.customer} &bull; {invoiceData.date}
                                </p>
                            </div>
                            <button onClick={() => setInvoiceData(null)} className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-6 space-y-3">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                    <AlertOctagon size={18} className="text-orange-500" /> Select Items
                                </h4>
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setReturnItems([])}
                                        className="text-xs font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                                    >
                                        Clear All
                                    </button>
                                    <button 
                                        onClick={handleFullReturn}
                                        className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors bg-red-50 dark:bg-red-900/20 px-3 py-1 rounded-md"
                                    >
                                        Full Return (Select All)
                                    </button>
                                </div>
                            </div>
                            {invoiceData.items.map((item) => {
                                const isSelected = returnItems.find(r => r.id === item.id);
                                return (
                                    <div key={item.id} className={`p-4 rounded-xl border transition-all flex items-center justify-between group
                                        ${isSelected ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : 'border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500'}`}>
                                        <div className="flex items-center gap-4">
                                            <input type="checkbox" checked={!!isSelected} onChange={() => toggleReturnItem(item)} className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 text-red-600 focus:ring-red-500 cursor-pointer" />
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-200">{item.name}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">Sold: ₹{item.price}</p>
                                            </div>
                                        </div>
                                        {isSelected && (
                                            <div className="flex items-center gap-4 animate-fade-in">
                                                <div className="flex items-center bg-white dark:bg-gray-700 border border-red-200 dark:border-red-800 rounded-lg h-9">
                                                    <button onClick={() => updateReturnQty(item.id, isSelected.returnQty - 1, item.qty)} className="px-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 h-full font-bold">-</button>
                                                    <span className="w-8 text-center text-sm font-bold text-gray-800 dark:text-white">{isSelected.returnQty}</span>
                                                    <button onClick={() => updateReturnQty(item.id, isSelected.returnQty + 1, item.qty)} className="px-3 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 h-full font-bold">+</button>
                                                </div>
                                                <div className="text-right w-24">
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">Refund</p>
                                                    <p className="font-bold text-red-600 dark:text-red-400">Rs. {(item.price * isSelected.returnQty).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                             <div className="w-full md:w-1/2">
                                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Return Reason <span className="text-red-500">*</span></label>
                                 <div className="space-y-2">
                                     <select 
                                        value={reason} 
                                        onChange={(e) => setReason(e.target.value)} 
                                        className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-white font-medium focus:ring-2 focus:ring-red-100"
                                     >
                                         <option value="">-- Select Reason --</option>
                                         <option value="Damage">Damage</option>
                                         <option value="Incorrect SKU">Incorrect SKU</option>
                                         <option value="Expiry">Expiry</option>
                                         <option value="Batch Issue">Batch Issue</option>
                                         <option value="Received Less than Invoice">Received Less than Invoice</option>
                                         <option value="MRP Issue">MRP Issue</option>
                                         <option value="Pack Size Issue">Pack Size Issue</option>
                                         <option value="Other">Other</option>
                                     </select>
                                     
                                     {reason === 'Other' && (
                                        <textarea 
                                            rows="2" 
                                            placeholder="Please specify the reason..." 
                                            id="customReasonInput"
                                            className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 animate-fade-in"
                                        ></textarea>
                                     )}
                                 </div>
                             </div>
                             <div className="w-full md:w-1/2">
                                 {/* Invoice File Upload */}
                                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">
                                     Upload Return Invoice <span className="text-red-500">*</span>
                                 </label>
                                 <label className={`flex items-center gap-3 p-3 border-2 border-dashed rounded-xl cursor-pointer transition-all
                                     ${ returnInvoiceFile
                                         ? 'border-green-400 bg-green-50 dark:bg-green-900/20'
                                         : 'border-gray-200 dark:border-gray-600 hover:border-red-400 dark:hover:border-red-500 bg-white dark:bg-gray-700'
                                     }`}>
                                     <input
                                         type="file"
                                         className="hidden"
                                         accept="image/*,application/pdf,.doc,.docx"
                                         onChange={(e) => setReturnInvoiceFile(e.target.files[0] || null)}
                                     />
                                     {returnInvoiceFile ? (
                                         <>
                                             <FileText size={20} className="text-green-500 flex-shrink-0" />
                                             <div className="flex-1 min-w-0">
                                                 <p className="text-xs font-bold text-green-700 dark:text-green-400 truncate">{returnInvoiceFile.name}</p>
                                                 <p className="text-[10px] text-green-500">{(returnInvoiceFile.size / 1024).toFixed(1)} KB — Click to change</p>
                                             </div>
                                             <button type="button" onClick={(e) => { e.preventDefault(); setReturnInvoiceFile(null); }} className="text-red-400 hover:text-red-600 flex-shrink-0">
                                                 <X size={16} />
                                             </button>
                                         </>
                                     ) : (
                                         <>
                                             <Upload size={20} className="text-gray-400 flex-shrink-0" />
                                             <div>
                                                 <p className="text-xs font-bold text-gray-600 dark:text-gray-300">Click to upload invoice</p>
                                                 <p className="text-[10px] text-gray-400">PDF, Image or Document (max 50MB)</p>
                                             </div>
                                         </>
                                     )}
                                 </label>
                             </div>
                             <div className="w-full md:w-auto text-right">
                                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Refund (Inc. Tax)</p>
                                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Rs. {calculateRefund().toFixed(2)}</h2>
                                 <button onClick={processReturn} disabled={returnItems.length === 0} className="w-full md:w-auto px-8 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 shadow-lg shadow-red-200 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                                    <RotateCcw size={18} /> Confirm Return
                                 </button>
                             </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
                <div className="flex items-center gap-4 w-full xl:w-auto">
                    <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30">
                        <RotateCcw size={28} strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">Sales Returns</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Manage returns and credit notes.</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                     <button 
                        onClick={handleDownloadReport}
                        className="w-full sm:w-auto px-6 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                     >
                        <FileText size={18} className="text-red-500" strokeWidth={2.5} /> Return Report PDF
                    </button>
                    <button 
                        onClick={handleClearAll}
                        className="w-full sm:w-auto px-6 py-3.5 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
                    >
                        <AlertOctagon size={18} strokeWidth={2.5} /> Clear All
                    </button>
                    <button 
                        onClick={() => setView('create')}
                        className="w-full sm:w-auto px-8 py-3.5 bg-red-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-red-700 shadow-lg shadow-red-600/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                        <Plus size={18} strokeWidth={3} /> New Return
                    </button>
                </div>
            </div>

            {/* List View Filters */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center px-5 py-5">
                <div className="relative w-full lg:w-96">
                   <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search Return No, Invoice, Customer..." 
                      value={searchTerm} 
                      onChange={(e) => handleSearchChange(e.target.value)} 
                      className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-red-500/10 focus:border-red-500 outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 font-medium" 
                    />
                </div>
                
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-red-500/10 w-full sm:w-auto">
                        <Calendar size={18} className="text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">From</span>
                        <input 
                            type="datetime-local" 
                            value={startDate} 
                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} 
                            className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200 font-bold" 
                        />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gray-100/50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-2.5 transition-all focus-within:ring-2 focus-within:ring-red-500/10 w-full sm:w-auto">
                        <Calendar size={18} className="text-gray-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">To</span>
                        <input 
                            type="datetime-local" 
                            value={endDate} 
                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} 
                            className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200 font-bold" 
                        />
                    </div>
                    
                    {(startDate || endDate) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                            className="w-full sm:w-auto p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all border border-transparent hover:border-red-100"
                            title="Clear Dates"
                        >
                            <X size={20} strokeWidth={2.5} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/80 dark:bg-gray-750/80 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Return Number</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ref Invoice</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Refund Amount</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Invoice</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {paginatedReturns.map((ret) => (
                                <tr key={ret._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span className="font-bold text-gray-800 dark:text-gray-100 tracking-tight">{ret.returnNumber}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">
                                        {new Date(ret.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">{ret.customerName || 'Walk-in'}</td>
                                    <td className="px-6 py-5">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 font-mono tracking-tighter">
                                            {ret.invoiceNumber}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right font-black text-red-600 dark:text-red-400">₹{ret.totalAmount.toFixed(2)}</td>
                                    <td className="px-6 py-5">
                                        {ret.invoiceFile ? (
                                            <a
                                                href={`${api.defaults.baseURL?.replace('/api','') || ''}${ret.invoiceFile}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-[10px] uppercase bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md transition-all active:scale-95 w-fit"
                                            >
                                                <FileText size={12} /> View File
                                            </a>
                                        ) : (
                                            <span className="text-gray-400 text-[10px] uppercase font-bold">No File</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all
                                            ${ret.status === 'Refunded' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                                              ret.status === 'Pending' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800' :
                                              'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-800'}`}>
                                            {ret.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button 
                                                onClick={() => navigate(`/sales/return/view/${ret._id}`)}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700" 
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/sales/return/view/${ret._id}`)}
                                                className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700" 
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {loading && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center">
                                        <div className="flex flex-col items-center gap-2">
                                            <div className="animate-spin rounded-full h-8 w-8 border-4 border-red-500 border-t-transparent"></div>
                                            <p className="text-sm text-gray-500 font-medium tracking-wide">Fetching returns...</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!loading && paginatedReturns.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-16 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                                <Search size={32} className="text-gray-300 dark:text-gray-600" />
                                            </div>
                                            <div>
                                                <p className="text-gray-800 dark:text-gray-200 font-bold">No data found</p>
                                                <p className="text-gray-400 dark:text-gray-500 text-xs">No sales returns found matching your search.</p>
                                            </div>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {paginationInfo.totalItems > 0 && (
                  <div className="px-6 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                      
                      {/* Info & Limit Selector */}
                      <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
                        <p className="text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1">
                          Showing <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                          <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                          <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> items
                        </p>
                        
                        <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm order-1 sm:order-2">
                          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Show:</label>
                          <select
                            value={itemsPerPage}
                            onChange={(e) => handleItemsPerPageChange(e.target.value)}
                            className="bg-transparent border-none text-sm font-black text-red-600 outline-none cursor-pointer focus:ring-0 p-0"
                          >
                            {[5, 10, 20, 50].map(v => <option key={v} value={v}>{v}</option>)}
                          </select>
                        </div>
                      </div>

                      {/* Page Navigation */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                          >
                            <ChevronLeft size={18} strokeWidth={2.5} />
                          </button>

                          <div className="flex items-center gap-1 sm:gap-1.5">
                             {[...Array(totalPages)].map((_, i) => {
                                 const pg = i + 1;
                                 if (totalPages <= 7 || (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1))) {
                                     return (
                                        <button
                                            key={pg}
                                            onClick={() => goToPage(pg)}
                                            className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shadow-sm active:scale-95 
                                                ${currentPage === pg 
                                                    ? 'bg-red-600 text-white shadow-red-600/20 scale-105' 
                                                    : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-red-500/50 border border-gray-200 dark:border-gray-600'}`}
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
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                          >
                            <ChevronRight size={18} strokeWidth={2.5} />
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

export default SalesReturn;
