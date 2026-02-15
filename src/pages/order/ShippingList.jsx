import React, { useState, useEffect } from 'react';
import { 
    Search, Calendar, Filter, Download, 
    ChevronRight, Upload, FileText, Anchor
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import Papa from 'papaparse';

const ShippingList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Filters State
    const [filters, setFilters] = useState({
        orderId: '',
        dateRangeStart: '',
        dateRangeEnd: '',
        vendorRefId: '',
        orderType: ''
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders');
            if (data.success) {
                // Filter for all shipping-related statuses to ensure visibility
                const shippingOrders = data.orders.filter(o => 
                    ['Scanned For Shipping', 'shipped', 'Shipping'].includes(o.status)
                ).map(order => ({
                    ...order,
                    vendorId: order.vendorId || 'N/A',
                    orderType: order.orderType || 'KS4'
                }));
                setOrders(shippingOrders);
            }
        } catch (error) {
            console.error("Failed to fetch Shipping orders:", error);
            Swal.fire('Error', 'Failed to load Shipping listing', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = () => {
        Swal.fire({
            title: 'Upload Tracking CSV',
            text: 'Upload a CSV file to bulk update tracking numbers and mark orders as Shipped.',
            input: 'file',
            inputAttributes: {
                'accept': '.csv',
                'aria-label': 'Upload your CSV file'
            },
            showCancelButton: true
        }).then((result) => {
            if (result.value) {
                Swal.fire('Success', 'Tracking info updated (Simulation)', 'success');
            }
        });
    };

    const handleDownloadSample = () => {
        const csv = "Order ID,Tracking Number,Courier\n12345,TRACK001,FedEx";
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'shipping_sample.csv';
        a.click();
    };

    const handleShippedReport = () => {
        Swal.fire('Info', 'Downloading Shipped Orders Report...', 'info');
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
    const paginatedOrders = filteredOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Shipping Listing</h1>
                <p className="text-sm text-gray-500 font-medium">Orders ready for shipping. Upload tracking details here.</p>
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

                    <input name="vendorRefId" placeholder="Vendor Ref ID" value={filters.vendorRefId} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 outline-none" />
                    <input name="orderType" placeholder="Order Type" value={filters.orderType} onChange={handleFilterChange} className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded px-2 py-1.5 text-xs w-28 outline-none" />
                    
                    <button onClick={() => setCurrentPage(1)} className="bg-cyan-500 text-white text-xs font-bold uppercase px-4 py-1.5 rounded">Search</button>
                    <button onClick={clearFilters} className="bg-amber-400 text-white text-xs font-bold uppercase px-4 py-1.5 rounded">Clear</button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
                <div className="p-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700">
                     <p className="text-xs font-bold text-gray-500">Showing {filteredOrders.length} shipping orders</p>
                     
                     <div className="flex gap-2">
                        <button onClick={handleUpload} className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2 hover:bg-cyan-600">
                            <Upload size={14} /> Upload
                        </button>
                        <button onClick={handleDownloadSample} className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2 hover:bg-cyan-600">
                            <Download size={14} /> Sample
                        </button>
                        <button onClick={handleShippedReport} className="px-3 py-1.5 bg-cyan-500 text-white text-xs font-bold uppercase rounded flex items-center gap-2 hover:bg-cyan-600">
                            <FileText size={14} /> Shipped Orders Report
                        </button>
                     </div>
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
                                <th className="p-3">Created On</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {loading ? <tr><td colSpan="6" className="p-10 text-center">Loading...</td></tr> : 
                             paginatedOrders.map(order => (
                                <tr key={order._id} className="hover:bg-cyan-50/50 dark:hover:bg-gray-800">
                                    <td className="p-3 text-center"><input type="checkbox" /></td>
                                    <td className="p-3 font-bold text-cyan-600">{order._id.substr(-12).toUpperCase()}</td>
                                    <td className="p-3">{order.vendorId}</td>
                                    <td className="p-3"><span className="px-2 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-600 text-[10px] uppercase font-black">{order.status}</span></td>
                                    <td className="p-3">{order.orderType}</td>
                                    <td className="p-3">{moment(order.createdAt).format('D MMM YYYY HH:mm')}</td>
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
        </div>
    );
};

export default ShippingList;
