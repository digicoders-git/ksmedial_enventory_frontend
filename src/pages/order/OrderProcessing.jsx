import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Calendar, RefreshCw, X, Download, 
    ChevronRight, Play, CheckCircle, AlertCircle, Truck, Package 
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import Papa from 'papaparse';

const OrderProcessing = () => {
    const [activeTab, setActiveTab] = useState('qc'); // 'qc' or 'packing'
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modal State
    const [showQCModal, setShowQCModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [processingQC, setProcessingQC] = useState(false);

    // Shared Filters State
    const [filters, setFilters] = useState({
        orderId: '',
        dateRangeStart: '',
        dateRangeEnd: '',
        skuName: '', // Relevant for QC
        vendorRefId: '',
        orderType: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        fetchOrders();
    }, [activeTab]); // Refetch when tab changes

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                let relevantOrders = [];
                
                if (activeTab === 'qc') {
                    relevantOrders = data.orders.filter(o => 
                        o.status === 'Quality Check' || o.status === 'Under QC'
                    ).map(order => ({
                        ...order,
                        vendorId: order.vendorId || 'N/A',
                        orderType: order.orderType || 'KS4',
                        skuCount: order.items.length,
                        paymentMethod: order.paymentMethod || 'Online',
                        collectibleAmount: order.total,
                        skuNames: order.items.map(i => i.productName).join(', ')
                    }));
                } else if (activeTab === 'packing') {
                    relevantOrders = data.orders.filter(o => 
                        o.status === 'Packing'
                    ).map(order => ({
                        ...order,
                        vendorId: order.vendorId || 'N/A',
                        orderType: order.orderType || 'KS4',
                        paymentMethod: order.paymentMethod || 'Online',
                        collectibleAmount: order.total
                    }));
                }
                
                setOrders(relevantOrders);
                setCurrentPage(1); // Reset to page 1 on tab switch
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            Swal.fire('Error', `Failed to load ${activeTab === 'qc' ? 'Quality Check' : 'Packing'} orders`, 'error');
        } finally {
            setLoading(false);
        }
    };

    // Action: Start QC (Moves to Packing)
    const handleStartQC = (order) => {
        setSelectedOrder(order);
        setShowQCModal(true);
    };

    const confirmQC = async () => {
        if (!selectedOrder) return;
        
        try {
            setProcessingQC(true);
            const result = await Swal.fire({
                title: 'Pass Quality Check?',
                text: "Confirm that all items in this order have been verified.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                confirmButtonText: 'Yes, Pass QC'
            });

            if (result.isConfirmed) {
                await api.put(`/orders/${selectedOrder._id}/status`, { status: 'Packing' });
                Swal.fire({
                    title: 'Moved to Packing!',
                    text: 'Order is now ready for packing.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                setShowQCModal(false);
                setSelectedOrder(null);
                fetchOrders(); 
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', 'Failed to update order status', 'error');
        } finally {
            setProcessingQC(false);
        }
    };

    // Action: Move to Shipping (Moves from Packing to Shipping)
    const handleMoveToShipping = async (orderId) => {
        try {
            const result = await Swal.fire({
                title: 'Move to Shipping?',
                text: "Confirm that this order is packed and ready for shipping.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#8B5CF6',
                confirmButtonText: 'Yes, Move to Shipping'
            });

            if (result.isConfirmed) {
                await api.put(`/orders/${orderId}/status`, { status: 'Scanned For Shipping' });
                Swal.fire({
                    title: 'Moved to Shipping!',
                    text: 'Order is now ready for shipping.',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                fetchOrders(); 
            }
        } catch (error) {
            console.error(error);
            const errorMsg = error.response?.data?.message || error.message || 'Unknown error';
            Swal.fire('Error', `Failed to update status: ${errorMsg}`, 'error');
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
            skuName: '',
            vendorRefId: '',
            orderType: ''
        });
        setCurrentPage(1);
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        if (filters.orderId && !order._id.toLowerCase().includes(filters.orderId.toLowerCase())) return false;
        
        // SKU Name filter only applies for QC usually, but we can keep it generic if data exists
        if (filters.skuName && activeTab === 'qc' && !order.skuNames?.toLowerCase().includes(filters.skuName.toLowerCase())) return false;
        
        if (filters.vendorRefId && !order.vendorId?.toLowerCase().includes(filters.vendorRefId.toLowerCase())) return false;
        if (filters.orderType && !order.orderType.toLowerCase().includes(filters.orderType.toLowerCase())) return false;
        
        if (filters.dateRangeStart && moment(order.createdAt).isBefore(filters.dateRangeStart)) return false;
        if (filters.dateRangeEnd && moment(order.createdAt).isAfter(filters.dateRangeEnd)) return false;

        return true;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
        a.download = `${activeTab}_list.csv`;
        a.click();
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Order Processing</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage Quality Check and Packing stages.</p>
                </div>
                
                {/* Tabs */}
                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg self-start">
                    <button 
                        onClick={() => setActiveTab('qc')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'qc' ? 'bg-white dark:bg-gray-700 shadow text-cyan-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                         Quality Check ({activeTab === 'qc' ? orders.length : ''})
                    </button>
                    <button 
                        onClick={() => setActiveTab('packing')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'packing' ? 'bg-white dark:bg-gray-700 shadow text-indigo-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Packing ({activeTab === 'packing' ? orders.length : ''})
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-end gap-2">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Filter results:</label>
                        <input name="orderId" placeholder="Order ID" value={filters.orderId} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none focus:ring-1 focus:ring-cyan-500" />
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase text-gray-500">Created</label>
                        <div className="flex gap-1">
                            <input type="datetime-local" name="dateRangeStart" value={filters.dateRangeStart} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none" />
                            <input type="datetime-local" name="dateRangeEnd" value={filters.dateRangeEnd} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none" />
                        </div>
                    </div>

                    {activeTab === 'qc' && (
                        <input name="skuName" placeholder="SKU Name" value={filters.skuName} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-32 outline-none" />
                    )}
                    
                    <input name="vendorRefId" placeholder="Vendor Ref ID" value={filters.vendorRefId} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 outline-none" />
                    <input name="orderType" placeholder="Order Type" value={filters.orderType} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 outline-none" />
                    
                    <button onClick={() => setCurrentPage(1)} className="bg-cyan-500 text-white text-xs font-bold uppercase px-4 py-1.5 rounded">Search</button>
                    <button onClick={clearFilters} className="bg-amber-400 text-white text-xs font-bold uppercase px-4 py-1.5 rounded">Clear</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-bold text-gray-500">Showing {filteredOrders.length} orders</p>
                    <button onClick={handleExport} className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2">
                        <Download size={14} /> CSV
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#003B5C] text-white text-[11px] font-bold uppercase">
                            <tr>
                                <th className="p-3 w-8"><input type="checkbox" /></th>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Vendor ID</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Order Type</th>
                                {activeTab === 'qc' && <th className="p-3 text-center">SKU Count</th>}
                                <th className="p-3">Payment Mode</th>
                                <th className="p-3">Amount</th>
                                <th className="p-3">Created On</th>
                                <th className="p-3 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {loading ? <tr><td colSpan="10" className="p-10 text-center">Loading...</td></tr> : 
                             paginatedOrders.map(order => (
                                <tr key={order._id} className="hover:bg-cyan-50/50 dark:hover:bg-gray-800">
                                    <td className="p-3 text-center"><input type="checkbox" /></td>
                                    <td className="p-3 font-bold text-cyan-600">{order._id.substr(-12).toUpperCase()}</td>
                                    <td className="p-3">{order.vendorId}</td>
                                    <td className="p-3">
                                        <span className={`px-2 py-0.5 rounded border text-[10px] uppercase font-black ${
                                            activeTab === 'qc' 
                                            ? 'border-purple-200 bg-purple-50 text-purple-600' 
                                            : 'border-indigo-200 bg-indigo-50 text-indigo-600'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{order.orderType}</td>
                                    {activeTab === 'qc' && <td className="p-3 text-center">{order.skuCount}</td>}
                                    <td className="p-3">{order.paymentMethod}</td>
                                    <td className="p-3 font-bold">₹{order.collectibleAmount.toFixed(2)}</td>
                                    <td className="p-3">{moment(order.createdAt).format('D MMM YYYY HH:mm')}</td>
                                    <td className="p-3 text-center">
                                        {activeTab === 'qc' ? (
                                            <button 
                                                onClick={() => handleStartQC(order)} 
                                                className="text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform bg-blue-50 p-1.5 rounded-full" 
                                                title="View QC Detail"
                                            >
                                                <Play size={16} fill="currentColor" />
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={() => handleMoveToShipping(order._id)} 
                                                className="text-purple-600 hover:text-purple-800 hover:scale-110 transition-transform bg-purple-50 p-1.5 rounded-full" 
                                                title="Move to Shipping"
                                            >
                                                <Truck size={16} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Pagination */}
                <div className="flex justify-end p-4 gap-2">
                    <button disabled={currentPage===1} onClick={()=>setCurrentPage(c=>Math.max(1,c-1))} className="p-1 rounded bg-gray-100 disabled:opacity-50"><ChevronRight className="rotate-180" size={16}/></button>
                    <span className="text-xs font-bold pt-1">{currentPage}</span>
                    <button disabled={currentPage>=totalPages} onClick={()=>setCurrentPage(c=>Math.min(totalPages,c+1))} className="p-1 rounded bg-gray-100 disabled:opacity-50"><ChevronRight size={16}/></button>
                </div>
            </div>

            {/* Quality Check Detail Modal */}
            {showQCModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden animate-scale-up">
                        {/* Modal Header */}
                        <div className="px-6 py-4 bg-gradient-to-r from-[#003B5C] to-[#005a8d] text-white flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-black uppercase tracking-tight">Quality Check Details</h2>
                                <p className="text-[10px] font-bold opacity-80 uppercase">Order ID: {selectedOrder._id.toUpperCase()}</p>
                            </div>
                            <button onClick={() => setShowQCModal(false)} className="p-1 hover:bg-white/20 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                            {/* Order Summary Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl border border-gray-100 dark:border-gray-700">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Vendor ID</p>
                                    <p className="text-xs font-black text-gray-800 dark:text-white">{selectedOrder.vendorId}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Order Type</p>
                                    <p className="text-xs font-black text-gray-800 dark:text-white">{selectedOrder.orderType}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Payment</p>
                                    <p className="text-xs font-black text-gray-800 dark:text-white">{selectedOrder.paymentMethod}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total Amount</p>
                                    <p className="text-xs font-black text-green-600">₹{selectedOrder.total.toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Item List */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-gray-500 uppercase flex items-center gap-2">
                                    <Package size={14} /> Items To Verify ({selectedOrder.items.length})
                                </h3>
                                <div className="space-y-2">
                                    {selectedOrder.items.map((item, idx) => (
                                        <div key={idx} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-l-4 border-cyan-500 rounded shadow-sm border border-gray-100 dark:border-gray-700">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-gray-800 dark:text-white">{item.productName}</p>
                                                <div className="flex gap-4">
                                                    <p className="text-[10px] text-gray-400">Price: <span className="text-gray-600 font-bold">₹{item.price}</span></p>
                                                    <p className="text-[10px] text-gray-400">Status: <span className="text-green-500 font-bold">Available</span></p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">Quantity</p>
                                                <p className="text-lg font-black text-cyan-600">{item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* QC Notes/Checklist (Optional Visual) */}
                            <div className="bg-amber-50 dark:bg-amber-900/10 p-3 rounded border border-amber-100 dark:border-amber-900/30 flex gap-3">
                                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                                <p className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                                    Please verify that the product names, quantities, and batch details match the physical items before passing the quality check.
                                </p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3">
                            <button 
                                onClick={() => setShowQCModal(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 uppercase hover:text-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmQC}
                                disabled={processingQC}
                                className="px-6 py-2 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-black uppercase rounded-lg shadow-lg shadow-green-500/30 hover:shadow-green-500/40 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
                            >
                                {processingQC ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle size={14} />}
                                Pass Quality Check
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderProcessing;
