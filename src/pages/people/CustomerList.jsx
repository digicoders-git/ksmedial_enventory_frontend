import React, { useState } from 'react';
import { Search, User, Phone, MapPin, MoreVertical, Plus, Filter, FileText, ArrowUpRight, DollarSign, Wallet, Star, LayoutGrid, List, Edit3, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const CustomerList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('All'); // All, Pending, Top
    const [viewMode, setViewMode] = useState('card'); // 'card' or 'table'
    const [activeDropdown, setActiveDropdown] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // Mock Data
    const [customers, setCustomers] = useState([
        { id: 1, name: 'Rahul Sharma', mobile: '9876543210', location: 'Mumbai, MH', totalSpent: 125000, pending: 0, lastVisit: '2024-01-20', rating: 5, orders: 12, type: 'Regular' },
        { id: 2, name: 'Priya Verma', mobile: '9988776655', location: 'Pune, MH', totalSpent: 45000, pending: 2500, lastVisit: '2024-01-18', rating: 4, orders: 5, type: 'New' },
        { id: 3, name: 'Amit Singh', mobile: '8877665544', location: 'Nashik, MH', totalSpent: 280000, pending: 15000, lastVisit: '2024-01-15', rating: 5, orders: 28, type: 'VIP' },
        { id: 4, name: 'Sneha Gupta', mobile: '7766554433', location: 'Nagpur, MH', totalSpent: 8500, pending: 0, lastVisit: '2023-12-28', rating: 3, orders: 2, type: 'Regular' },
        { id: 5, name: 'Walk-in Customer', mobile: '-', location: '-', totalSpent: 500000, pending: 0, lastVisit: '2024-01-22', rating: 0, orders: 150, type: 'General' },
    ]);

    const { paginatedCustomers, totalPages, paginationInfo } = React.useMemo(() => {
        const filtered = customers.filter(customer => {
            const matchesSearch = customer.name.toLowerCase().includes(searchTerm.toLowerCase()) || customer.mobile.includes(searchTerm);
            
            if (filterType === 'Pending') return matchesSearch && customer.pending > 0;
            if (filterType === 'Top') return matchesSearch && customer.totalSpent > 100000;
            
            return matchesSearch;
        });

        const totalItems = filtered.length;
        const totalPgs = Math.ceil(totalItems / itemsPerPage);
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const slicedItems = filtered.slice(startIndex, endIndex);

        return {
            paginatedCustomers: slicedItems,
            totalPages: totalPgs,
            paginationInfo: {
                totalItems,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, totalItems),
                currentPage
            }
        };
    }, [customers, searchTerm, filterType, currentPage, itemsPerPage]);

    const totalReceivables = customers.reduce((acc, curr) => acc + curr.pending, 0);

    const handleSearchChange = (value) => {
        setSearchTerm(value);
        setCurrentPage(1);
    };

    const handleFilterChange = (type) => {
        setFilterType(type);
        setCurrentPage(1);
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
                <input id="swal-mobile" class="swal2-input" placeholder="Mobile Number">
                <input id="swal-loc" class="swal2-input" placeholder="Location / City">
            `,
            confirmButtonText: 'Add Customer',
            confirmButtonColor: '#007242',
            showCancelButton: true,
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const mobile = document.getElementById('swal-mobile').value;
                if (!name || !mobile) {
                    Swal.showValidationMessage('Name and Mobile are required');
                }
                return { name, mobile };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Success', 'Customer added successfully', 'success');
            }
        });
    }

    const handleDelete = (id, name) => {
        Swal.fire({
            title: 'Delete Customer?',
            text: `Are you sure you want to delete ${name}? All transaction history will be archived.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc2626',
            confirmButtonText: 'Yes, Delete',
        }).then((result) => {
            if (result.isConfirmed) {
                setCustomers(customers.filter(c => c.id !== id));
                Swal.fire('Deleted', 'Customer record has been removed.', 'success');
            }
        });
        setActiveDropdown(null);
    };

    const handleEdit = (customer) => {
        Swal.fire({
            title: 'Edit Customer',
            html: `
                <input id="swal-name" class="swal2-input" value="${customer.name}" placeholder="Full Name">
                <input id="swal-mobile" class="swal2-input" value="${customer.mobile}" placeholder="Mobile Number">
                <input id="swal-loc" class="swal2-input" value="${customer.location}" placeholder="Location">
            `,
            confirmButtonText: 'Update Details',
            confirmButtonColor: '#007242',
            showCancelButton: true,
        }).then((result) => {
            if (result.isConfirmed) {
                Swal.fire('Updated', 'Customer details refined successfully.', 'success');
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
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{customers.length}</h3>
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
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">Amit Singh</h3>
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

            {/* List View Toggle */}
            {viewMode === 'card' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {paginatedCustomers.map((customer) => (
                        <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
                            {customer.pending > 0 && (
                                <div className="absolute top-0 right-0 bg-red-500 text-white text-[10px] uppercase font-black px-4 py-1.5 rounded-bl-2xl shadow-sm z-10">
                                    PAYMENT DUE
                                </div>
                            )}
                            
                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner
                                        ${customer.pending > 0 ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                                        {customer.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-lg text-gray-800 dark:text-white tracking-tight">{customer.name}</h3>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 font-bold">
                                            <MapPin size={12} className="text-red-400" /> {customer.location}
                                        </p>
                                    </div>
                                </div>
                                <div className="relative">
                                    <button 
                                        onClick={() => setActiveDropdown(activeDropdown === customer.id ? null : customer.id)}
                                        className={`p-2 rounded-xl transition-all ${activeDropdown === customer.id ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200' : 'text-gray-300 hover:text-gray-600 dark:hover:text-gray-400'}`}
                                    >
                                        <MoreVertical size={20} />
                                    </button>
                                    
                                    {activeDropdown === customer.id && (
                                        <>
                                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdown(null)}></div>
                                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 z-20 py-2 animate-scale-up">
                                                <button onClick={() => handleEdit(customer)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 font-bold">
                                                    <Edit3 size={16} className="text-blue-500" /> Edit Profile
                                                </button>
                                                <button onClick={() => handleDelete(customer.id, customer.name)} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 font-bold">
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
                                    <span className="font-black text-gray-700 dark:text-gray-200 tracking-tighter">{customer.mobile}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Orders</span>
                                    <span className="font-black text-gray-700 dark:text-gray-200">{customer.orders} Units</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-gray-400 dark:text-gray-500 font-bold uppercase text-[10px] tracking-widest">Revenue</span>
                                    <span className="font-black text-gray-800 dark:text-white text-base">₹{customer.totalSpent.toLocaleString()}</span>
                                </div>
                                 <div className="p-4 bg-gray-50 dark:bg-gray-750 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-700">
                                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Balance Due</span>
                                    <span className={`font-black text-lg ${customer.pending > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                        ₹{customer.pending.toLocaleString()}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3 relative z-10">
                                <button 
                                    onClick={() => navigate(`/sales/invoices?customerName=${customer.name}`)}
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
                            {paginatedCustomers.map((customer) => (
                                <tr key={customer.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xs">
                                                {customer.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-gray-800 dark:text-white">{customer.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 font-mono text-[13px]">{customer.mobile}</td>
                                    <td className="px-6 py-5 text-gray-500 dark:text-gray-400 text-xs font-medium">{customer.location}</td>
                                    <td className="px-6 py-5 text-center font-bold text-gray-700 dark:text-gray-300">{customer.orders}</td>
                                    <td className="px-6 py-5 text-right font-black text-gray-800 dark:text-white">₹{customer.totalSpent.toLocaleString()}</td>
                                    <td className={`px-6 py-5 text-right font-black ${customer.pending > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                                        ₹{customer.pending.toLocaleString()}
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
                                                onClick={() => navigate(`/sales/invoices?customerName=${customer.name}`)}
                                                className="p-2 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all"
                                                title="History"
                                            >
                                                <Eye size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(customer.id, customer.name)}
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

            {/* Pagination Controls */}
            {paginationInfo.totalItems > 0 && (
                <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl shadow-sm p-4 mt-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                                Showing <span className="font-black text-gray-800 dark:text-white">{paginationInfo.startIndex}</span> to{' '}
                                <span className="font-black text-gray-800 dark:text-white">{paginationInfo.endIndex}</span> of{' '}
                                <span className="font-black text-gray-800 dark:text-white">{paginationInfo.totalItems}</span> records
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
                                
                                <div className="flex items-center gap-1">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            onClick={() => goToPage(i + 1)}
                                            className={`w-10 h-10 rounded-xl text-xs font-black transition-all
                                                ${currentPage === i + 1 
                                                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200 dark:shadow-none' 
                                                    : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

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

             {paginationInfo.totalItems === 0 && (
                <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed border-gray-100 dark:border-gray-700">
                    <User size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4 opacity-50" />
                    <h3 className="text-lg font-black text-gray-800 dark:text-white uppercase tracking-tight">No Records Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Try adjusting your filters or add a new customer.</p>
                </div>
            )}
        </div>
    );
};

export default CustomerList;
