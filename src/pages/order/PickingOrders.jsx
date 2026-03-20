import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Eye, Truck, CheckCircle, 
    XCircle, Clock, Package, Boxes, AlertCircle,
    ArrowRight, MapPin, Phone, User as UserIcon,
    Download, ChevronRight, FileText, ShoppingCart,
    ChevronDown, Calendar, RefreshCw, X, QrCode, ScanLine,
    Printer, Layers
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
    
    const [allPickers, setAllPickers] = useState([]);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const [ordersRes, pickersRes] = await Promise.all([
                api.get('/orders'),
                api.get('/pickers').catch(() => ({ data: { success: true, pickers: [] } }))
            ]);
            
            if (ordersRes.data.success) {
                const dbPickers = (pickersRes.data.pickers || []).map(p => p.name);
                const orderPickers = ordersRes.data.orders.map(o => o.pickerName).filter(Boolean);
                const combinedPickers = [...new Set([...dbPickers, ...orderPickers])];
                setAllPickers(combinedPickers);

                // ONLY 'Picking' status orders here
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
            if (isSafetyCurrent) {
                if (targetStatus === 'pending' || targetStatus === 'confirmed') return { isValid: false, reason: `Cannot move an "${order.status}" order back to "${targetStatus}".` };
                if (['Scanned For Shipping', 'shipped', 'delivered'].includes(targetStatus)) return { isValid: false, reason: `Cannot move from "${order.status}" directly to "${targetStatus}". Resume through Picking/Packing stages first.` };
                continue; 
            }
            const isPicklistGenerated = targetStatus === 'Picklist Generated' && order.status === 'Picking';
            const isQCFromPicking = targetStatus === 'Quality Check' && order.status === 'Picking';
            if (currIdx >= 2 && (targetStatus === 'pending' || targetStatus === 'confirmed')) return { isValid: false, reason: `Cannot move to "${targetStatus}" — order is already in the warehouse workflow.` };
            const isSkip = nextIdx > currIdx + 1 && !isQCFromPicking && !isPicklistGenerated && currIdx !== -1 && nextIdx !== -1;
            if (isSkip && !isSafetyStage && !isSelf) return { isValid: false, reason: `Cannot skip from "${order.status}" to "${targetStatus}". Follow the step-by-step workflow.` };
            const isReverse = nextIdx < currIdx && nextIdx !== -1 && currIdx !== -1 && !isSafetyStage;
            if (isReverse && !isSelf) return { isValid: false, reason: `Cannot move "${order.status}" order backward to "${targetStatus}".` };
        }
        return { isValid: true, reason: '' };
    };

    const handleSelectAll = (e) => setSelectedIds(e.target.checked ? paginatedOrders.map(o => o._id) : []);
    const handleSelectOne = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

    const handleBulkStatusUpdate = async () => {
        if (!bulkStatus) return Swal.fire('Error', 'Please select a status.', 'error');
        const validation = getBulkValidation(bulkStatus);
        if (!validation.isValid) return Swal.fire('Invalid Workflow', validation.reason, 'error');
        const result = await Swal.fire({ title: `Update ${selectedIds.length} orders?`, text: `Move to "${bulkStatus}"?`, icon: 'question', showCancelButton: true, confirmButtonText: 'Yes, Update All' });
        if (result.isConfirmed) {
            try {
                setLoading(true);
                const response = await api.put('/orders/bulk-status', { orderIds: selectedIds, status: bulkStatus });
                if (response.data.success) {
                    Swal.fire('Updated!', response.data.message, 'success');
                    setSelectedIds([]);
                    setBulkStatus('');
                    fetchOrders();
                }
            } catch { Swal.fire('Error', 'Failed to update orders in bulk.', 'error'); } finally { setLoading(false); }
        }
    };

    const handleStatusUpdate = async (orderId, newStatus) => {
        const order = selectedOrder || orders.find(o => o._id === orderId);
        if (!order || (!order.pickerName && newStatus !== 'On Hold' && newStatus !== 'Problem Queue')) {
            return Swal.fire('Picker Required', 'Please assign a picker before moving forward.', 'warning');
        }

        const result = await Swal.fire({
            title: `Move to ${newStatus}?`,
            text: `Move Order #${order._id.substr(-8).toUpperCase()} to ${newStatus} stage?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, Move It',
            confirmButtonColor: '#003B5C'
        });

        if (!result.isConfirmed) return;

        try {
            setLoading(true);
            const response = await api.put(`/orders/${order._id}/status`, { status: newStatus });
            if (response.data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Moved!',
                    text: `Order is now in ${newStatus}.`,
                    timer: 1500,
                    showConfirmButton: false
                });
                setShowModal(false);
                fetchOrders();
            }
        } catch { Swal.fire('Error', 'Failed to update status.', 'error'); } finally { setLoading(false); }
    };

    const totalPages = Math.ceil(orders.length / itemsPerPage);
    const paginatedOrders = orders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Picking Queue</h1>
                    <p className="text-sm text-gray-500 font-medium">Generate picklists and assign pickers.</p>
                </div>
                <button onClick={fetchOrders} className="p-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-200">
                    <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {selectedIds.length > 0 && (
                <div className="bg-orange-600 text-white p-3 rounded-xl shadow-xl flex items-center justify-between sticky top-4 z-40 border-2 border-orange-400">
                    <div className="flex items-center gap-4">
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest">{selectedIds.length} Selected</span>
                        <select value={bulkStatus} onChange={(e) => setBulkStatus(e.target.value)} className="bg-orange-800 border border-orange-400 rounded px-2 py-1 text-xs font-bold outline-none">
                            <option value="">-- Choose Status --</option>
                            <option value="Picklist Generated">Picklist Generated</option>
                            <option value="Quality Check">Quality Check</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Problem Queue">Problem Queue</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => setSelectedIds([])} className="px-4 py-1.5 hover:bg-white/10 rounded-lg text-xs font-bold uppercase transition-all">Cancel</button>
                        <button onClick={handleBulkStatusUpdate} className="bg-white text-orange-600 px-6 py-1.5 rounded-lg text-xs font-black uppercase hover:bg-orange-50 transition-all flex items-center gap-2">
                            Update Selected
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden text-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#003B5C] text-white text-[11px] font-bold uppercase">
                            <tr>
                                <th className="p-4 w-12"><input type="checkbox" onChange={handleSelectAll} checked={paginatedOrders.length > 0 && selectedIds.length === paginatedOrders.length} className="rounded" /></th>
                                <th className="p-4">Order ID</th>
                                <th className="p-4">Vendor ID</th>
                                <th className="p-4">Picker</th>
                                <th className="p-4 text-center">Status</th>
                                <th className="p-4 text-right">Amount</th>
                                <th className="p-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? <tr><td colSpan="7" className="p-10 text-center text-gray-500">Loading...</td></tr> : 
                             paginatedOrders.length === 0 ? <tr><td colSpan="7" className="p-10 text-center text-gray-500 uppercase font-black">No picking orders.</td></tr> :
                                paginatedOrders.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50">
                                        <td className="p-4 text-center"><input type="checkbox" checked={selectedIds.includes(order._id)} onChange={() => handleSelectOne(order._id)} className="rounded" /></td>
                                        <td className="p-4 font-bold text-orange-600 cursor-pointer" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>{order._id.substr(-12).toUpperCase()}</td>
                                        <td className="p-4 font-mono">{order.vendorId}</td>
                                        <td className="p-4 font-bold">
                                            <select value={order.pickerName || ''} onChange={async (e) => {
                                                const val = e.target.value;
                                                if (val === 'ADD_NEW') {
                                                    const { value: n } = await Swal.fire({ title: 'Add Staff', input: 'text' });
                                                    if (n) { await api.post('/pickers', { name: n }); await api.put(`/orders/${order._id}/status`, { pickerName: n }); fetchOrders(); }
                                                    return;
                                                }
                                                await api.put(`/orders/${order._id}/status`, { pickerName: val }); fetchOrders();
                                            }} className="bg-transparent border-none outline-none">
                                                <option value="">-- Assign --</option>
                                                {allPickers.map(p => <option key={p} value={p}>{p}</option>)}
                                                <option value="ADD_NEW">+ Add New</option>
                                            </select>
                                        </td>
                                        <td className="p-4 text-center"><span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200 text-[10px] font-black uppercase">{order.status}</span></td>
                                        <td className="p-4 text-right font-black">₹{order.total.toFixed(2)}</td>
                                        <td className="p-4 text-center"><button onClick={() => { setSelectedOrder(order); setShowModal(true); }} className="text-gray-400 hover:text-orange-600 p-2 hover:bg-orange-50 rounded-full transition-all"><Eye size={18} /></button></td>
                                    </tr>
                                ))
                            }
                        </tbody>
                    </table>
                </div>
                 <div className="flex justify-end p-4 gap-2 border-t border-gray-100">
                    <button disabled={currentPage === 1} onClick={() => setCurrentPage(c => c - 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"><ChevronRight className="rotate-180" size={16} /></button>
                    <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage(c => c + 1)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 disabled:opacity-50"><ChevronRight size={16} /></button>
                </div>
            </div>

            {showModal && selectedOrder && createPortal(
                <>
                <style>{`@media print { #root, .print\\:hidden { display: none !important; } #printable { display: block !important; position: absolute; left: 0; top: 0; width: 100%; padding: 20px; background: white; } }`}</style>
                <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm print:hidden">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[85vh] rounded-xl shadow-2xl overflow-hidden flex flex-col border border-gray-200">
                        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
                            <div><h2 className="text-xl font-black text-gray-800 uppercase tracking-tight">Order #{selectedOrder._id.substr(-8).toUpperCase()}</h2><p className="text-xs text-gray-500">Pick List Generation</p></div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-red-500"><X size={24} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 text-xs">
                                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100"><p className="font-black text-blue-600 uppercase tracking-widest mb-1">Customer</p><p className="font-bold text-gray-800 text-sm">{selectedOrder.userId?.name || selectedOrder.shippingAddress?.name || 'Guest'}</p></div>
                                <div className="p-4 bg-emerald-50/50 rounded-lg border border-emerald-100"><p className="font-black text-emerald-600 uppercase tracking-widest mb-1">Deadline</p><p className="font-bold text-gray-800 text-sm">{moment(selectedOrder.expectedHandover).format('DD MMM YYYY')}</p></div>
                                <div className="p-4 bg-slate-50/50 rounded-lg border border-slate-100"><p className="font-black text-slate-600 uppercase tracking-widest mb-1">Picker</p><p className="font-bold text-gray-800 text-sm uppercase">{selectedOrder.pickerName || 'NOT ASSIGNED'}</p></div>
                             </div>
                             <table className="w-full text-left text-sm mb-6 border border-gray-100">
                                <thead className="bg-gray-50 text-[10px] text-gray-400 uppercase font-black"><tr><th className="p-3">Product</th><th className="p-3 text-center">Qty</th><th className="p-3 text-center">Rack</th></tr></thead>
                                <tbody className="divide-y divide-gray-100">
                                    {selectedOrder.items.map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50/50">
                                            <td className="p-3"><p className="font-bold text-gray-800">{item.productName}</p><p className="text-[10px] text-gray-400">SKU: {item.product?.sku || 'N/A'}</p></td>
                                            <td className="p-3 text-center font-black text-lg">{item.quantity}</td>
                                            <td className="p-3 text-center font-mono text-xs text-cyan-600">{item.product?.rackLocation || 'TBD'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            <div className="flex justify-end gap-3 border-t pt-6">
                                <button 
                                    onClick={() => window.print()} 
                                    className="px-6 py-2 bg-gray-100 text-gray-800 rounded-lg text-xs font-black uppercase hover:bg-gray-200 flex items-center gap-2"
                                >
                                    <Printer size={16} /> Print Picklist Only
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(selectedOrder._id, 'Picklist Generated')} 
                                    className="px-6 py-2 bg-[#003B5C] text-white rounded-lg text-xs font-black uppercase hover:bg-gray-900 shadow-lg shadow-blue-500/20 flex items-center gap-2 transition-all active:scale-95"
                                >
                                    <Layers size={16} /> Move to Picklist Generated
                                </button>
                                <button 
                                    onClick={() => handleStatusUpdate(selectedOrder._id, 'Quality Check')} 
                                    className="px-6 py-2 bg-orange-600 text-white rounded-lg text-xs font-black uppercase hover:bg-orange-700 shadow-lg shadow-orange-500/30 flex items-center gap-2 active:scale-95 transition-all"
                                >
                                    <CheckCircle size={16} /> Move to Quality Check
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div id="printable" className="hidden print:block bg-white text-black p-4 font-sans uppercase font-bold text-xs" style={{ width: '100%' }}>
                    <div style={{ display: 'flex', border: '2px solid #000', padding: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                         <span style={{ fontSize: '24px' }}>KS Medial - Pick List</span>
                         <span style={{ fontSize: '24px' }}>#{selectedOrder._id.substr(-8).toUpperCase()}</span>
                    </div>
                    <div style={{ marginTop: '20px', border: '1px solid #000' }}>
                        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}><div style={{ width: '20%', padding: '5px' }}>Picker:</div><div style={{ flex: 1, padding: '5px' }}>{selectedOrder.pickerName || '---'}</div></div>
                        <div style={{ display: 'flex', borderBottom: '1px solid #000' }}><div style={{ width: '20%', padding: '5px' }}>Date:</div><div style={{ flex: 1, padding: '5px' }}>{moment().format('DD/MM/YYYY')}</div></div>
                    </div>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                        <thead><tr><th style={{ border: '1px solid #000', padding: '5px' }}>No</th><th style={{ border: '1px solid #000', padding: '5px' }}>Location</th><th style={{ border: '1px solid #000', padding: '5px' }}>SKU</th><th style={{ border: '1px solid #000', padding: '5px' }}>Item</th><th style={{ border: '1px solid #000', padding: '5px' }}>Qty</th><th style={{ border: '1px solid #000', padding: '5px' }}>Check</th></tr></thead>
                        <tbody>{selectedOrder.items.map((item, i) => (<tr key={i}><td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center' }}>{i + 1}</td><td style={{ border: '1px solid #000', padding: '5px' }}>{item.product?.rackLocation || '---'}</td><td style={{ border: '1px solid #000', padding: '5px' }}>{item.product?.sku || 'N/A'}</td><td style={{ border: '1px solid #000', padding: '5px' }}>{item.productName}</td><td style={{ border: '1px solid #000', padding: '5px', textAlign: 'center', fontSize: '16px' }}>{item.quantity}</td><td style={{ border: '1px solid #000', padding: '10px' }}></td></tr>))}</tbody>
                    </table>
                </div>
                </>,
                document.body
            )}
        </div>
    );
};

export default PickingOrders;
