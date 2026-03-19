import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Eye, CheckCircle, X, Download, 
    ChevronRight, Package, Layers, RefreshCw, Calendar,
    FileText, Printer, AlertCircle, Truck
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import Papa from 'papaparse';
import { createPortal } from 'react-dom';

const PicklistGenerated = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [filters, setFilters] = useState({
        orderId: '',
        dateRangeStart: '',
        dateRangeEnd: '',
        vendorRefId: '',
        orderType: ''
    });

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                const picklistOrders = data.orders
                    .filter(o => o.status === 'Picklist Generated')
                    .map(order => ({
                        ...order,
                        vendorId: order.vendorId || 'N/A',
                        orderType: order.orderType || 'KS4',
                        skuCount: order.items.length,
                        paymentMethod: order.paymentMethod || 'Online',
                        collectibleAmount: order.total,
                        city: order.shippingAddress?.city || 'Unknown'
                    }));
                setOrders(picklistOrders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            Swal.fire('Error', 'Failed to load picklist generated orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(paginatedOrders.map(o => o._id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        setSelectedIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedIds.length === 0) return;

        try {
            const result = await Swal.fire({
                title: `Move ${selectedIds.length} orders?`,
                text: `Move all selected orders to "${newStatus}"?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Yes, Update All',
                confirmButtonColor: '#10B981'
            });

            if (result.isConfirmed) {
                const { data } = await api.put('/orders/bulk-status', {
                    orderIds: selectedIds,
                    status: newStatus
                });

                if (data.success) {
                    Swal.fire('Success', `${selectedIds.length} orders updated successfully`, 'success');
                    setSelectedIds([]);
                    fetchOrders();
                }
            }
        } catch (error) {
            console.error("Bulk Update Error:", error);
            Swal.fire('Error', 'Failed to update orders in bulk', 'error');
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Order moved to ${newStatus}`,
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchOrders();
                setShowModal(false);
            }
        } catch (error) {
            console.error("Update Status Error", error);
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1);
    };

    const clearFilters = () => {
        setFilters({
            orderId: '',
            dateRangeStart: '',
            dateRangeEnd: '',
            vendorRefId: '',
            orderType: ''
        });
        setCurrentPage(1);
    };

    const filteredOrders = orders.filter(order => {
        if (filters.orderId && !order._id.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
        if (filters.vendorRefId && !order.vendorId?.toLowerCase().includes(filters.vendorRefId.toLowerCase())) return false;
        if (filters.orderType && !order.orderType.toLowerCase().includes(filters.orderType.toLowerCase())) return false;
        if (filters.dateRangeStart && moment(order.createdAt).isBefore(filters.dateRangeStart)) return false;
        if (filters.dateRangeEnd && moment(order.createdAt).isAfter(filters.dateRangeEnd)) return false;
        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExport = () => {
        const csv = Papa.unparse(filteredOrders.map(o => ({
            'Order ID': o._id,
            'Vendor ID': o.vendorId,
            'Status': o.status,
            'Items': o.items?.length || 0,
            'Amount': o.collectibleAmount,
            'Created': moment(o.createdAt).format('YYYY-MM-DD HH:mm')
        })));
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `picklist_generated_orders.csv`;
        a.click();
    };

    const getStatusColor = (status) => {
        return 'text-purple-600 bg-purple-50 border-purple-200';
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Picklist Generated</h1>
                    <p className="text-sm text-gray-500 font-medium">Orders with generated picklists ready for quality check.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={fetchOrders}
                        className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-all"
                    >
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Filter results:</label>
                        <input 
                            name="orderId" 
                            placeholder="Order ID" 
                            value={filters.orderId} 
                            onChange={handleFilterChange} 
                            className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none focus:ring-1 focus:ring-purple-500" 
                        />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Created</label>
                        <div className="flex gap-1">
                            <input 
                                type="datetime-local" 
                                name="dateRangeStart" 
                                value={filters.dateRangeStart} 
                                onChange={handleFilterChange} 
                                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none" 
                            />
                            <input 
                                type="datetime-local" 
                                name="dateRangeEnd" 
                                value={filters.dateRangeEnd} 
                                onChange={handleFilterChange} 
                                className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none" 
                            />
                        </div>
                    </div>
                    
                    <input 
                        name="vendorRefId" 
                        placeholder="Vendor Ref ID" 
                        value={filters.vendorRefId} 
                        onChange={handleFilterChange} 
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 outline-none" 
                    />
                    <input 
                        name="orderType" 
                        placeholder="Order Type" 
                        value={filters.orderType} 
                        onChange={handleFilterChange} 
                        className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 outline-none" 
                    />
                    
                    <button 
                        onClick={() => setCurrentPage(1)} 
                        className="bg-purple-500 text-white text-xs font-bold uppercase px-4 py-1.5 rounded"
                    >
                        Search
                    </button>
                    <button 
                        onClick={clearFilters} 
                        className="bg-amber-400 text-white text-xs font-bold uppercase px-4 py-1.5 rounded"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#003B5C] text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-8 animate-scale-up border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-3 border-r border-white/20 pr-8">
                        <div className="bg-purple-500 p-2 rounded-lg shadow-inner">
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-purple-400">Selected</p>
                            <p className="text-sm font-black">{selectedIds.length} {selectedIds.length === 1 ? 'Order' : 'Orders'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bulk Move To:</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleBulkStatusUpdate('Quality Check')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={14} /> Quality Check
                            </button>
                            
                            <button 
                                onClick={() => handleBulkStatusUpdate('Problem Queue')}
                                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"
                            >
                                Problem Queue
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedIds([])}
                        className="text-white/40 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500">Showing {filteredOrders.length} orders</p>
                    <button 
                        onClick={handleExport} 
                        className="px-3 py-1.5 bg-purple-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2"
                    >
                        <Download size={14} /> CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#003B5C] text-white text-[11px] font-bold uppercase">
                            <tr>
                                <th className="p-3 w-8">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                                        onChange={handleSelectAll}
                                        className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                    />
                                </th>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Vendor ID</th>
                                <th className="p-3">Picker</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Order Type</th>
                                <th className="p-3 text-center">SKU Count</th>
                                <th className="p-3">Payment Mode</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Created On</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {loading ? (
                                <tr><td colSpan="10" className="p-10 text-center">Loading...</td></tr>
                            ) : paginatedOrders.length === 0 ? (
                                <tr><td colSpan="10" className="p-10 text-center text-gray-500">No picklist generated orders found.</td></tr>
                            ) : (
                                paginatedOrders.map(order => (
                                    <tr 
                                        key={order._id} 
                                        className={`hover:bg-purple-50/50 dark:hover:bg-gray-800 transition-colors ${selectedIds.includes(order._id) ? 'bg-purple-50/30' : ''}`}
                                    >
                                        <td className="p-3 text-center">
                                            <input 
                                                type="checkbox" 
                                                checked={selectedIds.includes(order._id)}
                                                onChange={() => handleSelectOne(order._id)}
                                                className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                                            />
                                        </td>
                                        <td className="p-3 font-bold text-purple-600">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                                className="hover:underline"
                                            >
                                                {order._id.substr(-12).toUpperCase()}
                                            </button>
                                        </td>
                                        <td className="p-3">{order.vendorId}</td>
                                        <td className="p-3">
                                            <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
                                                <div className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-400">
                                                    <Package size={10} />
                                                </div>
                                                {order.pickerName || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-black ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="p-3">{order.orderType}</td>
                                        <td className="p-3 text-center">{order.skuCount}</td>
                                        <td className="p-3">{order.paymentMethod}</td>
                                        <td className="p-3 font-bold">₹{order.collectibleAmount.toFixed(2)}</td>
                                        <td className="p-3">{moment(order.createdAt).format('D MMM YYYY HH:mm')}</td>
                                        <td className="p-3 text-center">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                                className="text-purple-600 hover:text-purple-800 hover:scale-110 transition-transform bg-purple-50 p-1.5 rounded-full" 
                                                title="View Details"
                                            >
                                                <Eye size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="flex justify-end p-4 gap-2">
                    <button 
                        disabled={currentPage === 1} 
                        onClick={() => setCurrentPage(c => Math.max(1, c - 1))} 
                        className="p-1 rounded bg-gray-100 disabled:opacity-50"
                    >
                        <ChevronRight className="rotate-180" size={16}/>
                    </button>
                    <span className="text-xs font-bold pt-1">{currentPage}</span>
                    <button 
                        disabled={currentPage >= totalPages} 
                        onClick={() => setCurrentPage(c => Math.min(totalPages, c + 1))} 
                        className="p-1 rounded bg-gray-100 disabled:opacity-50"
                    >
                        <ChevronRight size={16}/>
                    </button>
                </div>
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrder && createPortal(
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200 dark:border-gray-700">
                        {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Order #{selectedOrder._id.substr(-8).toUpperCase()}</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">Picklist Generated - Ready for Quality Check</p>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)} 
                                className="text-gray-400 hover:text-red-500 transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto custom-scrollbar">
                            {/* Order Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <h3 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Customer Details</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{selectedOrder.userId?.name || selectedOrder.shippingAddress?.name || 'Guest'}</p>
                                    {selectedOrder.shippingAddress?.phone && <p className="text-xs text-gray-500 mt-1">📞 {selectedOrder.shippingAddress.phone}</p>}
                                    <div className="mt-2 pt-2 border-t border-blue-100 dark:border-blue-800 text-xs text-gray-500 space-y-0.5">
                                        <p>{[selectedOrder.shippingAddress?.city, selectedOrder.shippingAddress?.state].filter(Boolean).join(', ')}</p>
                                        {selectedOrder.shippingAddress?.pincode && <p>PIN: {selectedOrder.shippingAddress.pincode}</p>}
                                    </div>
                                </div>

                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Order Summary</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">Total: ₹{selectedOrder.total.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 mt-1">💳 Payment: {selectedOrder.paymentMethod}</p>
                                    <p className="text-xs text-gray-500">📦 Items: {selectedOrder.items?.length || 0}</p>
                                    <div className="mt-2 pt-2 border-t border-emerald-100 dark:border-emerald-800 text-xs text-gray-500 space-y-0.5">
                                        <p>🏷️ Vendor ID: <span className="font-mono font-bold text-gray-700 dark:text-gray-300">{selectedOrder.vendorId || 'N/A'}</span></p>
                                        <p>📋 Type: {selectedOrder.orderType || 'N/A'}</p>
                                        <p>🕐 Placed: {moment(selectedOrder.createdAt).format('DD MMM YYYY, hh:mm A')}</p>
                                    </div>
                                </div>
                                {/* Current Status & Picker */}
                                <div className="p-4 bg-purple-50/50 dark:bg-purple-900/10 rounded-lg border border-purple-100 dark:border-purple-800">
                                    <h3 className="text-[10px] font-black uppercase text-purple-600 mb-2 tracking-widest">Processing Info</h3>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
                                            <div className={`inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest border ${getStatusColor(selectedOrder.status)}`}>
                                                {selectedOrder.status}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Assigned Picker</p>
                                            <p className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-tight flex items-center gap-1.5">
                                                <Layers size={14} className="text-purple-400" />
                                                {selectedOrder.pickerName || 'No Picker assigned'}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-4 border-t border-purple-100 dark:border-purple-800/50 pt-2 flex justify-between">
                                        <span>Last Update:</span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">{moment(selectedOrder.updatedAt || selectedOrder.createdAt).format('DD MMM YYYY')}</span>
                                    </p>
                                </div>
                            </div>

                            {/* Items Table */}
                            <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3">Order Items</h3>
                            <div className="border border-gray-100 dark:border-gray-700 overflow-hidden rounded-lg">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase font-bold">
                                        <tr>
                                            <th className="p-3">Product Name</th>
                                            <th className="p-3 text-center">Prescription</th>
                                            <th className="p-3 text-center">Qty</th>
                                            <th className="p-3 text-right">Price</th>
                                            <th className="p-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                        {selectedOrder.items?.map((item, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                                <td className="p-3 font-medium text-gray-800 dark:text-gray-200">{item.productName}</td>
                                                <td className="p-3 text-center">
                                                    {item.product?.isPrescriptionRequired
                                                        ? <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-black uppercase">Rx Required</span>
                                                        : <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-[10px] font-black uppercase">No Rx</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-center text-gray-600 dark:text-gray-400">{item.quantity}</td>
                                                <td className="p-3 text-right text-gray-600 dark:text-gray-400">₹{Number(item.productPrice || item.price || 0).toFixed(2)}</td>
                                                <td className="p-3 text-right font-bold text-gray-800 dark:text-gray-200">₹{(Number(item.productPrice || item.price || 0) * item.quantity).toFixed(2)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-black uppercase rounded-xl hover:bg-gray-300 transition-all active:scale-95"
                            >
                                Close
                            </button>
                            <button 
                                onClick={() => handleStatusUpdate(selectedOrder._id, 'Quality Check')}
                                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-black uppercase rounded-xl hover:shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center gap-2"
                            >
                                <CheckCircle size={16} /> Move to Quality Check
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PicklistGenerated;
