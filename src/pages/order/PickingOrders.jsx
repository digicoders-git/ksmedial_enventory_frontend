import React, { useState, useEffect } from 'react';
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
import { createPortal } from 'react-dom';

const PickingOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState([]);
    const [bulkStatus, setBulkStatus] = useState('');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);

    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const statusOptions = [
        'pending', 'confirmed', 'On Hold', 'Picking', 'Picklist Generated', 
        'Problem Queue', 'Quality Check', 'Packing', 'Scanned For Shipping', 
        'shipped', 'delivered', 'cancelled', 'Unallocated', 'Billing'
    ];

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                // Filter for 'Picking' by default for this page
                const pickingOrders = data.orders
                    .filter(o => o.status === 'Picking' || o.status === 'Picklist Generated')
                    .map(order => ({
                        ...order,
                        vendorId: order.vendorId || 'N/A',
                        orderType: order.orderType || 'KS4',
                        rapidOrderType: order.rapidOrderType || 'N/A',
                        skuIdKS4: order.items.map(item => item.product?.sku || 'N/A').join(', '), 
                        vendorRefId: order.vendorRefId || 'N/A',
                        expectedHandover: order.expectedHandover ? moment(order.expectedHandover).toISOString() : moment(order.createdAt).add(2, 'days').toISOString(),
                        city: order.shippingAddress?.city || 'Unknown'
                    }));
                setOrders(pickingOrders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            Swal.fire('Error', 'Failed to load picking orders', 'error');
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
            prev.includes(id)
                ? prev.filter(i => i !== id)
                : [...prev, id]
        );
    };

    const getBulkValidation = (targetStatus) => {
        if (!targetStatus || !selectedIds.length) return { isValid: true, reason: '' };

        const flow = ['pending', 'confirmed', 'Picking', 'Picklist Generated', 'Quality Check', 'Packing', 'Scanned For Shipping', 'shipped', 'delivered'];
        const safetyStages = ['On Hold', 'Problem Queue', 'Unallocated', 'Billing', 'cancelled'];
        const selectedOrders = orders.filter(o => selectedIds.includes(o._id));

        for (const order of selectedOrders) {
            const currIdx = flow.indexOf(order.status);
            const nextIdx = flow.indexOf(targetStatus);
            const isSafetyStage = safetyStages.includes(targetStatus);
            const isSafetyCurrent = ['On Hold', 'Problem Queue'].includes(order.status);
            const isSelf = targetStatus === order.status;

            // --- Special Rule for Safety-Stage Orders (On Hold / Problem Queue) ---
            if (isSafetyCurrent) {
                if (targetStatus === 'pending' || targetStatus === 'confirmed') {
                    return { isValid: false, reason: `Cannot move an "${order.status}" order back to "${targetStatus}".` };
                }
                if (['Scanned For Shipping', 'shipped', 'delivered'].includes(targetStatus)) {
                    return { isValid: false, reason: `Cannot move from "${order.status}" directly to "${targetStatus}". Resume through Picking/Packing stages first.` };
                }
                continue; // Skip flow-index checks for held orders
            }

            // --- Standard Flow Logic ---
            const isPicklistGenerated = targetStatus === 'Picklist Generated' && order.status === 'Picking';
            const isQCFromPicking = targetStatus === 'Quality Check' && order.status === 'Picking';

            if (currIdx >= 2 && (targetStatus === 'pending' || targetStatus === 'confirmed')) {
                return { isValid: false, reason: `Cannot move to "${targetStatus}" — order is already in the warehouse workflow.` };
            }

            const isSkip = nextIdx > currIdx + 1 && !isQCFromPicking && !isPicklistGenerated && currIdx !== -1 && nextIdx !== -1;
            if (isSkip && !isSafetyStage && !isSelf) {
                return { isValid: false, reason: `Cannot skip from "${order.status}" to "${targetStatus}". Follow the step-by-step workflow.` };
            }

            const isReverse = nextIdx < currIdx && nextIdx !== -1 && currIdx !== -1 && !isSafetyStage;
            if (isReverse && !isSelf) {
                return { isValid: false, reason: `Cannot move "${order.status}" order backward to "${targetStatus}".` };
            }
        }
        return { isValid: true, reason: '' };
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus) {
            return Swal.fire('Wait', 'Please select a status to move orders to.', 'info');
        }

        // Check terminal orders first
        const terminalOrders = orders.filter(o => selectedIds.includes(o._id)).filter(o => o.status === 'delivered' || o.status === 'cancelled');
        if (terminalOrders.length > 0) {
            Swal.fire({
                title: 'Operation Blocked',
                text: 'Some selected orders are already "delivered" or "cancelled". Final statuses cannot be changed.',
                icon: 'error',
                customClass: { container: 'z-[100001]' }
            });
            return;
        }

        // Validate workflow for all selected orders
        const validation = getBulkValidation(bulkStatus);
        if (!validation.isValid) {
            Swal.fire({
                title: 'Invalid Workflow',
                text: validation.reason,
                icon: 'error',
                customClass: { container: 'z-[100001]' }
            });
            return;
        }

        const result = await Swal.fire({
            title: `Update ${selectedIds.length} orders?`,
            text: `Move all selected orders to "${bulkStatus}"?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Update All',
            confirmButtonColor: '#06b6d4',
            customClass: { container: 'z-[100001]' }
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await api.put('/orders/bulk-status', {
                    orderIds: selectedIds,
                    status: bulkStatus
                });

                if (response.data.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Updated!',
                        text: response.data.message,
                        customClass: { container: 'z-[100001]' }
                    });
                    setSelectedIds([]);
                    setBulkStatus('');
                    fetchOrders();
                }
            } catch (error) {
                console.error("Bulk Update Error:", error);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Failed to update orders in bulk.',
                    customClass: { container: 'z-[100001]' }
                });
            } finally {
                setLoading(false);
            }
        }
    };

    const getNextStatus = (currentStatus) => {
        const flow = [
            'pending', 'confirmed', 'Picking', 'Picklist Generated', 
            'Quality Check', 'Packing', 'Scanned For Shipping', 
            'shipped', 'delivered'
        ];
        const index = flow.indexOf(currentStatus);
        if (index !== -1 && index < flow.length - 1) {
            // Picking can go to Quality Check directly or Picklist Generated
            if (currentStatus === 'Picking') return 'Quality Check';
            return flow[index + 1];
        }
        return null; // End of chain or not in standard flow
    };

    const handleStatusUpdate = async (newStatus) => {
        if (!selectedOrder) return;

        // 1. BLOCK changes if order is already delivered or cancelled
        if (selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled') {
             Swal.fire({
                title: 'Order Completed',
                text: 'This order is already delivered or cancelled. Its status cannot be changed.',
                icon: 'info',
                customClass: { container: 'z-[100001]' }
            });
            return; // STOP EXECUTION
        }

        // 2. SPECIAL RULE: 'pending' order MUST go to 'confirmed' first
        if (selectedOrder.status === 'pending' && newStatus !== 'confirmed' && newStatus !== 'cancelled' && newStatus !== 'pending') {
             Swal.fire({
                title: 'Confirm First',
                text: 'Fresh orders must be "confirmed" before they can enter the Picking/QC workflow.',
                icon: 'warning',
                customClass: { container: 'z-[100001]' }
            });
            return; // STOP EXECUTION
        }

        // 3. Strict Status Flow Logic for jumps
        const flow = ['pending', 'confirmed', 'Picking', 'Picklist Generated', 'Quality Check', 'Packing', 'Scanned For Shipping', 'shipped', 'delivered'];
        const currIdx = flow.indexOf(selectedOrder.status);
        const nextIdx = flow.indexOf(newStatus);
        
        const isSafetyStage = ['On Hold', 'Problem Queue', 'Unallocated', 'Billing', 'cancelled'].includes(newStatus);
        const isSelf = newStatus === selectedOrder.status;
        const isPicklistGenerated = newStatus === 'Picklist Generated' && selectedOrder.status === 'Picking';
        const isQCFromPicking = newStatus === 'Quality Check' && selectedOrder.status === 'Picking';

        // Block 'pending' and 'confirmed' if moving from 'On Hold' or later stages
        if ((selectedOrder.status === 'On Hold' || selectedOrder.status === 'Problem Queue' || currIdx >= 2) && (newStatus === 'pending' || newStatus === 'confirmed')) {
            Swal.fire({
                title: 'Reverse Blocked',
                text: `You cannot move an order back to "${newStatus}" once it has entered the warehouse workflow.`,
                icon: 'warning',
                customClass: { container: 'z-[100001]' }
            });
            return;
        }

        // Check for skipping stages (blocked if nextIdx > currIdx + 1)
        if (nextIdx > currIdx + 1 && !isSafetyStage && !isQCFromPicking && !isPicklistGenerated && currIdx !== -1 && nextIdx !== -1) {
             Swal.fire({
                title: 'Invalid Flow',
                text: `You cannot skip to "${newStatus}". Order must follow sequence: Picking -> QC -> Packing -> Shipping.`,
                icon: 'warning',
                customClass: { container: 'z-[100001]' }
            });
            return; // STOP EXECUTION
        }

        // 4. BLOCK REVERSE FLOW
        if (nextIdx < currIdx && nextIdx !== -1 && currIdx !== -1 && !isSafetyStage) {
            Swal.fire({
                title: 'Reverse Blocked',
                text: `You cannot move an order back to "${newStatus}". The process only moves forward.`,
                icon: 'warning',
                customClass: { container: 'z-[100001]' }
            });
            return; // STOP EXECUTION
        }

        try {
            const { data } = await api.put(`/orders/${selectedOrder._id}/status`, { status: newStatus });
            if (data.success) {
                // Trigger print ONLY if the button clicked was 'Print Picklist'
                if (newStatus === 'Picklist Generated') {
                    window.print();
                    setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, status: newStatus } : o));
                    setSelectedOrder(prev => ({ ...prev, status: newStatus }));
                }
                // If moving outside Picking/Picklist Generated cycle, remove it from list
                else if (newStatus !== 'Picking' && newStatus !== 'Picklist Generated') {
                    setOrders(prev => prev.filter(o => o._id !== selectedOrder._id));
                    setShowModal(false);
                } else {
                    setOrders(prev => prev.map(o => o._id === selectedOrder._id ? { ...o, status: newStatus } : o));
                    setSelectedOrder(prev => ({ ...prev, status: newStatus }));
                }
                Swal.fire({
                    icon: 'success',
                    title: 'Status Updated',
                    text: `Order marked as ${newStatus}`,
                    timer: 1000,
                    showConfirmButton: false,
                    customClass: {
                        container: 'z-[100001]' // Ensures it's above the modal's 10000
                    }
                });
            }
        } catch (error) {
            console.error("Update Status Error", error);
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const paginatedOrders = orders.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'Picking': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'On Hold': return 'text-amber-600 bg-amber-50 border-amber-200';
            case 'Packing': return 'text-indigo-600 bg-indigo-50 border-indigo-200';
            case 'Shipping': return 'text-purple-600 bg-purple-50 border-purple-200';
            default: return 'text-blue-600 bg-blue-50 border-blue-200';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Picking Queue</h1>
                    <p className="text-sm text-gray-500 font-medium">Orders currently in the picking stage.</p>
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

            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="bg-orange-600 text-white p-3 rounded-xl shadow-xl flex items-center justify-between animate-slide-up sticky top-4 z-40 border-2 border-orange-400">
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                            {selectedIds.length} Selected
                        </div>
                        <div className="h-6 w-px bg-white/20"></div>
                        <div className="flex items-center gap-2">
                             <label className="text-[10px] font-black uppercase whitespace-nowrap">Move to Status:</label>
                             <select 
                                value={bulkStatus}
                                onChange={(e) => setBulkStatus(e.target.value)}
                                className="bg-orange-800 border border-orange-400 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-white transition-all"
                             >
                                 <option value="">-- Choose Status --</option>
                                 {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                             </select>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={() => setSelectedIds([])}
                            className="px-4 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold transition-all uppercase"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleBulkStatusUpdate}
                            className="bg-white text-orange-600 px-6 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-orange-50 shadow-lg active:scale-95 transition-all flex items-center gap-2"
                        >
                            <ArrowRight size={14} /> Update Selected
                        </button>
                    </div>
                </div>
            )}

            {/* Main Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase ">
                            <tr>
                                <th className="px-5 py-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 dark:border-gray-600 focus:ring-orange-500" 
                                        onChange={handleSelectAll}
                                        checked={paginatedOrders.length > 0 && selectedIds.length === paginatedOrders.length}
                                    />
                                </th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Order ID</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Vendor ID</th>
                                <th className="px-5 py-4 whitespace-nowrap text-center">Status</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Type</th>
                                <th className="px-5 py-4 whitespace-nowrap text-right">Amount</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Created On</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">Handover</th>
                                <th className="px-5 py-4 whitespace-nowrap text-left">City</th>
                                <th className="px-5 py-4 whitespace-nowrap text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700 text-sm">
                            {loading ? (
                                <tr><td colSpan="10" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">Loading Picking Queue...</td></tr>
                            ) : paginatedOrders.length === 0 ? (
                                <tr><td colSpan="10" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No orders currently in picking stage.</td></tr>
                            ) : (
                                paginatedOrders.map((order) => (
                                    <tr key={order._id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group ${selectedIds.includes(order._id) ? 'bg-orange-50/30 dark:bg-orange-900/20' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-gray-300 dark:border-gray-600" 
                                                checked={selectedIds.includes(order._id)}
                                                onChange={() => handleSelectOne(order._id)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                                className="hover:underline"
                                            >
                                                {order._id.substr(-12).toUpperCase()}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 whitespace-nowrap font-mono text-xs">{order.vendorId}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{order.orderType}</td>
                                        <td className="px-6 py-4 text-right font-black text-gray-900 dark:text-white whitespace-nowrap">₹{order.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">{moment(order.createdAt).format('D MMM, HH:mm')}</td>
                                        <td className="px-6 py-4 dark:text-gray-400 whitespace-nowrap text-xs text-orange-600 font-bold">{moment(order.expectedHandover).format('D MMM')}</td>
                                        <td className="px-6 py-4 text-gray-700 dark:text-gray-300 whitespace-nowrap">{order.city}</td>
                                        <td className="px-6 py-4 text-center whitespace-nowrap">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                                className="text-gray-400 hover:text-orange-500 p-1.5 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                            >
                                                <Eye size={18} />
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

            {/* Order Details Modal & Printable Picklist */}
            {showModal && selectedOrder && createPortal(
                <>
                <style>{`
                    @media print {
                        /* 1. Hide EVERY existing element on the page */
                        body * {
                            display: none !important;
                        }

                        /* 2. Show only our printable picklist and its inner content */
                        #printable-picklist, 
                        #printable-picklist * {
                            display: block !important;
                        }

                        /* 3. Force the picklist to the top-left for printing */
                        #printable-picklist {
                            display: block !important;
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            height: auto !important;
                            margin: 0 !important;
                            padding: 20px !important;
                            background: white !important;
                            z-index: 9999999 !important;
                        }

                        /* 4. Support table structures in print */
                        #printable-picklist table {
                            display: table !important;
                        }
                        #printable-picklist thead {
                            display: table-header-group !important;
                        }
                        #printable-picklist tr {
                            display: table-row !important;
                        }
                        #printable-picklist th, 
                        #printable-picklist td {
                            display: table-cell !important;
                        }

                        /* 5. Clean up page headers/footers */
                        @page {
                            size: portrait;
                            margin: 10mm;
                        }
                    }
                `}</style>
                
                {/* 1. VISUAL MODAL UI (HIDDEN IN PRINT) */}
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in print:hidden">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200 dark:border-gray-700">
                         {/* Header */}
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gray-50 dark:bg-gray-800">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Picking Entry #{selectedOrder._id.substr(-8).toUpperCase()}</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">Verify items and move to next stage.</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                                <div className="p-4 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <h3 className="text-[10px] font-black uppercase text-blue-600 mb-2 tracking-widest">Customer</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{selectedOrder.userId?.name || 'Guest'}</p>
                                    <p className="text-xs text-gray-500 mt-1">{selectedOrder.city}</p>
                                </div>
                                <div className="p-4 bg-orange-50/50 dark:bg-orange-900/10 rounded-lg border border-orange-100 dark:border-orange-800">
                                    <h3 className="text-[10px] font-black uppercase text-orange-600 mb-2 tracking-widest">Move to Stage</h3>
                                    <select 
                                        value={selectedOrder.status}
                                        disabled={selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled'}
                                        onChange={(e) => handleStatusUpdate(e.target.value)}
                                        className={`w-full bg-white dark:bg-gray-800 border-2 border-orange-200 dark:border-orange-800 text-gray-700 dark:text-gray-200 text-xs rounded-lg p-2 font-bold outline-none focus:ring-2 focus:ring-orange-500 transition-all shadow-sm ${selectedOrder.status === 'delivered' || selectedOrder.status === 'cancelled' ? 'opacity-50 cursor-not-allowed border-gray-300' : 'cursor-pointer hover:border-orange-400'}`}
                                    >
                                        {statusOptions.map(option => {
                                            const flow = ['pending', 'confirmed', 'Picking', 'Picklist Generated', 'Quality Check', 'Packing', 'Scanned For Shipping', 'shipped', 'delivered'];
                                            const currIdx = flow.indexOf(selectedOrder.status);
                                            const optIdx = flow.indexOf(option);
                                            
                                            // Disable if:
                                            // 1. It's 'pending' or 'confirmed' and current is 'On Hold' or later
                                            // 2. It's logically before current status in flow
                                            const isPastStage = (optIdx !== -1 && currIdx !== -1 && optIdx < currIdx);
                                            const isEarlyStageOnHold = (selectedOrder.status === 'On Hold' || selectedOrder.status === 'Problem Queue') && (option === 'pending' || option === 'confirmed');
                                            
                                            return (
                                                <option 
                                                    key={option} 
                                                    value={option}
                                                    disabled={isPastStage || isEarlyStageOnHold}
                                                    className={isPastStage || isEarlyStageOnHold ? 'text-gray-400 bg-gray-100' : ''}
                                                >
                                                    {option} {option === selectedOrder.status ? '(Current)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                </div>
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Handover Target</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{moment(selectedOrder.expectedHandover).format('DD MMM YYYY')}</p>
                                    <p className="text-[10px] text-emerald-600 mt-1 font-bold italic tracking-tighter">Must pick before 6:00 PM</p>
                                </div>
                             </div>

                             {/* Items Table - CRITICAL FOR PICKING */}
                            <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                                <Package size={14} /> Items to Pick
                            </h3>
                            <table className="w-full text-left text-sm mb-6 border border-gray-100 dark:border-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-3">Product Name</th>
                                        <th className="p-3 text-center">Required Qty</th>
                                        <th className="p-3">Bin Location</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {selectedOrder.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="p-3 font-medium">
                                                <p className="text-gray-800 dark:text-gray-200">{item.productName}</p>
                                                <p className="text-[10px] text-gray-400">SKU: {item.product?.sku || 'N/A'}</p>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-gray-800 dark:text-gray-200 rounded-full font-black text-lg">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="p-3">
                                                <span className="font-mono text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 px-2 py-1 rounded border border-cyan-100 dark:border-cyan-800">
                                                    {item.product?.rackLocation || 'TBD'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            
                            <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 pt-6 dark:border-gray-800">
                                <button 
                                    onClick={() => handleStatusUpdate('Picklist Generated')}
                                    className="px-6 py-2 bg-gray-800 text-white rounded-lg text-xs font-black uppercase hover:bg-gray-900 transition-all flex items-center gap-2"
                                >
                                    <FileText size={16} /> Print Picklist
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate('Quality Check')}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg text-xs font-black uppercase hover:bg-orange-700 shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Mark as Picked
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. PRINTABLE PICKLIST (HIDDEN ON SCREEN, VISIBLE IN PRINT ONLY) */}
                <div id="printable-picklist" className="hidden print:block bg-white text-black p-4 font-sans" style={{ color: '#000', backgroundColor: '#fff', minHeight: '100vh' }}>
                    {/* Professional Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '4px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ backgroundColor: '#000', color: '#fff', padding: '5px 12px', fontWeight: '900', fontSize: '24px' }}>KS</div>
                                <h1 style={{ fontSize: '28px', fontWeight: '900', margin: 0, letterSpacing: '-1px' }}>WAREHOUSE PICKLIST</h1>
                            </div>
                            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: '5px 0 0 0', color: '#666' }}>OFFICIAL INTERNAL DOCUMENT</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', fontWeight: 'bold', margin: 0 }}>ORDER ID:</p>
                            <p style={{ fontSize: '24px', fontWeight: '900', margin: 0 }}>#{selectedOrder._id.substr(-8).toUpperCase()}</p>
                        </div>
                    </div>

                    {/* Meta Information Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
                        <div style={{ border: '2px solid #000', padding: '10px' }}>
                            <p style={{ fontSize: '10px', fontWeight: '900', margin: '0 0 5px 0', borderBottom: '1px solid #000', display: 'inline-block' }}>CUSTOMER</p>
                            <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>{selectedOrder.userId?.name || 'Guest'}</p>
                            <p style={{ fontSize: '12px', margin: '2px 0 0 0' }}>{selectedOrder.city}</p>
                        </div>
                        <div style={{ border: '2px solid #000', padding: '10px' }}>
                            <p style={{ fontSize: '10px', fontWeight: '900', margin: '0 0 5px 0', borderBottom: '1px solid #000', display: 'inline-block' }}>ORDER SCHEDULE</p>
                            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Date: {moment(selectedOrder.createdAt).format('DD MMM YYYY')}</p>
                            <p style={{ fontSize: '14px', fontWeight: 'bold', margin: 0 }}>Time: {moment(selectedOrder.createdAt).format('HH:mm')}</p>
                        </div>
                        <div style={{ border: '2px solid #000', padding: '10px', backgroundColor: '#f0f0f0' }}>
                            <p style={{ fontSize: '10px', fontWeight: '900', margin: '0 0 5px 0', borderBottom: '1px solid #000', display: 'inline-block' }}>PICKING TARGET</p>
                            <p style={{ fontSize: '18px', fontWeight: '900', margin: 0 }}>{moment(selectedOrder.expectedHandover).format('DD MMM YYYY')}</p>
                        </div>
                    </div>

                    {/* Master Items Table */}
                    <table style={{ width: '100%', borderCollapse: 'collapse', border: '3px solid #000', tableLayout: 'fixed' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f0f0f0' }}>
                                <th style={{ border: '2px solid #000', padding: '8px', fontSize: '11px', fontWeight: '900', width: '40px', textAlign: 'center' }}>#</th>
                                <th style={{ border: '2px solid #000', padding: '8px', fontSize: '11px', fontWeight: '900', textAlign: 'left' }}>PRODUCT DESCRIPTION & SKU</th>
                                <th style={{ border: '2px solid #000', padding: '8px', fontSize: '11px', fontWeight: '900', width: '120px', textAlign: 'center' }}>LOCATION</th>
                                <th style={{ border: '2px solid #000', padding: '8px', fontSize: '11px', fontWeight: '900', width: '60px', textAlign: 'center' }}>QTY</th>
                                <th style={{ border: '2px solid #000', padding: '8px', fontSize: '11px', fontWeight: '900', width: '60px', textAlign: 'center' }}>OK?</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.items.map((item, i) => (
                                <tr key={i}>
                                    <td style={{ border: '2px solid #000', padding: '10px 5px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>
                                        {i + 1}
                                    </td>
                                    <td style={{ border: '2px solid #000', padding: '10px' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '900', margin: 0, textTransform: 'uppercase', lineHeight: '1.2' }}>{item.productName}</p>
                                        <p style={{ fontSize: '10px', margin: '4px 0 0 0', fontFamily: 'monospace', fontWeight: 'bold', color: '#333' }}>SKU: {item.product?.sku || 'N/A'}</p>
                                    </td>
                                    <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'center', fontWeight: '900', fontSize: '16px' }}>
                                        {item.product?.rackLocation || 'TBD'}
                                    </td>
                                    <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'center', fontWeight: '900', fontSize: '24px' }}>
                                        {item.quantity}
                                    </td>
                                    <td style={{ border: '2px solid #000', padding: '10px', textAlign: 'center' }}>
                                        <div style={{ width: '22px', height: '22px', border: '3px solid #000', margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary Footer */}
                    <div style={{ marginTop: '30px', borderTop: '2px solid #000', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: '12px', fontWeight: 'bold' }}>
                            <p style={{ margin: '0 0 5px 0', fontSize: '14px' }}>TOTAL ITEMS: {selectedOrder.items.length}</p>
                            <p style={{ margin: 0, color: '#444' }}>PRINTED AT: {moment().format('DD/MM/YYYY HH:mm:ss')}</p>
                        </div>
                        <div style={{ display: 'flex', gap: '40px' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '130px', borderBottom: '2px solid #000', marginBottom: '5px', height: '30px' }}></div>
                                <p style={{ fontSize: '10px', fontWeight: '900', margin: 0 }}>PICKER SIGN</p>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ width: '130px', borderBottom: '2px solid #000', marginBottom: '5px', height: '30px' }}></div>
                                <p style={{ fontSize: '10px', fontWeight: '900', margin: 0 }}>CHECKER SIGN</p>
                            </div>
                        </div>
                    </div>
                </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default PickingOrders;
