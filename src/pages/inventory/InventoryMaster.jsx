import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Map, Package, Truck, 
    FileText, Download, Edit2, History, 
    ChevronLeft, ChevronRight, RefreshCw,
    Plus, AlertTriangle, ArrowRightLeft,
    X, User, Shield, ArrowDownCircle, ArrowUpCircle, Save, Boxes
} from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { useAuth } from '../../context/AuthContext';
import { createPortal } from 'react-dom';

const InventoryMaster = () => {
    const navigate = useNavigate();
    const { shop } = useAuth();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(25);
    
    // Batch Modal State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [selectedProductBatches, setSelectedProductBatches] = useState([]);
    const [loadingBatches, setLoadingBatches] = useState(false);
    const [batchCounts, setBatchCounts] = useState({});

    // Filters
    const [filters, setFilters] = useState({
        sku: '',
        name: '',
        batch: '',
        location: '',
        tags: '',
        startDate: '',
        endDate: '',
        nearExpiry: false,
        lowStock: false
    });
    const [selectedItems, setSelectedItems] = useState([]);

    // Stock Adjustment State
    const [showAdjustModal, setShowAdjustModal] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [adjustmentData, setAdjustmentData] = useState({
        type: 'deduct',
        quantity: '',
        reason: 'Damage',
        note: '',
        adjusterName: '',
        adjusterEmail: '',
        adjusterMobile: ''
    });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit,
                isLive: true,
                ...filters
            });
            const { data } = await api.get(`/products/search?${queryParams}`);
            if (data.success) {
                setProducts(data.products);
                setTotal(data.total);
                setTotalPages(data.pages);
                
                // Fetch batch counts for all products
                fetchBatchCounts(data.products);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
            Swal.fire('Error', 'Failed to fetch inventory data', 'error');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchBatchCounts = async (productList) => {
        try {
            const counts = {};
            for (const product of productList) {
                const { data } = await api.get(`/batches/product/${product._id}`);
                if (data.success) {
                    counts[product._id] = data.batches.length;
                }
            }
            setBatchCounts(counts);
        } catch (error) {
            console.error('Error fetching batch counts:', error);
        }
    };
    
    const handleViewBatches = async (product) => {
        setLoadingBatches(true);
        setShowBatchModal(true);
        try {
            const { data } = await api.get(`/batches/product/${product._id}`);
            if (data.success) {
                setSelectedProductBatches({
                    product: product,
                    batches: data.batches
                });
            }
        } catch (error) {
            console.error('Error fetching batches:', error);
            Swal.fire('Error', 'Failed to load batch details', 'error');
        } finally {
            setLoadingBatches(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [page, limit, filters]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const toggleFilter = (key) => {
        setFilters(prev => ({ ...prev, [key]: !prev[key] }));
        setPage(1);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedItems(products.map(p => p._id));
        } else {
            setSelectedItems([]);
        }
    };

    const handleSelectRow = (id) => {
        setSelectedItems(prev => 
            prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
        );
    };

    const handleDownloadReport = () => {
        if (products.length === 0) {
             Swal.fire('Info', 'No data to export', 'info');
             return;
        }
        
        const dataToExport = products.map(p => ({
            SKU: p.sku || p._id,
            Name: p.name,
            Generic: p.genericName,
            Batch: p.batchNumber,
            Expiry: p.expiryDate,
            Quantity: p.quantity,
            MRP: p.sellingPrice,
            Location: p.rackLocation,
            Category: p.category
        }));

        const csv = Papa.unparse(dataToExport);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'inventory_report.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleTransfer = async () => {
        if (selectedItems.length === 0) {
            Swal.fire('Selection Required', 'Please select items to transfer.', 'warning');
            return;
        }

        const { value: location } = await Swal.fire({
            title: 'Transfer Stock',
            input: 'text',
            inputLabel: `Transfer ${selectedItems.length} items to new location`,
            inputPlaceholder: 'Enter new Rack/Shelf location',
            showCancelButton: true
        });

        if (location) {
            Swal.fire('Success', `Transferred ${selectedItems.length} items to ${location}`, 'success');
            fetchProducts();
        }
    };

    const handleBulkPicking = () => {
         if (selectedItems.length === 0) {
            Swal.fire('Selection Required', 'Select items to generate picking list.', 'warning');
            return;
        }
        const items = products.filter(p => selectedItems.includes(p._id));
        const listHtml = items.map(i => `<li><b>${i.runLocation || 'N/A'}</b> - ${i.name} (${i.quantity})</li>`).join('');
        Swal.fire({
            title: 'Picking List',
            html: `<ul style="text-align:left; font-size:12px;">${listHtml}</ul>`,
            confirmButtonText: 'Print / Done'
        });
    };

    const handleSearch = () => {
        setPage(1);
        fetchProducts();
    };

    const handleEdit = (id) => {
        const product = products.find(p => p._id === id);
        if (product) {
            navigate('/medicines/add', { 
                state: { 
                    medicine: {
                        id: product._id,
                        sku: product.sku,
                        name: product.name,
                        generic: product.genericName,
                        packing: product.packing,
                        company: product.company,
                        hsnCode: product.hsnCode,
                        tax: product.tax,
                        unit: product.unit,
                        minLevel: product.reorderLevel,
                        description: product.description,
                        isPrescriptionRequired: product.isPrescriptionRequired,
                        rackLocation: product.rackLocation,
                        status: product.status,
                        rate: product.purchasePrice,
                        mrp: product.sellingPrice,
                        group: product.group,
                        category: product.category,
                        batch: product.batchNumber,
                        expiry: product.expiryDate,
                        image: product.image,
                        schedule: product.schedule,
                        nppaMrp: product.nppaMrp,
                        mfgDate: product.manufacturingDate
                    },
                    mode: 'edit'
                } 
            });
        }
    };

    const handleSingleTransfer = async (product) => {
        const { value: location } = await Swal.fire({
            title: 'Transfer Stock',
            input: 'text',
            inputLabel: `Transfer ${product.name} (Qty: ${product.quantity}) to new location`,
            inputPlaceholder: 'Enter new Rack/Shelf location',
            inputValue: product.rackLocation,
            showCancelButton: true
        });

        if (location && location !== product.rackLocation) {
            Swal.fire('Success', `Transferred ${product.name} to ${location}`, 'success');
            setProducts(prev => prev.map(p => p._id === product._id ? { ...p, rackLocation: location } : p));
        }
    };

    // --- Stock Adjustment Logic ---
    const openAdjustModal = (product) => {
        setSelectedStock(product);
        setAdjustmentData({ 
            type: 'deduct', 
            quantity: '', 
            reason: 'Damage',
            note: '',
            adjusterName: shop?.ownerName || '',
            adjusterEmail: shop?.email || '',
            adjusterMobile: shop?.contactNumber || ''
        });
        setShowAdjustModal(true);
    };

    const handleAdjustmentChange = (e) => {
        const { name, value } = e.target;
        setAdjustmentData(prev => {
            if (name === 'type') {
                return { 
                    ...prev, 
                    [name]: value,
                    reason: value === 'add' ? 'Found' : 'Damage'
                };
            }
            return { ...prev, [name]: value };
        });
    };

    const handleAdjustSubmit = async (e) => {
        e.preventDefault();
        if (!adjustmentData.quantity || parseInt(adjustmentData.quantity) <= 0) {
            Swal.fire('Error', 'Please enter a valid quantity', 'error');
            return;
        }

        const qtyChange = parseInt(adjustmentData.quantity);
        try {
            const { data } = await api.put(`/products/${selectedStock._id}/adjust`, {
                type: adjustmentData.type,
                quantity: qtyChange,
                reason: adjustmentData.reason,
                note: adjustmentData.note,
                adjusterName: adjustmentData.adjusterName,
                adjusterEmail: adjustmentData.adjusterEmail,
                adjusterMobile: adjustmentData.adjusterMobile
            });

            if (data.success) {
                setShowAdjustModal(false);
                const actionText = adjustmentData.type === 'add' ? 'Added' : 'Removed';
                
                if (data.message && data.message.includes('Put Away')) {
                     Swal.fire({
                        icon: 'info',
                        title: 'Sent to Put Away',
                        text: data.message,
                        confirmButtonText: 'Go to Put Away Bucket',
                        showCancelButton: true,
                        cancelButtonText: 'Stay Here'
                    }).then((result) => {
                        if (result.isConfirmed) {
                            navigate('/inventory/putaway');
                        }
                    });
                } else {
                    Swal.fire({
                        icon: 'success',
                        title: 'Stock Updated',
                        text: `Successfully ${actionText} ${qtyChange} units.`,
                        confirmButtonColor: '#007242',
                        timer: 2000
                    });
                }
                // Update local state by refetching or manual update
                // Refetch is safer to get latest
                fetchProducts();
            } else {
                Swal.fire('Error', data.message, 'error');
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Adjustment failed', 'error');
        }
    };

    const calculateShelfLife = (expiryDate) => {
        if (!expiryDate || expiryDate === 'N/A') return 'N/A';
        const exp = new Date(expiryDate);
        const now = new Date();
        if (isNaN(exp.getTime())) return 'Invalid';
        const remaining = exp.getTime() - now.getTime();
        if (remaining < 0) return '0%';
        const daysRemaining = Math.ceil(remaining / (1000 * 60 * 60 * 24));
        return `${daysRemaining} Days`;
    };

    return (
        <div className="space-y-6 animate-fade-in-up p-4 sm:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
            
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
                    Inventory Master
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                    Manage and track all inventory items, batches, and locations.
                </p>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                     <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">SKU / ID</label>
                        <input 
                            type="text" 
                            name="sku"
                            value={filters.sku}
                            onChange={handleFilterChange}
                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Search SKU..."
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Product Name</label>
                        <input 
                            type="text" 
                            name="name"
                            value={filters.name}
                            onChange={handleFilterChange}
                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Product Name..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Batch (Exact)</label>
                        <input 
                            type="text" 
                            name="batch"
                            value={filters.batch}
                            onChange={handleFilterChange}
                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Batch No..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Location</label>
                        <input 
                            type="text" 
                            name="location"
                            value={filters.location}
                            onChange={handleFilterChange}
                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Rack/Shelf..."
                        />
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">Tags / Category</label>
                        <input 
                            type="text" 
                            name="tags"
                            value={filters.tags}
                            onChange={handleFilterChange}
                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Category..."
                        />
                    </div>
                    <div>
                        <button 
                            onClick={handleSearch}
                            className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                        >
                            <Search size={14} strokeWidth={3} /> Fetch Record
                        </button>
                    </div>
                </div>
                
                {/* Date Range Row */}
                <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">From Date & Time</label>
                            <input 
                                type="datetime-local" 
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-gray-500 mb-1 block">To Date & Time</label>
                            <input 
                                type="datetime-local" 
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                className="w-full text-xs p-2.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            {(filters.startDate || filters.endDate) && (
                                <button 
                                    onClick={() => setFilters({...filters, startDate: '', endDate: ''})}
                                    className="w-full py-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/30"
                                >
                                    <X size={14} strokeWidth={3} /> Clear Dates
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Bar & Stats */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                <div className="text-xs font-bold text-gray-600 dark:text-gray-400">
                    Showing <span className="text-gray-900 dark:text-white">{(page - 1) * limit + 1}</span> - <span className="text-gray-900 dark:text-white">{Math.min(page * limit, total)}</span> of <span className="text-gray-900 dark:text-white">{total}</span> products
                </div>

                <div className="flex flex-wrap gap-2 justify-center xl:justify-end">
                    <button onClick={() => Swal.fire('Feature Coming Soon', 'Header mapping configuration will be available here.', 'info')} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-wider rounded hover:bg-indigo-100 transition-colors border border-indigo-100 dark:border-indigo-800">Map Header</button>
                    <button onClick={() => navigate('/medicines/categories')} className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider rounded hover:bg-blue-100 transition-colors border border-blue-100 dark:border-blue-800">Category Map</button>
                    <button onClick={handleBulkPicking} className="px-3 py-1.5 bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400 text-[10px] font-black uppercase tracking-wider rounded hover:bg-teal-100 transition-colors border border-teal-100 dark:border-teal-800">Bulk Picking</button>
                    <button onClick={() => toggleFilter('nearExpiry')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-colors border ${filters.nearExpiry ? 'bg-rose-500 text-white border-rose-600' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800 hover:bg-rose-100'}`}>Near Expiry</button>
                    <button onClick={handleTransfer} className="px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider rounded hover:bg-amber-100 transition-colors border border-amber-100 dark:border-amber-800">Transfer</button>
                    <button onClick={() => toggleFilter('lowStock')} className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-wider rounded transition-colors border ${filters.lowStock ? 'bg-purple-500 text-white border-purple-600' : 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-purple-800 hover:bg-purple-100'}`}>Low Stock</button>
                    <button onClick={handleDownloadReport} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[10px] font-black uppercase tracking-wider rounded hover:bg-gray-200 transition-colors border border-gray-200 dark:border-gray-600 flex items-center gap-1">
                        <Download size={12} strokeWidth={3} /> Report
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-gray-500">Rows:</span>
                    <select 
                        value={limit} 
                        onChange={(e) => setLimit(Number(e.target.value))}
                        className="text-xs border border-gray-200 dark:border-gray-600 rounded bg-white dark:bg-gray-800 p-1 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value={10}>10</option>
                        <option value={25}>25</option>
                        <option value={50}>50</option>
                        <option value={100}>100</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1200px]">
                        <thead>
                            <tr className="bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider text-left">
                                <th className="p-3 w-10 text-center"><input type="checkbox" onChange={handleSelectAll} checked={products.length > 0 && selectedItems.length === products.length} className="rounded border-gray-400" /></th>
                                <th className="p-3">SKU ID</th>
                                <th className="p-3">SKU Name</th>
                                <th className="p-3">Schedule</th>
                                <th className="p-3">Manufacturer</th>
                                <th className="p-3">Batch</th>
                                <th className="p-3 text-center">Batch Count</th>
                                <th className="p-3">Location</th>
                                <th className="p-3">Category</th>
                                <th className="p-3 text-right">Qty</th>
                                <th className="p-3 text-right">MRP</th>
                                <th className="p-3 text-right">NPPA MRP</th>
                                <th className="p-3">Expiry Date</th>
                                <th className="p-3">Mfg Date</th>
                                <th className="p-3">Shelf Life</th>
                                <th className="p-3 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="16" className="p-8 text-center text-gray-500">
                                        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                                        <p className="text-xs">Loading Inventory...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="16" className="p-8 text-center text-gray-500 text-xs font-medium uppercase">
                                        No Records Found
                                    </td>
                                </tr>
                            ) : (
                                products.map((product) => (
                                    <tr key={product._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/50 transition-colors text-[11px] text-gray-700 dark:text-gray-300">
                                        <td className="p-3 text-center"><input type="checkbox" checked={selectedItems.includes(product._id)} onChange={() => handleSelectRow(product._id)} className="rounded border-gray-300" /></td>
                                        <td className="p-3 font-semibold text-blue-600">{product.sku || product._id.slice(-6).toUpperCase()}</td>
                                        <td className="p-3 font-medium">{product.name}</td>
                                        <td className="p-3">{product.schedule || 'H'}</td>
                                        <td className="p-3">{product.company || product.brand || 'N/A'}</td>
                                        <td className="p-3 font-mono">{product.batchNumber || 'N/A'}</td>
                                        <td className="p-3 text-center">
                                            {batchCounts[product._id] === undefined ? (
                                                <span className="inline-block w-3 h-3 border border-gray-300 border-t-orange-400 rounded-full animate-spin" />
                                            ) : batchCounts[product._id] > 0 ? (
                                                <button
                                                    onClick={() => handleViewBatches(product)}
                                                    title="View all batches"
                                                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400 text-[10px] font-black uppercase tracking-wide hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-colors"
                                                >
                                                    <Boxes size={11} strokeWidth={2.5} />
                                                    <span>{batchCounts[product._id]}</span>
                                                    <span className="text-orange-400 dark:text-orange-600">batch{batchCounts[product._id] > 1 ? 'es' : ''}</span>
                                                </button>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-[10px] text-gray-400 dark:text-gray-600 font-medium">
                                                    <Boxes size={11} strokeWidth={1.5} />
                                                    No batch
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-3">{product.rackLocation || '-'}</td>
                                        <td className="p-3">{product.category || 'General'}</td>
                                        <td className={`p-3 text-right font-bold ${product.quantity === 0 ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                                            {product.quantity}
                                        </td>
                                        <td className="p-3 text-right">{product.sellingPrice?.toFixed(2)}</td>
                                        <td className="p-3 text-right">{product.nppaMrp ? product.nppaMrp.toFixed(2) : '-'}</td>
                                        <td className={`p-3 ${new Date(product.expiryDate) < new Date() ? 'text-red-500 font-bold' : ''}`}>
                                            {product.expiryDate || 'N/A'}
                                        </td>
                                        <td className="p-3">{product.manufacturingDate || '-'}</td>
                                        <td className="p-3">{calculateShelfLife(product.expiryDate)}</td>
                                        <td className="p-3">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => handleEdit(product._id)} className="p-1 hover:bg-blue-50 rounded text-blue-500 hover:text-blue-600 transition-colors" title="Edit Item">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleSingleTransfer(product)} className="p-1 hover:bg-violet-50 rounded text-violet-500 hover:text-violet-600 transition-colors" title="Transfer Stock">
                                                    <ArrowRightLeft size={14} />
                                                </button>
                                                <button onClick={() => openAdjustModal(product)} className="p-1 hover:bg-amber-50 rounded text-amber-500 hover:text-amber-600 transition-colors" title="Stock Adjustment">
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button onClick={() => navigate('/inventory/history', { state: { filter: product.sku } })} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-600 transition-colors" title="View History">
                                                    <History size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Stats Footer */}
                <div className="bg-gray-50 dark:bg-gray-800 p-3 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center text-xs">
                     <button 
                        onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                        disabled={page === 1}
                        className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                     >
                         Previous
                     </button>
                     <span className="font-medium text-gray-500">Page {page} of {totalPages}</span>
                     <button 
                         onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                         disabled={page === totalPages}
                        className="px-3 py-1 border rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                     >
                         Next
                     </button>
                </div>
            </div>

            {/* Adjust Stock Modal */}
            {showAdjustModal && selectedStock && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl transform transition-all animate-scale-up border border-white/20 dark:border-gray-700 flex flex-col max-h-[85vh]">
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50 shrink-0 rounded-t-2xl">
                            <div>
                                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Adjust Stock</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-xs">Update quantity for <span className="font-mono font-semibold">{selectedStock.batchNumber}</span></p>
                            </div>
                            <button 
                                onClick={() => setShowAdjustModal(false)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-600"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAdjustSubmit} className="flex-1 overflow-y-auto custom-scrollbar">
                            <div className="p-6 space-y-6">
                                
                                {/* Current Info */}
                                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900/30 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-sm">
                                            <Package size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Current Stock</p>
                                            <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">{selectedStock.quantity} Units</h4>
                                        </div>
                                    </div>
                                </div>

                                {/* Adjuster Info */}
                                <div className="p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-100 dark:border-gray-600 rounded-xl relative overflow-hidden group">
                                    <div className="flex items-center gap-3 relative z-10 w-full">
                                        <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-primary shadow-sm border border-gray-100 dark:border-gray-600 shrink-0">
                                            <User size={20} />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="space-y-1">
                                                <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest leading-none">Adjuster Name</p>
                                                <input 
                                                    type="text"
                                                    name="adjusterName"
                                                    value={adjustmentData.adjusterName}
                                                    onChange={handleAdjustmentChange}
                                                    placeholder="Enter adjuster name"
                                                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1.5 rounded-lg font-bold text-gray-800 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm placeholder:text-gray-400 shadow-sm"
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">Email Address</p>
                                                    <input 
                                                        type="email"
                                                        name="adjusterEmail"
                                                        value={adjustmentData.adjusterEmail}
                                                        onChange={handleAdjustmentChange}
                                                        placeholder="email@example.com"
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1.5 rounded-lg font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[11px] placeholder:text-gray-400 shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider leading-none">Mobile No.</p>
                                                    <input 
                                                        type="text"
                                                        name="adjusterMobile"
                                                        value={adjustmentData.adjusterMobile}
                                                        onChange={handleAdjustmentChange}
                                                        placeholder="Enter mobile"
                                                        className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 px-2 py-1.5 rounded-lg font-bold text-gray-600 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-[11px] placeholder:text-gray-400 shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                                        <Shield size={80} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300 block">Adjustment Type</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => handleAdjustmentChange({ target: { name: 'type', value: 'deduct' } })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                adjustmentData.type === 'deduct' 
                                                ? 'border-red-500 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400' 
                                                : 'border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <ArrowDownCircle size={24} />
                                            <span className="font-bold text-sm">Deduct Stock</span>
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => handleAdjustmentChange({ target: { name: 'type', value: 'add' } })}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                                                adjustmentData.type === 'add' 
                                                ? 'border-green-500 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                                                : 'border-gray-100 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                                            }`}
                                        >
                                            <ArrowUpCircle size={24} />
                                            <span className="font-bold text-sm">Add Stock</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Reason</label>
                                        <select 
                                            name="reason"
                                            value={adjustmentData.reason}
                                            onChange={handleAdjustmentChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm text-gray-800 dark:text-white"
                                        >
                                            {adjustmentData.type === 'deduct' ? (
                                                <>
                                                    <option value="Damage">Damaged / Broken</option>
                                                    <option value="Expired">Expired</option>
                                                    <option value="Theft">Theft / Lost</option>
                                                    <option value="Correction">Counting Correction</option>
                                                </>
                                            ) : (
                                                <>
                                                    <option value="Found">Stock Found</option>
                                                    <option value="Correction">Counting Correction</option>
                                                    <option value="Return">Customer Return</option>
                                                </>
                                            )}
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Quantity</label>
                                        <input 
                                            type="number"
                                            name="quantity"
                                            value={adjustmentData.quantity}
                                            onChange={handleAdjustmentChange}
                                            className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm font-bold text-gray-800 dark:text-white"
                                            placeholder="0"
                                            min="1"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Note</label>
                                    <textarea 
                                        name="note"
                                        value={adjustmentData.note}
                                        onChange={handleAdjustmentChange}
                                        className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-sm text-gray-800 dark:text-white resize-none h-24"
                                        placeholder="Add any additional details about this adjustment..."
                                    ></textarea>
                                </div>
                            </div>
                            
                            <div className="p-5 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-end gap-3 rounded-b-2xl">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAdjustModal(false)}
                                    className="px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-bold rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    className="px-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-secondary transition-all text-sm active:scale-95 flex items-center gap-2"
                                >
                                    <Save size={18} /> Confirm Adjustment
                                </button>
                            </div>
                        </form>
                    </div>
                </div>, 
                document.body
            )}
            
            {/* Batch Details Modal */}
            {showBatchModal && selectedProductBatches && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    <Boxes size={24} className="text-orange-600" />
                                    Batch Details
                                </h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">
                                    {selectedProductBatches.product?.name} ({selectedProductBatches.product?.sku})
                                </p>
                            </div>
                            <button onClick={() => setShowBatchModal(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {loadingBatches ? (
                                <div className="text-center py-10 text-gray-500">
                                    <div className="inline-block w-8 h-8 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin mb-2"></div>
                                    <p className="text-sm">Loading batches...</p>
                                </div>
                            ) : selectedProductBatches.batches?.length > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Total Batches</p>
                                            <p className="text-2xl font-black text-gray-800 dark:text-white">{selectedProductBatches.batches.length}</p>
                                        </div>
                                        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                            <p className="text-xs font-bold text-green-600 dark:text-green-400 uppercase">Total Stock</p>
                                            <p className="text-2xl font-black text-gray-800 dark:text-white">
                                                {selectedProductBatches.batches.reduce((sum, b) => sum + b.quantity, 0)} Units
                                            </p>
                                        </div>
                                        <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                                            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">Active Batches</p>
                                            <p className="text-2xl font-black text-gray-800 dark:text-white">
                                                {selectedProductBatches.batches.filter(b => b.status === 'Active').length}
                                            </p>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        {selectedProductBatches.batches.map((batch, idx) => (
                                            <div key={batch._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50 hover:shadow-md transition-shadow">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-500 rounded-lg flex items-center justify-center text-white font-black text-sm">
                                                            #{idx + 1}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-mono text-sm font-bold text-gray-800 dark:text-white">{batch.batchNumber}</h3>
                                                            <p className="text-xs text-gray-500">Batch ID: {batch._id.slice(-8).toUpperCase()}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                        batch.status === 'Active' ? 'bg-green-100 text-green-700' :
                                                        batch.status === 'Expired' ? 'bg-red-100 text-red-700' :
                                                        'bg-gray-100 text-gray-700'
                                                    }`}>
                                                        {batch.status}
                                                    </span>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Stock Quantity</p>
                                                        <p className="text-lg font-black text-gray-800 dark:text-white">{batch.quantity}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Expiry Date</p>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-white">
                                                            {batch.expiryDate ? new Date(batch.expiryDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold">MRP</p>
                                                        <p className="text-sm font-bold text-gray-800 dark:text-white">₹{batch.mrp || batch.sellingPrice || 0}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] text-gray-500 uppercase font-bold">Location</p>
                                                        <p className="text-sm font-bold text-cyan-600 dark:text-cyan-400">{batch.rackLocation || 'N/A'}</p>
                                                    </div>
                                                </div>
                                                
                                                {batch.manufacturingDate && (
                                                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                        <p className="text-xs text-gray-500">
                                                            <span className="font-bold">Mfg Date:</span> {new Date(batch.manufacturingDate).toLocaleDateString('en-GB')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-10 text-gray-500">
                                    <Boxes size={48} className="mx-auto mb-3 text-gray-300" />
                                    <p className="text-sm font-medium">No batches found for this product</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end bg-gray-50 dark:bg-gray-800">
                            <button 
                                onClick={() => setShowBatchModal(false)}
                                className="px-6 py-2 bg-gray-800 text-white rounded-lg text-xs font-black uppercase hover:bg-gray-900 transition-all"
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

export default InventoryMaster;
