import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, ShoppingCart, User, Plus, Minus, Trash2, ArrowRight, Printer, 
  FileText, CheckCircle, Package, ChevronLeft, ChevronRight, 
  ChevronUp, ChevronDown, XCircle, ShoppingBag, List, LayoutGrid 
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';
import { useInventory } from '../../context/InventoryContext';

const getPackSize = (packingStr) => {
    if (!packingStr) return 1;
    const match = packingStr.toString().match(/(\d+)$/);
    return match ? parseInt(match[0]) : 1;
};

const InventoryStockOut = () => {
    const navigate = useNavigate();
    const { 
        inventory, 
        sellItems, 
        bulkAdjustStock, 
        transactions, 
        deleteTransaction, 
        clearAllTransactions,
        loading: inventoryLoading 
    } = useInventory();

    const [searchTerm, setSearchTerm] = useState('');
    const [activeCategory, setActiveCategory] = useState('All');
    const [cart, setCart] = useState([]);
    const [stockOutReason, setStockOutReason] = useState('Sale');
    const [viewMode, setViewMode] = useState('table');
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [showExtraDetails, setShowExtraDetails] = useState(false);
    const [paymentMode, setPaymentMode] = useState('Cash');

    const [patientDetails, setPatientDetails] = useState({ 
        name: '', 
        phone: '', 
        age: '', 
        gender: 'Male',
        address: '', 
        doctorName: '', 
        doctorAddress: '' 
    });

    const [categories, setCategories] = useState(['All']);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerSearch, setCustomerSearch] = useState('');
    const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

    // Fetch Categories & Customers
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [catRes, custRes] = await Promise.all([
                    api.get('/categories'),
                    api.get('/customers')
                ]);
                if (catRes.data.success) {
                    setCategories(['All', ...catRes.data.categories.map(c => c.name)]);
                }
                if (custRes.data.success) {
                    setCustomers(custRes.data.customers);
                }
            } catch (error) {
                console.error("Error fetching POS data:", error);
            }
        };
        fetchData();
    }, []);

    // FEFO (First Expiring First Out) + FIFO (First In First Out) Sorting
    const sortedInventory = useMemo(() => {
        return [...inventory].sort((a, b) => {
            if (a.name.toLowerCase() === b.name.toLowerCase()) {
                const dateA = new Date(a.exp || '9999-12-31');
                const dateB = new Date(b.exp || '9999-12-31');
                if (dateA - dateB !== 0) return dateA - dateB;
                return a.id - b.id;
            }
            return a.name.localeCompare(b.name);
        });
    }, [inventory]);

    const { filteredInventory, paginatedInventory, totalPages } = useMemo(() => {
        const filtered = sortedInventory.filter(item => {
            const searchLower = searchTerm.toLowerCase().trim();
            const matchesSearch = !searchLower || (
                item.name.toLowerCase().includes(searchLower) ||
                item.sku?.toLowerCase().includes(searchLower) ||
                item.batch?.toLowerCase().includes(searchLower) ||
                item.brand?.toLowerCase().includes(searchLower)
            );
            const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
            return matchesSearch && matchesCategory;
        });

        const totalPgs = Math.ceil(filtered.length / itemsPerPage);
        const start = (currentPage - 1) * itemsPerPage;
        return { 
            filteredInventory: filtered, 
            paginatedInventory: filtered.slice(start, start + itemsPerPage), 
            totalPages: totalPgs 
        };
    }, [sortedInventory, searchTerm, activeCategory, currentPage, itemsPerPage]);

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
        c.phone?.includes(customerSearch)
    );

    const addToCart = (product) => {
        if (product.stock <= 0) {
            Swal.fire({
                icon: 'error',
                title: 'Out of Stock',
                text: 'This item is currently unavailable.',
                toast: true,
                position: 'top-end',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        const existingItem = cart.find(item => item.id === product.id);
        const currentQty = existingItem ? existingItem.qty : 0;
        
        if (currentQty + 1 > product.stock) {
            Swal.fire({
                icon: 'warning',
                title: 'Limit Reached',
                text: `Only ${product.stock} units available.`,
                toast: true,
                position: 'top-end',
                timer: 2000,
                showConfirmButton: false
            });
            return;
        }

        if (existingItem) {
            setCart(cart.map(item => 
                item.id === product.id 
                    ? { ...item, qty: item.qty + 1 } 
                    : item
            ));
        } else {
            setCart([...cart, { ...product, qty: 1, price: product.rate }]);
        }
    };

    const updateQty = (id, delta) => {
        setCart(cart.map(item => {
            if (item.id === id) {
                const newQty = item.qty + delta;
                if (newQty <= 0) return item;
                
                const product = inventory.find(p => p.id === id);
                if (newQty > product.stock) {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Stock Limit',
                        text: `Max ${product.stock} units available.`,
                        toast: true,
                        position: 'top-end',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    return item;
                }
                return { ...item, qty: newQty };
            }
            return item;
        }));
    };

    const printShippingLabel = (sale, details) => {
        const w = window.open('', '_blank');
        w.document.write(`
            <html>
            <head>
                <title>Shipping Label</title>
                <style>
                    body { font-family: sans-serif; padding: 20px; border: 2px solid #000; max-width: 400px; margin: 20px auto; }
                    h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
                    .row { margin: 10px 0; display: flex; justify-content: space-between; }
                    .label { font-weight: bold; }
                    .box { border: 1px solid #333; padding: 10px; margin-top: 20px; text-align: center; font-weight: bold; font-size: 1.2em; }
                    .cold { background: #e0f7fa; color: #006064; padding: 5px; text-align: center; font-weight: bold; margin-bottom: 10px; border: 1px dashed #0097a7; }
                </style>
            </head>
            <body>
                ${details.shipping?.isColdStorage ? '<div class="cold">❄️ COLD STORAGE ITEM ❄️</div>' : ''}
                <h1>SHIPPING LABEL</h1>
                
                <div style="margin-bottom: 20px;">
                    <div class="label">TO:</div>
                    <div>${details.patient.name || sale.customerName}</div>
                    <div>${details.patient.address || (sale.customer && sale.customer.address) || ''}</div>
                    <div>Ph: ${details.patient.phone || details.patient.mobile || (sale.customer && sale.customer.phone) || ''}</div>
                </div>

                <div style="margin-bottom: 20px; text-align: right;">
                    <div class="label">FROM:</div>
                    <div>KS4PharmaNet</div>
                    <div>Main Market, City Center</div>
                    <div>New Delhi - 110001</div>
                </div>

                <div class="row">
                    <span>Type: ${details.stockOutReason || 'Stock Out'}</span>
                    <span>Inv #: ${sale.invoiceNumber || sale.id?.slice(-6).toUpperCase()}</span>
                </div>
                
                <div class="box">
                   Contents Checked & Verified
                </div>

                <script>window.print();</script>
            </body>
            </html>
        `);
        w.document.close();
    };

    const removeFromCart = (id) => {
        setCart(cart.filter(item => item.id !== id));
    };

    const calculateTotal = () => {
        return cart.reduce((total, item) => total + (item.price * item.qty), 0);
    };

    const handleQuickAddCustomer = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Quick Add Customer',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Full Name" value="${customerSearch}">
                <input id="swal-phone" class="swal2-input" placeholder="Phone Number">
                <input id="swal-address" class="swal2-input" placeholder="Address (Optional)">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Add Customer',
            confirmButtonColor: '#007242',
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const phone = document.getElementById('swal-phone').value;
                const address = document.getElementById('swal-address').value;
                if (!name || !phone) {
                    Swal.showValidationMessage('Name and Phone are required');
                    return false;
                }
                return { name, phone, address };
            }
        });

        if (formValues) {
            try {
                Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });
                const { data } = await api.post('/customers', formValues);
                if (data.success) {
                    setCustomers([...customers, data.customer]);
                    setSelectedCustomer(data.customer);
                    setCustomerSearch(data.customer.name);
                    setShowCustomerDropdown(false);
                    Swal.fire('Success', 'Customer added and selected.', 'success');
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to add customer', 'error');
            }
        }
    };

    const handleCheckout = () => {
        if (cart.length === 0) {
            Swal.fire('Empty Cart', 'Please add medicines to process.', 'info');
            return;
        }
        
        const typeLabel = stockOutReason === 'Sale' ? 'Sale' : 'Stock Out';
        
        Swal.fire({
            title: `Confirm ${typeLabel}?`,
            html: `
                <div class="text-left font-sans space-y-2 p-2">
                    <p className="text-gray-500 uppercase text-[10px] font-bold">Reason: <b className="text-gray-800">${stockOutReason}</b></p>
                    <p className="text-gray-500 uppercase text-[10px] font-bold">Total Items: <b className="text-gray-800">${cart.length}</b></p>
                    <p className="text-gray-500 uppercase text-[10px] font-bold pt-2 border-t">Grand Total: <b className="text-primary text-lg">₹${calculateTotal().toFixed(2)}</b></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Process & Finalize',
            confirmButtonColor: '#007242',
        }).then(async (result) => {
            if (result.isConfirmed) {
                let result;
                if (stockOutReason === 'Sale') {
                    const soldItems = cart.map(item => ({ id: item.id, qty: item.qty }));
                    result = await sellItems(soldItems, { 
                        customer: selectedCustomer || (customerSearch ? { name: customerSearch } : 'Walk-in'), 
                        patientDetails,
                        paymentMode,
                        totalAmount: calculateTotal(),
                        subTotal: calculateTotal(),
                        tax: 0
                    });
                } else {
                    result = await bulkAdjustStock(cart, 'deduct', stockOutReason, `Manual Stock Out: ${selectedCustomer?.name || customerSearch || 'N/A'}`);
                }
                
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Stock Updated!',
                        text: 'Record has been processed successfully.',
                        showCancelButton: true,
                        confirmButtonText: 'View Document',
                        cancelButtonText: 'Done',
                        confirmButtonColor: '#007242'
                    }).then((navResult) => {
                        if (navResult.isConfirmed) {
                            if (stockOutReason === 'Sale' && result.saleId) {
                                navigate(`/sales/invoices/view/${result.saleId}`);
                            } else if (result.logId) {
                                navigate(`/inventory/stock-out/view/${result.logId}`);
                            }
                        }
                    });

                    // Auto Print Label
                    if (result.sale || result.data) {
                        printShippingLabel(result.sale || result.data, { patient: patientDetails, stockOutReason });
                    }

                    setCart([]);
                    setSelectedCustomer(null);
                    setCustomerSearch('');
                } else {
                    Swal.fire('Error', result.message, 'error');
                }
            }
        });
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) setCurrentPage(page);
    };

    // Pagination for History
    const [historyPage, setHistoryPage] = useState(1);
    const historyPerPage = 5;
    const stockOutTransactions = transactions
        .filter(t => t.type === 'OUT')
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const historyTotalPages = Math.ceil(stockOutTransactions.length / historyPerPage);
    const paginatedTransactions = stockOutTransactions.slice(
        (historyPage - 1) * historyPerPage, 
        historyPage * historyPerPage
    );

    return (
        <div className="flex flex-col gap-6 p-2 lg:p-6 bg-gray-50/50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100 font-sans">
            
            {/* Top Section: Catalog */}
            <div className="flex flex-col gap-5 w-full">
                <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-2 items-center shrink-0">
                    <div className="relative w-full md:w-72 lg:w-80 group shrink-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Scan or Search Stock..." 
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                        />
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                            <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}><LayoutGrid size={14}/></button>
                            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-500'}`}><List size={14}/></button>
                        </div>
                        <select 
                            value={itemsPerPage} 
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="bg-gray-100 dark:bg-gray-700 text-xs font-bold px-3 py-2 rounded-xl border-none outline-none"
                        >
                            <option value={10}>10 Rows</option>
                            <option value={20}>20 Rows</option>
                            <option value={50}>50 Rows</option>
                        </select>
                    </div>

                    <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block mx-1"></div>

                    <div className="flex-1 overflow-x-auto no-scrollbar">
                        <div className="flex gap-1">
                            {categories.map(cat => (
                                <button key={cat} onClick={() => { setActiveCategory(cat); setCurrentPage(1); }} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-primary text-white shadow-md shadow-primary/30' : 'text-gray-500 hover:bg-white dark:hover:bg-gray-700'}`}>{cat}</button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full">
                    {inventoryLoading ? (
                        <div className="h-64 flex flex-col items-center justify-center text-gray-400"><div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent mb-4"></div><p className="font-medium">Loading Inventory...</p></div>
                    ) : (
                        <div className="flex flex-col gap-6">
                            {viewMode === 'grid' ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                                    {paginatedInventory.map((item) => (
                                        <div key={item.id} onClick={() => item.stock > 0 && addToCart(item)} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl ${item.stock === 0 ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer'}`}>
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{item.stock} in stock</span>
                                                <Plus size={16} className="text-gray-300" />
                                            </div>
                                            <h3 className="font-bold text-sm truncate uppercase tracking-tight">{item.name}</h3>
                                            <p className="text-[10px] text-primary font-black uppercase mt-1 leading-none">{item.brand || 'Generic'}</p>
                                            <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 flex justify-between items-center">
                                                <span className="text-xs font-bold text-gray-500">₹{item.rate}</span>
                                                <span className="text-[9px] text-gray-400 font-mono italic">{item.batch}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Description</th>
                                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Metadata</th>
                                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest">Pricing</th>
                                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">In-Stock</th>
                                                    <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                                {paginatedInventory.map((item) => (
                                                    <tr key={item.id} onClick={() => item.stock > 0 && addToCart(item)} className="hover:bg-primary/5 transition-colors cursor-pointer group">
                                                        <td className="px-4 py-3.5">
                                                            <p className="font-bold text-sm uppercase">{item.name}</p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[10px] text-primary font-black uppercase bg-primary/5 px-1.5 py-0.5 rounded">{item.brand || 'Generic'}</span>
                                                                <span className="text-[10px] text-gray-400 font-bold uppercase">{item.sku || 'No SKU'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className="text-xs font-bold text-gray-600 dark:text-gray-300">B: <span className="text-gray-400">{item.batch || 'N/A'}</span></p>
                                                            <p className="text-[10px] text-gray-400 uppercase font-black">EXP: {item.exp ? new Date(item.exp).toLocaleDateString('en-IN', {month: 'short', year: 'numeric'}) : 'N/A'}</p>
                                                        </td>
                                                        <td className="px-4 py-3.5">
                                                            <p className="font-black text-gray-900 dark:text-white text-sm">₹{item.rate}</p>
                                                            <p className="text-[9px] text-gray-400 font-bold uppercase">MRP: ₹{item.mrp || item.rate}</p>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center px-6">
                                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase tracking-tighter ${item.stock > 20 ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>{item.stock} Units</span>
                                                        </td>
                                                        <td className="px-4 py-3.5 text-center">
                                                            <button className="p-2.5 bg-gray-900 dark:bg-primary text-white rounded-xl shadow-lg shadow-gray-200/50 dark:shadow-primary/20 hover:scale-110 active:scale-95 transition-all"><Plus size={16} strokeWidth={3}/></button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                            {filteredInventory.length > itemsPerPage && (
                                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> - <span className="text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span> of <span className="text-gray-900 dark:text-white">{filteredInventory.length}</span></p>
                                    <div className="flex gap-2">
                                        <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="p-2 border rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"><ChevronLeft size={16}/></button>
                                        <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="p-2 border rounded-xl disabled:opacity-30 hover:bg-gray-50 transition-all"><ChevronRight size={16}/></button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Bottom Section: Workflow Hub */}
            <div className="w-full bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden flex flex-col lg:flex-row min-h-[450px]">
                
                {/* Cart Section */}
                <div className="flex-1 border-r border-gray-100 dark:border-gray-700 flex flex-col">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-black flex items-center gap-2 italic tracking-tight"><ShoppingBag className="text-primary"/> BUCKET LIST</h2>
                            <select 
                                value={stockOutReason}
                                onChange={(e) => setStockOutReason(e.target.value)}
                                className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-xl text-xs font-black uppercase border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            >
                                <option value="Sale">Retail Sale</option>
                                <option value="Internal Use">Hospital Use</option>
                                <option value="Damaged">Waste/Damaged</option>
                                <option value="Expired">Expiry Disposal</option>
                                <option value="Adjustment">Adjustment (-)</option>
                            </select>
                        </div>

                        {/* Customer Search (Only if Sale) */}
                        <div className="relative group">
                            <div className="bg-gray-50 dark:bg-gray-750 rounded-2xl p-1 flex items-center border border-gray-200 dark:border-gray-600 focus-within:border-primary transition-all shadow-inner">
                                <div className="p-2.5 text-gray-400"><User size={20} /></div>
                                <input 
                                    type="text" 
                                    placeholder="Reference Customer Name / Patient / Phone..." 
                                    value={customerSearch}
                                    onFocus={() => setShowCustomerDropdown(true)}
                                    onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); setShowCustomerDropdown(true); }}
                                    className="bg-transparent w-full text-sm outline-none font-bold placeholder:font-medium placeholder:text-gray-400" 
                                />
                                {selectedCustomer && <button onClick={() => {setSelectedCustomer(null); setCustomerSearch('');}} className="p-2 text-gray-300 hover:text-red-500"><XCircle size={18}/></button>}
                            </div>
                            
                            {showCustomerDropdown && customerSearch.trim().length > 0 && !selectedCustomer && (
                                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl z-[100] max-h-60 overflow-y-auto p-2 space-y-1">
                                    {filteredCustomers.length > 0 ? (
                                        filteredCustomers.map(c => (
                                            <div key={c._id} onClick={() => { setSelectedCustomer(c); setCustomerSearch(c.name); setShowCustomerDropdown(false); }} className="p-3 hover:bg-primary/5 rounded-xl cursor-pointer border-b border-gray-50 dark:border-gray-700 last:border-0 group">
                                                <p className="font-black text-sm group-hover:text-primary transition-colors">{c.name}</p>
                                                <p className="text-xs text-gray-400">{c.phone}</p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center">
                                            <p className="text-xs text-gray-500">Not found. Record as: <span className="font-bold text-gray-800">"{customerSearch}"</span></p>
                                            <button onClick={handleQuickAddCustomer} className="mt-3 text-xs font-black text-primary uppercase tracking-widest border border-primary/20 px-4 py-2 rounded-xl hover:bg-primary hover:text-white transition-all">+ Add New Record</button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Detail Toggle */}
                        <div className="border-t border-dashed border-gray-100 dark:border-gray-700 pt-3">
                            <button onClick={() => setShowExtraDetails(!showExtraDetails)} className="w-full text-[10px] font-black uppercase text-gray-400 flex items-center justify-between hover:text-primary transition-all bg-gray-50 dark:bg-gray-700/50 p-2 rounded-xl">
                                <span>{showExtraDetails ? 'Compact View' : 'Additional Metadata (Patient/Doc)'}</span>
                                {showExtraDetails ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                            </button>
                            {showExtraDetails && (
                                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Patient Age</label>
                                        <input value={patientDetails.age} onChange={e => setPatientDetails({...patientDetails, age: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs outline-none" placeholder="Years" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Gender</label>
                                        <select value={patientDetails.gender} onChange={e => setPatientDetails({...patientDetails, gender: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs outline-none">
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Kids">Kids</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase">Doctor Ref</label>
                                        <input value={patientDetails.doctorName} onChange={e => setPatientDetails({...patientDetails, doctorName: e.target.value})} className="w-full p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-xs outline-none" placeholder="Dr. Name" />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
                        {cart.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-gray-300 gap-2 min-h-[300px]">
                                <ShoppingCart size={48} className="opacity-20 animate-pulse" />
                                <p className="font-black uppercase tracking-widest text-xs">Bucket is Empty</p>
                                <p className="text-[10px] uppercase font-bold text-gray-400">Scan items to fill the list</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="sticky top-0 bg-white dark:bg-gray-800 shadow-sm z-10">
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400">Item Description</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Qty Adjustment</th>
                                        <th className="px-6 py-4 text-[10px] font-black uppercase text-gray-400 text-right">Line Total</th>
                                        <th className="px-6 py-4"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                    {cart.map(item => (
                                        <tr key={item.id} className="group hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="font-bold text-xs uppercase text-gray-800 dark:text-white">{item.name}</p>
                                                <p className="text-[10px] text-gray-400 font-mono mt-0.5">{item.batch} • {item.exp || 'N/A'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-center items-center gap-2">
                                                    <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-primary hover:text-white transition-all"><Minus size={12} strokeWidth={4}/></button>
                                                    <span className="text-xs font-black min-w-[24px] text-center">{item.qty}</span>
                                                    <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-primary hover:text-white transition-all"><Plus size={12} strokeWidth={4}/></button>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-black text-gray-900 dark:text-white">₹{(item.price * item.qty).toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button onClick={() => removeFromCart(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Summary Section */}
                <div className="w-full lg:w-[400px] bg-gray-50/30 dark:bg-gray-900/10 p-8 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-gray-100 dark:border-gray-700">
                    <div className="space-y-6">
                        <h3 className="text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-l-4 border-primary pl-3">Checkout Hub</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>UNITS SUB TOTAL</span>
                                <span>₹{calculateTotal().toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm font-bold text-gray-500">
                                <span>TAX ESTIMATE (0%)</span>
                                <span>₹0.00</span>
                            </div>
                            <div className="pt-6 border-t border-dashed border-gray-200 dark:border-gray-700 flex justify-between items-end">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Grand Total</span>
                                <span className="text-4xl font-black text-primary drop-shadow-md">₹{calculateTotal().toFixed(2)}</span>
                            </div>
                        </div>

                        {stockOutReason === 'Sale' && (
                            <div className="pt-6 grid grid-cols-2 gap-3">
                                {['Cash', 'UPI', 'Card', 'Credit'].map(mode => (
                                    <button key={mode} onClick={() => setPaymentMode(mode)} className={`py-3 rounded-2xl border-2 text-[11px] font-black uppercase transition-all ${paymentMode === mode ? 'bg-primary/5 border-primary text-primary shadow-sm' : 'border-gray-100 dark:border-gray-700 text-gray-400 hover:border-gray-200'}`}>{mode}</button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-10 flex gap-4">
                        <button 
                            onClick={() => { setCart([]); setSelectedCustomer(null); setCustomerSearch(''); }} 
                            disabled={cart.length === 0} 
                            className="px-5 py-4 bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400 rounded-2xl hover:bg-red-100 transition-all disabled:opacity-30 disabled:cursor-not-allowed border border-red-100 dark:border-red-900/30 shadow-sm"
                            title="Purge Bucket"
                        >
                            <Trash2 size={24}/>
                        </button>
                        <button 
                            onClick={handleCheckout} 
                            disabled={cart.length === 0} 
                            className="flex-1 py-4 bg-gray-900 dark:bg-primary text-white text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-gray-400/20 dark:shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
                        >
                            <CheckCircle size={20}/>
                            <span>Finalize & Sync</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* History Section */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden mt-6 mb-12">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-gray-700/50">
                    <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2 italic tracking-tighter uppercase text-sm">
                        <FileText size={18} className="text-primary" /> Audit Trail - Stock Out History
                    </h3>
                    
                    <div className="flex items-center gap-3">
                        {transactions.length > 0 && (
                            <button 
                                onClick={() => {
                                    Swal.fire({
                                        title: 'Clear History?',
                                        text: "This will restore stock levels for ALL entries!",
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonText: 'Clear Audit Trail',
                                        confirmButtonColor: '#d33'
                                    }).then(r => r.isConfirmed && clearAllTransactions());
                                }}
                                className="text-[10px] font-black uppercase text-red-500 hover:underline tracking-widest mr-2"
                            >Clear All</button>
                        )}
                        <div className="flex items-center bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl p-1 shadow-sm">
                            <button onClick={() => setHistoryPage(p => Math.max(1, p-1))} disabled={historyPage === 1} className="p-2 disabled:opacity-30"><ChevronLeft size={16}/></button>
                            <span className="text-[10px] font-black px-3 border-x dark:border-gray-700">{historyPage} / {historyTotalPages || 1}</span>
                            <button onClick={() => setHistoryPage(p => Math.min(historyTotalPages, p+1))} disabled={historyPage >= historyTotalPages} className="p-2 disabled:opacity-30"><ChevronRight size={16}/></button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/30 dark:bg-gray-700/30 text-[10px] uppercase font-black tracking-widest text-gray-400 border-b dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4">Timeline</th>
                                <th className="px-6 py-4">Reason & Lead</th>
                                <th className="px-6 py-4">Items Summary</th>
                                <th className="px-6 py-4 text-center">Qty</th>
                                <th className="px-6 py-4 text-right">Value</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {paginatedTransactions.map(tx => (
                                <tr key={tx.id} className="hover:bg-primary/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-bold text-gray-800 dark:text-white text-xs">{new Date(tx.date).toLocaleDateString()}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(tx.date).toLocaleTimeString()}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-700 text-[9px] font-black uppercase text-gray-600 dark:text-gray-400 shadow-sm">{tx.reason || 'Manual'}</span>
                                        <p className="text-[10px] font-bold text-gray-400 mt-2 truncate w-32 tracking-tighter">{tx.paymentMode ? `[${tx.paymentMode}] ` : ''}{tx.customerName || 'N/A'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            {tx.items.slice(0, 2).map((item, i) => (
                                                <div key={i} className="text-[10px] text-gray-600 dark:text-gray-400 flex items-center gap-1.5 uppercase font-bold">
                                                    <span className="text-gray-900 dark:text-white">{item.name}</span>
                                                    <span className="text-gray-300">|</span>
                                                    <span className="text-primary">x{item.qty}</span>
                                                </div>
                                            ))}
                                            {tx.items.length > 2 && <p className="text-[9px] text-gray-400 italic font-medium">+ {tx.items.length - 2} more items</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-black text-gray-800 dark:text-white text-xs">{tx.totalQty}</td>
                                    <td className="px-6 py-4 text-right font-black text-primary text-xs">₹{tx.items.reduce((sum, i) => sum + (i.qty * (i.price || i.rate || 0)), 0).toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <button onClick={() => navigate(tx.reason === 'Sale' ? `/sales/invoices/view/${tx.id}` : `/inventory/stock-out/view/${tx.id}`)} className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-primary rounded-xl transition-all shadow-sm"><Printer size={14}/></button>
                                            <button onClick={() => Swal.fire({ title: 'Undo Transfer?', text: "Restore stock levels for this entry?", icon: 'warning', showCancelButton: true, confirmButtonText: 'Undo Transfer', confirmButtonColor: '#d33' }).then(r => r.isConfirmed && deleteTransaction(tx.id))} className="p-2 bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-xl transition-all shadow-sm"><Trash2 size={14}/></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default InventoryStockOut;
