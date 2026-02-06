import { useState, useEffect } from 'react';
import { Package, Search, CheckCircle, FileText, ArrowRight, Upload, Filter, Download, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import api from '../../api/axios';

const PutAwayBucket = () => {
    const navigate = useNavigate();
    const [purchases, setPurchases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPurchase, setSelectedPurchase] = useState(null);
    const [verifiedItems, setVerifiedItems] = useState([]);
    
    // Pagination & Stats
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(25);

    // Filters State
    const [filters, setFilters] = useState({
        skuName: '',
        batchName: '',
        priority: '',
        actionType: '',
        createdFrom: '',
        createdTo: '',
        supplierName: '',
        pickingAisle: '',
        grnNos: '', // Comma separated
        putAwayType: 'Purchase Receipt Item',
        invoiceNos: '', // Comma separated
        locationPresent: '',
        putterName: '',
        assignStatus: '',
        reason: '',
        tags: ''
    });

    // Fetch Pending Putaway Purchases
    useEffect(() => {
        fetchPendingPurchases();
    }, [page, pageSize]); // Refetch on pagination change

    const fetchPendingPurchases = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('status', 'Putaway_Pending');
            params.append('pageNumber', page);
            params.append('pageSize', pageSize);

            // Append all filters if present
            Object.keys(filters).forEach(key => {
                if (filters[key]) params.append(key, filters[key]);
            });

            const { data } = await api.get(`/purchases?${params.toString()}`);
            if (data.success) {
                setPurchases(data.purchases);
                setTotalPages(data.pages);
                setTotalRecords(data.total);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to fetch putaway tasks', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleFetchRecord = () => {
        setPage(1); // Reset to page 1 on new filter
        fetchPendingPurchases();
    };

    const handleSelectPurchase = (purchase) => {
        setSelectedPurchase(purchase);
        // Deep copy items to avoid direct mutation
        setVerifiedItems(JSON.parse(JSON.stringify(purchase.items)));
    };

    const handleCSVUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                if (results.errors.length) {
                    Swal.fire('Error', 'CSV Parse Error', 'error');
                    return;
                }
                
                const csvData = results.data;
                const newItems = [...verifiedItems];
                let matchCount = 0;

                csvData.forEach(row => {
                    // Try to match by SKU or Name
                    const itemIndex = newItems.findIndex(item => 
                        (item.productName && row['Medicine Name'] && item.productName.toLowerCase() === row['Medicine Name'].trim().toLowerCase()) ||
                        (item.skuId && row['SKU'] && item.skuId === row['SKU'])
                    );

                    if (itemIndex > -1) {
                        matchCount++;
                        if (row['Quantity']) newItems[itemIndex].receivedQty = Number(row['Quantity']);
                        if (row['Rack']) newItems[itemIndex].rack = row['Rack'];
                    }
                });

                setVerifiedItems(newItems);
                Swal.fire('Success', `Updated ${matchCount} items from CSV`, 'success');
            }
        });
        e.target.value = ''; // Reset input
    };

    const handleCompletePutAway = async () => {
        if (!selectedPurchase) return;

        const result = await Swal.fire({
            title: 'Complete Put Away?',
            text: "This will make the stock LIVE in inventory.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, Make Live!'
        });

        if (result.isConfirmed) {
            try {
                const { data } = await api.put(`/purchases/${selectedPurchase._id}/putaway`, {
                    items: verifiedItems
                });
                
                if (data.success) {
                    Swal.fire('Success', 'Stock is now LIVE!', 'success');
                    setSelectedPurchase(null);
                    fetchPendingPurchases();
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleDownloadCSV = () => {
        if (purchases.length === 0) {
            Swal.fire('Info', 'No records to download', 'info');
            return;
        }

        const csvRows = [];
        // Header
        csvRows.push(['Invoice Number', 'Supplier', 'Product Name', 'SKU', 'Batch', 'Expiry', 'Received Qty', 'Rack', 'Status']);

        purchases.forEach(p => {
            p.items.forEach(item => {
                csvRows.push([
                    p.invoiceNumber,
                    p.supplierId?.name || '',
                    item.productName,
                    item.skuId || '',
                    item.batchNumber,
                    item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : '',
                    item.receivedQty,
                    item.rack || '',
                    'Pending'
                ]);
            });
        });

        const csvString = Papa.unparse(csvRows);
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, `PutAway_Pending_${new Date().toLocaleDateString()}.csv`);
    };

    const handleBulkPutAwayUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                if (results.errors.length) {
                    Swal.fire('Error', 'CSV Parse Error', 'error');
                    return;
                }
                
                // Expected headers: Invoice Number, SKU, Rack (at least)
                const itemsToUpdate = results.data.map(row => ({
                    invoiceNumber: row['Invoice Number'],
                    sku: row['SKU'],
                    productName: row['Product Name'], // Fallback if SKU is missing/incorrect
                    rack: row['Rack'],
                    quantity: row['Received Qty'] // Optional
                })).filter(i => i.invoiceNumber && (i.sku || i.productName) && i.rack); // Filter valid rows

                if (itemsToUpdate.length === 0) {
                    Swal.fire('Warning', 'No valid rows found. Ensure CSV has "Invoice Number", "SKU" (or "Product Name"), and "Rack" columns.', 'warning');
                    return;
                }

                try {
                    setLoading(true);
                    const { data } = await api.post('/purchases/bulk-putaway-upload', { items: itemsToUpdate });
                    if (data.success) {
                        Swal.fire('Success', data.message, 'success');
                        fetchPendingPurchases(); // Refresh list
                    }
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'Upload failed', 'error');
                } finally {
                    setLoading(false);
                }
            }
        });
        e.target.value = '';
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Package className="text-primary" /> Put Away
            </h1>

            {!selectedPurchase ? (
                <>
                {/* Filter Section */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex items-center gap-4">
                         <span className="text-sm font-bold text-gray-500 whitespace-nowrap w-24">Filter results:</span>
                         
                         {/* Row 1 */}
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                             <input name="skuName" value={filters.skuName} onChange={handleFilterChange} placeholder="SKU Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <input name="batchName" value={filters.batchName} onChange={handleFilterChange} placeholder="Batch Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <input name="priority" value={filters.priority} onChange={handleFilterChange} placeholder="Priority" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <select name="actionType" value={filters.actionType} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-500">
                                 <option value="">Action Type</option>
                                 <option value="Standard">Standard</option>
                             </select>
                         </div>
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                             <input type="date" name="createdFrom" value={filters.createdFrom} onChange={handleFilterChange} placeholder="Created From" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-500" />
                             <input type="date" name="createdTo" value={filters.createdTo} onChange={handleFilterChange} placeholder="Created To" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-500" />
                             <input name="supplierName" value={filters.supplierName} onChange={handleFilterChange} placeholder="Supplier Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <input name="pickingAisle" value={filters.pickingAisle} onChange={handleFilterChange} placeholder="Picking Aisle" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                         </div>
                    </div>

                    <div className="flex items-center gap-4 pl-[8rem]"> {/* Indent to align with inputs above */}
                         {/* Row 2 */}
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                             <input name="grnNos" value={filters.grnNos} onChange={handleFilterChange} placeholder="GRN Nos. (Comma Separated)" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <select name="putAwayType" value={filters.putAwayType} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white font-medium">
                                 <option value="Purchase Receipt Item">Purchase Receipt Item</option>
                                 <option value="Sales Return Receiving">Sales Return Receiving</option>
                                 <option value="Pr Item Return">Pr Item Return</option>
                                 <option value="Inventory">Inventory</option>
                                 <option value="Phlebo Inventory">Phlebo Inventory</option>
                             </select>
                             <input name="invoiceNos" value={filters.invoiceNos} onChange={handleFilterChange} placeholder="Invoice Nos. (Comma Separated)" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <select name="locationPresent" value={filters.locationPresent} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-500">
                                 <option value="">Location Present</option>
                                 <option value="Yes">Yes</option>
                                 <option value="No">No</option>
                             </select>
                         </div>
                         <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-3">
                             <input name="putterName" value={filters.putterName} onChange={handleFilterChange} placeholder="Putter Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             <select name="assignStatus" value={filters.assignStatus} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-500">
                                 <option value="">Assign Status</option>
                                 <option value="Assigned">Assigned</option>
                                 <option value="Unassigned">Unassigned</option>
                             </select>
                         </div>
                    </div>

                    <div className="flex items-center gap-4 pl-[8rem]">
                        {/* Row 3 */}
                        <div className="flex-1 flex items-center gap-3 max-w-2xl">
                             <select name="reason" value={filters.reason} onChange={handleFilterChange} className="w-1/3 px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-gray-500">
                                 <option value="">Reason</option>
                                 <option value="Damaged">Damaged</option>
                                 <option value="Expiry">Expiry</option>
                             </select>
                             <input name="tags" value={filters.tags} onChange={handleFilterChange} placeholder="Tags" className="w-1/3 px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                             
                             <button 
                                onClick={handleFetchRecord}
                                className="px-6 py-2 bg-cyan-500 text-white font-bold rounded-md text-sm hover:bg-cyan-600 shadow-md transition-colors"
                             >
                                 Fetch Record
                             </button>
                        </div>
                    </div>
                </div>

                 {/* Results & Actions Bar */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-2">
                    <div className="text-gray-500 text-sm">
                        Showing {(page - 1) * pageSize} - {Math.min(page * pageSize, totalRecords)} of {totalRecords} results
                    </div>
                    <div className="flex items-center gap-3">
                         <div className="flex items-center gap-2">
                             <span className="text-sm font-bold text-gray-500">Records per page</span>
                             <select 
                                value={pageSize} 
                                onChange={(e) => setPageSize(Number(e.target.value))}
                                className="px-2 py-1 border rounded bg-white dark:bg-gray-700 dark:border-gray-600 text-sm"
                             >
                                 <option value={10}>10</option>
                                 <option value={25}>25</option>
                                 <option value={50}>50</option>
                                 <option value={100}>100</option>
                             </select>
                         </div>
                         <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 font-bold rounded text-sm hover:bg-gray-300 cursor-not-allowed">
                             Assign Putter
                         </button>
                         
                         {/* Bulk Upload trigger */}
                         <div className="relative">
                            <input 
                                type="file" 
                                accept=".csv" 
                                onChange={handleBulkPutAwayUpload}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <button className="px-4 py-2 bg-cyan-500 text-white font-bold rounded text-sm hover:bg-cyan-600 shadow-md flex items-center gap-1">
                                Upload Put Away <Upload size={14} />
                            </button>
                         </div>

                         <button 
                            onClick={handleDownloadCSV}
                            className="p-2 border border-cyan-500 text-cyan-500 rounded-full hover:bg-cyan-50 transition-colors"
                            title="Download CSV"
                         >
                             <Download size={16} />
                         </button>
                    </div>
                </div>

                {/* List View */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-bold border-b dark:border-gray-700">
                                <tr>
                                    <th className="p-4">Invoice No</th>
                                    <th className="p-4">Supplier</th>
                                    <th className="p-4">Items</th>
                                    <th className="p-4">Total Amount</th>
                                    <th className="p-4">Date</th>
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-500">Loading...</td></tr>
                                ) : purchases.length === 0 ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-500">No items pending for Put Away</td></tr>
                                ) : (
                                    purchases.map(purchase => (
                                        <tr key={purchase._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="p-4 font-black text-gray-700 dark:text-gray-200">{purchase.invoiceNumber}</td>
                                            <td className="p-4 text-sm font-medium">{purchase.supplierId?.name || 'Unknown'}</td>
                                            <td className="p-4 text-sm"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{purchase.items.length} items</span></td>
                                            <td className="p-4 font-mono text-sm">₹{purchase.grandTotal.toLocaleString()}</td>
                                            <td className="p-4 text-sm text-gray-500">{new Date(purchase.invoiceDate).toLocaleDateString()}</td>
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => handleSelectPurchase(purchase)}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 flex items-center gap-2 border border-blue-200"
                                                >
                                                    Start Put Away <ArrowRight size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center gap-2 pb-8">
                        <button 
                            onClick={() => setPage(p => Math.max(1, p - 1))} 
                            disabled={page === 1}
                            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1 text-sm flex items-center">Page {page} of {totalPages}</span>
                        <button 
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))} 
                            disabled={page === totalPages}
                            className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                )}
                </>
            ) : (
                // Detail/Action View
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col h-[calc(100vh-140px)] animate-fade-in-up">
                     <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800">
                         <div>
                             <button onClick={() => setSelectedPurchase(null)} className="text-sm text-gray-500 hover:underline mb-1 flex items-center gap-1">← Back to List</button>
                             <h2 className="text-xl font-black flex items-center gap-2 text-gray-800 dark:text-white">
                                 Invoice: {selectedPurchase.invoiceNumber}
                                 <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200">Waitlist</span>
                             </h2>
                             <p className="text-sm text-gray-500">Verify items and location before making live</p>
                         </div>
                         <div className="flex gap-3">
                             {/* CSV Upload */}
                             <div className="relative">
                                 <input 
                                    type="file" 
                                    accept=".csv"
                                    onChange={handleCSVUpload}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                 />
                                 <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                     <Upload size={16} /> Upload CSV
                                 </button>
                             </div>
                             
                             <button 
                                onClick={handleCompletePutAway}
                                className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 shadow-md flex items-center gap-2 transition-transform active:scale-95"
                             >
                                 <CheckCircle size={18} /> Complete & Make Live
                             </button>
                         </div>
                     </div>

                     <div className="flex-1 overflow-auto p-0 scrollbar-hide">
                         <table className="w-full text-left">
                             <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-bold text-gray-500 uppercase sticky top-0 z-10 backdrop-blur-sm border-b dark:border-gray-700">
                                 <tr>
                                     <th className="p-4">Product Name</th>
                                     <th className="p-4">Batch</th>
                                     <th className="p-4">Expiry</th>
                                     <th className="p-4">Qty (Received)</th>
                                     <th className="p-4">Free</th>
                                     <th className="p-4">Rack/Bin</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                 {verifiedItems.map((item, idx) => (
                                     <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                         <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{item.productName}</td>
                                         <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.batchNumber}</td>
                                         <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                         <td className="p-4 font-bold text-blue-600">{item.receivedQty}</td>
                                         <td className="p-4 text-gray-500">{item.physicalFreeQty}</td>
                                         <td className="p-4">
                                             <input 
                                                type="text" 
                                                placeholder="Enter Rack"
                                                className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm w-32 bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                                value={item.rack || ''}
                                                onChange={(e) => {
                                                    const updated = [...verifiedItems];
                                                    updated[idx].rack = e.target.value;
                                                    setVerifiedItems(updated);
                                                }}
                                             />
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                </div>
            )}
        </div>
    );
};

export default PutAwayBucket;
