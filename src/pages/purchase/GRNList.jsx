import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    Search, Plus, Filter, Calendar, 
    FileText, Eye, Download, CheckCircle, 
    AlertCircle, Package, Truck, User 
} from 'lucide-react';
import api from '../../api/axios';

const GRNList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [grns, setGrns] = useState([]);
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalEntries, setTotalEntries] = useState(0);
    const itemsPerPage = 10;

    const fetchGRNs = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/purchases', {
                params: {
                    pageNumber: currentPage,
                    pageSize: itemsPerPage,
                    keyword: searchTerm
                }
            });

            if (data.success) {
                setGrns(data.purchases);
                setTotalPages(data.pages);
                setTotalEntries(data.total);
            }
        } catch (error) {
            console.error("Failed to fetch GRNs", error);
        } finally {
            setLoading(false);
        }
    }, [currentPage, searchTerm]);

    useEffect(() => {
        fetchGRNs();
    }, [fetchGRNs]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Goods Receipt Notes (GRN)</h1>
                    <p className="text-gray-500 mt-1">Manage and track incoming stock deliveries</p>
                </div>
                <button 
                    onClick={() => navigate('/purchase/grn/add')}
                    className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                >
                    <Plus size={20} />
                    <span>Create GRN</span>
                </button>
            </div>

            {/* Stats Cards (Optional - using dummy logic for now or could compute from list) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center space-x-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Total GRNs</p>
                        <h3 className="text-xl font-bold text-gray-800">{totalEntries}</h3>
                    </div>
                </div>
                 {/* Can add more stats here */}
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by GRN Number or Invoice..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">GRN No.</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Input Date</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Supplier</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Invoice</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Items</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="py-4 px-6 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-500">
                                        Loading GRNs...
                                    </td>
                                </tr>
                            ) : grns.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-8 text-center text-gray-500">
                                        No GRNs found
                                    </td>
                                </tr>
                            ) : (
                                grns.map((grn) => (
                                    <tr key={grn._id} className="hover:bg-gray-50 dark:hover:bg-gray-900/30 transition">
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-emerald-600">{grn.invoiceNumber}</span>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(grn.invoiceDate || grn.purchaseDate).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <div className="flex items-center space-x-2">
                                                <Truck size={16} className="text-gray-400" />
                                                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{grn.supplierId?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-sm font-bold text-gray-800 dark:text-white">
                                            ₹{grn.invoiceSummary?.invoiceAmount?.toLocaleString() || grn.grandTotal?.toLocaleString() || '0'}
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                                {grn.items?.length || 0} SKUs
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                                                grn.status === 'Received' 
                                                    ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                                                    : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                                            }`}>
                                                {grn.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button 
                                                onClick={() => navigate(`/purchase/grn/view/${grn._id}`)}
                                                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-emerald-600 transition"
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

                {/* Pagination */}
                <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                    <div className="text-sm text-gray-500">
                        Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalEntries)} of {totalEntries} results
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                        >
                            Previous
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GRNList;
