import React, { useState, useEffect, useRef } from 'react';
import { 
    Search, Filter, Eye, Truck, CheckCircle, 
    XCircle, Clock, Package, Boxes, AlertCircle,
    ArrowRight, MapPin, Phone, User as UserIcon,
    Download, ChevronRight, FileText, ShoppingCart,
    ChevronDown, Calendar, RefreshCw, X, QrCode, ScanLine
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
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
    
    // Batch Selection State
    const [showBatchModal, setShowBatchModal] = useState(false);
    const [batches, setBatches] = useState({});
    const [selectedBatches, setSelectedBatches] = useState({});
    const [loadingBatches, setLoadingBatches] = useState(false);

    // QR Detail Modal State
    const [showQRModal, setShowQRModal] = useState(false);
    const [qrModalData, setQrModalData] = useState(null); // { order, batchDetails[] }
    const [scanInput, setScanInput] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);
    const scanInputRef = useRef(null);

    const statusOptions = [
        'pending', 'confirmed', 'On Hold', 'Picking', 'Picklist Generated', 
        'Problem Queue', 'Quality Check', 'Packing', 'Scanned For Shipping', 
        'shipped', 'delivered', 'cancelled', 'Unallocated', 'Billing'
    ];

    const [allPickers, setAllPickers] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const [ordersRes, pickersRes] = await Promise.all([
                api.get('/orders'),
                api.get('/pickers')
            ]);
            
            if (ordersRes.data.success) {
                // Combine pickers from DB and existing orders for full list
                const dbPickers = (pickersRes.data.pickers || []).map(p => p.name);
                const orderPickers = ordersRes.data.orders.map(o => o.pickerName).filter(Boolean);
                const combinedPickers = [...new Set([...dbPickers, ...orderPickers])];
                setAllPickers(combinedPickers);

                // Filter for ONLY 'Picking' status orders
                const pickingOrders = ordersRes.data.orders
                    .filter(o => o.status === 'Picking')
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

            // --- Picker Requirement Check ---
            // Requirement for Picklist Generated or Quality Check
            const movingPastPickingOnly = nextIdx > flow.indexOf('Picking');
            if (movingPastPickingOnly && !order.pickerName) {
                return { isValid: false, reason: `Order ${order._id.substr(-6)}: Picker assignment is required to move past Picking stage.` };
            }
        }
        return { isValid: true, reason: '' };
    };

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus) {
            return Swal.fire('Wait', 'Please select a status to move orders to.', 'info');
        }

        // BLOCK Quality Check in bulk - must use individual batch selection
        if (bulkStatus === 'Quality Check') {
            Swal.fire({
                title: 'Batch Selection Required',
                text: 'To move orders to Quality Check, please open each order individually and select batches.',
                icon: 'info',
                customClass: { container: 'z-[100001]' }
            });
            return;
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

    const handlePrintPicklist = () => {
        // Just trigger print without changing status
        window.print();
    };

    const fetchBatchesForOrder = async (orderToFetch) => {
        const order = orderToFetch || selectedOrder;
        if (!order) return null;
        setLoadingBatches(true);
        try {
            const batchData = {};
            const autoSelected = {};
            for (const item of order.items) {
                const pid = String(item.product?._id || item.product || "");
                if (!pid) continue;
                try {
                    const { data } = await api.get(`/batches/product/${pid}`);
                    if (data.success) {
                        let pBatches = data.batches || [];
                        
                        // Handle products with quantity but NO batch records (legacy/unbatched)
                        if (pBatches.length === 0 && (item.product?.quantity > 0)) {
                            pBatches = [{
                                _id: 'PRODUCT_LEVEL',
                                batchNumber: item.product.batchNumber || 'Product Stock',
                                expiryDate: item.product.expiryDate || 'N/A',
                                quantity: item.product.quantity,
                                rackLocation: item.product.rackLocation || item.product.rackLocation || 'N/A'
                            }];
                        }

                        batchData[pid] = pBatches;
                        // Auto-select if there is exactly one batch (real or virtual)
                        if (pBatches.length === 1) {
                            autoSelected[pid] = pBatches[0]._id;
                        }
                    }
                } catch (err) {
                    console.error(`Error fetching batches for product ${pid}:`, err);
                }
            }
            setBatches(batchData);
            setSelectedBatches(autoSelected);
            return { batchData, autoSelected };
        } catch (error) {
            console.error('Failed to fetch batches:', error);
            Swal.fire('Error', 'Failed to load batch information', 'error');
            return null;
        } finally {
            setLoadingBatches(false);
        }
    };
    // Shared function to finalize move to QC
    const finalizeOrderMoveToQC = async (orderId, batchAssignments) => {
        try {
            setLoadingBatches(true);
            await api.put(`/orders/${orderId}/assign-batches`, { batchAssignments });
            await api.put(`/orders/${orderId}/status`, { status: 'Quality Check' });
            
            setOrders(prev => prev.filter(o => o._id !== orderId));
            setShowBatchModal(false);
            setShowModal(false);
            setShowQRModal(false);
            setQrModalData(null);
            setSelectedBatches({});
            setScanSuccess(false);
            
            Swal.fire({
                icon: 'success',
                title: 'Moved to QC!',
                text: 'Order successfully moved to QC stage.',
                timer: 1500,
                showConfirmButton: false,
                customClass: { container: 'z-[100001]' }
            });
            return true;
        } catch (error) {
            console.error('Finalize QC Move failed:', error);
            Swal.fire('Error', 'Failed to move to QC', 'error');
            return false;
        } finally {
            setLoadingBatches(false);
        }
    };


    const handleBatchAssignment = async (bdArg, skipFlowConfirm = false) => {
        // Handle case where it's called as an event listener (first arg is the event)
        const bd = (bdArg && bdArg.nativeEvent) ? batches : (bdArg || batches);
        const currentSelected = selectedBatches;
        
        // Final sanity check on items and their batches
        const missingBatches = selectedOrder.items.filter(item => {
            const pid = String(item.product?._id || item.product || "");
            const productBatches = bd[pid] || [];
            
            // 1. Single batch available? Auto-accept.
            if (productBatches.length === 1) return false;
            
            // 2. Multiple batches? Check if one is manually selected or was auto-selected
            if (productBatches.length > 1) {
                return !currentSelected[pid];
            }
            
            // 3. No batches? Mark as missing/incomplete
            return true;
        });

        if (missingBatches.length > 0) {
            Swal.fire({ 
                title: 'Incomplete', 
                text: 'Some items need a batch selection or are out of stock. Please check all items.', 
                icon: 'warning', 
                customClass: { container: 'z-[100001]' } 
            });
            setShowBatchModal(true);
            return;
        }

        const batchDetails = selectedOrder.items.map(item => {
            const pid = String(item.product?._id || item.product || "");
            const productBatches = bd[pid] || [];
            const bId = productBatches.length === 1 ? productBatches[0]._id : currentSelected[pid];
            const batchInfo = productBatches.find(b => b._id === bId);
            return {
                productId: pid,
                productName: item.productName,
                sku: item.product?.sku || 'N/A',
                quantity: item.quantity,
                batchId: bId,
                batchNumber: batchInfo?.batchNumber || 'N/A',
                expiryDate: batchInfo?.expiryDate,
                mrp: batchInfo?.mrp || 0,
                rackLocation: batchInfo?.rackLocation || 'N/A',
                availableQty: batchInfo?.quantity || 0,
            };
        });
        
        // ONLY skip if skipFlowConfirm is true (system auto-confirm)
        // Otherwise, ALWAYS open QR scanner to follow the manual picking process
        if (skipFlowConfirm) {
            const batchAssignments = batchDetails.map((b, idx) => ({
                itemIndex: idx,
                batchId: b.batchId,
                quantity: b.quantity
            }));
            await finalizeOrderMoveToQC(selectedOrder._id, batchAssignments);
            return;
        }

        const qrPayload = JSON.stringify({
            orderId: selectedOrder._id,
            action: 'MOVE_TO_QC',
            batches: batchDetails.map(b => ({ productId: b.productId, batchId: b.batchId, qty: b.quantity }))
        });

        setQrModalData({ order: selectedOrder, batchDetails, qrPayload });
        setShowBatchModal(false);
        setScanInput('');
        setScanSuccess(false);
        setShowQRModal(true);
        setTimeout(() => scanInputRef.current?.focus(), 300);
    };

    const handleMarkAsPicked = async () => {
        if (!selectedOrder?.pickerName) {
            Swal.fire({
                title: 'Picker Assignment Required',
                text: 'Please assign a picker to this order before proceeding.',
                icon: 'warning',
                customClass: { container: 'z-[100001]' }
            });
            return;
        }

        setLoadingBatches(true);
        // Force a fresh fetch if we are not 100% sure we have all items
        const result = await fetchBatchesForOrder();
        if (!result) { setLoadingBatches(false); return; }
        const bd = result.batchData;
        const isFullySelected = selectedOrder.items.every(item => {
            const pid = String(item.product?._id || item.product || "");
            const productBatches = bd[pid] || [];
            // Auto-accept if single batch exists
            if (productBatches.length === 1) return true;
            // For multiple batches, check either the current state or the fresh autoSelected result
            if (productBatches.length > 1) {
                return selectedBatches[pid] || result.autoSelected[pid];
            }
            return false; // Zero batches
        });

        if (isFullySelected) {
            // Even if fully selected, we don't 'skip' - we want the QR to open for confirmation
            await handleBatchAssignment(bd, false);
        } else {
            // Open modal to select the remaining ones
            setShowBatchModal(true);
        }
        setLoadingBatches(false);
    };

    const handleMoveToQC = async () => {
        if (!qrModalData) return;
        const batchAssignments = qrModalData.batchDetails.map((b, idx) => ({
            itemIndex: idx,
            batchId: b.batchId,
            quantity: b.quantity
        }));
        await finalizeOrderMoveToQC(qrModalData.order._id, batchAssignments);
    };

    // QR scan handler - jab scanner se scan ho
    const handleScanInput = (e) => {
        const val = e.target.value;
        // Scanner Enter key bhejta hai end mein
        if (val.endsWith('\n') || e.nativeEvent?.inputType === 'insertLineBreak') {
            try {
                const parsed = JSON.parse(val.trim());
                if (parsed.action === 'MOVE_TO_QC' && parsed.orderId === qrModalData?.order._id) {
                    setScanSuccess(true);
                    setScanInput('');
                    setTimeout(() => handleMoveToQC(), 800);
                } else {
                    Swal.fire({ icon: 'error', title: 'Invalid QR', text: 'This QR does not match the current order.', timer: 2000, showConfirmButton: false });
                    setScanInput('');
                }
            } catch {
                setScanInput('');
            }
        } else {
            setScanInput(val);
        }
    };

    const handleScanKeyDown = (e) => {
        if (e.key === 'Enter') {
            try {
                const parsed = JSON.parse(scanInput.trim());
                if (parsed.action === 'MOVE_TO_QC' && parsed.orderId === qrModalData?.order._id) {
                    setScanSuccess(true);
                    setScanInput('');
                    setTimeout(() => handleMoveToQC(), 800);
                } else {
                    Swal.fire({ icon: 'error', title: 'Invalid QR', text: 'This QR does not match the current order.', timer: 2000, showConfirmButton: false });
                    setScanInput('');
                }
            } catch {
                setScanInput('');
            }
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
                                <th className="px-5 py-4 whitespace-nowrap text-left">Picker</th>
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
                                <tr><td colSpan="11" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">Loading Picking Queue...</td></tr>
                            ) : paginatedOrders.length === 0 ? (
                                <tr><td colSpan="11" className="px-6 py-10 text-center text-gray-500 dark:text-gray-400">No orders currently in picking stage.</td></tr>
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
                                                onClick={() => { 
                                                    setBatches({});
                                                    setSelectedBatches({});
                                                    setSelectedOrder(order); 
                                                    setShowModal(true); 
                                                    fetchBatchesForOrder(order);
                                                }}
                                                className="hover:underline"
                                            >
                                                {order._id.substr(-12).toUpperCase()}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-gray-800 dark:text-gray-200 whitespace-nowrap font-mono text-xs">{order.vendorId}</td>
                                        
                                        {/* Dynamic Picker Section */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2 group/picker min-w-[140px]">
                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-400 group-hover/picker:bg-orange-100 group-hover/picker:text-orange-500 transition-colors">
                                                    <UserIcon size={12} />
                                                </div>
                                                <select 
                                                    value={order.pickerName || ''}
                                                    onChange={async (e) => {
                                                        const val = e.target.value;
                                                        if (val === 'ADD_NEW_PICKER') {
                                                            const { value: newPicker } = await Swal.fire({
                                                                title: 'Add New Picker',
                                                                input: 'text',
                                                                inputLabel: 'Staff Name',
                                                                placeholder: 'Enter picker name...',
                                                                showCancelButton: true
                                                            });
                                                            
                                                            if (newPicker && newPicker.trim()) {
                                                                try {
                                                                    // 1. Add to Picker DB for persistence
                                                                    await api.post('/pickers', { name: newPicker.trim() });
                                                                    
                                                                    // 2. Assign to order
                                                                    await api.put(`/orders/${order._id}/status`, { pickerName: newPicker.trim() });
                                                                    
                                                                    // 3. Update local state
                                                                    order.pickerName = newPicker.trim();
                                                                    setAllPickers(prev => [...new Set([...prev, newPicker.trim()])]);
                                                                    
                                                                    Swal.fire({
                                                                        toast: true,
                                                                        position: 'top-end',
                                                                        icon: 'success',
                                                                        title: 'Picker added & assigned',
                                                                        showConfirmButton: false,
                                                                        timer: 1500
                                                                    });
                                                                } catch (err) {
                                                                    console.error('Failed to add picker:', err);
                                                                    // Even if adding to DB fails (e.g. already exists), try assigning to order
                                                                    try {
                                                                        await api.put(`/orders/${order._id}/status`, { pickerName: newPicker.trim() });
                                                                        order.pickerName = newPicker.trim();
                                                                        setAllPickers(prev => [...new Set([...prev, newPicker.trim()])]);
                                                                    } catch (innerErr) {
                                                                        Swal.fire('Error', 'Failed to assign picker', 'error');
                                                                    }
                                                                }
                                                            }
                                                            return;
                                                        }
                                                        
                                                        try {
                                                            await api.put(`/orders/${order._id}/status`, { pickerName: val });
                                                            order.pickerName = val; 
                                                            setSelectedOrder(prev => prev && prev._id === order._id ? { ...prev, pickerName: val } : prev);
                                                            Swal.fire({
                                                                toast: true,
                                                                position: 'top-end',
                                                                icon: 'success',
                                                                title: 'Picker assigned',
                                                                showConfirmButton: false,
                                                                timer: 1500
                                                            });
                                                        } catch (err) {
                                                            console.error('Failed to update picker:', err);
                                                        }
                                                    }}
                                                    className="bg-transparent border-none focus:ring-0 py-1 px-1 text-[11px] font-bold text-gray-700 dark:text-gray-200 w-full cursor-pointer hover:text-orange-600 transition-all outline-none"
                                                >
                                                    <option value="">-- Assign --</option>
                                                    {allPickers.map(p => (
                                                        <option key={p} value={p}>{p}</option>
                                                    ))}
                                                    <option value="ADD_NEW_PICKER" className="font-bold text-orange-600">+ Add New Picker...</option>
                                                </select>
                                            </div>
                                        </td>

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
                                                onClick={() => { 
                                                    setBatches({});
                                                    setSelectedBatches({});
                                                    setSelectedOrder(order); 
                                                    setShowModal(true); 
                                                    fetchBatchesForOrder(order);
                                                }}
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
                        #root { display: none !important; }
                        .print\\:hidden { display: none !important; }
                        #printable-picklist {
                            display: block !important;
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            padding: 20px;
                            background-color: white !important;
                        }

                        * {
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
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
                                <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-800">
                                    <h3 className="text-[10px] font-black uppercase text-emerald-600 mb-2 tracking-widest">Handover Target</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm">{moment(selectedOrder.expectedHandover).format('DD MMM YYYY')}</p>
                                    <p className="text-[10px] text-emerald-600 mt-1 font-bold italic tracking-tighter">Must pick before 6:00 PM</p>
                                </div>
                                <div className="p-4 bg-slate-50/50 dark:bg-slate-900/10 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">Assigned Picker</h3>
                                    <p className="font-bold text-gray-800 dark:text-gray-200 text-sm flex items-center gap-1.5">
                                        <UserIcon size={14} className="text-slate-400" />
                                        {selectedOrder.pickerName || 'No Picker Assigned'}
                                    </p>
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Assign from the main table</p>
                                </div>
                             </div>

                             {/* Items Table */}
                            <h3 className="text-xs font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-2">
                                <Package size={14} /> Items to Pick
                            </h3>
                            <table className="w-full text-left text-sm mb-6 border border-gray-100 dark:border-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 uppercase">
                                    <tr>
                                        <th className="p-3">Product Name</th>
                                        <th className="p-3 text-center">Prescription</th>
                                        <th className="p-3 text-center">Required Qty</th>
                                        <th className="p-3 text-center">Bin Location</th>
                                        <th className="p-3 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {selectedOrder.items.map((item, i) => {
                                        const pid = String(item.product?._id || item.product);
                                        const productBatches = batches[pid] || [];
                                        const isPicked = selectedBatches[pid];
                                        return (
                                            <tr key={i} className={isPicked ? 'bg-orange-50/20 dark:bg-orange-900/10' : ''}>
                                                <td className="p-3 font-medium">
                                                    <p className="text-gray-800 dark:text-gray-200">{item.productName}</p>
                                                    <p className="text-[10px] text-gray-400">SKU: {item.product?.sku || 'N/A'}</p>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {item.product?.isPrescriptionRequired
                                                        ? <span className="px-2 py-0.5 bg-red-50 text-red-600 border border-red-200 rounded-full text-[10px] font-black uppercase">Rx Required</span>
                                                        : <span className="px-2 py-0.5 bg-green-50 text-green-600 border border-green-200 rounded-full text-[10px] font-black uppercase">No Rx</span>
                                                    }
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="bg-gray-100 dark:bg-gray-800 px-3 py-1 text-gray-800 dark:text-gray-200 rounded-full font-black text-lg">
                                                        {item.quantity}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    <span className="font-mono text-xs bg-cyan-50 dark:bg-cyan-900/20 text-cyan-600 px-2 py-1 rounded border border-cyan-100 dark:border-cyan-800">
                                                        {item.product?.rackLocation || 'TBD'}
                                                    </span>
                                                </td>
                                                <td className="p-3 text-center">
                                                    {loadingBatches ? (
                                                        <span className="flex items-center justify-center gap-1 text-[10px] text-gray-400">
                                                            <RefreshCw className="w-3 h-3 animate-spin" /> Fetching...
                                                        </span>
                                                    ) : productBatches.length === 0 ? (
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-[10px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100">Zero Stock</span>
                                                            <span className="text-[10px] text-gray-400">Available: {item.product?.quantity || 0}</span>
                                                        </div>
                                                    ) : isPicked ? (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[10px] font-black uppercase border border-green-200">
                                                                Done
                                                            </span>
                                                            <button 
                                                                onClick={async () => {
                                                                    const result = await fetchBatchesForOrder();
                                                                    if (result) setShowBatchModal(true);
                                                                }}
                                                                className="text-[9px] font-black uppercase text-orange-600 hover:underline"
                                                            >
                                                                Change
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button 
                                                            disabled={loadingBatches}
                                                            onClick={async () => {
                                                                let currentBatches = productBatches;
                                                                if (currentBatches.length === 0) {
                                                                    const result = await fetchBatchesForOrder();
                                                                    if (result) currentBatches = result.batchData[pid] || [];
                                                                }
                                                                
                                                                if (currentBatches.length === 1) {
                                                                    setSelectedBatches(prev => ({ ...prev, [pid]: currentBatches[0]._id }));
                                                                } else {
                                                                    setShowBatchModal(true);
                                                                }
                                                            }}
                                                            className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-1 mx-auto disabled:opacity-50"
                                                        >
                                                            Pick
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            
                            <div className="flex justify-end gap-3 mt-4 border-t border-gray-100 pt-6 dark:border-gray-800">
                                <button 
                                    onClick={handlePrintPicklist}
                                    className="px-6 py-2 bg-gray-800 text-white rounded-lg text-xs font-black uppercase hover:bg-gray-900 transition-all flex items-center gap-2"
                                >
                                    <FileText size={16} /> Print Picklist
                                </button>
                                <button 
                                    onClick={handleMarkAsPicked}
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg text-xs font-black uppercase hover:bg-orange-700 shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2"
                                >
                                    <CheckCircle size={16} /> Mark as Picked
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. PRINTABLE PICKLIST (LOGIWA STYLE DESIGN) */}
                <div id="printable-picklist" className="hidden print:block bg-white text-black p-4 font-sans" style={{ color: '#000', backgroundColor: '#fff', minHeight: '100vh', width: '100%', padding: '20px' }}>
                    {/* Top Header Section */}
                    <div style={{ display: 'flex', border: '1px solid #000', marginBottom: '-1px' }}>
                        <div style={{ width: '50%', padding: '15px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center', gap: '10px' }}>
                             <div style={{ backgroundColor: '#005bb5', color: '#fff', width: '40px', height: '40px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyCenter: 'center', fontWeight: 'bold', fontSize: '20px' }}><span style={{ margin: 'auto' }}>KS</span></div>
                             <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#005bb5', letterSpacing: '-1px' }}>KS Medial</span>
                        </div>
                        <div style={{ width: '50%', padding: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <h1 style={{ fontSize: '42px', fontWeight: '900', margin: 0, letterSpacing: '2px' }}>PICK LIST</h1>
                        </div>
                    </div>

                    {/* Meta Data Table Section */}
                    <div style={{ border: '1px solid #000' }}>
                        {/* Row 1: Name & Order No */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', backgroundColor: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Customer Name :</div>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', fontSize: '13px' }}>{selectedOrder.userId?.name || 'Guest'}</div>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', backgroundColor: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Order Number :</div>
                            <div style={{ width: '25%', padding: '8px 12px', fontSize: '13px', textAlign: 'center', fontWeight: 'bold' }}>{selectedOrder.orderNumber || selectedOrder._id.substr(-8).toUpperCase()}</div>
                        </div>
                        
                        {/* Row 2: Address & Date */}
                        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', backgroundColor: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Customer Address :</div>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', fontSize: '13px' }}>{selectedOrder.city}, {selectedOrder.state || 'India'}</div>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', backgroundColor: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Order Date :</div>
                            <div style={{ width: '25%', padding: '8px 12px', fontSize: '13px', textAlign: 'center' }}>{moment(selectedOrder.createdAt).format('DD/MM/YYYY')}</div>
                        </div>

                        {/* Row 3: Picker Details (User Requested) */}
                        <div style={{ display: 'flex' }}>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', backgroundColor: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Assigned Picker :</div>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', fontSize: '13px', fontWeight: '900', color: '#005bb5' }}>{selectedOrder.pickerName || 'NOT ASSIGNED'}</div>
                            <div style={{ width: '25%', padding: '8px 12px', borderRight: '1px solid #000', backgroundColor: '#fff', fontSize: '13px', fontWeight: 'bold' }}>Picking Deadline :</div>
                            <div style={{ width: '25%', padding: '8px 12px', fontSize: '13px', textAlign: 'center', color: '#d97706', fontWeight: 'bold' }}>{moment(selectedOrder.expectedHandover).format('DD/MM/YYYY')}</div>
                        </div>
                    </div>

                    {/* Extra Notes Placeholder Section */}
                    <div style={{ border: '1px solid #000', borderTop: 'none', padding: '15px', textAlign: 'center', backgroundColor: '#fff' }}>
                        <p style={{ fontSize: '16px', fontWeight: 'bold', margin: 0 }}>Extra Notes</p>
                    </div>

                    {/* Master Items Table Section */}
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse', 
                        border: '1px solid #000',
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#cccccc', color: '#000' }}>
                                <th style={{ border: '1px solid #000', padding: '8px 5px', fontSize: '14px', textAlign: 'center', width: '40px' }}>No</th>
                                <th style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '14px', textAlign: 'left', width: '120px' }}>Location</th>
                                <th style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '14px', textAlign: 'left', width: '80px' }}>Pallet</th>
                                <th style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '14px', textAlign: 'left', width: '150px' }}>SKU</th>
                                <th style={{ border: '1px solid #000', padding: '8px 12px', fontSize: '14px', textAlign: 'left' }}>Item Name</th>
                                <th style={{ border: '1px solid #000', padding: '8px 8px', fontSize: '14px', textAlign: 'center', width: '80px' }}>Qty To Pick</th>
                                <th style={{ border: '1px solid #000', padding: '8px 8px', fontSize: '14px', textAlign: 'center', width: '80px' }}>Picked Qty</th>
                            </tr>
                        </thead>
                        <tbody>
                            {selectedOrder.items.map((item, i) => (
                                <tr key={i} style={{ height: '45px' }}>
                                    <td style={{ border: '1px solid #000', padding: '8px 5px', textAlign: 'center', fontSize: '13px' }}>{i + 1}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold' }}>{item.product?.rackLocation || '---'}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'left', fontSize: '13px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'left', fontSize: '13px', fontWeight: 'bold' }}>{item.product?.sku || item.sku || 'N/A'}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 12px', textAlign: 'left', fontSize: '13px' }}>{item.productName}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 8px', textAlign: 'center', fontSize: '16px', fontWeight: 'bold' }}>{item.quantity}</td>
                                    <td style={{ border: '1px solid #000', padding: '8px 8px', textAlign: 'center', fontSize: '13px' }}></td>
                                </tr>
                            ))}
                            {/* Empty rows if necessary, filler for visual matching */}
                            {selectedOrder.items.length < 5 && [1,2,3,4,5].slice(selectedOrder.items.length).map((_, i) => (
                                <tr key={`empty-${i}`} style={{ height: '35px' }}>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '8px' }}></td>
                                    <td style={{ border: '1px solid #000', padding: '1px' }}></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Footer Info */}
                    <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#666' }}>
                        <p>Printed By: System Admin</p>
                        <p>Page 1 of 1</p>
                        <p>Print Time: {moment().format('DD/MM/YYYY HH:mm:ss')}</p>
                    </div>
                </div>
                </>,
                document.body
            )}

            {/* Batch Selection Modal */}
            {showBatchModal && selectedOrder && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[90vh] rounded-xl shadow-2xl overflow-hidden flex flex-col animate-scale-up border border-gray-200 dark:border-gray-700">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Select Batches</h2>
                                <p className="text-xs text-gray-500 font-medium mt-1">Choose batch for each product before moving to QC</p>
                            </div>
                            <button onClick={() => setShowBatchModal(false)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={24} /></button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto">
                            {loadingBatches ? (
                                <div className="text-center py-10 text-gray-500">Loading batches...</div>
                            ) : (
                                <div className="space-y-6">
                                    {selectedOrder.items.map((item, idx) => {
                                        const pid = String(item.product?._id || item.product);
                                        const bd = batches;
                                        const productBatches = bd[pid] || [];
                                        const isSingleBatch = productBatches.length === 1;
                                        const autoBatch = isSingleBatch ? productBatches[0] : null;
                                        return (
                                        <div key={idx} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50/50 dark:bg-gray-800/50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h3 className="font-bold text-gray-800 dark:text-white">{item.productName}</h3>
                                                    <p className="text-xs text-gray-500">SKU: {item.product?.sku} | Required Qty: {item.quantity}</p>
                                                </div>
                                                {isSingleBatch ? (
                                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-bold">Auto Selected</span>
                                                ) : selectedBatches[pid] ? (
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">&#10003; Selected</span>
                                                ) : null}
                                            </div>

                                            {isSingleBatch ? (
                                                <div className="flex items-center gap-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                                                    <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                                        <div>
                                                            <p className="text-gray-500 text-[10px] uppercase">Batch No.</p>
                                                            <p className="font-mono font-bold text-gray-800 dark:text-white">{autoBatch.batchNumber}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 text-[10px] uppercase">Expiry</p>
                                                            <p className="font-bold text-gray-800 dark:text-white">{moment(autoBatch.expiryDate).format('MMM YYYY')}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 text-[10px] uppercase">Stock</p>
                                                            <p className={`font-bold ${autoBatch.quantity >= item.quantity ? 'text-green-600' : 'text-red-600'}`}>{autoBatch.quantity}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-gray-500 text-[10px] uppercase">Location</p>
                                                            <p className="font-bold text-cyan-600">{autoBatch.rackLocation || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : productBatches.length > 1 ? (
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                    {productBatches.map(batch => (
                                                        <div
                                                            key={batch._id}
                                                            onClick={() => setSelectedBatches(prev => ({ ...prev, [pid]: batch._id }))}
                                                            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
                                                                selectedBatches[pid] === batch._id
                                                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                                                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                                                            }`}
                                                        >
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300">{batch.batchNumber}</span>
                                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                                    batch.quantity >= item.quantity ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                                                }`}>Stock: {batch.quantity}</span>
                                                            </div>
                                                            <div className="grid grid-cols-2 gap-2 text-xs">
                                                                <div>
                                                                    <p className="text-gray-500 text-[10px] uppercase">Expiry</p>
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200">{moment(batch.expiryDate).format('MMM YYYY')}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 text-[10px] uppercase">Location</p>
                                                                    <p className="font-bold text-gray-800 dark:text-gray-200">{batch.rackLocation || 'N/A'}</p>
                                                                </div>
                                                            </div>
                                                            {batch.quantity < item.quantity && (
                                                                <p className="text-red-600 text-[10px] font-bold mt-2">&#9888; Insufficient stock</p>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="text-center py-4 text-gray-500 text-sm">No batches available for this product</div>
                                            )}
                                        </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800">
                            <button 
                                onClick={() => setShowBatchModal(false)}
                                className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-black uppercase hover:bg-gray-300 transition-all"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleBatchAssignment}
                                disabled={loadingBatches}
                                className="px-6 py-2 bg-orange-600 text-white rounded-lg text-xs font-black uppercase hover:bg-orange-700 shadow-lg shadow-orange-500/30 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <CheckCircle size={16} /> {loadingBatches ? 'Processing...' : 'Confirm & Move to QC'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* QR Detail Modal */}
            {showQRModal && qrModalData && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-gray-200 dark:border-gray-700">
                        
                        {/* Header */}
                        <div className="px-5 py-3.5 flex justify-between items-center border-b border-gray-100 dark:border-gray-800">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                                    <QrCode size={16} className="text-orange-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-800 dark:text-white">Batch Confirmed</p>
                                    <p className="text-[10px] text-gray-400">Order #{qrModalData.order._id.substr(-8).toUpperCase()}</p>
                                </div>
                            </div>
                            <button onClick={() => { setShowQRModal(false); setQrModalData(null); }} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                <X size={18} />
                            </button>
                        </div>

                        <div className="p-5 space-y-4">
                            {/* Batch Items - compact table */}
                            <div className="border border-gray-100 dark:border-gray-800 rounded-xl overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-50 dark:bg-gray-800 text-gray-500 uppercase">
                                            <th className="px-3 py-2 text-left font-black tracking-wide">Product</th>
                                            <th className="px-3 py-2 text-center font-black tracking-wide">Batch</th>
                                            <th className="px-3 py-2 text-center font-black tracking-wide">Expiry</th>
                                            <th className="px-3 py-2 text-center font-black tracking-wide">Qty</th>
                                            <th className="px-3 py-2 text-center font-black tracking-wide">Rack</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                        {qrModalData.batchDetails.map((item, idx) => (
                                            <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                                                <td className="px-3 py-2.5">
                                                    <p className="font-bold text-gray-800 dark:text-white truncate max-w-[120px]">{item.productName}</p>
                                                    <p className="text-[9px] text-orange-500 font-mono">{item.sku}</p>
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-mono font-bold text-gray-700 dark:text-gray-300">{item.batchNumber}</td>
                                                <td className={`px-3 py-2.5 text-center font-bold ${
                                                    item.expiryDate && new Date(item.expiryDate) < new Date(Date.now() + 90*24*60*60*1000) ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'
                                                }`}>
                                                    {item.expiryDate ? moment(item.expiryDate).format('MMM YY') : 'N/A'}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] ${
                                                        item.availableQty < item.quantity ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-700'
                                                    }`}>{item.quantity}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center font-bold text-cyan-600 dark:text-cyan-400">{item.rackLocation}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* QR + Scan row */}
                            <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800">
                                {/* QR Code */}
                                <div className="bg-white p-2 rounded-xl border-2 border-orange-300 shrink-0">
                                    <QRCodeSVG value={qrModalData.qrPayload} size={100} level="H" fgColor="#1a1a1a" />
                                </div>
                                {/* Scan input + info */}
                                <div className="flex-1 space-y-2">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Scan QR to move to QC</p>
                                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all ${
                                        scanSuccess ? 'border-green-500 bg-green-50' : 'border-orange-200 bg-white dark:bg-gray-900 focus-within:border-orange-400'
                                    }`}>
                                        <ScanLine size={14} className={scanSuccess ? 'text-green-500' : 'text-orange-400'} />
                                        <input
                                            ref={scanInputRef}
                                            type="text"
                                            value={scanInput}
                                            onChange={handleScanInput}
                                            onKeyDown={handleScanKeyDown}
                                            placeholder={scanSuccess ? '✓ Scanned!' : 'Scan here...'}
                                            className="flex-1 bg-transparent outline-none text-xs font-bold text-gray-700 dark:text-gray-300 placeholder:text-gray-400"
                                        />
                                    </div>
                                    <p className="text-[9px] text-gray-400">Point scanner at QR code</p>
                                </div>
                            </div>

                            {/* Footer buttons */}
                            <div className="flex items-center gap-3 pt-1">
                                <button
                                    onClick={() => { setShowQRModal(false); setQrModalData(null); }}
                                    className="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl text-xs font-black uppercase hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleMoveToQC}
                                    disabled={loadingBatches}
                                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-black uppercase shadow-lg shadow-orange-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loadingBatches
                                        ? <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                                        : <><CheckCircle size={14} /> Move to QC</>
                                    }
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default PickingOrders;
