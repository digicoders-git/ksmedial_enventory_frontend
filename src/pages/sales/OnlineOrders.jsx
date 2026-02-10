import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Filter, Eye, Truck, CheckCircle, 
    XCircle, Clock, Package, Boxes, AlertCircle,
    ArrowRight, MapPin, Phone, User as UserIcon,
    Download, ChevronRight, FileText, ShoppingCart,
    ChevronDown, Calendar, RefreshCw, X
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import Papa from 'papaparse';

const OnlineOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        orderId: '',
        dateRangeStart: '',
        dateRangeEnd: '',
        skuName: '',
        skuIdKS4: '',
        rapidType: '',
        vendorRefId: '',
        orderType: ''
    });

    const [statusFilterOpen, setStatusFilterOpen] = useState(false);
    const [selectedStatuses, setSelectedStatuses] = useState([]);
    const statusOptions = [
        'On Hold', 'Picking', 'Picklist Generated', 'Problem Queue', 
        'Quality Check', 'Packing', 'Shipping', 'Scanned For Shipping', 
        'Shipped', 'Cancelled', 'Unallocated', 'delivered'
    ];

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const filterRef = useRef(null);

    useEffect(() => {
        fetchOrders();
        
        // Click outside to close status dropdown
        const handleClickOutside = (event) => {
            if (filterRef.current && !filterRef.current.contains(event.target)) {
                setStatusFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                // Map/Enrich data with real backend fields
                const enrichedOrders = data.orders.map(order => ({
                    ...order,
                    // Use real data or fallbacks if not yet populated in older records
                    vendorId: order.vendorId || 'N/A',
                    orderType: order.orderType || 'KS4',
                    rapidOrderType: order.rapidOrderType || 'N/A',
                    // Flatten SKUs for easier searching/display
                    skuIdKS4: order.items.map(item => item.product?.sku || 'N/A').join(', '), 
                    vendorRefId: order.vendorRefId || 'N/A',
                    expectedHandover: order.expectedHandover ? moment(order.expectedHandover).toISOString() : moment(order.createdAt).add(2, 'days').toISOString(),
                    city: order.shippingAddress?.city || 'Unknown'
                }));
                setOrders(enrichedOrders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            Swal.fire('Error', 'Failed to load online orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const toggleStatus = (status) => {
        setSelectedStatuses(prev => 
            prev.includes(status) 
                ? prev.filter(s => s !== status)
                : [...prev, status]
        );
        setCurrentPage(1);
    };

    const toggleAllStatuses = () => {
        if (selectedStatuses.length === statusOptions.length) {
            setSelectedStatuses([]);
        } else {
            setSelectedStatuses([...statusOptions]);
        }
    };

    const clearFilters = () => {
        setFilters({
            orderId: '',
            dateRangeStart: '',
            dateRangeEnd: '',
            skuName: '',
            skuIdKS4: '',
            rapidType: '',
            vendorRefId: '',
            orderType: ''
        });
        setSelectedStatuses([]);
        setCurrentPage(1);
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        // Text Filters
        if (filters.orderId && !order._id.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
        if (filters.skuName && !order.items.some(i => i.productName.toLowerCase().includes(filters.skuName.toLowerCase()))) return false;
        if (filters.skuIdKS4 && !order.skuIdKS4.toLowerCase().includes(filters.skuIdKS4.toLowerCase())) return false;
        if (filters.rapidType && !order.rapidOrderType.toLowerCase().includes(filters.rapidType.toLowerCase())) return false;
        if (filters.vendorRefId && !order.vendorRefId.toLowerCase().includes(filters.vendorRefId.toLowerCase())) return false;
        if (filters.orderType && !order.orderType.toLowerCase().includes(filters.orderType.toLowerCase())) return false;

        // Date Range
        if (filters.dateRangeStart) {
            if (moment(order.createdAt).isBefore(filters.dateRangeStart)) return false;
        }
        if (filters.dateRangeEnd) {
            if (moment(order.createdAt).isAfter(filters.dateRangeEnd)) return false;
        }

        // Status Filter
        if (selectedStatuses.length > 0 && !selectedStatuses.includes(order.status)) return false;

        return true;
    });

    // Pagination Logic
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = () => {
        const data = filteredOrders.map(o => ({
            'Order ID': o._id,
            'Vendor ID': o.vendorId,
            'Status': o.status,
            'Order Type': o.orderType,
            'Total Amount': o.total,
            'Date': moment(o.createdAt).format('YYYY-MM-DD'),
            'City': o.city
        }));
        const csv = Papa.unparse(data);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sales_orders.csv';
        a.click();
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Picking': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'On Hold': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Packing': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'Shipping': return 'text-purple-600 bg-purple-50 border-purple-200';
            case 'Problem Queue': return 'text-rose-600 bg-rose-50 border-rose-200';
            case 'delivered': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
            case 'cancelled': return 'text-gray-600 bg-gray-100 border-gray-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Sales Orders</h1>
                <p className="text-sm text-gray-500 font-medium">Manage and process orders with detailed filtering.</p>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Filter results:</label>
                        <input 
                            name="orderId"
                            placeholder="Order ID" 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 focus:ring-1 focus:ring-cyan-500 outline-none"
                            value={filters.orderId}
                            onChange={handleFilterChange}
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Created</label>
                        <div className="flex items-center gap-1">
                            <input 
                                type="datetime-local"
                                name="dateRangeStart"
                                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-36 focus:ring-1 focus:ring-cyan-500 outline-none"
                                value={filters.dateRangeStart}
                                onChange={handleFilterChange}
                            />
                            <input 
                                type="datetime-local"
                                name="dateRangeEnd"
                                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-36 focus:ring-1 focus:ring-cyan-500 outline-none"
                                value={filters.dateRangeEnd}
                                onChange={handleFilterChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">SKU Name</label>
                        <input 
                            name="skuName"
                            placeholder="SKU Name" 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 focus:ring-1 focus:ring-cyan-500 outline-none"
                            value={filters.skuName}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">SKU ID</label>
                        <input 
                            name="skuIdKS4"
                            placeholder="KS4 SKU ID" 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 focus:ring-1 focus:ring-cyan-500 outline-none"
                            value={filters.skuIdKS4}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Rapid Type</label>
                        <input 
                            name="rapidType"
                            placeholder="Rapid Type" 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 focus:ring-1 focus:ring-cyan-500 outline-none"
                            value={filters.rapidType}
                            onChange={handleFilterChange}
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Vendor ID</label>
                        <input 
                            name="vendorRefId"
                            placeholder="Vendor Ref ID" 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 focus:ring-1 focus:ring-cyan-500 outline-none"
                            value={filters.vendorRefId}
                            onChange={handleFilterChange}
                        />
                    </div>

                     <div className="space-y-1 relative" ref={filterRef}>
                        <label className="text-[10px] font-bold uppercase text-gray-500">Status</label>
                        <button 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 focus:ring-1 focus:ring-cyan-500 outline-none flex justify-between items-center"
                            onClick={() => setStatusFilterOpen(!statusFilterOpen)}
                        >
                            <span className="truncate">{selectedStatuses.length > 0 ? `${selectedStatuses.length} Selected` : 'All Statuses'}</span>
                            <ChevronDown size={12} />
                        </button>
                        
                        {statusFilterOpen && (
                            <div className="absolute top-full left-0 mt-1 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl z-50 p-2 max-h-60 overflow-y-auto">
                                <div className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer border-b border-gray-100 dark:border-gray-700 mb-1" onClick={toggleAllStatuses}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedStatuses.length === statusOptions.length}
                                        readOnly
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-xs font-bold">Select All</span>
                                </div>
                                {statusOptions.map(status => (
                                    <div key={status} className="flex items-center gap-2 p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer" onClick={() => toggleStatus(status)}>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedStatuses.includes(status)}
                                            readOnly
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-xs">{status}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex items-end gap-2 ml-auto">
                        <button 
                            onClick={() => setCurrentPage(1)}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold uppercase px-6 py-2 rounded shadow-sm transition-colors"
                        >
                            Search
                        </button>
                        <button 
                            onClick={clearFilters}
                            className="bg-amber-400 hover:bg-amber-500 text-white text-xs font-bold uppercase px-4 py-2 rounded shadow-sm transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Pagination Info & Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                 <p className="text-xs font-bold text-gray-500">
                    Showing <span className="text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}-{(currentPage - 1) * itemsPerPage + paginatedOrders.length}</span> of <span className="text-gray-900 dark:text-white">{filteredOrders.length}</span> sales orders
                </p>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500">Records per page:</span>
                        <select 
                            value={itemsPerPage}
                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                            className="text-xs border border-gray-300 rounded px-2 py-1 outline-none"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                    <button onClick={handleExport} className="p-1.5 bg-cyan-500 text-white rounded-full"><Download size={14} /></button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase ">
                            <tr>
                                <th className="px-5 py-4 w-12"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 focus:ring-accent" /></th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Order ID</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Vendor ID</th>
                                <th className="px-5 py-4 whitespace-nowrap text-center">Status</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Type</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Rapid Type</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Payment</th>
                                <th className="px-5 py-4 whitespace-nowrap text-right">Amount</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Created On</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Expected Handover</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">City</th>
                                <th className="px-5 py-4 whitespace-nowrap text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr><td colSpan="12" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">Loading Orders...</td></tr>
                            ) : paginatedOrders.length === 0 ? (
                                <tr><td colSpan="12" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No orders match your filters.</td></tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-4 text-center"><input type="checkbox" className="rounded border-gray-300 dark:border-gray-600" /></td>
                                        <td className="px-6 py-4 font-bold text-cyan-600 dark:text-cyan-400 whitespace-nowrap">
                                            <a 
                                                href="#" 
                                                onClick={(e) => { e.preventDefault(); setSelectedOrder(order); setShowModal(true); }}
                                                className="hover:underline"
                                            >
                                                {order._id.substr(-12).toUpperCase()}
                                            </a>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 whitespace-nowrap font-mono text-xs">{order.vendorId}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{order.orderType}</td>
                                        <td className="px-6 py-4 text-gray-400 dark:text-gray-500 whitespace-nowrap text-xs">{order.rapidOrderType}</td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 whitespace-nowrap">{order.paymentMethod}</td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white whitespace-nowrap">₹{order.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{moment(order.createdAt).format('D MMM YYYY, HH:mm')}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{moment(order.expectedHandover).format('D MMM YYYY, HH:mm')}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.city}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <button className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                                <XCircle size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                 <div className="flex justify-end items-center gap-2 p-4 border-t border-gray-200 dark:border-gray-700">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))}
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        <ChevronRight className="rotate-180" size={16} />
                    </button>
                    <span className="text-xs font-bold">{currentPage}</span>
                    <button 
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))}
                        className={`w-8 h-8 flex items-center justify-center rounded-full ${currentPage >= totalPages ? 'bg-gray-100 text-gray-400' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>
             {/* Order Details Modal (Preserved & Styled) */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200 dark:border-gray-700">
                         {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Order #{selectedOrder._id.substr(-8).toUpperCase()}</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">View complete details and workflow.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {/* Detailed Info Grid */}
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <h3 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Customer Details</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{selectedOrder.userId?.name || 'Guest'}</p>
                                    <p className="text-xs text-gray-500 mt-1">{selectedOrder.shippingAddress?.phone}</p>
                                    <p className="text-xs text-gray-500">{selectedOrder.city}</p>
                                </div>
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Order Summary</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Total: ₹{selectedOrder.total.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 mt-1">Payment: {selectedOrder.paymentMethod}</p>
                                    <p className="text-xs text-gray-500">Items: {selectedOrder.items.length}</p>
                                </div>
                                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800">
                                    <h3 className="text-[10px] font-black uppercase text-purple-600 mb-2 tracking-widest">Workflow Status</h3>
                                    <div className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">Expect Handover: {moment(selectedOrder.expectedHandover).format('DD MMM')}</p>
                                </div>
                             </div>

                             {/* Items Table */}
                            <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3">Order Items</h3>
                            <table className="w-full text-left text-sm mb-6 border border-gray-100 dark:border-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-3">Product Name</th>
                                        <th className="p-3 text-center">Qty</th>
                                        <th className="p-3 text-right">Price</th>
                                        <th className="p-3 text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {selectedOrder.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-3 font-medium">{item.productName}</td>
                                            <td className="p-3 text-center">{item.quantity}</td>
                                            <td className="p-3 text-right">₹{item.productPrice}</td>
                                            <td className="p-3 text-right font-bold">₹{(item.productPrice * item.quantity).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineOrders;
