import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
    Save, X, Plus, Trash2, Calendar, 
    FileText, Search, Package, 
    ArrowLeft, ShoppingCart, AlertCircle, Clock
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

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
        supplierId: '',
        poDate: new Date().toISOString().split('T')[0],
        expectedDeliveryDate: '',
        notes: ''
    });

    const [items, setItems] = useState([]);
    
    // Product Search
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);

    // Totals
    const [totals, setTotals] = useState({
        subTotal: 0,
        taxAmount: 0,
        grandTotal: 0
    });

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
            // Data structure depends on API: { success: true, order: {...} } or just {...}
            // Based on orderController, it returns { order: ... }?
            // Wait, purchaseOrderController: res.status(200).json(order); - It returns the order object directly!
            const order = data; 
            
            setFormData({
                supplierId: order.supplierId,
                poDate: new Date(order.createdAt).toISOString().split('T')[0], // or order.poDate if exists
                expectedDeliveryDate: order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toISOString().split('T')[0] : '',
                notes: order.notes || ''
            });

            // Map items
            const mappedItems = order.items.map(item => ({
                product: item.product._id || item.product, // Handle populated or not
                medicineName: item.product.name || item.medicineName || 'Unknown Product', // Fallback
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

    useEffect(() => {
        calculateTotals();
    }, [items]);

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
        if (value.length > 1) {
            const results = products.filter(p => 
                p.name.toLowerCase().includes(value.toLowerCase()) ||
                p.sku?.toLowerCase().includes(value.toLowerCase())
            );
            setSearchResults(results);
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    const addItem = (product, quantity = 1, rate = 0) => {
        const existingIndex = items.findIndex(item => item.product === product._id);
        if (existingIndex >= 0) {
            Swal.fire({
                title: 'Already Added',
                text: 'This product is already in the order. Updating quantity.',
                icon: 'info',
                timer: 1500,
                showConfirmButton: false
            });
            const updatedItems = [...items];
            updatedItems[existingIndex].quantity += quantity;
            setItems(updatedItems);
        } else {
            const newItem = {
                product: product._id,
                medicineName: product.name,
                quantity: quantity,
                purchaseRate: rate || product.purchasePrice || 0,
                gst: product.tax || 0,
                totalAmount: 0 // Calculated in effect
            };
            setItems([...items, newItem]);
        }
        setProductSearch('');
        setShowResults(false);
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;
        setItems(updatedItems);
    };

    const removeItem = (index) => {
        setItems(items.filter((_, i) => i !== index));
    };

    const calculateTotals = () => {
        let sub = 0;
        let tax = 0;
        
        items.forEach(item => {
            const lineTotal = item.quantity * item.purchaseRate;
            const lineTax = lineTotal * (item.gst / 100);
            
            sub += lineTotal;
            tax += lineTax;
            
            // Update item total for display if needed, but we rely on state for rendering input
            // Actually, let's update the item's totalAmount just in case we save it
            item.totalAmount = lineTotal + lineTax;
        });

        setTotals({
            subTotal: sub,
            taxAmount: tax,
            grandTotal: sub + tax
        });
    };

    const handleSubmit = async (status = 'Draft') => {
        if (!formData.supplierId) {
            Swal.fire('Error', 'Please select a supplier', 'error');
            return;
        }
        if (items.length === 0) {
            Swal.fire('Error', 'Please add items to the order', 'error');
            return;
        }

        try {
            setLoading(true);
            const selectedSupplier = suppliers.find(s => s._id === formData.supplierId);
            
            const payload = {
                ...formData,
                supplierName: selectedSupplier?.name || 'Unknown',
                items,
                totalAmount: totals.grandTotal,
                status,
                expectedDeliveryDate: formData.expectedDeliveryDate || null // Handle empty date string
            };

            const { data } = await api.post('/purchase-orders/create', payload);
            
            Swal.fire({
                title: 'Success!',
                text: `Purchase Order ${data.poNumber} created successfully.`,
                icon: 'success'
            }).then(() => {
                navigate('/purchase/orders');
            });
            
        } catch (error) {
            console.error(error);
            const errMsg = error.response?.data?.error || error.response?.data?.message || 'Failed to create Purchase Order';
            Swal.fire({
                title: 'Error',
                text: errMsg,
                icon: 'error'
            });
        } finally {
            setLoading(false);
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
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium">{orderId ? 'View or modify existing purchase order details.' : 'Create new purchase orders for suppliers.'}</p>
                </div>
                <button
                    onClick={() => navigate('/purchase/orders')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all border border-gray-200 dark:border-gray-700 font-bold shadow-sm"
                >
                    <ArrowLeft size={18} /> Back to List
                </button>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                
                {/* Left Column: Requisitions & Search (1/4 width on large screens) */}
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
                                placeholder="Search products..."
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm font-medium transition-all"
                            />
                             {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl max-h-80 overflow-y-auto z-50">
                                    {searchResults.map(p => (
                                        <div
                                            key={p._id}
                                            onClick={() => addItem(p)}
                                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors"
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
                                                <span>Suggested Order: {p.suggestedOrder}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {requisitions.expiryNear.length > 0 && (
                            <div>
                                <h4 className="text-xs font-bold text-orange-500 mb-3 bg-orange-50 dark:bg-orange-900/20 px-3 py-1.5 rounded-lg inline-block">Near Expiry ({requisitions.expiryNear.length})</h4>
                                <div className="space-y-3">
                                    {requisitions.expiryNear.map(p => (
                                        <div key={p._id} className="p-3 border border-orange-100 dark:border-gray-700 bg-orange-50/30 dark:bg-gray-800 rounded-xl hover:shadow-md transition-all">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">{p.name}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">Exp: {p.expiryDate}</p>
                                                </div>
                                                <button 
                                                    onClick={() => addItem(p)}
                                                    className="p-1.5 bg-white dark:bg-gray-700 text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-50 dark:hover:bg-gray-600 transition-colors"
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: PO Form & Items (3/4 width) */}
                <div className="xl:col-span-3 space-y-6">
                    {/* Step 2 Details Form */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supplier</label>
                                <select 
                                    value={formData.supplierId}
                                    onChange={(e) => setFormData({...formData, supplierId: e.target.value})}
                                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-primary/50 text-sm font-bold"
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
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
                                    value={orderId ? "Loaded from ID" : "Auto Generated"}
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
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-black text-gray-500 uppercase tracking-widest">
                                    <tr>
                                        <th className="px-6 py-4">Medicine Name</th>
                                        <th className="px-6 py-4 w-32">Qty</th>
                                        <th className="px-6 py-4 w-40">Rate (₹)</th>
                                        <th className="px-6 py-4 w-24">GST (%)</th>
                                        <th className="px-6 py-4 text-right">Total</th>
                                        <th className="px-6 py-4 text-center w-20">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-12 text-center text-gray-400">
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
                                                    <input 
                                                        type="number" 
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-primary text-center font-bold"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={item.purchaseRate}
                                                        onChange={(e) => updateItem(index, 'purchaseRate', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-primary text-right"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input 
                                                        type="number" 
                                                        min="0"
                                                        value={item.gst}
                                                        onChange={(e) => updateItem(index, 'gst', parseFloat(e.target.value) || 0)}
                                                        className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg outline-none focus:border-primary text-right"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 text-right font-black text-gray-800 dark:text-white">
                                                    ₹{((item.quantity * item.purchaseRate) * (1 + item.gst/100)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                             <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₹{totals.subTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Total Tax (GST)</span>
                                    <span>₹{totals.taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <span className="font-black text-lg text-gray-800 dark:text-white">Total Amount</span>
                                    <span className="font-black text-xl text-primary">₹{totals.grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            <div className="mt-6 flex flex-col gap-3">
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
                                            <Save size={20} /> Send to Supplier
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
