import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Save, X, Plus, Trash2, Calendar, 
    FileText, Search, Package, 
    ArrowLeft, ShoppingCart, AlertCircle, Clock, Truck,
    Download, Upload
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

const CreatePurchaseOrder = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('id');
    const [loading, setLoading] = useState(false);
    
    // Data States
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [requisitions, setRequisitions] = useState({ lowStock: [], expiryNear: [] });
    
    // Form State
    const [formData, setFormData] = useState({
        poDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        notes: ''
    });

    const [items, setItems] = useState([]);
    
    // Product Search
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(0);

{/* Totals State Removed */}

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
        fetchRequisitions();
        
        if (orderId) {
            fetchOrderDetails(orderId);
        }
    }, [orderId]);

    const fetchOrderDetails = async (id) => {
        try {
            setLoading(true);
            const { data } = await api.get(`/purchase-orders/${id}`);
            const order = data; 
            
            setFormData({
                poDate: new Date(order.createdAt).toISOString().split('T')[0], 
                expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
                notes: order.notes || ''
            });

            // Map items
            const mappedItems = order.items.map(item => ({
                product: item.product._id || item.product, 
                medicineName: item.product.name || item.medicineName || 'Unknown Product', 
                supplierId: order.supplierId, // Existing orders are single supplier
                quantity: item.quantity,
                purchaseRate: item.purchaseRate,
                gst: item.gst || 0,
                totalAmount: item.totalAmount
            }));
            setItems(mappedItems);

        } catch (error) {
            console.error("Failed to fetch order", error);
            Swal.fire('Error', 'Failed to load order details', 'error');
            navigate('/purchase/orders');
        } finally {
            setLoading(false);
        }
    };

{/* Totals Effect Removed */}

    const fetchSuppliers = async () => {
        try {
            const { data } = await api.get('/suppliers');
            if (data.success) setSuppliers(data.suppliers);
        } catch (error) {
            console.error("Failed to fetch suppliers");
        }
    };

    const fetchProducts = async () => {
        try {
            const { data } = await api.get('/products');
            if (data.success) setProducts(data.products);
        } catch (error) {
            console.error("Failed to fetch products");
        }
    };

    const fetchRequisitions = async () => {
        try {
            const { data } = await api.get('/purchase-orders/requisitions');
            setRequisitions(data);
        } catch (error) {
            console.error("Failed to fetch requisitions");
        }
    };

    const handleProductSearch = (value) => {
        setProductSearch(value);
        if (value.length > 0) {
            const results = products.filter(p => 
                p.name.toLowerCase().includes(value.toLowerCase()) ||
                p.sku?.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(results);
            setShowResults(true);
            setHighlightedIndex(0);
        } else {
            setShowResults(false);
        }
    };

    const handleSearchKeyDown = (e) => {
        if (!showResults || searchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev + 1) % searchResults.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => (prev - 1 + searchResults.length) % searchResults.length);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            addItem(searchResults[highlightedIndex]);
        }
    };

    // Auto-select supplier logic: 
    // 1. Try to find last used supplier for this product? (Not implemented)
    // 2. Default to first available supplier.
    const addItem = (product, quantity = 1, rate = 0) => {
        const existingIndex = items.findIndex(item => item.product === product._id);
        const purchaseRate = rate || product.purchasePrice || 0;
        const gst = product.tax || 0;

        if (existingIndex >= 0) {
            const updatedItems = [...items];
            const item = updatedItems[existingIndex];
            item.quantity += quantity;
            item.totalAmount = (item.quantity * item.purchaseRate) * (1 + item.gst/100);
            
            setItems(updatedItems);
            
            Swal.fire({
                icon: 'info',
                title: 'Updated Quantity',
                text: `${product.name} quantity increased.`,
                timer: 1000,
                showConfirmButton: false,
                toast: true,
                position: 'bottom-end'
            });
        } else {
            const newItem = {
                product: product._id,
                medicineName: product.name,
                supplierId: suppliers.length > 0 ? suppliers[0]._id : '', 
                quantity: quantity,
                purchaseRate: purchaseRate,
                gst: gst,
                totalAmount: (quantity * purchaseRate) * (1 + gst/100) 
            };
            setItems([...items, newItem]);
        }
        setProductSearch('');
        setShowResults(false);
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        
        if (field === 'quantity' || field === 'purchaseRate' || field === 'gst') {
             const item = updatedItems[index];
             item.totalAmount = (item.quantity * item.purchaseRate) * (1 + item.gst/100);
        }
        
        setItems(updatedItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

{/* calculateTotals Function Removed */}

    const handleSubmit = async (status = 'Draft') => {
        if (items.length === 0) {
            Swal.fire('Error', 'Please add items to the order', 'error');
            return;
        }

        // Validate Suppliers
        const missingSupplier = items.some(i => !i.supplierId);
        if (missingSupplier) {
            Swal.fire('Error', 'Please select a supplier for all items', 'error');
            return;
        }

        try {
            setLoading(true);

            // Determine Header Supplier Info
            // If all items have same supplier, use that. Otherwise 'Multiple Suppliers'.
            const uniqueSupplierIds = [...new Set(items.map(i => i.supplierId).filter(id => id))];
            let headerSupplierId = null;
            let headerSupplierName = 'Multiple Suppliers';

            if (uniqueSupplierIds.length === 1) {
                headerSupplierId = uniqueSupplierIds[0];
                const supplier = suppliers.find(s => s._id === headerSupplierId);
                headerSupplierName = supplier?.name || 'Unknown Supplier';
            }

            // Calculate total (just for backend validation)
            const totalAmount = items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

            // Prepare Items with Supplier Info
            const payloadItems = items.map(item => ({
                product: item.product,
                medicineName: item.medicineName,
                quantity: item.quantity,
                purchaseRate: item.purchaseRate,
                gst: item.gst,
                totalAmount: item.totalAmount,
                supplier: item.supplierId // sending supplier ID per item
            }));

            const payload = {
                supplierId: headerSupplierId, // Can be null if multiple
                supplierName: headerSupplierName,
                items: payloadItems,
                totalAmount: totalAmount,
                gstAmount: 0,
                subTotal: 0,
                poDate: formData.poDate,
                expectedDeliveryDate: formData.expectedDeliveryDate || null,
                notes: formData.notes,
                status
            };

            const response = await api.post('/purchase-orders/create', payload);
            const data = response.data;
            
            // Flexible Success Check
            if (data.success || data.poNumber || data._id || data.order) {
                const poNumber = data.poNumber || data.order?.poNumber || "New Order";
                const orderId = data._id || data.order?._id;
                
                Swal.fire({
                    title: 'Success!',
                    text: data.message || `Purchase Order Created: ${poNumber}`,
                    icon: 'success',
                    showConfirmButton: false,
                    timer: 1500
                }).then(() => {
                    if (orderId) {
                        navigate(`/purchase/orders/view/${orderId}`);
                    } else {
                        navigate('/purchase/orders');
                    }
                });
            } else {
                 throw new Error("Invalid response from server");
            }
            
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create Purchase Orders';
            Swal.fire({
                title: 'Error',
                text: errMsg,
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // CSV Functions
    const handleDownloadSample = () => {
        const csvContent = "data:text/csv;charset=utf-8," + "Product Name,SKU,Quantity,Supplier Name\nParacetamol,PARA123,100,Sun Pharma\nCrocin,CROC456,50,";
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "purchase_order_sample.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                const importedItems = [];
                let matchCount = 0;
                let noMatchCount = 0;

                results.data.forEach(row => {
                    const name = row['Product Name'] || row['Item Name'];
                    const sku = row['SKU'];
                    const qty = parseInt(row['Quantity']) || 1;
                    const supplierName = row['Supplier Name'] || '';

                    // Find Product Match
                    const product = products.find(p => 
                        (name && p.name.toLowerCase() === name.toLowerCase()) || 
                        (sku && p.sku && p.sku.toLowerCase() === sku.toLowerCase())
                    );

                    if (product) {
                        // Find Supplier Match (by exact name)
                        const supplier = suppliers.find(s => s.name.toLowerCase() === supplierName.toLowerCase());
                        
                        // Check if already in items
                        const existing = items.find(i => i.product === product._id);
                        if (!existing) {
                            importedItems.push({
                                product: product._id,
                                medicineName: product.name,
                                supplierId: supplier ? supplier._id : '', // Pre-fill if matched
                                quantity: qty,
                                purchaseRate: product.purchasePrice || 0,
                                gst: product.tax || 0,
                                totalAmount: (qty * (product.purchasePrice || 0)) * (1 + (product.tax || 0)/100)
                            });
                            matchCount++;
                        }
                    } else {
                        noMatchCount++;
                    }
                });

                if (importedItems.length > 0) {
                    setItems(prev => [...prev, ...importedItems]);
                    Swal.fire({
                        title: 'Import Successful',
                        text: `Imported ${matchCount} items. ${noMatchCount > 0 ? `${noMatchCount} items skipped (not found).` : ''}`,
                        icon: 'success'
                    });
                } else {
                     Swal.fire({
                        title: 'No Items Imported',
                        text: 'No matching products found in CSV.',
                        icon: 'warning'
                    });
                }
                
                // Reset file input
                e.target.value = '';
            },
            error: (err) => {
                Swal.fire('Error', 'Failed to parse CSV file', 'error');
            }
        });
    };

    // Quick Add Supplier Helper (Same as before)
    const handleQuickAddSupplier = async () => {
         const { value: formValues } = await Swal.fire({
            title: 'Add New Supplier',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Name *" style="margin-bottom: 10px;">
                <input id="swal-phone" class="swal2-input" placeholder="Phone *" style="margin-bottom: 10px;">
                <input id="swal-city" class="swal2-input" placeholder="City (Optional)">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Add Supplier',
            confirmButtonColor: '#007242',
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const phone = document.getElementById('swal-phone').value;
                const city = document.getElementById('swal-city').value;
                if (!name || !phone) {
                    Swal.showValidationMessage('Name and Phone are required');
                    return false;
                }
                return { name, phone, city };
            }
        });

        if (formValues) {
            try {
                Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });
                const { data } = await api.post('/suppliers', formValues);
                if (data.success) {
                    const newSupplier = data.supplier || { ...formValues, _id: data.supplierId }; 
                    setSuppliers(prev => [...prev, newSupplier]);
                    Swal.fire({ icon: 'success', title: 'Supplier Added', timer: 1500, showConfirmButton: false });
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <ShoppingCart className="text-primary" size={32} />
                        {orderId ? 'View / Edit Purchase Order' : 'Create Purchase Order'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">{orderId ? 'View or modify existing details.' : 'Multi-supplier ordering system.'}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                    <button 
                         onClick={handleDownloadSample}
                         className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold transition-all shadow-sm"
                         title="Download CSV Template"
                    >
                        <Download size={18} /> Sample CSV
                    </button>
                    <label className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 text-sm font-bold cursor-pointer transition-all shadow-sm">
                        <Upload size={18} /> Import CSV
                        <input type="file" accept=".csv" className="hidden" onChange={handleCSVUpload} />
                    </label>
                    <button
                        onClick={() => navigate('/purchase/orders')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 font-bold shadow-sm"
                    >
                        <ArrowLeft size={18} /> Back
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Left Column: Requisitions & Search */}
                <div className="xl:col-span-1 space-y-6">
                    {/* Search Product */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Add Item</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => handleProductSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                                placeholder="Search products (Enter to Select)..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                            />
                             {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                                    {searchResults.map((p, idx) => (
                                        <div
                                            key={p._id}
                                            onClick={() => addItem(p)}
                                            className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${idx === highlightedIndex ? 'bg-primary/10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{p.name}</p>
                                            <div className="flex justify-between mt-1">
                                                <span className="text-xs text-gray-500">Stock: {p.quantity}</span>
                                                <span className="text-xs font-bold text-emerald-600">₹{p.purchasePrice}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Requisitions List */}
                    <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 max-h-[600px] overflow-y-auto custom-scrollbar">
                        <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <AlertCircle size={14} className="text-orange-500"/>
                            System Suggestions
                        </h3>
                        
                        {requisitions.lowStock.length === 0 && requisitions.expiryNear.length === 0 && (
                            <div className="text-center py-8 text-gray-400 text-sm">
                                No suggestions available.
                            </div>
                        )}

                        {requisitions.lowStock.length > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-red-500 mb-3 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg inline-block">Low Stock ({requisitions.lowStock.length})</h4>
                                <div className="space-y-3">
                                    {requisitions.lowStock.map(p => (
                                        <div key={p._id} className="p-3 border border-red-100 dark:border-gray-700 bg-red-50/30 dark:bg-gray-800 rounded-xl hover:shadow-md transition-all group">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.name}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">Current: {p.quantity} | Min: {p.reorderLevel}</p>
                                                </div>
                                                <button 
                                                    onClick={() => addItem(p, p.suggestedOrder, p.purchasePrice)}
                                                    className="p-1.5 bg-white dark:bg-gray-700 text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors"
                                                    title="Add Suggested Qty"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                            <div className="mt-2 text-xs font-medium text-emerald-600 flex items-center gap-1">
                                                <span>Suggested: {p.suggestedOrder}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: PO Form & Items */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Step 2 Details Form */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Supplier Removal - Now global fields only */}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PO Date</label>
                                <input 
                                    type="date"
                                    value={formData.poDate}
                                    onChange={(e) => setFormData({...formData, poDate: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Expected Delivery</label>
                                <input 
                                    type="date"
                                    value={formData.expectedDeliveryDate}
                                    onChange={(e) => setFormData({...formData, expectedDeliveryDate: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">PO Number</label>
                                <input 
                                    type="text"
                                    value={orderId ? "Loaded from ID" : "Auto Generated (Per Supplier)"}
                                    disabled
                                    className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-800 border-none rounded-xl text-sm font-bold text-gray-400 cursor-not-allowed"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Step 3 Items Table */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-750 flex justify-between items-center">
                            <h3 className="font-black text-gray-800 dark:text-white flex items-center gap-2">
                                <Package size={20} className="text-primary"/>
                                Order Items
                            </h3>
                            <span className="text-xs font-bold bg-gray-200 dark:bg-gray-700 px-2 py-1 rounded-lg text-gray-600 dark:text-gray-300">{items.length} Items</span>
                        </div>
                        <div className="overflow-visible min-h-[300px]">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Medicine Name</th>
                                        <th className="px-6 py-4 w-64">Supplier</th>
                                        <th className="px-6 py-4 w-32 text-center">Qty</th>
                                        <th className="px-6 py-4 text-center w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="4" className="px-6 py-12 text-center text-gray-400">
                                                <div className="flex flex-col items-center gap-3">
                                                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                                                        <Package size={24} className="opacity-50" />
                                                    </div>
                                                    <p className="font-medium">No items added yet. Search or use suggestions.</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                                                <td className="px-6 py-4 font-bold text-gray-800 dark:text-white">
                                                    {item.medicineName}
                                                </td>
                                                <td className="px-6 py-4">
                                                     <div className="flex gap-2">
                                                        <select 
                                                            value={item.supplierId}
                                                            onChange={(e) => updateItem(index, 'supplierId', e.target.value)}
                                                            className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-primary text-sm font-medium"
                                                        >
                                                            <option value="">Select Supplier</option>
                                                            {suppliers.map(s => (
                                                                <option key={s._id} value={s._id}>{s.name}</option>
                                                            ))}
                                                        </select>
                                                        <button 
                                                            onClick={handleQuickAddSupplier}
                                                            className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
                                                            title="Add Supplier"
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="w-24 px-3 py-2 mx-auto bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-primary text-center font-bold"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <button 
                                                        onClick={() => removeItem(index)}
                                                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Footer / Summary */}
                    <div className="flex flex-col lg:flex-row gap-6 justify-end items-end">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-full lg:w-96">
                             
                             <div className="flex flex-col gap-3">
                                <button 
                                    onClick={() => handleSubmit('Draft')}
                                    disabled={loading}
                                    className="w-full py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                                >
                                    Save as Draft
                                </button>
                                <button 
                                    onClick={() => handleSubmit('Sent to Supplier')}
                                    disabled={loading}
                                    className="w-full py-3 bg-primary text-white font-bold rounded-xl hover:bg-secondary shadow-lg shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {loading ? 'Processing...' : (
                                        <>
                                            <Truck size={20} /> Process Items
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreatePurchaseOrder;
