import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, Phone, MapPin, MoreVertical, Plus, Filter, FileText, ArrowUpRight, DollarSign, Wallet, Star, LayoutGrid, List, Edit3, Trash2, Eye, ChevronLeft, ChevronRight, Loader, X, Calendar, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const CustomerList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // All, Pending, Top
    const [viewMode, setViewMode] = useState('card');
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Data State
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);
    const [totalEntries, setTotalEntries] = useState(0);

    // History Modal State
    const [showHistoryModal, setShowHistoryModal] = useState(false);
    const [selectedCustomerHistory, setSelectedCustomerHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [selectedCustomerForHistory, setSelectedCustomerForHistory] = useState(null);

    const handleViewHistory = async (customer) => {
        setSelectedCustomerForHistory(customer);
        setShowHistoryModal(true);
        setHistoryLoading(true);
        try {
            const { data } = await api.get('/sales', {
                params: { customerId: customer._id, limit: 20 }
            });
            if (data.success) {
                setSelectedCustomerHistory(data.sales);
            }
        } catch (error) {
            console.error("Error fetching history", error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const fetchCustomers = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/customers', {
                params: {
                    pageNumber: currentPage,
                    pageSize: itemsPerPage,
                    keyword: searchTerm
                }
            });

            if (data.success) {
                setCustomers(data.customers);
                setTotalPages(data.pages);
                setTotalEntries(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch customers", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, itemsPerPage, searchTerm]);

    useEffect(() => {
        fetchCustomers();
    }, [fetchCustomers]);

    // Client-side filtering for 'Pending' and 'Top' since backend search is keyword-based
    // Ideally pending/top could be backend filters, but for now we filter the current page or we can add params.
    // Given the current backend only supports keyword, we will stick to basic keyword search and maybe basic client-side filtering 
    // BUT since we are paginating on backend, client side filter on 1 page is weird.
    // For now, let's assume FilterType 'All' is default and just show all. 
    // If user wants 'Pending', we might strictly need backend support or we just highlight them.
    // Let's implement client-side filter on the *fetched* data for visual filtering or request backend changes.
    // For robustness, I will just apply filters on the fetched chunk or ignore if complex.
    // Actually, let's keep it simple: Filter applies to the VIEW of fetched customers for now.
    
    const displayedCustomers = React.useMemo(() => {
        return customers.filter(customer => {
            if (filterType === 'Pending') return customer.pendingAmount > 0;
            if (filterType === 'Top') return customer.totalSpent > 50000;
            return true;
        });
    }, [customers, filterType]);


    const totalReceivables = customers.reduce((acc, curr) => acc + (curr.pendingAmount || 0), 0);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        // setCurrentPage(1); // No need to reset page if filtering locally, but might be better UX to stay
    };

    const handleItemsPerPageChange = (value) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1);
    };

    const goToPage = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    const handleAddCustomer = () => {
        Swal.fire({
            title: 'Add New Customer',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Full Name">
                <input id="swal-phone" class="swal2-input" placeholder="Mobile Number">
                <input id="swal-address" class="swal2-input" placeholder="Address / Location">
                <input id="swal-opening-bal" class="swal2-input" type="number" placeholder="Opening Balance (Pending)">
            `,
            confirmButtonText: 'Add Customer',
            confirmButtonColor: '#007242',
            showCancelButton: true,
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const phone = document.getElementById('swal-phone').value;
                const address = document.getElementById('swal-address').value;
                const pending = document.getElementById('swal-opening-bal').value;

                if (!name || !phone) {
                    Swal.showValidationMessage('Name and Mobile are required');
                }
                return { name, phone, address, pendingAmount: pending || 0 };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const { data } = await api.post('/customers', result.value);
                    if (data.success) {
                        Swal.fire('Success', 'Customer added successfully', 'success');
                        fetchCustomers();
                    }
                } catch (error) {
                    Swal.fire('Error', error.response?.data?.message || 'Failed to add customer', 'error');
                }
            }
        });
    }

    const handleDelete = (id, name) => {
        Swal.fire({
            title: 'Delete Customer?',
            text: `Are you sure you want to delete ${name}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, Delete',
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/customers/${id}`);
                    Swal.fire('Deleted', 'Customer record has been removed.', 'success');
                    fetchCustomers();
                } catch (error) {
                    Swal.fire('Error', 'Failed to delete customer', 'error');
                }
            }
        });
        setActiveDropdown(null);
    };

    const handleEdit = (customer) => {
        Swal.fire({
            title: 'Edit Customer',
            html: `
                <input id="swal-edit-name" class="swal2-input" value="${customer.name}" placeholder="Full Name">
                <input id="swal-edit-phone" class="swal2-input" value="${customer.phone}" placeholder="Mobile Number">
                <input id="swal-edit-address" class="swal2-input" value="${customer.address || ''}" placeholder="Address">
            `,
            confirmButtonText: 'Update Details',
            confirmButtonColor: '#007242',
            showCancelButton: true,
            preConfirm: () => {
                return {
                    name: document.getElementById('swal-edit-name').value,
                    phone: document.getElementById('swal-edit-phone').value,
                    address: document.getElementById('swal-edit-address').value
                };
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.put(`/customers/${customer._id}`, result.value);
                    Swal.fire('Updated', 'Customer details updated successfully.', 'success');
                    fetchCustomers();
                } catch (error) {
                    Swal.fire('Error', 'Failed to update customer', 'error');
                }
            }
        });
        setActiveDropdown(null);
    };

    return (
        <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto pb-10 px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <User className="text-emerald-600" /> Customer Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage customer profiles, history, and credit records.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex gap-1 border border-gray-200 dark:border-gray-700 mr-2">
                        <button 
                            onClick={() => setViewMode('card')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'card' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Card View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('table')}
                            className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-white dark:bg-gray-700 shadow-sm text-emerald-600' : 'text-gray-400 hover:text-gray-600'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                    <button 
                        onClick={handleAddCustomer}
                        className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Add Customer
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <User size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Customers</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalEntries}</h3>
                         <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium mt-1">
                            <ArrowUpRight size={14} /> Active Base
                        </div>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl relative z-10">
                        <User size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <Wallet size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Receivables (Credit)</p>
                        {/* Note: This total checks only current page fetched items due to frontend reduce, ideally fetch from stat API */}
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">₹{totalReceivables.toLocaleString()}</h3>
                         <div className="flex items-center gap-1 text-orange-500 text-xs font-medium mt-1">
                            <DollarSign size={14} /> Pending Payment
                        </div>
                    </div>
                    <div className="p-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-xl relative z-10">
                        <Wallet size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow relative overflow-hidden group">
                    <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
                        <Star size={120} />
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Top Customer</p>
                        {/* Placeholder logic for top customer */}
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{customers.length > 0 ? customers[0].name : '-'}</h3>
                         <div className="flex items-center gap-1 text-purple-500 text-xs font-medium mt-1">
                            <Star size={14} /> High Value
                        </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl relative z-10">
                        <Star size={24} />
                    </div>
                </div>
            </div>

             {/* Filters & Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                <div className="relative w-full sm:w-96">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                   <input 
                     type="text" 
                     placeholder="Search name, mobile number..." 
                     value={searchTerm}
                     onChange={(e) => handleSearchChange(e.target.value)}
                     className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900 focus:border-emerald-500 outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                   />
                </div>
                
                <div className="flex items-center gap-2">
                    {['All', 'Pending', 'Top'].map((type) => (
                        <button
                            key={type}
                            onClick={() => handleFilterChange(type)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                                ${filterType === type 
                                    ? 'bg-gray-800 dark:bg-emerald-600 text-white shadow-md' 
                                    : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                        >
                            {type}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                 <div className="flex items-center justify-center py-20">
                    <Loader className="animate-spin text-emerald-600" size={40} />
                </div>
            ) : (
                <>
                {/* List View Toggle */}
                {viewMode === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {displayedCustomers.map((customer) => (
                            <div key={customer._id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                                {customer.pendingAmount > 0 && (
                                    <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-black px-4 py-1.5 rounded-bl-2xl shadow-sm z-10">
                                        PAYMENT DUE
                                    </div>
                                )}
                                
                                <div className="flex items-start justify-between mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner
                                            ${customer.pendingAmount > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg text-gray-800 dark:text-white tracking-tight">{customer.name}</h3>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 font-bold">
                                                <MapPin size={12} className="text-red-400" /> {customer.address || 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <button 
                                            onClick={() => setActiveDropdown(activeDropdown === customer._id ? null : customer._id)}
                                            className={`p-2 rounded-xl transition-all ${activeDropdown === customer._id ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'text-gray-300 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                        >
                                            <MoreVertical size={20} />
                                        </button>
                                        
                                        {activeDropdown === customer._id && (
                                            <>
                                                <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                                                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-20 py-2 animate-scale-up">
                                                    <button onClick={() => handleEdit(customer)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold">
                                                        <Edit3 size={16} className="text-blue-500" /> Edit Profile
                                                    </button>
                                                    <button onClick={() => handleDelete(customer._id, customer.name)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold">
                                                        <Trash2 size={16} /> Delete Record
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-4 mb-8">
                                     <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Mobile</span>
                                        <span className="font-black text-gray-700 dark:text-gray-200 tracking-tighter">{customer.phone}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Orders</span>
                                        <span className="font-black text-gray-700 dark:text-gray-200">{customer.totalOrders || 0} Units</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Revenue</span>
                                        <span className="font-black text-gray-800 dark:text-white text-base">₹{(customer.totalSpent || 0).toLocaleString()}</span>
                                    </div>
                                     <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                                        <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Balance Due</span>
                                        <span className={`font-black text-lg ${customer.pendingAmount > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                            ₹{(customer.pendingAmount || 0).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 relative z-10">
                                    <button 
                                        onClick={() => handleViewHistory(customer)}
                                        className="px-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-xs font-black uppercase tracking-wider hover:bg-gray-50 dark:hover:bg-gray-700 transition-all text-center"
                                    >
                                        History
                                    </button>
                                    <button 
                                        onClick={() => navigate('/sales/pos')}
                                        className="px-4 py-3 rounded-xl bg-emerald-600 text-white text-xs font-black uppercase tracking-wider hover:bg-emerald-700 shadow-lg shadow-emerald-200 dark:shadow-none transition-all text-center"
                                    >
                                        Quick Bill
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm overflow-hidden overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-gray-50/80 dark:bg-gray-750/80 border-b border-gray-100 dark:border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Customer</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mobile</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Location</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">Orders</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Revenue</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Balance Due</th>
                                    <th className="px-6 py-4 text-[11px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                                {displayedCustomers.map((customer) => (
                                    <tr key={customer._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                                                    {customer.name.charAt(0)}
                                                </div>
                                                <span className="font-bold text-gray-800 dark:text-white">{customer.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-mono text-[13px]">{customer.phone}</td>
                                        <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs font-medium">{customer.address || 'N/A'}</td>
                                        <td className="px-6 py-5 text-center font-bold text-gray-700 dark:text-gray-300">{customer.totalOrders || 0}</td>
                                        <td className="px-6 py-5 text-right font-black text-gray-800 dark:text-white">₹{(customer.totalSpent || 0).toLocaleString()}</td>
                                        <td className={`px-6 py-5 text-right font-black ${customer.pendingAmount > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                            ₹{(customer.pendingAmount || 0).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button 
                                                    onClick={() => handleEdit(customer)}
                                                    className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleViewHistory(customer)}
                                                    className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                                                    title="History"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDelete(customer._id, customer.name)}
                                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                </>
            )}

            {/* Pagination Controls */}
            {totalEntries > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 mt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Showing <span className="font-black text-gray-800 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                                <span className="font-black text-gray-800 dark:text-white">{Math.min(currentPage * itemsPerPage, totalEntries)}</span> of{' '}
                                <span className="font-black text-gray-800 dark:text-white">{totalEntries}</span> records
                            </p>
                            
                            <select
                                value={itemsPerPage}
                                onChange={(e) => handleItemsPerPageChange(e.target.value)}
                                className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-black text-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="6">6 Per Page</option>
                                <option value="12">12 Per Page</option>
                                <option value="24">24 Per Page</option>
                                <option value="50">50 Per Page</option>
                            </select>
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className="p-2 rounded-xl border-2 border-gray-50 dark:border-gray-700 text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronLeft size={20} />
                                </button>
                                
                                <span className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs font-black">
                                    Page {currentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className="p-2 rounded-xl border-2 border-gray-50 dark:border-gray-700 text-gray-400 hover:text-emerald-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    <ChevronRight size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

             {!loading && totalEntries === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                    <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
                    <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">No Customers Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Try adjusting your filters or add a new customer.</p>
                </div>
            )}

            
            {/* History Modal */}
            {showHistoryModal && selectedCustomerForHistory && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                            <div>
                                <h2 className="text-xl font-black text-gray-800 dark:text-white flex items-center gap-2">
                                    <Clock className="text-emerald-600" size={24} /> 
                                    Transaction History
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Viewing history for <span className="font-bold text-gray-800 dark:text-white">{selectedCustomerForHistory.name}</span>
                                </p>
                            </div>
                            <button 
                                onClick={() => setShowHistoryModal(false)}
                                className="p-2 bg-white dark:bg-gray-700 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 shadow-sm border border-gray-100 dark:border-gray-600 transition-all hover:rotate-90"
                            >
                                <X size={20} />
                            </button>
                        </div>
                        
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {historyLoading ? (
                                <div className="flex flex-col items-center justify-center py-12">
                                    <Loader className="animate-spin text-emerald-500 mb-4" size={32} />
                                    <p className="text-gray-400 text-sm font-medium">Loading records...</p>
                                </div>
                            ) : selectedCustomerHistory.length > 0 ? (
                                <div className="space-y-4">
                                    {selectedCustomerHistory.map((invoice) => (
                                        <div key={invoice._id} className="bg-white dark:bg-gray-750 border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-md transition-shadow flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 rounded-xl bg-gray-50 dark:bg-gray-700 flex items-center justify-center text-gray-400 dark:text-gray-500">
                                                    <FileText size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white">{invoice.invoiceNumber}</h4>
                                                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                        <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(invoice.createdAt).toLocaleDateString()}</span>
                                                        <span className="flex items-center gap-1"><Clock size={12} /> {new Date(invoice.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center justify-between w-full sm:w-auto gap-8">
                                                <div className="text-right">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Amount</p>
                                                    <p className="font-black text-gray-800 dark:text-white text-base">₹{invoice.totalAmount.toLocaleString()}</p>
                                                </div>
                                                
                                                <div className="text-right hidden sm:block">
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Payment</p>
                                                    <p className="font-bold text-gray-600 dark:text-gray-300 text-sm">{invoice.paymentMethod}</p>
                                                </div>

                                                <div className="text-right">
                                                    <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                        invoice.status === 'Paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:border-emerald-900/30' : 
                                                        invoice.status === 'Pending' ? 'bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-900/20 dark:border-orange-900/30' : 
                                                        'bg-gray-50 text-gray-600 border-gray-100'
                                                    }`}>
                                                        {invoice.status}
                                                    </span>
                                                </div>
                                                
                                                <button 
                                                    onClick={() => navigate(`/sales/invoices/view/${invoice._id}`)}
                                                    className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors"
                                                    title="View Invoice"
                                                >
                                                    <ArrowUpRight size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                                        <FileText size={32} />
                                    </div>
                                    <h3 className="text-gray-800 dark:text-white font-bold">No Transaction History</h3>
                                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">This customer hasn't made any purchases yet.</p>
                                </div>
                            )}
                        </div>
                        
                        <div className="p-4 bg-gray-50 dark:bg-gray-750 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                            <button 
                                onClick={() => setShowHistoryModal(false)}
                                className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
