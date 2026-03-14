import React, { useState, useEffect, useCallback } from 'react';
import { 
    Search, Calendar, Filter, Download, 
    ChevronRight, Upload, FileText, Anchor,
    Camera, X, ShoppingCart, Eye, Image as ImageIcon,
    Layers, Truck, CheckCircle
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';
import Papa from 'papaparse';
import { Html5Qrcode } from 'html5-qrcode';
import { createPortal } from 'react-dom';

const ShippingList = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scanningOrder, setScanningOrder] = useState(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);
    
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

    const fetchOrders = useCallback(async () => {
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
    }, []);

    const handleMarkAsShipped = useCallback(async (orderId) => {
        try {
            let capturedImage = null;
            
            // Capture frame from video before closing
            const video = document.querySelector('#reader video');
            if (video) {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                capturedImage = canvas.toDataURL('image/jpeg', 0.7);
            }

            setIsScannerOpen(false);
            const { data } = await api.put(`/orders/${orderId}/status`, { 
                status: 'shipped',
                trackingUrl: 'Scanned via Camera',
                dispatchProof: capturedImage
            });
            
            if (data.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Order Shipped',
                    text: 'Status updated with proof of dispatch',
                    timer: 1500,
                    showConfirmButton: false
                });
                fetchOrders();
            }
        } catch (error) {
            console.error("Update Status Error", error);
            Swal.fire('Error', 'Failed to update status', 'error');
        } finally {
            setScanningOrder(null);
        }
    }, [fetchOrders]);

    const handleBulkStatusUpdate = async (newStatus) => {
        if (selectedIds.length === 0) return;

        try {
            const { value: confirmed } = await Swal.fire({
                title: 'Bulk Update Status?',
                text: `Are you sure you want to move ${selectedIds.length} orders to ${newStatus}?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#003B5C',
                confirmButtonText: 'Yes, Update All'
            });

            if (confirmed) {
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

    const toggleSelectAll = () => {
        if (selectedIds.length === paginatedOrders.length) {
            setSelectedIds([]);
        } else {
            setSelectedIds(paginatedOrders.map(o => o._id));
        }
    };

    const toggleSelect = (id) => {
        setSelectedIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const onScanSuccess = useCallback(async (decodedText, decodedResult) => {
        console.log(`Code matched = ${decodedText}`, decodedResult);
        if (scanningOrder) {
            handleMarkAsShipped(scanningOrder._id);
        }
    }, [scanningOrder, handleMarkAsShipped]);

    const onScanFailure = () => {
        // Silently ignore scan failures as they happen many times per second during normal operation
    };

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    useEffect(() => {
        let html5QrCode = null;
        if (isScannerOpen) {
            // Give a tiny delay for the 'reader' element to be in DOM
            const startTimer = setTimeout(() => {
                html5QrCode = new Html5Qrcode("reader");
                const config = { 
                    fps: 20, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0 
                };
                
                html5QrCode.start(
                    { facingMode: "environment" }, 
                    config, 
                    onScanSuccess, 
                    onScanFailure
                ).catch(err => {
                    console.error("Direct Camera Start Error:", err);
                });
            }, 100);

            return () => {
                clearTimeout(startTimer);
                if (html5QrCode && html5QrCode.isScanning) {
                    html5QrCode.stop().catch(err => console.error("Stop error", err));
                }
            };
        }
    }, [isScannerOpen, onScanSuccess]);


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
                                <th className="p-3 w-8">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.length === paginatedOrders.length && paginatedOrders.length > 0}
                                        onChange={toggleSelectAll}
                                        className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                    />
                                </th>
                                <th className="p-3">Order ID</th>
                                <th className="p-3">Vendor ID</th>
                                <th className="p-3">Status</th>
                                <th className="p-3">Order Type</th>
                                <th className="p-3">Created On</th>
                                <th className="p-3 text-center">Proof</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                            {loading ? <tr><td colSpan="6" className="p-10 text-center">Loading...</td></tr> : 
                             paginatedOrders.map(order => (
                                <tr key={order._id} className={`hover:bg-cyan-50/50 dark:hover:bg-gray-800 transition-colors ${selectedIds.includes(order._id) ? 'bg-cyan-50/30' : ''}`}>
                                    <td className="p-3 text-center">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.includes(order._id)}
                                            onChange={() => toggleSelect(order._id)}
                                            className="rounded border-gray-300 text-cyan-600 focus:ring-cyan-500"
                                        />
                                    </td>
                                    <td className="p-3 font-bold text-cyan-600">{order._id.substr(-12).toUpperCase()}</td>
                                    <td className="p-3">{order.vendorId}</td>
                                    <td className="p-3">
                                        <span 
                                            onClick={() => {
                                                if(order.status === 'Scanned For Shipping') {
                                                    setScanningOrder(order);
                                                    setIsScannerOpen(true);
                                                }
                                            }}
                                            className={`px-2 py-0.5 rounded border border-purple-200 bg-purple-50 text-purple-600 text-[10px] uppercase font-black transition-all ${order.status === 'Scanned For Shipping' ? 'cursor-pointer hover:bg-cyan-600 hover:text-white hover:border-cyan-500 shadow-sm flex items-center justify-center gap-1 w-fit' : ''}`}
                                        >
                                            {order.status === 'Scanned For Shipping' && <Camera size={10} />}
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-3">{order.orderType}</td>
                                    <td className="p-3">{moment(order.createdAt).format('D MMM YYYY HH:mm')}</td>
                                    <td className="p-3 text-center">
                                        {order.dispatchProof ? (
                                            <button 
                                                onClick={() => setPreviewImage(order.dispatchProof)}
                                                className="p-1.5 bg-cyan-50 text-cyan-600 rounded-lg hover:bg-cyan-100 transition-colors"
                                                title="View Dispatch Proof"
                                            >
                                                <Eye size={14} />
                                            </button>
                                        ) : (
                                            <span className="text-gray-400 text-[10px]">—</span>
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
            {/* Scanner Modal */}
            {isScannerOpen && createPortal(
                <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden animate-scale-up border border-gray-100 dark:border-gray-800">
                        <div className="p-4 border-b border-gray-50 dark:border-gray-800 flex justify-between items-center">
                            <div>
                                <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em] flex items-center gap-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div> Vision Dispatch
                                </h3>
                            </div>
                            <button 
                                onClick={() => { setIsScannerOpen(false); setScanningOrder(null); }} 
                                className="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 dark:bg-gray-800 p-1.5 rounded-full"
                            >
                                <X size={18} />
                            </button>
                        </div>
                        
                        <div className="p-5">
                            <div className="relative rounded-3xl overflow-hidden border-2 border-orange-500/30 shadow-xl bg-black aspect-square max-w-[280px] mx-auto">
                                <div id="reader" className="w-full h-full object-cover"></div>
                                {/* Scanning Animation Overlay */}
                                <div className="absolute inset-x-0 top-0 h-0.5 bg-orange-400 animate-scan z-10 shadow-[0_0_10px_rgba(251,146,60,1)]"></div>
                                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                    <div className="w-40 h-40 border border-white/20 rounded-2xl"></div>
                                </div>
                            </div>
                            
                            <div className="mt-6 text-center space-y-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        Order: {scanningOrder?._id.substr(-8).toUpperCase()}
                                    </p>
                                </div>
                                
                                <button 
                                    onClick={() => handleMarkAsShipped(scanningOrder?._id || orders[0]?._id)}
                                    className="w-full py-4 bg-orange-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-700 shadow-xl shadow-orange-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingCart size={16} /> Confirm Shipped
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Image Preview Modal */}
            {previewImage && createPortal(
                <div className="fixed inset-0 z-[20000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-gray-700">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="text-xs font-black text-gray-800 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={16} className="text-cyan-500" /> Dispatch Proof
                            </h3>
                            <button 
                                onClick={() => setPreviewImage(null)} 
                                className="text-gray-400 hover:text-red-500 transition-colors bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-2">
                            <div className="rounded-2xl overflow-hidden border-2 border-gray-100 dark:border-gray-800 shadow-inner bg-black aspect-[4/3] flex items-center justify-center">
                                <img src={previewImage} alt="Dispatch Proof" className="max-w-full max-h-full object-contain" />
                            </div>
                        </div>
                        <div className="p-4 text-center">
                            <button 
                                onClick={() => setPreviewImage(null)}
                                className="px-8 py-2.5 bg-gray-800 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-black transition-all"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {/* Bulk Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#003B5C] text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-8 animate-scale-up border border-white/10 backdrop-blur-md w-fit whitespace-nowrap">
                    <div className="flex items-center gap-3 border-r border-white/20 pr-8">
                        <div className="bg-cyan-500 p-2 rounded-lg shadow-inner">
                            <Layers size={18} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-cyan-400">Selected</p>
                            <p className="text-sm font-black">{selectedIds.length} {selectedIds.length === 1 ? 'Order' : 'Orders'}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Bulk Move To:</p>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => handleBulkStatusUpdate('shipped')}
                                className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <Truck size={14} /> Mark Shipped
                            </button>
                            <button 
                                onClick={() => handleBulkStatusUpdate('delivered')}
                                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2"
                            >
                                <CheckCircle size={14} /> Delivered
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
        </div>
    );
};

export default ShippingList;
