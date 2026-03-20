import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { 
    Search, RefreshCw, X, Play, CheckCircle, AlertCircle, Truck, Package,
    User as UserIcon, MapPin, Clock, Edit3, PlusCircle, ArrowLeft, ScanLine, QrCode as QrIcon
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import { createPortal } from 'react-dom';

const OrderProcessing = () => {
    const [activeTab, setActiveTab] = useState('qc'); 
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Comprehensive Modal State
    const [showProcessModal, setShowProcessModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [batches, setBatches] = useState({});
    const [selectedBatches, setSelectedBatches] = useState({});
    const [loadingBatches, setLoadingBatches] = useState(false);
    
    // Batch Picker Modal State
    const [editingBatchProduct, setEditingBatchProduct] = useState(null);

    // QR & Scan
    const [scanInput, setScanInput] = useState('');
    const [scanSuccess, setScanSuccess] = useState(false);
    const scanInputRef = useRef(null);

    // Filters
    const [selectedIds, setSelectedIds] = useState([]);
    const [filters, setFilters] = useState({ orderId: '' });
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(25);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                let relevantOrders = [];
                if (activeTab === 'qc') {
                    relevantOrders = data.orders.filter(o => o.status === 'Quality Check' || o.status === 'Under QC');
                } else if (activeTab === 'packing') {
                    relevantOrders = data.orders.filter(o => o.status === 'Packing');
                }
                
                setOrders(relevantOrders.map(order => ({
                    ...order,
                    vendorId: order.vendorId || 'N/A',
                    skuNames: order.items.map(i => i.productName).join(', '),
                    collectibleAmount: order.total
                })));
                setCurrentPage(1);
            }
        } catch {
            Swal.fire('Error', 'Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const fetchBatchesForOrder = async (order) => {
        setLoadingBatches(true);
        try {
            const batchData = {};
            const autoSelected = {};
            for (const item of order.items) {
                const pid = String(item.product?._id || item.product || "");
                if (!pid) continue;
                const { data } = await api.get(`/batches/product/${pid}`);
                if (data.success) {
                    let pBatches = data.batches || [];
                    if (pBatches.length === 0 && (item.product?.quantity > 0)) {
                        pBatches = [{
                            _id: 'PRODUCT_LEVEL',
                            batchNumber: item.product.batchNumber || 'Stock',
                            expiryDate: item.product.expiryDate || 'N/A',
                            quantity: item.product.quantity,
                            rackLocation: item.product.rackLocation || 'N/A'
                        }];
                    }
                    batchData[pid] = pBatches;
                    if (pBatches.length === 1) autoSelected[pid] = pBatches[0]._id;
                }
            }
            setBatches(batchData);
            setSelectedBatches(autoSelected);
        } catch (error) {
            console.error('Batch fetch error:', error);
        } finally {
            setLoadingBatches(false);
        }
    };

    const handleOpenProcessModal = async (order) => {
        setSelectedOrder(order);
        setEditingBatchProduct(null);
        setScanSuccess(false);
        setScanInput('');
        setShowProcessModal(true);
        await fetchBatchesForOrder(order);
        setTimeout(() => scanInputRef.current?.focus(), 800);
    };

    const isOrderReady = useMemo(() => {
        if (!selectedOrder) return false;
        return selectedOrder.items.every(item => {
            const pid = String(item.product?._id || item.product);
            return !!selectedBatches[pid];
        });
    }, [selectedOrder, selectedBatches]);

    const qrPayload = useMemo(() => {
        if (!isOrderReady || !selectedOrder) return '';
        const batchDetails = selectedOrder.items.map(item => {
            const pid = String(item.product?._id || item.product);
            const bId = selectedBatches[pid];
            return { productId: pid, batchId: bId, qty: item.quantity };
        });
        return JSON.stringify({ orderId: selectedOrder._id, action: 'PASS_QC', batches: batchDetails });
    }, [isOrderReady, selectedOrder, selectedBatches]);

    const handleManualPass = async () => {
        if (!isOrderReady) {
            return Swal.fire({ title: 'Batches Missing', text: 'Select a batch for each SKU.', icon: 'warning', customClass: { container: 'z-[99999]' } });
        }

        const result = await Swal.fire({
            title: 'Manual Pass?',
            text: 'Move instantly to Packing?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Move',
            customClass: { container: 'z-[99999]' }
        });

        if (result.isConfirmed) { await finalizeQC(true); }
    };

    const handleScanInput = (e) => {
        const val = e.target.value;
        if (val.endsWith('\n') || e.nativeEvent?.inputType === 'insertLineBreak') {
             try {
                 const parsed = JSON.parse(val.trim());
                 if (parsed.action === 'PASS_QC' && parsed.orderId === selectedOrder._id) {
                     setScanSuccess(true);
                     setTimeout(() => finalizeQC(), 800);
                 } else {
                     setScanInput('');
                     Swal.fire({ icon: 'error', title: 'Invalid', text: 'Invalid QR for this order.', timer: 1500, showConfirmButton: false });
                 }
             } catch { setScanInput(''); }
        } else {
            setScanInput(val);
        }
    };

    const finalizeQC = async (isManual = false) => {
        const orderId = selectedOrder._id;
        const currentBatches = batches;
        const currentSelected = selectedBatches;

        const batchAssignments = selectedOrder.items.map((item, idx) => {
            const pid = String(item.product?._id || item.product || "");
            const pBatches = currentBatches[pid] || [];
            const bId = pBatches.length === 1 ? pBatches[0]._id : currentSelected[pid];
            return { itemIndex: idx, batchId: bId, quantity: item.quantity };
        });

        try {
            await api.put(`/orders/${orderId}/assign-batches`, { batchAssignments });
            await api.put(`/orders/${orderId}/status`, { status: 'Packing' });
            Swal.fire({ icon: 'success', title: isManual ? 'Manual Pass' : 'QC Verified', text: 'Order sent to Packing.', timer: 1200, showConfirmButton: false, customClass: { container: 'z-[99999]' } });
            setShowProcessModal(false);
            fetchOrders();
        } catch { Swal.fire('Error', 'Update failed.', 'error'); }
    };

    const handleMoveToShipping = async (orderId) => {
        const result = await Swal.fire({ title: 'Ready for shipping?', icon: 'question', showCancelButton: true });
        if (result.isConfirmed) {
            try {
                await api.put(`/orders/${orderId}/status`, { status: 'Scanned For Shipping' });
                fetchOrders();
            } catch { Swal.fire('Error', 'Failed', 'error'); }
        }
    };

    const paginatedOrders = orders.filter(o => o._id.toLowerCase().includes(filters.orderId.toLowerCase()))
                                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? paginatedOrders.map(o => o._id) : []);
    const handleSelectOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleBulkMove = async () => {
        if (selectedIds.length === 0) return;
        const targetStatus = activeTab === 'qc' ? 'Packing' : 'Scanned For Shipping';
        
        const result = await Swal.fire({
            title: `Bulk Move ${selectedIds.length} Orders?`,
            text: `This will move selected orders to "${targetStatus}". Note: Manual batch verification will be skipped for these orders.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: `Yes, Move to ${targetStatus}`,
            confirmButtonColor: '#003B5C'
        });

        if (result.isConfirmed) {
            try {
                setLoading(true);
                const { data } = await api.put('/orders/bulk-status', { 
                    orderIds: selectedIds, 
                    status: targetStatus 
                });
                if (data.success) {
                    Swal.fire('Success', `${selectedIds.length} orders moved to ${targetStatus}`, 'success');
                    setSelectedIds([]);
                    fetchOrders();
                }
            } catch {
                Swal.fire('Error', 'Bulk update failed.', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    return (
        <div className="p-4 space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <Package className="text-[#003B5C]"/> Order Processing
                </h1>
                <div className="flex bg-gray-100 dark:bg-gray-800 p-0.5 rounded-lg border shadow-inner">
                    <button onClick={() => setActiveTab('qc')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'qc' ? 'bg-white shadow text-[#003B5C]' : 'text-gray-500'}`}>
                        QC Queue ({activeTab === 'qc' ? orders.length : ''})
                    </button>
                    <button onClick={() => setActiveTab('packing')} className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${activeTab === 'packing' ? 'bg-white shadow text-[#003B5C]' : 'text-gray-500'}`}>
                        Packing ({activeTab === 'packing' ? orders.length : ''})
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border shadow-sm overflow-hidden">
                <div className="p-3 border-b flex gap-3">
                    <div className="relative flex-1 max-w-xs">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={12} />
                        <input placeholder="Search Order ID..." className="w-full pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-900 border rounded text-xs focus:ring-1 focus:ring-blue-500 outline-none" onChange={e => setFilters({...filters, orderId: e.target.value})} />
                    </div>
                    <button onClick={fetchOrders} className="p-2 border rounded hover:bg-gray-100"><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/></button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-[#003B5C] text-white font-bold uppercase tracking-wider">
                            <tr>
                                <th className="p-4 w-10">
                                    <input 
                                        type="checkbox" 
                                        checked={paginatedOrders.length > 0 && selectedIds.length === paginatedOrders.length}
                                        onChange={handleSelectAll}
                                        className="rounded border-white/20"
                                    />
                                </th>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Vendor</th>
                                <th className="p-4">Picker</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                            {loading ? <tr><td colSpan="5" className="p-10 text-center text-gray-400 uppercase font-black tracking-widest animate-pulse">Syncing Warehouse Queue...</td></tr> : 
                             paginatedOrders.length === 0 ? <tr><td colSpan="5" className="p-10 text-center text-gray-300 uppercase font-bold italic">No orders in this queue.</td></tr> :
                             paginatedOrders.map(o => (
                                <tr key={o._id} className={`hover:bg-blue-50/30 transition-colors border-l-4 ${selectedIds.includes(o._id) ? 'border-blue-500 bg-blue-50/20' : 'border-transparent'}`}>
                                    <td className="p-4 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(o._id)}
                                            onChange={() => handleSelectOne(o._id)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                    </td>
                                    <td className="p-4 font-bold text-[#003B5C] cursor-pointer hover:underline" onClick={() => handleOpenProcessModal(o)}>{o._id.substr(-8).toUpperCase()}</td>
                                    <td className="p-4 text-gray-400 font-mono text-[10px]">{o.vendorId}</td>
                                    <td className="p-4 uppercase text-[10px] font-bold text-gray-600">{o.pickerName || '---'}</td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => activeTab === 'qc' ? handleOpenProcessModal(o) : handleMoveToShipping(o._id)} className="p-2 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-transform active:scale-90">
                                            {activeTab === 'qc' ? <Play size={14} fill="currentColor"/> : <Truck size={14}/>}
                                        </button>
                                    </td>
                                </tr>
                             ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* BULK ACTION BAR */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#003B5C] text-white px-8 py-5 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.3)] z-[100] flex items-center gap-10 animate-scale-up border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-4 pr-10 border-r border-white/10">
                        <div className="bg-blue-500 p-2.5 rounded-2xl shadow-inner">
                            <Package size={22} className="text-white" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 opacity-80">Selected</p>
                            <p className="text-lg font-black tracking-tight">{selectedIds.length} {selectedIds.length === 1 ? 'Order' : 'Orders'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Step Progression</span>
                            <button 
                                onClick={handleBulkMove}
                                className="px-8 py-3 bg-white text-[#003B5C] hover:bg-blue-50 rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 group"
                            >
                                <CheckCircle size={18} className="group-hover:rotate-12 transition-transform" />
                                Move to {activeTab === 'qc' ? 'Packing' : 'Shipping'}
                            </button>
                        </div>
                    </div>

                    <button 
                        onClick={() => setSelectedIds([])}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>
            )}

            {/* MAIN PROCESS MODAL */}
            {showProcessModal && selectedOrder && createPortal(
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-5xl max-h-[92vh] rounded-2xl shadow-xl flex flex-col overflow-hidden border relative animate-scale-up">
                        
                        {/* THE NESTED BATCH MODAL */}
                        {editingBatchProduct && (
                            <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/50 animate-fade-in shadow-2xl">
                                <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl flex flex-col max-h-[80vh] border border-white/20">
                                    <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                                        <h3 className="font-bold text-sm uppercase tracking-tight">Select Batch Matrix</h3>
                                        <button onClick={() => setEditingBatchProduct(null)} className="p-1 hover:text-red-500 transition-colors"><X size={18}/></button>
                                    </div>
                                    <div className="p-4 bg-blue-50/30 border-b">
                                        <h4 className="font-bold text-sm leading-tight text-[#003B5C] uppercase">{editingBatchProduct.productName}</h4>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Required Quantity: <span className="text-blue-600">{editingBatchProduct.requiredQty} UNITS</span></p>
                                    </div>
                                    <div className="p-4 overflow-y-auto space-y-2 custom-scrollbar bg-gray-50/30">
                                        {(batches[editingBatchProduct.pid] || []).map(b => (
                                            <div 
                                                key={b._id} 
                                                onClick={() => { setSelectedBatches({...selectedBatches, [editingBatchProduct.pid]: b._id}); setEditingBatchProduct(null); }}
                                                className={`p-4 border rounded-xl cursor-pointer transition-all ${selectedBatches[editingBatchProduct.pid] === b._id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'hover:border-blue-200 bg-white shadow-sm'}`}
                                            >
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="font-bold text-xs uppercase tracking-tight">Batch: {b.batchNumber}</span>
                                                    <span className="text-white bg-[#003B5C] px-2.5 py-0.5 rounded text-[9px] font-black uppercase">{b.rackLocation}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold text-gray-500 mt-2 border-t pt-2">
                                                    <span>In Stock: <span className={b.quantity >= editingBatchProduct.requiredQty ? 'text-green-600' : 'text-red-500'}>{b.quantity}</span></span>
                                                    <span>Expiry: {moment(b.expiryDate).format('MMM YYYY')}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="p-3 border-t bg-gray-50 text-center">
                                         <button onClick={() => setEditingBatchProduct(null)} className="text-[10px] font-bold text-gray-400 hover:text-blue-600 uppercase tracking-widest transition-colors">Abort Selection</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* HEADER */}
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h2 className="font-bold text-lg text-[#003B5C] uppercase tracking-tight">Quality Check Mode</h2>
                                <p className="text-[10px] text-blue-600 font-bold uppercase flex items-center gap-2 mt-0.5">
                                    <Clock size={12}/> {selectedOrder._id.substr(-12).toUpperCase()} • Picker: {selectedOrder.pickerName || 'System'}
                                </p>
                            </div>
                            <button onClick={() => setShowProcessModal(false)} className="p-1 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>

                        <div className="flex-1 flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x overflow-hidden">
                            {/* LEFT SIDE: INVENTORY CHECKLIST */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    <div className="p-3 bg-blue-50/30 rounded-lg border border-blue-100 flex flex-col">
                                        <span className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Customer</span>
                                        <span className="text-xs font-bold mt-0.5 truncate">{selectedOrder.userId?.name || selectedOrder.shippingAddress?.name || 'Guest'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">City</span>
                                        <span className="text-xs font-bold mt-0.5 truncate">{selectedOrder.shippingAddress?.city || selectedOrder.city || 'N/A'}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Pricing</span>
                                        <span className="text-xs font-bold mt-0.5 text-emerald-600">₹{selectedOrder.total}</span>
                                    </div>
                                    <div className="p-3 bg-gray-50 rounded-lg border flex flex-col">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Items</span>
                                        <span className="text-xs font-bold mt-0.5">{selectedOrder.items?.length} SKUs</span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-[#003B5C]/40 uppercase tracking-[0.3em] px-1">Scanning Checklist</h3>
                                    <div className="space-y-1.5 min-h-[100px]">
                                        {loadingBatches ? (
                                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3 border border-dashed rounded-2xl">
                                                <RefreshCw size={24} className="animate-spin text-blue-500" />
                                                <p className="text-[10px] font-bold uppercase tracking-[0.2em] animate-pulse">Assigning Batches...</p>
                                            </div>
                                        ) : (
                                            selectedOrder.items.map((it, idx) => {
                                            const pid = String(it.product?._id || it.product);
                                            const pBatches = batches[pid] || [];
                                            const selectedId = selectedBatches[pid];
                                            const bInfo = pBatches.find(b => b._id === selectedId);
                                            return (
                                                <div key={idx} className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-all ${selectedId ? 'bg-blue-50/20 border-blue-100 shadow-sm' : 'bg-white border-gray-100'}`}>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-bold text-sm truncate uppercase tracking-tight text-gray-700">{it.productName}</p>
                                                        <div className="flex items-center gap-3 mt-1.5">
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase">Req: <span className="text-blue-600">{it.quantity} UNITS</span></p>
                                                            {selectedId && <span className="text-[9px] font-bold text-emerald-600 bg-white border border-emerald-100 px-2 rounded flex items-center gap-1"><CheckCircle size={10}/> Batch: {bInfo?.batchNumber}</span>}
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => setEditingBatchProduct({ pid, productName: it.productName, requiredQty: it.quantity })}
                                                        className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-all flex items-center gap-2 border shadow-sm ${selectedId ? 'bg-white text-blue-600 border-blue-100 hover:shadow-md' : 'bg-blue-600 text-white animate-pulse'}`}
                                                    >
                                                        {selectedId ? <><Edit3 size={12}/> Change</> : <><PlusCircle size={12}/> Add</>}
                                                    </button>
                                                </div>
                                            );
                                        }))}
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT SIDE: SCAN & PROCESS CONTROLS */}
                            <div className="w-full md:w-[320px] bg-gray-50 flex flex-col p-6 border-l overflow-y-auto custom-scrollbar">
                                <div className="space-y-6">
                                    <h3 className="text-[10px] font-black text-[#003B5C] uppercase tracking-widest px-1">Verification Center</h3>
                                    
                                    {qrPayload ? (
                                        <div className="space-y-6 animate-scale-up">
                                            {/* QR Section */}
                                            <div className="bg-white p-5 rounded-2xl shadow-lg border-t-4 border-[#003B5C] flex flex-col items-center gap-4">
                                                <div className="bg-white p-2 rounded-xl border">
                                                    <QRCodeSVG value={qrPayload} size={150} level="M" />
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-[10px] font-black text-[#003B5C] uppercase tracking-tighter italic">Scanner Protocol Active</p>
                                                    <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">Scan QR to verify & move to packing</p>
                                                </div>
                                                <div className="w-full relative h-12 flex items-center justify-center bg-gray-900 rounded-xl border border-white/20 group">
                                                    <input ref={scanInputRef} type="text" value={scanInput} onChange={handleScanInput} autoFocus className="absolute inset-0 opacity-0 cursor-default" />
                                                    {scanSuccess ? (
                                                        <div className="text-green-400 font-black text-[10px] gap-2 flex items-center uppercase animate-pulse">
                                                            <CheckCircle size={14}/> Verified
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 group-focus-within:text-blue-400 transition-colors text-gray-500">
                                                            <ScanLine size={16} className="animate-pulse" />
                                                            <span className="text-[9px] font-bold uppercase tracking-widest">Entry Active</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Manual Section (Properly Visible) */}
                                            <div className="bg-white p-5 rounded-2xl border flex flex-col gap-3 shadow-sm">
                                                <div className="flex items-center gap-2 text-[#003B5C]">
                                                    <Edit3 size={14}/>
                                                    <span className="text-[10px] font-black uppercase tracking-tight">Manual Control</span>
                                                </div>
                                                <button 
                                                    onClick={handleManualPass}
                                                    className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-md active:scale-95"
                                                >
                                                    Move to Packing
                                                </button>
                                                <p className="text-[9px] text-gray-400 font-bold text-center uppercase tracking-tighter opacity-50 italic">Log Manual QC Pass</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-white p-10 rounded-2xl border border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 text-center">
                                            <div className="p-4 bg-gray-50 rounded-full text-gray-200"><AlertCircle size={32}/></div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">Please complete the checklist to enable controls</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-3 bg-white border-t flex justify-between items-center px-6">
                            <span className="text-[9px] font-bold text-gray-300 uppercase italic">Warehouse Automation Mode v2 • {new Date().toLocaleDateString()}</span>
                            <button onClick={() => setShowProcessModal(false)} className="px-6 py-2 text-[10px] font-black text-gray-400 hover:text-red-500 uppercase transition-colors">Abort & Exit</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

export default OrderProcessing;
