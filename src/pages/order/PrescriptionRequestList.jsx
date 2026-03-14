import React, { useState, useEffect } from 'react';
import { 
    Search, Filter, Calendar, CheckCircle, XCircle, 
    Eye, User, Phone, ClipboardList, RefreshCw,
    Clock, Tag, Package
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import moment from 'moment';

const PrescriptionRequestList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    
    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [adminUploadImage, setAdminUploadImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/orders/prescription/requests');
            if (data.success) {
                setRequests(data.requests);
            }
        } catch (error) {
            console.error("Failed to fetch requests:", error);
            Swal.fire('Error', 'Failed to load prescription requests', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (id) => {
        try {
            const result = await Swal.fire({
                title: 'Approve Prescription?',
                text: "This will create a new order and verify this user for future orders.",
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#10B981',
                confirmButtonText: 'Yes, Approve'
            });

            if (result.isConfirmed) {
                setProcessing(true);
                const { data } = await api.put(`/orders/prescription/requests/${id}/approve`);
                if (data.success) {
                    Swal.fire('Approved!', 'Order has been created and user verified.', 'success');
                    setShowModal(false);
                    fetchRequests();
                }
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.message || 'Failed to approve request', 'error');
        } finally {
            setProcessing(false);
        }
    };

    const handleAdminImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAdminUploadImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAdminUpload = async () => {
        if (!adminUploadImage) {
            Swal.fire('Error', 'Please select an image first', 'error');
            return;
        }
        try {
            setUploading(true);
            const { data } = await api.put(`/orders/prescription/requests/${selectedRequest._id}/upload`, { 
                prescriptionImage: adminUploadImage 
            });
            if (data.success) {
                Swal.fire('Success', 'Prescription uploaded successfully', 'success');
                setSelectedRequest({ ...selectedRequest, prescriptionImage: adminUploadImage });
                setAdminUploadImage(null);
                fetchRequests();
            }
        } catch (error) {
            console.error(error);
            Swal.fire('Error', error.response?.data?.message || 'Upload failed', 'error');
        } finally {
            setUploading(false);
        }
    };

    const filteredRequests = requests.filter(req => 
        req.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.userId?.phone?.includes(searchTerm) ||
        req._id.includes(searchTerm)
    );

    return (
        <div className="space-y-6 animate-fade-in pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                        <ClipboardList className="text-primary" /> Prescription Orders
                    </h1>
                    <p className="text-sm text-gray-500 font-medium mt-1">Review and approve orders waiting for prescription verification.</p>
                </div>
                <button 
                    onClick={fetchRequests}
                    className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 p-2.5 rounded-xl hover:bg-gray-200 transition-all text-sm font-bold"
                >
                    <RefreshCw size={18} className={loading ? 'animate-spin' : ''} /> Refresh
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Clock size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Pending Requests</p>
                        <h3 className="text-2xl font-black">{requests.length}</h3>
                    </div>
                </div>
                {/* Visual Placeholder for UX */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 opacity-70">
                    <div className="p-3 bg-green-50 text-green-600 rounded-xl"><CheckCircle size={24} /></div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase">Total Approved</p>
                        <h3 className="text-2xl font-black">History View</h3>
                    </div>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                    type="text"
                    placeholder="Search by Patient Name, Phone or Request ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
                />
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden min-h-[400px]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/80 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                            <tr className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                <th className="px-6 py-4">Request Details</th>
                                <th className="px-6 py-4">User Details</th>
                                <th className="px-6 py-4">Items</th>
                                <th className="px-6 py-4">Total</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                            {loading ? (
                                <tr><td colSpan="6" className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest animate-pulse">Loading Requests...</td></tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr><td colSpan="6" className="py-20 text-center text-gray-400 font-bold uppercase tracking-widest">No pending requests found</td></tr>
                            ) : (
                                filteredRequests.map((req) => (
                                    <tr key={req._id} className="group hover:bg-primary/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-black text-[13px] text-primary">#{req._id.substr(-8).toUpperCase()}</p>
                                            <p className="text-[10px] text-gray-400 font-bold">{req.paymentMethod}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-accent/10 text-accent flex items-center justify-center font-black text-xs uppercase">
                                                    {req.userId?.name?.charAt(0) || <User size={14}/>}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{req.userId?.name}</p>
                                                    <p className="text-xs text-gray-500 flex items-center gap-1"><Phone size={10}/> {req.userId?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1 flex-wrap max-w-xs">
                                                {req.items.map((item, idx) => (
                                                    <span key={idx} className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                                        {item.productName} (x{item.quantity})
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-black text-gray-800 dark:text-white">₹{req.total}</td>
                                        <td className="px-6 py-4 text-xs font-bold text-gray-500">
                                            {moment(req.createdAt).fromNow()}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                onClick={() => {
                                                    setSelectedRequest(req);
                                                    setShowModal(true);
                                                }}
                                                className="p-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-primary hover:bg-primary hover:text-white transition-all shadow-sm hover:shadow-md"
                                                title="View Details"
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
            </div>

            {/* Details Modal */}
            {showModal && selectedRequest && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-scale-up border border-white/20">
                        <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h1 className="text-lg font-black uppercase tracking-tight text-gray-800 dark:text-white">Request Verification</h1>
                                <p className="text-xs font-bold text-gray-400">ID: {selectedRequest._id}</p>
                            </div>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors"><XCircle size={24} className="text-gray-400"/></button>
                        </div>

                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {/* User Info */}
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><User size={14}/> User Information</h3>
                                    <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <p className="text-sm font-black text-gray-800 dark:text-white">{selectedRequest.userId?.name}</p>
                                        <p className="text-xs text-gray-500 font-bold mb-2">{selectedRequest.userId?.phone}</p>
                                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1">
                                            <p className="text-[10px] font-black uppercase text-gray-400">Shipping To:</p>
                                            <p className="text-[11px] font-bold text-gray-600 dark:text-gray-400 leading-relaxed">
                                                {selectedRequest.shippingAddress.addressLine1}, {selectedRequest.shippingAddress.addressLine2 && selectedRequest.shippingAddress.addressLine2 + ','} {selectedRequest.shippingAddress.city}, {selectedRequest.shippingAddress.state} - {selectedRequest.shippingAddress.pincode}
                                            </p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Tag size={14}/> Payment Details</h3>
                                    <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                                        <span className="text-xs font-bold text-gray-500 uppercase">{selectedRequest.paymentMethod}</span>
                                        <span className="text-lg font-black text-primary">₹{selectedRequest.total}</span>
                                    </div>
                                </section>
                            </div>

                            {/* Prescription Image & Items List */}
                            <div className="space-y-6">
                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Eye size={14}/> Prescription Image</h3>
                                    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 aspect-video flex items-center justify-center group relative">
                                        {selectedRequest.prescriptionImage ? (
                                            <img src={selectedRequest.prescriptionImage} alt="Prescription" className="w-full h-full object-contain transition-transform group-hover:scale-105" />
                                        ) : (
                                            <div className="text-gray-500 text-[10px] font-bold uppercase">No Image Uploaded</div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black/50 px-2 py-1 rounded text-[8px] text-white font-bold opacity-0 group-hover:opacity-100 transition-opacity">User Uploaded</div>
                                    </div>
                                    
                                    {/* Admin Upload Option */}
                                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                                        <p className="text-[10px] font-black text-gray-400 uppercase mb-3">Upload Doctor Prescription</p>
                                        <div className="flex items-center gap-3">
                                            <input 
                                                type="file" 
                                                id="admin-rx-upload" 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleAdminImageChange}
                                            />
                                            <label 
                                                htmlFor="admin-rx-upload"
                                                className="flex-1 px-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-[10px] font-bold text-gray-600 dark:text-gray-300 cursor-pointer hover:border-primary transition-all text-center"
                                            >
                                                {adminUploadImage ? 'Change Image' : 'Select Rx Image'}
                                            </label>
                                            
                                            {adminUploadImage && (
                                                <button 
                                                    onClick={handleAdminUpload}
                                                    disabled={uploading}
                                                    className="px-4 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-secondary transition-all disabled:opacity-50"
                                                >
                                                    {uploading ? '...' : 'Upload Now'}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2"><Package size={14}/> Items List</h3>
                                <div className="space-y-3">
                                    {selectedRequest.items.map((item, idx) => (
                                        <div key={idx} className="flex justify-between items-center bg-white dark:bg-gray-700 p-3 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <div>
                                                <p className="text-xs font-black text-gray-800 dark:text-white uppercase truncate max-w-[150px]">{item.productName}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">₹{item.productPrice} per unit</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-black text-primary">x{item.quantity}</p>
                                                <p className="text-[10px] font-bold text-gray-400">₹{item.productPrice * item.quantity}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                </section>
                            </div>
                        </div>

                        <div className="p-8 pt-0 flex gap-4">
                            <button 
                                onClick={() => setShowModal(false)}
                                className="flex-1 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 font-black uppercase text-[10px] tracking-widest hover:bg-gray-50 transition-all active:scale-95"
                            >
                                Not Clear
                            </button>
                            <button 
                                onClick={() => handleApprove(selectedRequest._id)}
                                disabled={processing}
                                className="flex-[2] py-4 bg-primary text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-primary/20 hover:bg-secondary transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                {processing ? <RefreshCw className="animate-spin" size={16} /> : <CheckCircle size={16} />}
                                Confirm & Create Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PrescriptionRequestList;
