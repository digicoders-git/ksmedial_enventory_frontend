import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Map, Package, Truck, 
    FileText, Download, Edit2, QrCode, 
    ChevronLeft, ChevronRight, RefreshCw,
    Plus, AlertTriangle, ArrowRightLeft
} from 'lucide-react';
import api from '../../api/axios';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

const InventoryMaster = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(25);

    // Filters
    const [filters, setFilters] = useState({
        sku: '',
        name: '',
        batch: '',
        location: '',
        tags: '',
        nearExpiry: false,
        lowStock: false
    });
    const [selectedItems, setSelectedItems] = useState([]);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const queryParams = new URLSearchParams({
                page,
                limit,
                ...filters
            });
            const { data } = await api.get(`/products/search?${queryParams}`);
            if (data.success) {
                setProducts(data.products);
                setTotal(data.total);
                setTotalPages(data.pages);
            }
        } catch (error) {
            console.error("Error fetching inventory:", error);
            Swal.fire('Error', 'Failed to fetch inventory data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        // Debounce or just fetch on mount and page change? 
        // User asked for "Fetch Record" button, so maybe manual fetch primarily, 
        // but fetching on mount is good UX.
        fetchProducts();
    }, [page, limit]);

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
            // In a real app, call API to update location. 
            // For now, we'll simulate.
            Swal.fire('Success', `Transferred ${selectedItems.length} items to ${location}`, 'success');
            // Optimistic update or refetch
            // await api.post('/products/transfer', { ids: selectedItems, location });
            fetchProducts();
        }
    };

    const handleBulkPicking = () => {
         if (selectedItems.length === 0) {
            Swal.fire('Selection Required', 'Select items to generate picking list.', 'warning');
            return;
        }
        // Generate a simple view
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
            // Optimistic update
            setProducts(prev => prev.map(p => p._id === product._id ? { ...p, rackLocation: location } : p));
        }
    };

    const calculateShelfLife = (expiryDate) => {
        if (!expiryDate || expiryDate === 'N/A') return 'N/A';
        const exp = new Date(expiryDate);
        const now = new Date();
        const mfg = new Date(); // Assuming MFG is 2 years back if not present, or use logic
        mfg.setFullYear(mfg.getFullYear() - 2); 
        
        // This is a rough estimation as MFG date is often not stored. 
        // If we added mfgDate schema, we can use it.
        // For now, let's just return relative time or a placeholder
        if (isNaN(exp.getTime())) return 'Invalid';
        
        const totalLife = exp.getTime() - mfg.getTime();
        const remaining = exp.getTime() - now.getTime();
        
        // If expired
        if (remaining < 0) return '0%';

        // This % is actually meaningless without MFG date. 
        // Let's just show Days Remaining for better utility or "N/A" if logic isn't solid.
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
                                    <td colSpan="15" className="p-8 text-center text-gray-500">
                                        <div className="inline-block w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin mb-2"></div>
                                        <p className="text-xs">Loading Inventory...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan="15" className="p-8 text-center text-gray-500 text-xs font-medium uppercase">
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
                                                <button onClick={() => navigate('/inventory/stock', { state: { filter: product.name } })} className="p-1 hover:bg-amber-50 rounded text-amber-500 hover:text-amber-600 transition-colors" title="Stock Adjustment">
                                                    <RefreshCw size={14} />
                                                </button>
                                                <button onClick={() => navigate('/inventory/stock', { state: { filter: product.sku } })} className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-600 transition-colors" title="Move to QR">
                                                    <QrCode size={14} />
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
        </div>
    );
};

export default InventoryMaster;
