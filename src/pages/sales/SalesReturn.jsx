import React, { useState, useMemo } from 'react';
import { RotateCcw, Search, FileText, User, ArrowRight, CheckCircle, AlertOctagon, X, Plus, Printer, Eye, Calendar, MoreVertical, ChevronLeft, ChevronRight } from 'lucide-react';
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
    const location = React.useMemo(() => window.location, []);
    
    // Check for pre-filled ID from navigation
    React.useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const preId = params.get('invId');
        if (preId) {
            setInvoiceSearch(preId);
            setView('create');
            // Trigger search automatically
            const found = mockInvoices.find(inv => inv.id.toLowerCase() === preId.toLowerCase());
            if (found) setInvoiceData(found);
        }
    }, [location.search]);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // --- Create Return Logic ---
    const [invoiceSearch, setInvoiceSearch] = useState('');
    const [invoiceData, setInvoiceData] = useState(null);
    const [returnItems, setReturnItems] = useState([]);
    const [reason, setReason] = useState('');

    // Mock Database
    const mockInvoices = [
        { 
            id: 'INV-2024-001', 
            customer: 'Rahul Sharma', 
            date: '2024-01-22', 
            items: [
                { id: 101, name: 'Dolo 650', qty: 2, price: 30.00, batch: 'B001', sku: 'DLO-001' },
                { id: 102, name: 'Azithral 500', qty: 1, price: 115.00, batch: 'AZ-99', sku: 'AZ-99' }
            ]
        },
        { 
            id: 'INV-2024-005', 
            customer: 'Sneha Gupta', 
            date: '2024-01-20', 
            items: [
                { id: 103, name: 'Paracetamol 500', qty: 5, price: 10.00, batch: 'PCM-12', sku: 'PCM-102' }
            ]
        }
    ];

    const mockReturns = [
        { id: 'RET-2024-001', invId: 'INV-2024-001', customer: 'Rahul Sharma', date: '2024-01-28', items: 2, amount: 212.40, status: 'Refunded', products: 'Dolo 650, Azithral 500', sku: 'DLO-001, AZ-99' },
        { id: 'RET-2024-002', invId: 'INV-2024-005', customer: 'Sneha Gupta', date: '2024-01-25', items: 1, amount: 45.00, status: 'Credit', products: 'Paracetamol 500', sku: 'PCM-102' },
        { id: 'RET-2024-003', invId: 'INV-2024-008', customer: 'Amit Singh', date: '2024-01-24', items: 3, amount: 550.00, status: 'Refunded', products: 'Azithromycin, Vitamin C', sku: 'AZ-112, VIT-003' },
        { id: 'RET-2024-004', invId: 'INV-2024-012', customer: 'Priya Verma', date: '2024-01-23', items: 1, amount: 120.00, status: 'Pending', products: 'Cetirizine', sku: 'CET-882' },
        { id: 'RET-2024-005', invId: 'INV-2024-015', customer: 'Arjun Reddy', date: '2024-01-22', items: 5, amount: 1200.00, status: 'Refunded', products: 'Amoxicillin, Pan 40', sku: 'AMX-001, PAN-401' },
        { id: 'RET-2024-006', invId: 'INV-2024-018', customer: 'Meera Nair', date: '2024-01-21', items: 2, amount: 340.00, status: 'Credit', products: 'Ibuprofen 400', sku: 'IBU-400' },
        { id: 'RET-2024-007', invId: 'INV-2024-021', customer: 'Suresh Raina', date: '2024-01-20', items: 1, amount: 85.00, status: 'Refunded', products: 'Vicks Vaporub', sku: 'VCK-111' },
        { id: 'RET-2024-008', invId: 'INV-2024-024', customer: 'Anjali Devi', date: '2024-01-19', items: 4, amount: 890.00, status: 'Pending', products: 'Omez, Telma 40', sku: 'OMZ-88, TLM-44' },
        { id: 'RET-2024-009', invId: 'INV-2024-027', customer: 'Vikram Singh', date: '2024-01-18', items: 2, amount: 450.00, status: 'Refunded', products: 'Limcee, Rantac 150', sku: 'LIM-01, RAN-150' },
        { id: 'RET-2024-010', invId: 'INV-2024-030', customer: 'Pooja Hegde', date: '2024-01-17', items: 1, amount: 110.00, status: 'Credit', products: 'Combiflam', sku: 'CMB-99' },
        { id: 'RET-2024-011', invId: 'INV-2024-033', customer: 'Rajesh Khanna', date: '2024-01-16', items: 3, amount: 670.00, status: 'Refunded', products: 'Metformin, Glipizide', sku: 'MET-500, GLP-02' },
        { id: 'RET-2024-012', invId: 'INV-2024-036', customer: 'Simran Kaur', date: '2024-01-15', items: 2, amount: 230.00, status: 'Pending', products: 'Digene, Gelusil', sku: 'DIG-10, GEL-01' },
    ];

    // Search Invoice Logic
    const handleInvoiceSearch = (e) => {
        e.preventDefault();
        const search = invoiceSearch.toLowerCase();
        
        // Search by Invoice ID, Customer Name, or SKU inside items
        const found = mockInvoices.find(inv => 
            inv.id.toLowerCase() === search || 
            inv.customer.toLowerCase().includes(search) ||
            inv.items.some(item => 
                item.name.toLowerCase().includes(search) || 
                (item.sku && item.sku.toLowerCase() === search)
            )
        );

        if (found) {
            setInvoiceData(found);
            setReturnItems([]);
        } else {
            Swal.fire('Not Found', 'No invoice matches this ID, Customer, or SKU.', 'error');
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
        const subtotal = returnItems.reduce((acc, item) => acc + (item.price * item.returnQty), 0);
        return subtotal * 1.18; // Adding 18% GST estimate
    };

    const handleFullReturn = () => {
        if (!invoiceData) return;
        const allItems = invoiceData.items.map(item => ({ ...item, returnQty: item.qty }));
        setReturnItems(allItems);
    };

    const processReturn = () => {
        if (returnItems.length === 0) {
            Swal.fire('Error', 'Please select at least one item to return.', 'warning');
            return;
        }

        const isFull = returnItems.length === invoiceData?.items.length && 
                      returnItems.every(r => r.returnQty === invoiceData.items.find(i => i.id === r.id)?.qty);

        Swal.fire({
            title: isFull ? 'Confirm Full Return?' : 'Confirm Partial Return?',
            text: `Refund Amount: ₹${calculateRefund().toFixed(2)}`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Process Refund',
            confirmButtonColor: '#dc2626'
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Processed', `${isFull ? 'Full' : 'Partial'} sales return created successfully.`, 'success');
                setView('list');
                setInvoiceData(null);
                setInvoiceSearch('');
                setReturnItems([]);
                setReason('');
            }
        });
    };

    const handleDownloadReport = () => {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const filteredAll = mockReturns.filter(ret => {
            const search = searchTerm.toLowerCase();
            const matchesSearch = ret.id.toLowerCase().includes(search) || 
                                 ret.customer.toLowerCase().includes(search) ||
                                 ret.invId.toLowerCase().includes(search) ||
                                 (ret.products && ret.products.toLowerCase().includes(search)) ||
                                 (ret.sku && ret.sku.toLowerCase().includes(search));
            
            let matchesDate = true;
            if (startDate && endDate) {
                matchesDate = ret.date >= startDate && ret.date <= endDate;
            } else if (startDate) {
                matchesDate = ret.date >= startDate;
            } else if (endDate) {
                matchesDate = ret.date <= endDate;
            }
            return matchesSearch && matchesDate;
        });

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
            if (startDate || endDate) {
                doc.text(`Period: ${startDate || 'Start'} to ${endDate || 'End'}`, pageWidth - 14, 37, { align: 'right' });
            }

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
            doc.text(filteredAll.length.toString(), 20, 68);
            doc.text(`Rs. ${filteredAll.reduce((acc, curr) => acc + curr.amount, 0).toLocaleString()}`, pageWidth / 2, 68, { align: 'center' });

            // Table
            const tableColumn = ["Return ID", "Invoice ID", "Date", "Customer", "Amount", "Status"];
            const tableRows = filteredAll.map(ret => [
                ret.id,
                ret.invId,
                ret.date,
                ret.customer,
                `Rs. ${ret.amount.toFixed(2)}`,
                ret.status
            ]);

            autoTable(doc, {
                startY: 85,
                head: [tableColumn],
                body: tableRows,
                theme: 'striped',
                headStyles: { fillColor: [220, 38, 38], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
                bodyStyles: { fontSize: 8 },
                columnStyles: {
                    4: { halign: 'right' },
                    5: { halign: 'center' },
                },
                margin: { left: 14, right: 14 },
            });

            doc.save(`sales_return_report_${new Date().toISOString().split('T')[0]}.pdf`);
        };
    };

    // Filter & Pagination Logic
    const { paginatedReturns, totalPages, paginationInfo } = useMemo(() => {
        // Filter
        let filtered = mockReturns.filter(ret => {
            const search = searchTerm.toLowerCase();
            const matchesSearch = ret.id.toLowerCase().includes(search) || 
                                 ret.customer.toLowerCase().includes(search) ||
                                 ret.invId.toLowerCase().includes(search) ||
                                 (ret.products && ret.products.toLowerCase().includes(search)) ||
                                 (ret.sku && ret.sku.toLowerCase().includes(search));
            
            // Date Filter
            let matchesDate = true;
            if (startDate && endDate) {
                matchesDate = ret.date >= startDate && ret.date <= endDate;
            } else if (startDate) {
                matchesDate = ret.date >= startDate;
            } else if (endDate) {
                matchesDate = ret.date <= endDate;
            }

            return matchesSearch && matchesDate;
        });

        // Pagination
        const totalItems = filtered.length;
        const totalPgs = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedItems = filtered.slice(startIndex, endIndex);

        return {
            paginatedReturns: paginatedItems,
            totalPages: totalPgs,
            paginationInfo: {
                totalItems,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, totalItems),
                currentPage
            }
        };
    }, [mockReturns, searchTerm, startDate, endDate, currentPage, itemsPerPage]);

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
                    <form onSubmit={handleInvoiceSearch} className="flex gap-2 w-full max-w-md relative mt-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                        <input 
                            type="text" 
                            placeholder="e.g. INV-2024-001" 
                            value={invoiceSearch}
                            onChange={(e) => setInvoiceSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none transition-all font-mono uppercase text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                        />
                        <button type="submit" className="px-6 py-3 bg-gray-900 dark:bg-gray-700 text-white font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-600 active:scale-95 transition-all">Fetching</button>
                    </form>
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
                                                    <p className="font-bold text-red-600 dark:text-red-400">₹{(item.price * isSelected.returnQty).toFixed(2)}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
                             <div className="w-full md:w-1/2">
                                 <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block mb-2">Return Reason</label>
                                 <textarea rows="2" placeholder="Reason..." value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"></textarea>
                             </div>
                             <div className="w-full md:w-auto text-right">
                                 <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Total Refund (Inc. Tax)</p>
                                 <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">₹{calculateRefund().toFixed(2)}</h2>
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Sales Returns</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage returns and credit notes.</p>
                </div>
                <div className="flex gap-2">
                     <button 
                        onClick={handleDownloadReport}
                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 font-bold shadow-sm"
                     >
                        <FileText size={16} className="text-red-500" /> Return Report PDF
                    </button>
                    <button 
                        onClick={() => setView('create')}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-md flex items-center gap-2"
                    >
                        <Plus size={18} /> New Return
                    </button>
                </div>
            </div>

            {/* List View */}
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                   <input 
                      type="text" 
                      placeholder="Search Return No, Invoice, Customer, SKU or Medicine..." 
                      value={searchTerm} 
                      onChange={(e) => handleSearchChange(e.target.value)} 
                      className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                    />
                </div>
                
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-1.5 transition-all focus-within:ring-2 focus-within:ring-red-100">
                        <Calendar size={16} className="text-gray-400" />
                        <input 
                            type="date" 
                            value={startDate} 
                            onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }} 
                            className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200" 
                        />
                        <span className="text-gray-400 text-xs font-bold">TO</span>
                        <input 
                            type="date" 
                            value={endDate} 
                            onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }} 
                            className="bg-transparent border-none outline-none text-xs text-gray-700 dark:text-gray-200" 
                        />
                    </div>
                    {(startDate || endDate) && (
                        <button 
                            onClick={() => { setStartDate(''); setEndDate(''); setCurrentPage(1); }}
                            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Clear Dates"
                        >
                            <X size={18} />
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/80 dark:bg-gray-750/80 border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Return ID</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Ref Invoice</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Products & SKU</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Qty</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Refund</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {paginatedReturns.map((ret) => (
                                <tr key={ret.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                            <span className="font-bold text-gray-800 dark:text-gray-100 tracking-tight">{ret.id}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-[11px] font-bold text-gray-600 dark:text-gray-400 font-mono tracking-tighter transition-colors group-hover:bg-gray-200 dark:group-hover:bg-gray-600">
                                            {ret.invId}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-medium">{ret.date}</td>
                                    <td className="px-6 py-5 font-bold text-gray-800 dark:text-gray-200">{ret.customer}</td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-0.5 max-w-[200px]">
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300 truncate">{ret.products}</span>
                                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium tracking-wide uppercase italic">{ret.sku}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center font-bold text-gray-700 dark:text-gray-300">{ret.items}</td>
                                    <td className="px-6 py-5 text-right font-black text-red-600 dark:text-red-400">₹{ret.amount.toFixed(2)}</td>
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
                                                onClick={() => navigate(`/sales/return/view/${ret.id}`)}
                                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20 rounded-xl transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700" 
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => navigate(`/sales/return/view/${ret.id}`)}
                                                className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all shadow-sm hover:shadow-md bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700" 
                                            >
                                                <Printer size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedReturns.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-400 dark:text-gray-500">
                                        No sales returns found matching your search.
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
                            className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-red-100 focus:border-red-500 outline-none"
                          >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                          </select>
                        </div>
                      </div>

                      {/* Page Navigation */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => goToPage(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                          >
                            <ChevronLeft size={18} />
                          </button>

                          <div className="flex items-center gap-1">
                            {/* Page Numbers Logic (Simplified for brevity, can enable full logic if needed) */}
                             {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                <button
                                    key={page}
                                    onClick={() => goToPage(page)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${currentPage === page ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                                >
                                    {page}
                                </button>
                             ))}
                          </div>

                          <button
                            onClick={() => goToPage(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

export default SalesReturn;
