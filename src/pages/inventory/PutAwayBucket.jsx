import React, { useState, useEffect } from 'react';
import { Package, Search, CheckCircle, FileText, ArrowRight, Upload, Filter, Download, UserPlus, RotateCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import Papa from 'papaparse';
import { saveAs } from 'file-saver';
import api from '../../api/axios';

const PutAwayBucket = () => {
    const navigate = useNavigate();
    
    // Original State Structure
    const [purchases, setPurchases] = useState([]);
    const [saleReturns, setSaleReturns] = useState([]); // Store returns too
    const [adjustments, setAdjustments] = useState([]); // Store stock adjustments

    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState(null); 
    const [verifiedItems, setVerifiedItems] = useState([]);
    
    // Pagination & Stats
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);
    const [pageSize, setPageSize] = useState(25);

    // Initial Filters (Restored to original + putAwayType)
    const [filters, setFilters] = useState({
        skuName: '',
        batchName: '',
        priority: '',
        actionType: '',
        createdFrom: '',
        createdTo: '',
        supplierName: '',
        pickingAisle: '',
        grnNos: '', 
        putAwayType: 'Purchase Receipt Item', // Default
        invoiceNos: '', 
        locationPresent: '',
        putterName: '',
        assignStatus: '',
        reason: '',
        tags: ''
    });

    // Fetch Data based on filters.putAwayType
    useEffect(() => {
        if (filters.putAwayType === 'Sales Return Receiving') {
            fetchPendingSaleReturns();
        } else if (filters.putAwayType === 'Stock Adjustment') {
            fetchPendingAdjustments();
        } else {
            fetchPendingPurchases();
        }
    }, [page, pageSize, filters.putAwayType]); // Re-fetch when Type changes

    const fetchPendingPurchases = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.append('status', 'Putaway_Pending');
            params.append('pageNumber', page);
            params.append('pageSize', pageSize);

            // Append all filters
            Object.keys(filters).forEach(key => {
                if (filters[key] && key !== 'putAwayType') params.append(key, filters[key]);
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

    const fetchPendingSaleReturns = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/sales/returns', {
                params: {
                    status: 'Putaway_Pending',
                    page,
                    limit: pageSize
                }
            });
            if (data.success) {
                setSaleReturns(data.returns);
                setTotalPages(data.pages);
                setTotalRecords(data.total);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to fetch sales returns', 'error');
        } finally {
            setLoading(false);
        }
    };

    const fetchPendingAdjustments = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/products/putaway/pending');
            if (data.success) {
                setAdjustments(data.logs);
                // Adjustments endpoint currently doesn't support pagination, so we set defaults
                setTotalPages(1); 
                setTotalRecords(data.logs.length);
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to fetch adjustments', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        // If type changes, reset page to 1
        if (name === 'putAwayType') setPage(1);
    };

    const handleFetchRecord = () => {
        setPage(1);
        if (filters.putAwayType === 'Sales Return Receiving') fetchPendingSaleReturns();
        else if (filters.putAwayType === 'Stock Adjustment') fetchPendingAdjustments();
        else fetchPendingPurchases();
    };

    const handleSelect = (item) => {
        setSelectedItem(item);
        if (filters.putAwayType === 'Stock Adjustment') {
            // Transform adjustment log to match verifiedItems structure (array of items)
            setVerifiedItems([{
                _id: item.productId._id,
                productName: item.productName || item.productId.name,
                skuId: item.productId.sku,
                batchNumber: item.batchNumber,
                expiryDate: item.productId.expiryDate,
                receivedQty: item.quantity,
                rack: item.productId.rackLocation || '', // Default to current loc
                price: item.productId.purchasePrice
            }]);
        } else {
            setVerifiedItems(JSON.parse(JSON.stringify(item.items)));
        }
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
                    const itemIndex = newItems.findIndex(item => 
                        (item.productName && row['Medicine Name'] && item.productName.toLowerCase() === row['Medicine Name'].trim().toLowerCase()) ||
                        (item.name && row['Medicine Name'] && item.name.toLowerCase() === row['Medicine Name'].trim().toLowerCase()) || 
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
        e.target.value = ''; 
    };

    const handleCompletePutAway = async () => {
        if (!selectedItem) return;

        if (filters.putAwayType === 'Sales Return Receiving') {
            handleCompleteSaleReturn();
            return;
        }
        
        if (filters.putAwayType === 'Stock Adjustment') {
            handleCompleteAdjustment();
            return;
        }

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
                const { data } = await api.put(`/purchases/${selectedItem._id}/putaway`, {
                    items: verifiedItems
                });
                
                if (data.success) {
                    Swal.fire({
                        title: 'Success!',
                        text: 'Stock is now LIVE! What would you like to do next?',
                        icon: 'success',
                        showCancelButton: true,
                        confirmButtonText: 'View Stock List',
                        cancelButtonText: 'Stay Here',
                        reverseButtons: true
                    }).then((result) => {
                        if (result.isConfirmed) {
                            navigate('/inventory/master');
                        } else {
                            setSelectedItem(null);
                            fetchPendingPurchases();
                        }
                    });
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleCompleteSaleReturn = async () => {
        const result = await Swal.fire({
            title: 'Complete Return Put Away?',
            text: "This will update stock and mark return as refunded/completed.",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6B7280',
            confirmButtonText: 'Yes, Restock!',
        });

        if (result.isConfirmed) {
            try {
                const { data } = await api.put(`/sales/returns/${selectedItem._id}/putaway`, { items: verifiedItems });

                if (data.success) {
                    Swal.fire('Restocked!', 'Stock updated based on return items.', 'success');
                    setSelectedItem(null);
                    fetchPendingSaleReturns();
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleCompleteAdjustment = async () => {
        const result = await Swal.fire({
            title: 'Complete Stock Entry?',
            text: "This will make the stock LIVE in inventory.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#10b981',
            confirmButtonText: 'Yes, Make Live!'
        });

        if (result.isConfirmed) {
            try {
                // For adjustment, we only process the first item in verifiedItems (since 1 log = 1 item)
                const item = verifiedItems[0];
                const { data } = await api.put(`/products/putaway/complete/${selectedItem._id}`, { 
                    rackLocation: item.rack 
                });

                if (data.success) {
                    Swal.fire('Success!', 'Stock added to inventory.', 'success');
                    setSelectedItem(null);
                    fetchPendingAdjustments();
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed', 'error');
            }
        }
    };

    const handleDownloadPendingReport = async () => {
        let reportData = [];
        const reportType = filters.putAwayType;
        
        Swal.fire({ title: 'Generating Report...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

        try {
            if (reportType === 'Purchase Receipt Item') {
                const params = new URLSearchParams();
                params.append('status', 'Putaway_Pending');
                params.append('pageNumber', 1);
                params.append('pageSize', 10000); // Fetch all/many for report
                
                Object.keys(filters).forEach(key => {
                    if (filters[key] && key !== 'putAwayType') params.append(key, filters[key]);
                });

                const { data } = await api.get(`/purchases?${params.toString()}`);
                if (data.success) reportData = data.purchases;

            } else if (reportType === 'Sales Return Receiving') {
                 const { data } = await api.get('/sales/returns', {
                    params: {
                        status: 'Putaway_Pending',
                        page: 1,
                        limit: 10000 
                    }
                });
                if (data.success) reportData = data.returns;
            } else if (reportType === 'Stock Adjustment') {
                const { data } = await api.get('/products/putaway/pending');
                if (data.success) reportData = data.logs;
            }

            if (!reportData || reportData.length === 0) {
                Swal.close();
                Swal.fire('Info', 'No pending records found to download.', 'info');
                return;
            }

            const csvRows = [];
            if (reportType === 'Purchase Receipt Item') {
                csvRows.push(['Invoice Number', 'Supplier', 'Product Name', 'SKU', 'Batch', 'Expiry', 'Received Qty', 'Rack', 'Status']);
                reportData.forEach(p => {
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
                            'Pending Putaway'
                        ]);
                    });
                });
            } else if (reportType === 'Stock Adjustment') {
                csvRows.push(['Log ID', 'Product Name', 'Batch', 'Quantity', 'Adjusted By', 'Date']);
                reportData.forEach(item => {
                    csvRows.push([
                        `#${item._id.slice(-6).toUpperCase()}`,
                        item.productName,
                        item.batchNumber,
                        item.quantity,
                        item.adjustedByName,
                        new Date(item.date).toLocaleDateString()
                    ]);
                });
            } else {
                csvRows.push(['Return Number', 'Ref Invoice', 'Customer', 'Product Name', 'Return Qty', 'Status']);
                reportData.forEach(r => {
                    r.items.forEach(item => {
                        csvRows.push([
                            r.returnNumber,
                            r.invoiceNumber,
                            r.customerName,
                            item.name,
                            item.quantity,
                            'Pending Putaway'
                        ]);
                    });
                });
            }

            const csvString = Papa.unparse(csvRows);
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, `PutAway_Pending_Report_${reportType.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
            
            Swal.close();
            Swal.fire({
                icon: 'success', 
                title: 'Report Downloaded',
                text: `${reportData.length} records exported.`,
                timer: 1500,
                showConfirmButton: false
            });

        } catch (error) {
            Swal.close();
            console.error("Report Generation Error", error);
            Swal.fire('Error', 'Failed to generate report', 'error');
        }
    };

    const handleBulkPutAwayUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                 if (filters.putAwayType === 'Sales Return Receiving') {
                     Swal.fire('Info', 'Bulk upload for sales returns not yet supported.', 'info');
                     return;
                 }
                
                if (results.errors.length) {
                    Swal.fire('Error', 'CSV Parse Error', 'error');
                    return;
                }
                
                const itemsToUpdate = results.data.map(row => ({
                    invoiceNumber: row['Invoice Number'],
                    sku: row['SKU'],
                    productName: row['Product Name'], 
                    rack: row['Rack'],
                    quantity: row['Received Qty'] 
                })).filter(i => i.invoiceNumber && (i.sku || i.productName) && i.rack); 

                if (itemsToUpdate.length === 0) {
                    Swal.fire('Warning', 'No valid rows found.', 'warning');
                    return;
                }

                try {
                    setLoading(true);
                    const { data } = await api.post('/purchases/bulk-putaway-upload', { items: itemsToUpdate });
                    if (data.success) {
                        Swal.fire('Success', data.message, 'success');
                        fetchPendingPurchases(); 
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

    const [locations, setLocations] = useState([]);
    const [showLocationModal, setShowLocationModal] = useState(false);
    const [newLocationData, setNewLocationData] = useState({
        aisle: '', rack: '', shelf: '', bin: '', category: 'Picking'
    });
    const [pendingLocationIndex, setPendingLocationIndex] = useState(null); 

    useEffect(() => {
        fetchLocations();
    }, []);

    const fetchLocations = async () => {
        try {
            const { data } = await api.get('/locations?pageSize=1000'); 
            if (data.success) {
                setLocations(data.locations);
            }
        } catch (error) {
            console.error("Failed to fetch locations", error);
        }
    };

    const handleCreateLocation = async () => {
        try {
            const { aisle, rack, shelf, bin, category } = newLocationData;
            if (!aisle || !rack || !shelf || !bin) {
                Swal.fire('Error', 'Please fill all location fields (Aisle, Rack, Shelf, Bin)', 'error');
                return;
            }
            
            const { data } = await api.post('/locations', newLocationData);
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Location Created',
                    text: `Code: ${data.location.locationCode}`,
                    timer: 1500,
                    showConfirmButton: false
                });
                
                await fetchLocations();
                
                if (pendingLocationIndex !== null) {
                    const updatedItems = [...verifiedItems];
                    updatedItems[pendingLocationIndex].rack = data.location.locationCode;
                    setVerifiedItems(updatedItems);
                }
                
                setShowLocationModal(false);
                setNewLocationData({ aisle: '', rack: '', shelf: '', bin: '', category: 'Picking' });
                setPendingLocationIndex(null);
            }
        } catch (error) {
            Swal.fire('Error', error.response?.data?.message || 'Failed to create location', 'error');
        }
    };

    const LocationInput = ({ value, onChange, onCreateRequest }) => {
        const [query, setQuery] = useState(value || '');
        const [showDropdown, setShowDropdown] = useState(false);
        const wrapperRef = React.useRef(null);
        
        const filtered = locations.filter(l => 
            l.locationCode.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 10); 
        
        useEffect(() => {
            function handleClickOutside(event) {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                    setShowDropdown(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, []);

        const handleSelect = (code) => {
            setQuery(code);
            onChange(code);
            setShowDropdown(false);
        };

        return (
            <div className="relative w-40" ref={wrapperRef}>
                <input 
                    type="text" 
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        onChange(e.target.value); 
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                    placeholder="Search/Add Loc"
                    className="w-full px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all uppercase font-bold"
                />
                
                {showDropdown && (
                    <div className="absolute z-50 w-64 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-xl max-h-48 overflow-y-auto custom-scrollbar animate-fade-in-up right-0 translate-x-2 md:translate-x-0">
                        {filtered.length > 0 && (
                            filtered.map(loc => (
                                <div 
                                    key={loc._id} 
                                    onClick={() => handleSelect(loc.locationCode)}
                                    className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-700 last:border-0"
                                >
                                    <span className="font-bold text-primary">{loc.locationCode}</span>
                                    <span className="text-xs text-gray-400 ml-2">({loc.category})</span>
                                </div>
                            ))
                        )}
                        <div className="p-2 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 sticky bottom-0">
                            <button 
                                onClick={() => {
                                    setShowDropdown(false);
                                    onCreateRequest();
                                }}
                                className="px-3 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-md text-xs font-bold hover:bg-blue-200 dark:hover:bg-blue-900/50 w-full flex items-center justify-center gap-1 transition-colors"
                            >
                                <UserPlus size={14} /> Add "{query}" as New
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen space-y-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Package className="text-primary" /> Put Away Bucket
            </h1>

            {!selectedItem ? (
                <>
                {/* Filter Section - Restored to original layout */}
                <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                        <span className="text-sm font-bold text-gray-500 whitespace-nowrap lg:w-24 lg:pt-2">Filter results:</span>
                        
                        <div className="flex-1 w-full space-y-4">
                            {/* Row 1 */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input name="skuName" value={filters.skuName} onChange={handleFilterChange} placeholder="SKU Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <input name="batchName" value={filters.batchName} onChange={handleFilterChange} placeholder="Batch Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <select name="priority" value={filters.priority} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="">Priority</option>
                                    <option value="High">High</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Low">Low</option>
                                </select>
                                <select name="actionType" value={filters.actionType} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="">Action Type</option>
                                    <option value="PutAway">Put Away</option>
                                    <option value="Return">Return</option>
                                </select>
                            </div>

                            {/* Row 2 */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input name="createdFrom" type="date" value={filters.createdFrom} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <input name="createdTo" type="date" value={filters.createdTo} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <input name="supplierName" value={filters.supplierName} onChange={handleFilterChange} placeholder="Supplier Name" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <input name="pickingAisle" value={filters.pickingAisle} onChange={handleFilterChange} placeholder="Picking Aisle" className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                            </div>

                             {/* Row 3 */}
                             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                <input name="grnNos" value={filters.grnNos} onChange={handleFilterChange} placeholder="GRN Nos." className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <select name="putAwayType" value={filters.putAwayType} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white font-bold text-primary">
                                    <option value="Purchase Receipt Item">Purchase Receipt Item</option>
                                    <option value="Sales Return Receiving">Sales Return Receiving</option>
                                    <option value="Stock Adjustment">Stock Adjustment</option>
                                    <option value="Stock Transfer">Stock Transfer</option>
                                </select>
                                <input name="invoiceNos" value={filters.invoiceNos} onChange={handleFilterChange} placeholder="Invoice Nos." className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
                                <select name="locationPresent" value={filters.locationPresent} onChange={handleFilterChange} className="w-full px-3 py-2 border rounded-md text-sm outline-none focus:ring-1 focus:ring-blue-500 bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                                    <option value="">Location Present</option>
                                    <option value="Yes">Yes</option>
                                    <option value="No">No</option>
                                </select>
                            </div>
                            
                            <div className="flex justify-end pt-2">
                                <button 
                                    onClick={handleFetchRecord}
                                    className="w-full sm:w-auto px-8 py-2.5 bg-cyan-500 text-white font-bold rounded-xl text-sm hover:bg-cyan-600 shadow-md transition-colors"
                                >
                                    Fetch Record
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                 {/* Results & Actions Bar */}
                <div className="flex flex-col xl:flex-row justify-between items-center gap-4 pt-2">
                    <div className="text-gray-500 text-sm font-medium order-2 xl:order-1">
                        Showing {(page - 1) * pageSize} - {Math.min(page * pageSize, totalRecords)} of {totalRecords} results
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto order-1 xl:order-2">
                         <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                             <span className="text-sm font-bold text-gray-500">Rows:</span>
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
                         
                         <div className="flex gap-2 w-full sm:w-auto">
                            {/* Bulk Upload trigger (Purchases only for now) */}
                            {filters.putAwayType === 'Purchase Receipt Item' && (
                                <div className="relative flex-1 sm:flex-none">
                                    <input 
                                        type="file" 
                                        accept=".csv" 
                                        onChange={handleBulkPutAwayUpload}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button className="w-full px-4 py-2 bg-cyan-500 text-white font-bold rounded-lg text-sm hover:bg-cyan-600 shadow-md flex items-center justify-center gap-1 whitespace-nowrap">
                                        Upload <Upload size={14} />
                                    </button>
                                </div>
                            )}

                             <button 
                                onClick={handleDownloadPendingReport}
                                className="px-5 py-2 bg-indigo-500 text-white font-bold rounded-xl text-sm hover:bg-indigo-400 hover:shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all active:scale-95 whitespace-nowrap"
                                title="Download Pending Report"
                             >
                                 <Download size={18} /> Report
                             </button>
                         </div>
                    </div>
                </div>

                {/* List View */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left hidden md:table">
                            <thead className="bg-gray-100 dark:bg-gray-700/50 text-xs uppercase text-gray-500 font-bold border-b dark:border-gray-700">
                                <tr>
                                    {filters.putAwayType === 'Purchase Receipt Item' ? (
                                        <>
                                            <th className="p-4">Invoice No</th>
                                            <th className="p-4">Supplier</th>
                                            <th className="p-4">Items</th>
                                            <th className="p-4">Total Amount</th>
                                            <th className="p-4">Date</th>
                                        </>
                                    ) : filters.putAwayType === 'Stock Adjustment' ? (
                                        <>
                                            <th className="p-4">Log ID</th>
                                            <th className="p-4">Product Name</th>
                                            <th className="p-4">Batch</th>
                                            <th className="p-4">Quantity</th>
                                            <th className="p-4">Adjuster</th>
                                            <th className="p-4">Date</th>
                                        </>
                                    ) : (
                                        <>
                                            <th className="p-4">Return ID</th>
                                            <th className="p-4">Ref Invoice</th>
                                            <th className="p-4">Customer</th>
                                            <th className="p-4">Items</th>
                                            <th className="p-4">Refund Amount</th>
                                            <th className="p-4">Date</th>
                                        </>
                                    )}
                                    <th className="p-4">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-500">Loading...</td></tr>
                                ) : (filters.putAwayType === 'Purchase Receipt Item' ? purchases : filters.putAwayType === 'Stock Adjustment' ? adjustments : saleReturns).length === 0 ? (
                                    <tr><td colSpan="6" className="p-10 text-center text-gray-500">No items pending for Put Away</td></tr>
                                ) : (
                                    (filters.putAwayType === 'Purchase Receipt Item' ? purchases : filters.putAwayType === 'Stock Adjustment' ? adjustments : saleReturns).map(item => (
                                        <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            {filters.putAwayType === 'Purchase Receipt Item' ? (
                                                <>
                                                    <td className="p-4 font-black text-gray-700 dark:text-gray-200">{item.invoiceNumber}</td>
                                                    <td className="p-4 text-sm font-medium">{item.supplierId?.name || 'Unknown'}</td>
                                                    <td className="p-4 text-sm"><span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-bold">{item.items.length} items</span></td>
                                                    <td className="p-4 font-mono text-sm">₹{item.grandTotal?.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-gray-500">{new Date(item.invoiceDate).toLocaleDateString()}</td>
                                                </>
                                            ) : filters.putAwayType === 'Stock Adjustment' ? (
                                                <>
                                                    <td className="p-4 font-black text-green-600">#{item._id.slice(-6).toUpperCase()}</td>
                                                    <td className="p-4 font-medium">{item.productName}</td>
                                                    <td className="p-4 font-mono text-xs">{item.batchNumber}</td>
                                                    <td className="p-4 font-bold text-gray-900 dark:text-white">{item.quantity}</td>
                                                    <td className="p-4 text-sm text-gray-500">{item.adjustedByName}</td>
                                                    <td className="p-4 text-sm text-gray-500">{new Date(item.date).toLocaleDateString()}</td>
                                                </>
                                            ) : (
                                                <>
                                                    <td className="p-4 font-black text-red-600">{item.returnNumber}</td>
                                                    <td className="p-4 text-xs font-mono">{item.invoiceNumber}</td>
                                                    <td className="p-4 text-sm font-medium">{item.customerName || 'Walk-in'}</td>
                                                    <td className="p-4 text-sm"><span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">{item.items.length} items</span></td>
                                                    <td className="p-4 font-mono text-sm">₹{item.totalAmount?.toLocaleString()}</td>
                                                    <td className="p-4 text-sm text-gray-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                                                </>
                                            )}
                                            <td className="p-4">
                                                <button 
                                                    onClick={() => handleSelect(item)}
                                                    className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border ${filters.putAwayType === 'Purchase Receipt Item' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200' : 'bg-green-50 text-green-600 hover:bg-green-100 border-green-200'}`}
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
                     <div className="p-4 md:p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center bg-gray-50/50 dark:bg-gray-800 gap-4">
                         <div>
                             <button onClick={() => setSelectedItem(null)} className="text-sm text-gray-500 hover:underline mb-1 flex items-center gap-1">← Back to List</button>
                             <h2 className="text-xl font-black flex flex-wrap items-center gap-2 text-gray-800 dark:text-white">
                                {filters.putAwayType === 'Purchase Receipt Item' 
                                    ? `Invoice: ${selectedItem.invoiceNumber}` 
                                    : filters.putAwayType === 'Stock Adjustment' 
                                    ? `Adjustment: ${selectedItem.productName}`
                                    : `Return: ${selectedItem.returnNumber}`}
                                <span className={`text-xs px-2 py-0.5 rounded-full border whitespace-nowrap ${
                                    filters.putAwayType === 'Purchase Receipt Item' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' : 
                                    filters.putAwayType === 'Stock Adjustment' ? 'bg-blue-100 text-blue-700 border-blue-200' : 
                                    'bg-red-100 text-red-700 border-red-200'
                                }`}>
                                    Waitlist
                                </span>
                            </h2>
                             <p className="text-sm text-gray-500">Verify items and location before making live</p>
                         </div>
                         <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                             {filters.putAwayType === 'Purchase Receipt Item' && (
                                <div className="relative">
                                    <input 
                                       type="file" 
                                       accept=".csv"
                                       onChange={handleCSVUpload}
                                       className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button className="w-full md:w-auto px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                        <Upload size={16} /> Upload CSV
                                    </button>
                                </div>
                             )}
                             
                             <button 
                                onClick={handleCompletePutAway}
                                className={`w-full md:w-auto px-6 py-2 text-white rounded-lg text-sm font-bold shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 ${
                                    filters.putAwayType === 'Sales Return Receiving' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
                                }`}
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
                                    {filters.putAwayType === 'Purchase Receipt Item' ? (
                                         <>
                                             <th className="p-4">Batch</th>
                                             <th className="p-4">Expiry</th>
                                             <th className="p-4">Qty (Received)</th>
                                             <th className="p-4">Free</th>
                                         </>
                                     ) : filters.putAwayType === 'Stock Adjustment' ? (
                                        <>
                                            <th className="p-4">Batch</th>
                                            <th className="p-4">Expiry</th>
                                            <th className="p-4">Qty</th>
                                        </>
                                     ) : (
                                        <>
                                            <th className="p-4">Return Price</th>
                                            <th className="p-4 text-center">Return Qty</th>
                                        </>
                                    )}
                                     <th className="p-4 w-48">Rack/Bin</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                 {verifiedItems.map((item, idx) => (
                                     <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/20">
                                        <td className="p-4 font-medium text-gray-800 dark:text-gray-200">{item.productName || item.name}</td>
                                        
                                        {filters.putAwayType === 'Purchase Receipt Item' ? (
                                             <>
                                                 <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.batchNumber}</td>
                                                 <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                 <td className="p-4 font-bold text-blue-600">{item.receivedQty}</td>
                                                 <td className="p-4 text-gray-500">{item.physicalFreeQty}</td>
                                             </>
                                         ) : filters.putAwayType === 'Stock Adjustment' ? (
                                            <>
                                                <td className="p-4 font-mono text-xs text-gray-600 dark:text-gray-400">{item.batchNumber}</td>
                                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString() : 'N/A'}</td>
                                                <td className="p-4 font-bold text-green-600">{item.receivedQty}</td>
                                            </>
                                        ) : (
                                            <>
                                                <td className="p-4 font-mono text-xs">Rs. {item.price}</td>
                                                <td className="p-4 font-bold text-red-600 text-center">{item.quantity}</td>
                                            </>
                                        )}
                                         
                                         <td className="p-4">
                                            {/* Location Input is generic and works for both provided item structure allows adding rack property */}
                                            <LocationInput 
                                                value={item.rack} 
                                                onChange={(code) => {
                                                    const updated = [...verifiedItems];
                                                    updated[idx].rack = code;
                                                    setVerifiedItems(updated);
                                                }}
                                                onCreateRequest={() => {
                                                    setPendingLocationIndex(idx);
                                                    setShowLocationModal(true);
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

            {/* Create Location Modal */}
            {showLocationModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4">
                         <div className="flex justify-between items-center pb-2 border-b dark:border-gray-700">
                             <h3 className="text-lg font-bold text-gray-800 dark:text-white">Add New Location</h3>
                             <button onClick={() => setShowLocationModal(false)} className="text-gray-400 hover:text-gray-600"><UserPlus size={20}/></button>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs text-gray-500 font-bold uppercase">Aisle</label>
                                 <input 
                                    className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newLocationData.aisle}
                                    onChange={(e) => setNewLocationData(p => ({...p, aisle: e.target.value}))}
                                    placeholder="e.g. A1"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 font-bold uppercase">Rack</label>
                                 <input 
                                    className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newLocationData.rack}
                                    onChange={(e) => setNewLocationData(p => ({...p, rack: e.target.value}))}
                                    placeholder="e.g. R01"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 font-bold uppercase">Shelf</label>
                                 <input 
                                    className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newLocationData.shelf}
                                    onChange={(e) => setNewLocationData(p => ({...p, shelf: e.target.value}))}
                                    placeholder="e.g. S01"
                                 />
                             </div>
                             <div>
                                 <label className="text-xs text-gray-500 font-bold uppercase">Bin</label>
                                 <input 
                                    className="w-full mt-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={newLocationData.bin}
                                    onChange={(e) => setNewLocationData(p => ({...p, bin: e.target.value}))}
                                    placeholder="e.g. B1"
                                 />
                             </div>
                         </div>
                         <div className="pt-2">
                             <button 
                                onClick={handleCreateLocation}
                                className="w-full py-3 bg-primary text-white rounded-xl font-bold shadow-lg hover:bg-secondary transition-colors"
                             >
                                 Create & Select
                             </button>
                         </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PutAwayBucket;
