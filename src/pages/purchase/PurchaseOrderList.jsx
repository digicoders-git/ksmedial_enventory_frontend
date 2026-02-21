import React, { useState, useEffect, useCallback } from 'react';
import { Search, FileText, Eye, Download, Printer, Plus, Calendar, ArrowUpRight, CheckCircle, Clock, X, Trash2, ChevronLeft, ChevronRight, ShoppingCart, FileSpreadsheet } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const PurchaseOrderList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    
    // Pagination States
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/purchase-orders'); // Currently fetches all, client-side pagination for now if API doesn't support
            // If API updates to support pagination, we update this.
            // For now, let's filter client side or assume simple list.
            setOrders(data);
        } catch (error) {
            console.error("Failed to fetch orders", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'Sent to Supplier': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'Approved by Supplier': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'Closed': return 'bg-green-100 text-green-700 border-green-200';
            case 'Cancelled': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/purchase-orders/${id}`);
                    fetchOrders();
                    Swal.fire('Deleted!', 'Purchase Order has been deleted.', 'success');
                } catch (error) {
                    Swal.fire('Error!', 'Failed to delete order.', 'error');
                }
            }
        });
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await api.put(`/purchase-orders/${id}/status`, { status });
            fetchOrders();
            Swal.fire({
                title: 'Updated!', 
                text: `Order marked as ${status}`, 
                icon: 'success',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
             Swal.fire('Error!', 'Failed to update status.', 'error');
        }
    };

    // Filter Logic
    const filteredOrders = orders.filter(order => {
        const matchesSearch = 
            order.poNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
            order.supplierName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    // CSV Download Function
    const handleDownloadCSV = (order) => {
        const csvRows = [];
        // Header
        csvRows.push("SR,Product Name,SKU,Supplier,Quantity");
        
        order.items.forEach((item, idx) => {
            const supplierName = item.supplier?.name || order.supplierName || '-'; 
            const sku = item.product?.sku || '-';
            const row = [
                idx + 1,
                `"${item.medicineName.replace(/"/g, '""')}"`,
                `"${sku.replace(/"/g, '""')}"`,
                `"${supplierName.replace(/"/g, '""')}"`,
                item.quantity
            ];
            csvRows.push(row.join(","));
        });

        const csvContent = "data:text/csv;charset=utf-8," + csvRows.join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `PO_${order.poNumber}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6 animate-fade-in-up pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-2xl">
                            <ShoppingCart className="text-primary" size={32} />
                        </div>
                        Purchase Orders
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 font-medium pl-1">Manage purchase orders and supplier requisitions.</p>
                </div>
            </div>

            {/* Actions & Filters */}
            <div className="flex flex-col xl:flex-row gap-4 justify-between items-center">
                <div className="relative w-full xl:w-1/3">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Search PO Number, Supplier..." 
                        value={searchTerm}
                        onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                        className="w-full pl-12 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none text-sm font-medium"
                    />
                </div>
                
                <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                    {['All', 'Draft', 'Sent to Supplier', 'Approved by Supplier', 'Closed', 'Cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                            className={`px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all
                                ${statusFilter === status 
                                    ? 'bg-gray-800 dark:bg-white text-white dark:text-gray-900 shadow-lg' 
                                    : 'bg-white dark:bg-gray-800 text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-100 dark:border-gray-700'}`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                <button 
                    onClick={() => navigate('/purchase/create-order')} 
                    className="w-full xl:w-auto px-6 py-3 bg-primary text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-secondary shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <Plus size={18} strokeWidth={3} /> Create Purchase Order
                </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">PO Number</th>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">Supplier</th>
                                <th className="px-6 py-4 text-center">Items</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-20 text-center text-gray-500">
                                        Loading orders...
                                    </td>
                                </tr>
                            ) : currentItems.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-10 text-center text-gray-400 font-medium">
                                        No purchase orders found.
                                    </td>
                                </tr>
                            ) : (
                                currentItems.map((order) => (
                                    <tr key={order._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-200">{order.poNumber}</td>
                                        <td className="px-6 py-4 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                            {new Date(order.poDate).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-800 dark:text-gray-100">{order.supplierName}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-gray-900 dark:text-white font-bold">{order.items.length} <span className="text-[10px] text-gray-400 font-normal uppercase">SKUs</span></span>
                                                <span className="text-[11px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-full mt-1">
                                                    {order.items.reduce((acc, item) => acc + (parseInt(item.quantity) || 0), 0)} Total Qty
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase border ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {/* Receive / GRN Button - Available after sending to supplier */}
                                                {['Sent to Supplier', 'Approved by Supplier', 'Dispatched'].includes(order.status) && (
                                                    <button 
                                                        onClick={() => navigate('/purchase/physical-validation', { state: { prefill: { poData: order } } })}
                                                        className="p-1.5 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all flex items-center gap-1" 
                                                        title="Receive Items (Physical Check)"
                                                    >
                                                        <CheckCircle size={16} />
                                                        <span className="text-[10px] font-bold uppercase pr-1">Receive</span>
                                                    </button>
                                                )}

                                                <button 
                                                    onClick={() => handleDownloadCSV(order)}
                                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all" 
                                                    title="Download CSV"
                                                >
                                                    <FileSpreadsheet size={16} />
                                                </button>

                                                <button 
                                                    onClick={() => navigate(`/purchase/orders/view/${order._id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all" 
                                                    title="View PO Invoice"
                                                >
                                                    <FileText size={16} />
                                                </button>

                                                <button 
                                                    onClick={() => navigate(`/purchase/create-order?id=${order._id}`)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                                                    title="Edit Order"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                
                                                <button 
                                                    onClick={() => handleDelete(order._id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" 
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50">
                        <button 
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm text-gray-600 font-medium">Page {currentPage} of {totalPages}</span>
                        <button 
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            className="p-2 border rounded-lg hover:bg-white disabled:opacity-50"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PurchaseOrderList;
