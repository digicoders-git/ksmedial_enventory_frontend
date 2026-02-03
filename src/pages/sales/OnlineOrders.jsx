import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Eye, Truck, CheckCircle, 
    XCircle, Clock, Package, Boxes, AlertCircle,
    ArrowRight, MapPin, Phone, User as UserIcon,
    Download, ChevronRight, FileText, ShoppingCart
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';

const OnlineOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                setOrders(data.orders);
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
            Swal.fire('Error', 'Failed to load online orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (orderId, newStatus) => {
        try {
            const { value: confirm } = await Swal.fire({
                title: 'Update Status?',
                text: `Are you sure you want to move this order to ${newStatus}?`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#0D9488'
            });

            if (confirm) {
                const { data } = await api.put(`/orders/${orderId}/status`, { status: newStatus });
                if (data.success) {
                    Swal.fire({
                        title: 'Updated!',
                        icon: 'success',
                        toast: true,
                        position: 'top-end',
                        timer: 2000,
                        showConfirmButton: false
                    });
                    fetchOrders();
                    if (selectedOrder) {
                        setSelectedOrder({ ...selectedOrder, status: newStatus });
                    }
                }
            }
        } catch (error) {
            Swal.fire('Error', 'Failed to update status', 'error');
        }
    };

    const moveToProblemQueue = async (orderId) => {
        const { value: reason } = await Swal.fire({
            title: 'Move to Problem Queue',
            input: 'textarea',
            inputLabel: 'Reason for moving to PQ',
            inputPlaceholder: 'Type your reason here...',
            showCancelButton: true,
            confirmButtonColor: '#EF4444'
        });

        if (reason) {
            try {
                const { data } = await api.put(`/orders/${orderId}/status`, { 
                    status: 'Problem Queue',
                    problemDescription: reason
                });
                if (data.success) {
                    Swal.fire('Moved!', 'Order moved to Problem Queue', 'success');
                    fetchOrders();
                    setShowModal(false);
                }
            } catch (error) {
                Swal.fire('Error', 'Failed to move order', 'error');
            }
        }
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.shippingAddress?.phone?.includes(searchTerm);
        
        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
        
        return matchesSearch && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'Picking': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
            case 'On Hold': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
            case 'Packing': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400';
            case 'Billing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
            case 'shipped': 
            case 'Shipping': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
            case 'Problem Queue': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400';
            case 'delivered': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'cancelled': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
            default: return 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Picking': return <Boxes size={14} />;
            case 'On Hold': return <Clock size={14} />;
            case 'Packing': return <Package size={14} />;
            case 'Billing': return <FileText size={14} />;
            case 'Shipping': return <Truck size={14} />;
            case 'Problem Queue': return <AlertCircle size={14} />;
            case 'delivered': return <CheckCircle size={14} />;
            case 'cancelled': return <XCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Website Online Orders</h1>
                    <p className="text-sm text-gray-500 font-medium">Manage and process orders coming from the website.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-all">
                        <Download size={18} /> Export
                    </button>
                </div>
            </div>

            {/* Quick Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {[
                    { label: 'Picking', count: orders.filter(o => o.status === 'Picking').length, color: 'text-emerald-500' },
                    { label: 'On Hold', count: orders.filter(o => o.status === 'On Hold').length, color: 'text-amber-500' },
                    { label: 'Packing', count: orders.filter(o => o.status === 'Packing').length, color: 'text-indigo-500' },
                    { label: 'Shipping', count: orders.filter(o => o.status === 'Shipping').length, color: 'text-purple-500' },
                    { label: 'Problem Q', count: orders.filter(o => o.status === 'Problem Queue').length, color: 'text-rose-500' },
                    { label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length, color: 'text-green-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center text-center">
                        <span className={`text-2xl font-black ${stat.color}`}>{stat.count.toString().padStart(2, '0')}</span>
                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">{stat.label}</span>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text"
                        placeholder="Search by Order ID, Customer Name or Phone..."
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 transition-all text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/50 px-3 py-1 rounded-xl border border-gray-100 dark:border-gray-700">
                        <Filter size={16} className="text-gray-400" />
                        <select 
                            className="bg-transparent text-sm font-bold text-gray-600 dark:text-gray-300 outline-none py-1.5"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            <option value="Picking">Picking</option>
                            <option value="On Hold">On Hold</option>
                            <option value="Billing">Billing</option>
                            <option value="Packing">Packing</option>
                            <option value="Shipping">Shipping</option>
                            <option value="Problem Queue">Problem Queue</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>
                    <button 
                        onClick={fetchOrders}
                        className="p-2.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl hover:bg-emerald-100 transition-all"
                    >
                        <Clock size={20} />
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 dark:bg-gray-900/20 text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest border-b border-gray-100 dark:border-gray-700">
                            <tr>
                                <th className="py-4 px-6 text-center">#</th>
                                <th className="py-4 px-4">Order Details</th>
                                <th className="py-4 px-4">Customer</th>
                                <th className="py-4 px-4">Items / Total</th>
                                <th className="py-4 px-4">Status</th>
                                <th className="py-4 px-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                Array(5).fill(0).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan="6" className="py-8 px-4 h-16 bg-gray-50/20 dark:bg-gray-800/20"></td>
                                    </tr>
                                ))
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="py-20 text-center">
                                        <div className="flex flex-col items-center gap-3 text-gray-400">
                                            <ShoppingCart size={48} strokeWidth={1} />
                                            <p className="font-bold uppercase tracking-widest text-xs">No orders found</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order, idx) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/40 transition-all group">
                                        <td className="py-4 px-6 text-center text-xs font-black text-gray-400">
                                            {(idx + 1).toString().padStart(2, '0')}
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-tight flex items-center gap-2">
                                                ID: {order._id.substr(-8).toUpperCase()}
                                                {order.paymentMethod === 'Online' && (
                                                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 text-[8px] px-1.5 py-0.5 rounded font-black uppercase">Paid</span>
                                                )}
                                            </p>
                                            <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                                                {moment(order.createdAt).format('DD MMM YYYY, hh:mm A')}
                                            </p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-500 font-black text-xs">
                                                    {order.userId?.name?.charAt(0) || 'C'}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-700 dark:text-gray-300">{order.userId?.name || 'Guest User'}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{order.shippingAddress?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="text-xs font-black text-gray-600 dark:text-gray-400">{order.items.length} Medicines</p>
                                            <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5">₹{order.total.toLocaleString()}</p>
                                        </td>
                                        <td className="py-4 px-4">
                                            <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight ${getStatusColor(order.status)}`}>
                                                {getStatusIcon(order.status)}
                                                {order.status}
                                            </div>
                                        </td>
                                        <td className="py-4 px-4 text-right">
                                            <button 
                                                onClick={() => { setSelectedOrder(order); setShowModal(true); }}
                                                className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 rounded-lg hover:text-emerald-500 hover:border-emerald-500 transition-all shadow-sm"
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
            </div>

            {/* Order Details Modal */}
            {showModal && selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-scale-up">
                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/30">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl ${getStatusColor(selectedOrder.status)}`}>
                                    {getStatusIcon(selectedOrder.status)}
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">Order: #{selectedOrder._id.substr(-8).toUpperCase()}</h2>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                        Placed on: {moment(selectedOrder.createdAt).format('LLL')}
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                        Status: {selectedOrder.status}
                                    </p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setShowModal(false)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
                            >
                                <XCircle size={24} className="text-gray-400" />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
                            
                            {/* Actions Bar */}
                            <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 flex flex-wrap items-center gap-3">
                                <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mr-2">Workflow Actions:</span>
                                
                                {selectedOrder.status === 'Picking' && (
                                    <button 
                                        onClick={() => updateStatus(selectedOrder._id, 'Billing')}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 dark:shadow-none"
                                    >
                                        Stock Ready <ChevronRight size={14} />
                                    </button>
                                )}

                                {selectedOrder.status === 'On Hold' && (
                                    <button 
                                        onClick={() => updateStatus(selectedOrder._id, 'Picking')}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-200 dark:shadow-none"
                                    >
                                        Force to Picking <ChevronRight size={14} />
                                    </button>
                                )}

                                {selectedOrder.status === 'Billing' && (
                                    <button 
                                        onClick={() => updateStatus(selectedOrder._id, 'Packing')}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-blue-700 transition-all"
                                    >
                                        Invoice Generated <ChevronRight size={14} />
                                    </button>
                                )}

                                {['Picking', 'On Hold', 'Billing'].includes(selectedOrder.status) && (
                                    <button 
                                        onClick={() => moveToProblemQueue(selectedOrder._id)}
                                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 text-rose-600 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-50 transition-all"
                                    >
                                        <AlertCircle size={14} /> Move to Problem Q
                                    </button>
                                )}

                                {['Packing', 'Shipping'].includes(selectedOrder.status) && (
                                    <button 
                                        onClick={() => updateStatus(selectedOrder._id, selectedOrder.status === 'Packing' ? 'Shipping' : 'delivered')}
                                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-purple-700 transition-all"
                                    >
                                        {selectedOrder.status === 'Packing' ? 'Handover to Shipping' : 'Mark as Delivered'} <ChevronRight size={14} />
                                    </button>
                                )}
                            </div>

                            {/* Customer & Address Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <UserIcon size={14} /> Customer Information
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <p className="text-sm font-black text-gray-800 dark:text-white uppercase tracking-tight">{selectedOrder.userId?.name || 'Guest User'}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-1 flex items-center gap-2"><Phone size={12} /> {selectedOrder.shippingAddress?.phone}</p>
                                        <p className="text-xs text-gray-500 font-bold mt-1">Email: {selectedOrder.userId?.email || 'N/A'}</p>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <MapPin size={14} /> Shipping Address
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                                        <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-relaxed">
                                            {selectedOrder.shippingAddress?.addressLine1},<br />
                                            {selectedOrder.shippingAddress?.addressLine2 && `${selectedOrder.shippingAddress.addressLine2}, `}
                                            {selectedOrder.shippingAddress?.city}, {selectedOrder.shippingAddress?.state} - {selectedOrder.shippingAddress?.pincode}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Order Items Table */}
                            <div className="space-y-4">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Boxes size={14} /> Order Items
                                </h3>
                                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 overflow-hidden shadow-sm">
                                    <table className="w-full text-left">
                                        <thead className="bg-gray-50/50 dark:bg-gray-900/20 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            <tr>
                                                <th className="py-3 px-6">Medicine Name</th>
                                                <th className="py-3 px-4 text-center">Qty</th>
                                                <th className="py-3 px-4 text-right">Price</th>
                                                <th className="py-3 px-6 text-right">Subtotal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                            {selectedOrder.items.map((item, i) => (
                                                <tr key={i} className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                                    <td className="py-4 px-6 uppercase tracking-tight">{item.productName}</td>
                                                    <td className="py-4 px-4 text-center">{item.quantity}</td>
                                                    <td className="py-4 px-4 text-right">₹{item.productPrice}</td>
                                                    <td className="py-4 px-6 text-right">₹{(item.productPrice * item.quantity).toLocaleString()}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-emerald-50/30 dark:bg-emerald-900/5 font-black">
                                                <td colSpan="3" className="py-4 px-6 text-right text-[10px] uppercase tracking-widest text-gray-400">Grand Total</td>
                                                <td className="py-4 px-6 text-right text-lg text-emerald-600 dark:text-emerald-400 tracking-tight">₹{selectedOrder.total.toLocaleString()}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Notes Section */}
                            {selectedOrder.notes && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <FileText size={14} /> Order Notes
                                    </h3>
                                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-800/30">
                                        <p className="text-sm font-bold text-amber-800 dark:text-amber-400 italic">"{selectedOrder.notes}"</p>
                                    </div>
                                </div>
                            )}

                            {/* Problem Queue Reason */}
                            {selectedOrder.status === 'Problem Queue' && selectedOrder.problemDescription && (
                                <div className="space-y-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                        <AlertCircle size={14} className="text-rose-500" /> Issue Root Cause
                                    </h3>
                                    <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 border-l-4 border-l-rose-500">
                                        <p className="text-sm font-black text-rose-700 dark:text-rose-400">{selectedOrder.problemDescription}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OnlineOrders;
