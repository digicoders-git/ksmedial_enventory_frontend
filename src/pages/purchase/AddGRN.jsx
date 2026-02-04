import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
    Save, X, Plus, Trash2, Calendar, 
    FileText, User, Search, Package, 
    ArrowLeft, Upload, Download
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const AddGRN = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedSupplierDetails, setSelectedSupplierDetails] = useState(null);
    
    // Form State
    const [formData, setFormData] = useState({
        supplierId: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        notes: ''
    });

    // Invoice Summary State
    const [invoiceSummary, setInvoiceSummary] = useState({
        taxableAmount: 0,
        tcsAmount: 0,
        mrpValue: 0,
        netAmount: 0,
        amountAfterGst: 0,
        roundAmount: 0,
        invoiceAmount: 0
    });

    // Tax Breakup State
    const [taxBreakup, setTaxBreakup] = useState({
        gst5: { taxable: 0, tax: 0 },
        gst12: { taxable: 0, tax: 0 },
        gst18: { taxable: 0, tax: 0 },
        gst28: { taxable: 0, tax: 0 }
    });

    // Items State
    const [items, setItems] = useState([]);
    
    // Product Search
    const [productSearch, setProductSearch] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [showResults, setShowResults] = useState(false);
    const [showAddSkuModal, setShowAddSkuModal] = useState(false);
    const [modalSearchTerm, setModalSearchTerm] = useState('');

    useEffect(() => {
        fetchSuppliers();
        fetchProducts();
    }, []);

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

    const addProductToGRN = (product) => {
        const existingIndex = items.findIndex(item => item.productId === product._id);
        
        if (existingIndex >= 0) {
            Swal.fire('Already Added', 'This product is already in the GRN', 'info');
            return;
        }

        const newItem = {
            productId: product._id,
            productName: product.name,
            supplierSkuId: '',
            skuId: product.sku || '',
            pack: product.packSize || '',
            batchNumber: '',
            expiryDate: '',
            mfgDate: '',
            systemMrp: product.mrp || 0,
            orderedQty: 0,
            receivedQty: 0,
            physicalFreeQty: 0,
            schemeFreeQty: 0,
            poRate: 0,
            ptr: 0,
            baseRate: 0,
            schemeDiscount: 0,
            discountPercent: 0,
            amount: 0,
            hsnCode: product.hsnCode || '',
            cgst: 0,
            sgst: 0,
            igst: 0,
            purchasePrice: product.purchasePrice || 0,
            sellingPrice: product.sellingPrice || 0,
            mrp: product.mrp || 0,
            margin: 0
        };

        setItems([...items, newItem]);
        setProductSearch('');
        setShowResults(false);
    };

    const updateItem = (index, field, value) => {
        const updatedItems = [...items];
        updatedItems[index][field] = value;

        // Auto-calculate amount
        if (['baseRate', 'receivedQty', 'discountPercent'].includes(field)) {
            const item = updatedItems[index];
            const baseAmount = (item.baseRate || 0) * (item.receivedQty || 0);
            const discountAmount = baseAmount * ((item.discountPercent || 0) / 100);
            item.amount = baseAmount - discountAmount;
        }

        // Auto-calculate margin
        if (['purchasePrice', 'sellingPrice'].includes(field)) {
            const item = updatedItems[index];
            if (item.purchasePrice > 0) {
                item.margin = ((item.sellingPrice - item.purchasePrice) / item.purchasePrice * 100).toFixed(2);
            }
        }

        setItems(updatedItems);
        calculateSummary(updatedItems);
    };

    const removeItem = (index) => {
        const updatedItems = items.filter((_, i) => i !== index);
        setItems(updatedItems);
        calculateSummary(updatedItems);
    };

    const calculateSummary = (itemsList) => {
        let taxableAmount = 0;
        let mrpValue = 0;
        const breakup = {
            gst5: { taxable: 0, tax: 0 },
            gst12: { taxable: 0, tax: 0 },
            gst18: { taxable: 0, tax: 0 },
            gst28: { taxable: 0, tax: 0 }
        };

        itemsList.forEach(item => {
            const itemTaxable = item.amount || 0;
            const totalGst = (item.cgst || 0) + (item.sgst || 0) + (item.igst || 0);
            const itemTax = itemTaxable * (totalGst / 100);

            taxableAmount += itemTaxable;
            mrpValue += (item.mrp || 0) * (item.receivedQty || 0);

            // Categorize by GST
            if (totalGst === 5) {
                breakup.gst5.taxable += itemTaxable;
                breakup.gst5.tax += itemTax;
            } else if (totalGst === 12) {
                breakup.gst12.taxable += itemTaxable;
                breakup.gst12.tax += itemTax;
            } else if (totalGst === 18) {
                breakup.gst18.taxable += itemTaxable;
                breakup.gst18.tax += itemTax;
            } else if (totalGst === 28) {
                breakup.gst28.taxable += itemTaxable;
                breakup.gst28.tax += itemTax;
            }
        });

        const totalTax = breakup.gst5.tax + breakup.gst12.tax + breakup.gst18.tax + breakup.gst28.tax;
        const amountAfterGst = taxableAmount + totalTax;
        const roundAmount = Math.round(amountAfterGst) - amountAfterGst;
        const invoiceAmount = Math.round(amountAfterGst);

        setInvoiceSummary({
            taxableAmount: parseFloat(taxableAmount.toFixed(2)),
            tcsAmount: 0,
            mrpValue: parseFloat(mrpValue.toFixed(2)),
            netAmount: parseFloat(taxableAmount.toFixed(2)),
            amountAfterGst: parseFloat(amountAfterGst.toFixed(2)),
            roundAmount: parseFloat(roundAmount.toFixed(2)),
            invoiceAmount
        });

        setTaxBreakup(breakup);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.supplierId) {
            Swal.fire('Error', 'Please select a supplier', 'error');
            return;
        }

        if (items.length === 0) {
            Swal.fire('Error', 'Please add at least one item', 'error');
            return;
        }

        try {
            setLoading(true);
            const payload = {
                supplierId: formData.supplierId,
                // invoiceNumber will be auto-generated by backend
                invoiceDate: formData.invoiceDate,
                notes: formData.notes,
                items,
                invoiceSummary,
                taxBreakup,
                subTotal: invoiceSummary.taxableAmount,
                taxAmount: invoiceSummary.amountAfterGst - invoiceSummary.taxableAmount,
                discount: 0,
                grandTotal: invoiceSummary.invoiceAmount,
                status: 'Received',
                paymentStatus: 'Pending'
            };

            const { data } = await api.post('/purchases', payload);
            
            if (data.success) {
                Swal.fire({
                    title: 'Success!',
                    text: 'GRN created successfully',
                    icon: 'success',
                    timer: 2000
                });
                navigate('/purchase/grn');
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to create GRN', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                        Purchase Receive Orders
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Create new GRN with invoice details</p>
                </div>
                <button
                    onClick={() => navigate('/purchase/grn')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 transition-all"
                >
                    <ArrowLeft size={18} /> Back
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Top Section: Supplier + Summary */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    {/* Left: Supplier Info */}
                    <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                        <h3 className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-widest mb-6">
                            Supplier & Invoice Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Supplier *</label>
                                <select
                                    value={formData.supplierId}
                                    onChange={(e) => {
                                        const supplierId = e.target.value;
                                        setFormData({ ...formData, supplierId });
                                        // Auto-fill supplier details
                                        const supplier = suppliers.find(s => s._id === supplierId);
                                        setSelectedSupplierDetails(supplier || null);
                                    }}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    required
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map(s => (
                                        <option key={s._id} value={s._id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Number *</label>
                                <input
                                    type="text"
                                    value={formData.invoiceNumber}
                                    onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl outline-none text-sm text-gray-500 dark:text-gray-400 cursor-not-allowed"
                                    placeholder="Auto-generated (GRN-YYYY-XXXX)"
                                    readOnly
                                />
                                <p className="text-[10px] text-gray-400 mt-1 font-medium">Invoice number will be auto-generated</p>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Invoice Date</label>
                                <input
                                    type="date"
                                    value={formData.invoiceDate}
                                    onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notes</label>
                                <input
                                    type="text"
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                    placeholder="Optional notes"
                                />
                            </div>
                        </div>
                        
                        {/* Supplier Details Display */}
                        {selectedSupplierDetails && (
                            <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                                <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-widest mb-3">Supplier Information</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Contact Person:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.contactPerson || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Phone:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Email:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">City:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.city || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">GST Number:</span>
                                        <p className="font-bold text-gray-800 dark:text-white font-mono">{selectedSupplierDetails.gstNumber || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs font-bold">Drug License:</span>
                                        <p className="font-bold text-gray-800 dark:text-white font-mono">{selectedSupplierDetails.drugLicenseNumber || 'N/A'}</p>
                                    </div>
                                    <div className="md:col-span-2">
                                        <span className="text-gray-500 text-xs font-bold">Address:</span>
                                        <p className="font-bold text-gray-800 dark:text-white">{selectedSupplierDetails.address || 'N/A'}</p>
                                    </div>
                                    {selectedSupplierDetails.supplierCode && (
                                        <div>
                                            <span className="text-gray-500 text-xs font-bold">Supplier Code:</span>
                                            <p className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{selectedSupplierDetails.supplierCode}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right: Summary & Tax Breakup */}
                    <div className="space-y-4">
                        {/* Summary */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Summary</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Taxable Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.taxableAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">TCS Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.tcsAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">MRP Value:</span>
                                    <span className="font-bold">₹{invoiceSummary.mrpValue.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Net Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.netAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Amount After GST:</span>
                                    <span className="font-bold">₹{invoiceSummary.amountAfterGst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Round Amount:</span>
                                    <span className="font-bold">₹{invoiceSummary.roundAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span className="font-black text-gray-800 dark:text-white">Invoice Amount:</span>
                                    <span className="font-black text-emerald-600 text-lg">₹{invoiceSummary.invoiceAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Tax Breakup */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Tax Breakup</h3>
                            <div className="space-y-2 text-xs">
                                {[
                                    { label: '5%', key: 'gst5' },
                                    { label: '12%', key: 'gst12' },
                                    { label: '18%', key: 'gst18' },
                                    { label: '28%', key: 'gst28' }
                                ].map(({ label, key }) => (
                                    <div key={key} className="grid grid-cols-3 gap-2">
                                        <span className="font-bold text-gray-500">{label}</span>
                                        <span className="text-right">₹{taxBreakup[key].taxable.toFixed(2)}</span>
                                        <span className="text-right font-bold">₹{taxBreakup[key].tax.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Add Product Section */}
                <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={productSearch}
                                onChange={(e) => handleProductSearch(e.target.value)}
                                placeholder="Search products by name or SKU..."
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                            />
                            {showResults && searchResults.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg max-h-60 overflow-y-auto z-50">
                                    {searchResults.map(product => (
                                        <div
                                            key={product._id}
                                            onClick={() => addProductToGRN(product)}
                                            className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                        >
                                            <p className="text-sm font-bold text-gray-800 dark:text-white">{product.name}</p>
                                            <p className="text-xs text-gray-500">SKU: {product.sku} | MRP: ₹{product.mrp}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowAddSkuModal(true)}
                            className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl font-bold text-sm hover:bg-emerald-700 transition-all flex items-center gap-2 active:scale-95"
                        >
                            <Plus size={18} /> Add SKU
                        </button>
                    </div>
                </div>

                {/* Items Table */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-gray-50 dark:bg-gray-900/50 text-[10px] font-black text-gray-500 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700">
                                <tr>
                                    <th className="py-3 px-3">Supplier SKU ID</th>
                                    <th className="py-3 px-3">SKU ID</th>
                                    <th className="py-3 px-3">Name</th>
                                    <th className="py-3 px-3">Pack</th>
                                    <th className="py-3 px-3">Batch</th>
                                    <th className="py-3 px-3">Expiry</th>
                                    <th className="py-3 px-3">Mfg Date</th>
                                    <th className="py-3 px-3">System MRP</th>
                                    <th className="py-3 px-3">Ordered Qty</th>
                                    <th className="py-3 px-3">Received Qty</th>
                                    <th className="py-3 px-3">Physical Free</th>
                                    <th className="py-3 px-3">Scheme Free</th>
                                    <th className="py-3 px-3">PO Rate</th>
                                    <th className="py-3 px-3">PTR</th>
                                    <th className="py-3 px-3">Base Rate</th>
                                    <th className="py-3 px-3">Scheme Disc</th>
                                    <th className="py-3 px-3">Disc %</th>
                                    <th className="py-3 px-3">Amount</th>
                                    <th className="py-3 px-3">HSN Code</th>
                                    <th className="py-3 px-3">CGST</th>
                                    <th className="py-3 px-3">SGST</th>
                                    <th className="py-3 px-3">MRP</th>
                                    <th className="py-3 px-3">Margin</th>
                                    <th className="py-3 px-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {items.length === 0 ? (
                                    <tr>
                                        <td colSpan="24" className="py-12 text-center text-gray-400">
                                            <Package size={48} className="mx-auto mb-2 opacity-30" />
                                            <p className="font-bold uppercase text-xs">No items added yet</p>
                                        </td>
                                    </tr>
                                ) : (
                                    items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-900/30">
                                            <td className="py-2 px-3">
                                                <input type="text" value={item.supplierSkuId} onChange={(e) => updateItem(index, 'supplierSkuId', e.target.value)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="text" value={item.skuId} onChange={(e) => updateItem(index, 'skuId', e.target.value)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3 font-bold text-gray-800 dark:text-white">{item.productName}</td>
                                            <td className="py-2 px-3">
                                                <input type="text" value={item.pack} onChange={(e) => updateItem(index, 'pack', e.target.value)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="text" value={item.batchNumber} onChange={(e) => updateItem(index, 'batchNumber', e.target.value)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="date" value={item.expiryDate} onChange={(e) => updateItem(index, 'expiryDate', e.target.value)} className="w-28 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="date" value={item.mfgDate} onChange={(e) => updateItem(index, 'mfgDate', e.target.value)} className="w-28 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3 text-gray-500">{item.systemMrp}</td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.orderedQty} onChange={(e) => updateItem(index, 'orderedQty', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.receivedQty} onChange={(e) => updateItem(index, 'receivedQty', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded text-xs font-bold" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.physicalFreeQty} onChange={(e) => updateItem(index, 'physicalFreeQty', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.schemeFreeQty} onChange={(e) => updateItem(index, 'schemeFreeQty', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.poRate} onChange={(e) => updateItem(index, 'poRate', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.ptr} onChange={(e) => updateItem(index, 'ptr', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.baseRate} onChange={(e) => updateItem(index, 'baseRate', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded text-xs font-bold" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.schemeDiscount} onChange={(e) => updateItem(index, 'schemeDiscount', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.discountPercent} onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3 font-bold text-emerald-600">{item.amount.toFixed(2)}</td>
                                            <td className="py-2 px-3">
                                                <input type="text" value={item.hsnCode} onChange={(e) => updateItem(index, 'hsnCode', e.target.value)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.cgst} onChange={(e) => updateItem(index, 'cgst', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.sgst} onChange={(e) => updateItem(index, 'sgst', parseFloat(e.target.value) || 0)} className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3">
                                                <input type="number" value={item.mrp} onChange={(e) => updateItem(index, 'mrp', parseFloat(e.target.value) || 0)} className="w-20 px-2 py-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded text-xs" />
                                            </td>
                                            <td className="py-2 px-3 text-gray-500">{item.margin}%</td>
                                            <td className="py-2 px-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(index)}
                                                    className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
                {/* Submit Button */}
                <div className="flex justify-end gap-4">
                    <button
                        type="button"
                        onClick={() => navigate('/purchase/grn')}
                        className="px-6 py-3 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-bold hover:bg-gray-200 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        <Save size={18} />
                        {loading ? 'Saving...' : 'Save GRN'}
                    </button>
                </div>
            </form>

            {/* Add SKU Modal - Using Portal to render outside component tree */}
            {showAddSkuModal && ReactDOM.createPortal(
                <div className="fixed inset-0 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in" style={{ zIndex: 999999, position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
                    <div className="bg-white dark:bg-gray-800 w-full max-w-4xl rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20 rounded-t-2xl">
                            <div>
                                <h3 className="font-black text-gray-800 dark:text-white text-lg uppercase tracking-tight">Add Products to GRN</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Select products to add to your purchase order</p>
                            </div>
                            <button onClick={() => { setShowAddSkuModal(false); setModalSearchTerm(''); }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-2 rounded-full bg-white dark:bg-gray-700 shadow-sm hover:shadow-md">
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={modalSearchTerm}
                                    onChange={(e) => setModalSearchTerm(e.target.value)}
                                    placeholder="Search products by name or SKU..."
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {products
                                    .filter(p => 
                                        modalSearchTerm === '' || 
                                        p.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                        p.sku?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                                    )
                                    .map(product => (
                                        <div
                                            key={product._id}
                                            onClick={() => {
                                                addProductToGRN(product);
                                                setShowAddSkuModal(false);
                                                setModalSearchTerm('');
                                            }}
                                            className="p-4 bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer transition-all group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-sm font-black text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{product.name}</h4>
                                                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold rounded uppercase">
                                                    {product.category?.name || 'N/A'}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                                                <p><span className="font-bold">SKU:</span> {product.sku || 'N/A'}</p>
                                                <p><span className="font-bold">MRP:</span> ₹{product.mrp || 0}</p>
                                                <p><span className="font-bold">Stock:</span> {product.quantity || 0} units</p>
                                            </div>
                                        </div>
                                    ))}
                                {products.filter(p => 
                                    modalSearchTerm === '' || 
                                    p.name.toLowerCase().includes(modalSearchTerm.toLowerCase()) ||
                                    p.sku?.toLowerCase().includes(modalSearchTerm.toLowerCase())
                                ).length === 0 && (
                                    <div className="col-span-2 py-12 text-center text-gray-400">
                                        <Package size={48} className="mx-auto mb-2 opacity-30" />
                                        <p className="font-bold uppercase text-xs">No products found</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end bg-gray-50/50 dark:bg-gray-700/50 rounded-b-2xl">
                            <button
                                onClick={() => { setShowAddSkuModal(false); setModalSearchTerm(''); }}
                                className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 text-sm transition-all"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default AddGRN;
