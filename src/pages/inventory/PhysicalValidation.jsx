import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useLocation } from 'react-router-dom';
import { useInventory } from '../../context/InventoryContext';
import { 
  ClipboardCheck, 
  Plus, 
  Search, 
  Clock, 
  CheckCircle, 
  FileText, 
  Package, 
  X,
  Download
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';

const StatusCard = ({ title, value, icon: Icon, colorClass, bgClass }) => (
  <div className={`p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between group overflow-hidden relative bg-white dark:bg-gray-800`}>
    <div className="flex items-center justify-between mb-4">
      <div className={`p-2.5 rounded-xl ${bgClass} ${colorClass}`}>
          <Icon size={20} />
      </div>
    </div>
    <div>
      <p className="text-[10px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{title}</p>
      <h3 className="text-2xl font-black text-gray-800 dark:text-white mt-0.5">{value}</h3>
    </div>
  </div>
);

const PhysicalValidation = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { suppliers } = useInventory();
  const [showSupplierSuggestions, setShowSupplierSuggestions] = useState(false);
  const supplierWrapperRef = React.useRef(null);
  
  // New: Dispatched POs
  const [dispatchedPOs, setDispatchedPOs] = useState([]);
  const [showPOSuggestions, setShowPOSuggestions] = useState(false);
  const poWrapperRef = React.useRef(null);
  const [poItems, setPoItems] = useState([]); // Added state for PO items

  // State Declarations moved to top
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showEntryModal, setShowEntryModal] = useState(false);
  const [filters, setFilters] = useState({
    supplier: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  // Entry Form State
  const [formData, setFormData] = useState({
    supplierName: '',
    invoiceNumber: '',
    invoiceValue: '',
    skuCount: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    location: '',
    poIds: '',
    isPoNotPresent: false
  });

  const fetchPOItems = async (poNumber) => {
    try {
        const { data } = await api.get(`/purchase-orders/${poNumber}`);
        if (data && data.items) {
            const items = data.items.map(item => ({
                productName: item.medicineName || item.product?.name,
                sku: item.product?.sku,
                orderedQty: item.quantity,
                receivedQty: item.quantity, // Default to match ordered
            }));
            setPoItems(items);
        }
    } catch (error) {
        console.error("Failed to fetch PO items", error);
    }
  };

  useEffect(() => {
    const fetchDispatchedPOs = async () => {
        try {
            const { data } = await api.get('/purchase-orders'); // Removed status query to filter client-side properly
            const allowedStatuses = ['Dispatched', 'Sent to Supplier', 'Approved by Supplier'];
            const dispatched = Array.isArray(data) ? data.filter(po => allowedStatuses.includes(po.status)) : [];
            setDispatchedPOs(dispatched);

            // Handle Prefill from navigation state if present
            if (location.state?.prefill?.poData) {
                const po = location.state.prefill.poData;
                setFormData(prev => ({
                    ...prev,
                    poIds: po.poNumber,
                    supplierName: po.supplierName,
                    skuCount: po.items.length,
                    invoiceValue: po.totalAmount
                }));
                setShowEntryModal(true);
                fetchPOItems(po.poNumber); // Fetch items on prefill
                window.history.replaceState({}, document.title);
            }
        } catch (error) {
            console.error("Failed to fetch dispatched POs", error);
        }
    };
    fetchDispatchedPOs();
  }, [location.state]);

  // Auto-fill logic when PO ID is typed or scanned
  useEffect(() => {
    if (formData.poIds && dispatchedPOs.length > 0) {
        const matchedPO = dispatchedPOs.find(po => po.poNumber.toLowerCase() === formData.poIds.trim().toLowerCase());
        if (matchedPO) {
             // Only update if data is missing or different to avoid overriding manual edits unnecessarily, 
             // but ensure we fill if it's a match.
             if (formData.supplierName !== matchedPO.supplierName || formData.skuCount != matchedPO.items.length) {
                 setFormData(prev => ({
                     ...prev,
                     supplierName: matchedPO.supplierName,
                     skuCount: matchedPO.items.length,
                     invoiceValue: matchedPO.totalAmount
                 }));
                 fetchPOItems(matchedPO.poNumber); // Fetch items on match
                 Swal.fire({
                     toast: true,
                     position: 'top-end',
                     icon: 'success',
                     title: 'PO Details Auto-filled',
                     showConfirmButton: false,
                     timer: 1500
                 });
             }
        } else {
            setPoItems([]); // Clear items if no match
        }
    } else {
        setPoItems([]);
    }
  }, [formData.poIds, dispatchedPOs]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
        if (supplierWrapperRef.current && !supplierWrapperRef.current.contains(event.target)) {
            setShowSupplierSuggestions(false);
        }
        if (poWrapperRef.current && !poWrapperRef.current.contains(event.target)) {
             setShowPOSuggestions(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);



  const fetchEntries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.supplier) params.append('supplier', filters.supplier);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const { data } = await api.get(`/physical-receiving?${params.toString()}`);
      if (data.success) {
        setEntries(data.data);
      }
    } catch (error) {
      console.error("Failed to fetch entries", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [filters]);

  const handleInputChange = (e) => {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
          ...prev,
          [name]: type === 'checkbox' ? checked : value
      }));
  };

  const handleSubmitEntry = async (e) => {
    e.preventDefault();
    
    // Validation 1: Supplier Name
    if (!formData.supplierName || formData.supplierName.trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Supplier Required',
            text: 'Please enter or select a supplier name',
            confirmButtonColor: '#007242'
        });
        return;
    }

    // Validation 2: Invoice Number
    if (!formData.invoiceNumber || formData.invoiceNumber.trim() === '') {
        Swal.fire({
            icon: 'warning',
            title: 'Invoice Number Required',
            text: 'Please enter the invoice number',
            confirmButtonColor: '#007242'
        });
        return;
    }

    // Validation 3: SKU Count
    if (!formData.skuCount || formData.skuCount <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid SKU Count',
            text: 'Please enter a valid number of SKUs (greater than 0)',
            confirmButtonColor: '#007242'
        });
        return;
    }

    // Validation 4: Invoice Value
    if (!formData.invoiceValue || formData.invoiceValue <= 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Invalid Invoice Amount',
            text: 'Please enter a valid invoice amount (greater than 0)',
            confirmButtonColor: '#007242'
        });
        return;
    }

    // Validation 5: Invoice Date
    if (!formData.invoiceDate) {
        Swal.fire({
            icon: 'warning',
            title: 'Invoice Date Required',
            text: 'Please select the invoice date',
            confirmButtonColor: '#007242'
        });
        return;
    }

    // Check for discrepancies in PO items
    if (poItems.length > 0) {
        const discrepancies = poItems.filter(i => i.orderedQty !== i.receivedQty);
        if (discrepancies.length > 0) {
            const result = await Swal.fire({
                title: 'Quantity Mismatch!',
                html: `
                    <div class="text-left text-sm">
                        <p class="mb-2 text-red-500 font-bold underline">Discrepancies found:</p>
                        ${discrepancies.map(d => `<p>• ${d.productName}: Ordered <b>${d.orderedQty}</b>, Received <b>${d.receivedQty}</b></p>`).join('')}
                    </div>
                    <p class="mt-4 font-bold">Do you want to proceed with these differences?</p>
                `,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Yes, Proceed',
                cancelButtonText: 'No, Re-check',
                confirmButtonColor: '#ff9800'
            });
            if (!result.isConfirmed) return;
        }
    }

    try {
        const payload = {
            ...formData,
            items: poItems.map(item => ({
                ...item,
                discrepancy: item.receivedQty - item.orderedQty
            }))
        };
        const { data } = await api.post('/physical-receiving', payload);
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Entry Created',
                html: `
                    <div class="text-left">
                        <p><strong>Physical ID:</strong> ${data.data.physicalReceivingId}</p>
                        <p class="text-sm text-gray-500 mt-2">Please write this Physical ID on the invoice.</p>
                    </div>
                `
            });
            setShowEntryModal(false);
            setPoItems([]);
            setFormData({
                supplierName: '',
                invoiceNumber: '',
                invoiceValue: '',
                skuCount: '',
                invoiceDate: new Date().toISOString().split('T')[0],
                location: '',
                poIds: '',
                isPoNotPresent: false
            });
            fetchEntries();
        }
    } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to create entry', 'error');
    }
  };

  const handleValidate = async (id, currentStatus) => {
      if (currentStatus === 'Done') return;

      const { value: name } = await Swal.fire({
          title: 'Mark as Validated',
          input: 'text',
          inputLabel: 'Enter your name/Staff ID',
          inputPlaceholder: 'e.g. John Doe',
          showCancelButton: true,
          confirmButtonText: 'Mark Done',
          confirmButtonColor: '#10b981',
          inputValidator: (value) => {
              if (!value) {
                  return 'You need to write your name!'
              }
          }
      });

      if (name) {
          try {
              const { data } = await api.put(`/physical-receiving/${id}/validate`, { validatedBy: name });
              if (data.success) {
                  Swal.fire('Success', 'Physical validation marked as done.', 'success');
                  fetchEntries();
              }
          } catch (error) {
              Swal.fire('Error', 'Failed to update status', 'error');
          }
      }
  };

  const handleClearAll = () => {
      Swal.fire({
          title: 'Are you sure?',
          text: "This will DELETE ALL physical validation entries. This action cannot be undone!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, clear all!'
      }).then(async (result) => {
          if (result.isConfirmed) {
              try {
                  const { data } = await api.delete('/physical-receiving/clear-all');
                  if (data.success) {
                      Swal.fire('Deleted!', 'All entries have been cleared.', 'success');
                      fetchEntries();
                  }
              } catch (error) {
                  Swal.fire('Error', 'Failed to clear entries', 'error');
              }
          }
      });
  };

  const downloadPendingReport = () => {
    const pendingEntries = entries.filter(e => e.status === 'Pending');
    
    if (pendingEntries.length === 0) {
        Swal.fire('Info', 'No pending entries to download.', 'info');
        return;
    }

    const csvHeaders = ['Physical ID', 'Date', 'Supplier', 'Invoice No', 'Invoice Value', 'SKU Count', 'Location', 'PO Number'];
    
    const csvRows = pendingEntries.map(e => [
        e.physicalReceivingId,
        new Date(e.createdAt).toLocaleDateString(),
        `"${e.supplierName.replace(/"/g, '""')}"`,
        `"${e.invoiceNumber.replace(/"/g, '""')}"`,
        e.invoiceValue,
        e.skuCount,
        `"${(e.location || '').replace(/"/g, '""')}"`,
        `"${(e.poIds || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [csvHeaders.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Pending_Physical_Validation_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const pendingCount = entries.filter(e => e.status === 'Pending').length;
  const doneCount = entries.filter(e => e.status === 'Done').length;

  return (
    <div className="animate-fade-in-up max-w-[1600px] mx-auto space-y-6 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
             <ClipboardCheck className="text-primary" /> Physical Stock Validation
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage and validate incoming physical stock before GRN.</p>
        </div>
        <div className="flex gap-2">
            {entries.length > 0 && (
                <button 
                    onClick={handleClearAll}
                    className="px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2"
                >
                    <X size={18} /> Clear All
                </button>
            )}
            <button 
                onClick={downloadPendingReport}
                className="px-5 py-2.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl font-bold text-sm hover:bg-blue-100 transition-all flex items-center gap-2"
            >
                <Download size={18} /> Pending Report
            </button>
            <button 
                onClick={() => setShowEntryModal(true)}
                className="px-5 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-bold text-sm hover:shadow-lg transition-all flex items-center gap-2"
            >
                <Plus size={18} /> New Entry
            </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatusCard 
            title="Pending Validation" 
            value={pendingCount} 
            icon={Clock} 
            bgClass="bg-orange-50 dark:bg-orange-900/20" 
            colorClass="text-orange-600 dark:text-orange-400" 
         />
         <StatusCard 
            title="Completed Validations" 
            value={doneCount} 
            icon={CheckCircle} 
            bgClass="bg-emerald-50 dark:bg-emerald-900/20" 
            colorClass="text-emerald-600 dark:text-emerald-400" 
         />
         <StatusCard 
            title="Total Entries" 
            value={entries.length} 
            icon={FileText} 
            bgClass="bg-blue-50 dark:bg-blue-900/20" 
            colorClass="text-blue-600 dark:text-blue-400" 
         />
      </div>

      {/* Filters & Content */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        
        {/* Filter Bar */}
        <div className="flex flex-col lg:flex-row gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
             <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                    placeholder="Search Supplier, Invoice No, Physical ID..." 
                    value={filters.supplier}
                    onChange={(e) => setFilters(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-gray-100 focus:ring-2 focus:ring-primary/20"
                />
             </div>
             <div className="w-full lg:w-48">
                <select 
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-sm text-gray-800 dark:text-gray-100 font-bold focus:ring-2 focus:ring-primary/20"
                >
                    <option value="">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Done">Done</option>
                </select>
             </div>
             <div className="w-full lg:w-auto">
                 <input 
                    type="datetime-local" 
                    value={filters.startDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                    placeholder="Start Date"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-xs text-gray-800 dark:text-gray-100 font-bold focus:ring-2 focus:ring-primary/20"
                 />
             </div>
             <div className="w-full lg:w-auto">
                 <input 
                    type="datetime-local" 
                    value={filters.endDate}
                    onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                    placeholder="End Date"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl outline-none text-xs text-gray-800 dark:text-gray-100 font-bold focus:ring-2 focus:ring-primary/20"
                 />
             </div>
             {(filters.supplier || filters.status || filters.startDate || filters.endDate) && (
                <button 
                    onClick={() => setFilters({ supplier: '', status: '', startDate: '', endDate: '' })}
                    className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl font-bold text-sm hover:bg-red-100 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                    <X size={16} /> Clear
                </button>
             )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                    <tr>
                        <th className="px-5 py-4 rounded-l-xl">IDs</th>
                        <th className="px-5 py-4">Invoice Details</th>
                        <th className="px-5 py-4">Counts</th>
                        <th className="px-5 py-4">Location</th>
                        <th className="px-5 py-4">Status</th>
                        <th className="px-5 py-4 text-right rounded-r-xl">Action</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {loading ? (
                       <tr><td colSpan="6" className="text-center py-10">Loading entries...</td></tr>
                    ) : entries.length === 0 ? (
                       <tr><td colSpan="6" className="text-center py-10 text-gray-400">No entries found</td></tr>
                    ) : (
                       entries.map(entry => (
                           <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                               <td className="px-5 py-4">
                                   <div className="font-bold text-gray-800 dark:text-white">{entry.physicalReceivingId}</div>
                                   <div className="text-xs text-gray-500 font-mono mt-0.5">{entry.systemId}</div>
                                   <div className="text-[10px] text-gray-400 mt-1">{new Date(entry.createdAt).toLocaleDateString()}</div>
                               </td>
                               <td className="px-5 py-4">
                                   <div className="font-bold text-gray-800 dark:text-gray-200">{entry.supplierName}</div>
                                   <div className="text-xs text-gray-500 mt-0.5">Inv: {entry.invoiceNumber} • ₹{entry.invoiceValue}</div>
                               </td>
                               <td className="px-5 py-4">
                                   <div className="text-xs space-y-1">
                                       <div className="font-bold text-primary">Total SKU: {entry.skuCount}</div>
                                       {entry.poIds && <div className="text-[10px] text-gray-400">PO: {entry.poIds}</div>}
                                   </div>
                               </td>
                               <td className="px-5 py-4">
                                    <span className="text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{entry.location || 'N/A'}</span>
                               </td>
                               <td className="px-5 py-4">
                                   {entry.status === 'Pending' ? (
                                       <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-bold">
                                           <Clock size={12} /> Pending
                                       </span>
                                   ) : (
                                       <div>
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-full text-xs font-bold">
                                                <CheckCircle size={12} /> Validated
                                            </span>
                                            <div className="text-[10px] text-gray-400 mt-1">by {entry.validatedBy}</div>
                                       </div>
                                   )}
                               </td>
                               <td className="px-5 py-4 text-right">
                                   {entry.status === 'Pending' ? (
                                       <button 
                                            onClick={() => handleValidate(entry._id, entry.status)}
                                            className="px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-xs font-bold hover:shadow-lg transition-all"
                                       >
                                           Validate
                                       </button>
                                   ) : (
                                       <div className="flex gap-2 justify-end">
                                            {entry.grnStatus !== 'Done' ? (
                                                <button 
                                                    onClick={() => navigate('/purchase/grn/add', { 
                                                        state: { 
                                                            prefill: {
                                                                physicalId: entry.physicalReceivingId,
                                                                entryData: entry
                                                            } 
                                                        } 
                                                    })}
                                                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
                                                >
                                                    <Plus size={14} /> Start GRN
                                                </button>
                                            ) : (
                                                <button 
                                                    onClick={() => navigate(`/purchase/grn/view/${entry.grnId || ''}`)}
                                                    className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold hover:bg-blue-100 border border-blue-100"
                                                >
                                                    View GRN
                                                </button>
                                            )}
                                       </div>
                                   )}
                               </td>
                           </tr>
                       ))
                    )}
                </tbody>
             </table>
        </div>

      </div>

      {/* Entry Modal */}
      {showEntryModal && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in text-left">
            <div className="bg-white dark:bg-gray-800 w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 sticky top-0 z-10">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-normal text-gray-800 dark:text-white flex items-center gap-2">
                            Physical Receiving
                        </h2>
                        <span className="text-red-500 text-sm font-medium ml-2">(Do not initiate reGRN from this screen)</span>
                    </div>
                    
                    <button onClick={() => setShowEntryModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                        <X size={24} />
                    </button>
                </div>
                
                <form onSubmit={handleSubmitEntry} className="p-6 space-y-5">
                    
                    <div className="space-y-1 relative" ref={supplierWrapperRef}>
                        <label className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                            Supplier Name <span className="text-red-500">*</span>
                        </label>
                        <input 
                            name="supplierName" 
                            value={formData.supplierName} 
                            onChange={(e) => {
                                handleInputChange(e);
                                setShowSupplierSuggestions(true);
                            }}
                            onClick={() => setShowSupplierSuggestions(true)}
                            required 
                            autoComplete="off"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-normal" 
                            placeholder="Enter or select supplier name" 
                        />
                        
                        {/* Supplier Suggestions Dropdown */}
                        {showSupplierSuggestions && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-fade-in-up">
                                {suppliers
                                    .filter(s => s.name.toLowerCase().includes(formData.supplierName.toLowerCase()))
                                    .map(s => (
                                        <div 
                                            key={s.id} 
                                            onClick={() => {
                                                setFormData(prev => ({ ...prev, supplierName: s.name }));
                                                setShowSupplierSuggestions(false);
                                            }}
                                            className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-700 last:border-0"
                                        >
                                            <div className="font-medium">{s.name}</div>
                                            <div className="text-[10px] text-gray-400">{s.address || 'No address'}</div>
                                        </div>
                                    ))
                                }
                                {suppliers.filter(s => s.name.toLowerCase().includes(formData.supplierName.toLowerCase())).length === 0 && (
                                    <div className="px-4 py-3 text-xs text-gray-400 text-center">
                                        No matching suppliers found. 
                                        <br/>Type name to use as new.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                            Invoice Number <span className="text-red-500">*</span>
                        </label>
                        <input 
                            name="invoiceNumber" 
                            value={formData.invoiceNumber} 
                            onChange={handleInputChange} 
                            required 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            placeholder="Enter invoice number" 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                            Number of SKUs <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="skuCount" 
                            value={formData.skuCount} 
                            onChange={handleInputChange} 
                            required 
                            min="1"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            placeholder="Total SKUs in invoice" 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                            Invoice Amount (₹) <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="number" 
                            name="invoiceValue" 
                            value={formData.invoiceValue} 
                            onChange={handleInputChange} 
                            required 
                            min="0.01"
                            step="0.01"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            placeholder="Total invoice amount" 
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-sm text-gray-600 dark:text-gray-400 font-bold">
                            Invoice Date <span className="text-red-500">*</span>
                        </label>
                        <input 
                            type="date" 
                            name="invoiceDate" 
                            value={formData.invoiceDate} 
                            onChange={handleInputChange} 
                            required 
                            max={new Date().toISOString().split('T')[0]}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                        />
                    </div>

                     <div className="space-y-1">
                        <label className="text-sm text-gray-600 dark:text-gray-400 font-bold">Staging / Receiving Area</label>
                        <input 
                            name="location" 
                            value={formData.location} 
                            onChange={handleInputChange} 
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all" 
                            placeholder="e.g. Receive Dock, Table 1, Warehouse A" 
                        />
                    </div>

                    <div className="space-y-2 relative" ref={poWrapperRef}>
                        <label className="text-sm text-gray-600 dark:text-gray-400">Select Purchase Order (Optional)</label>
                        <input 
                            name="poIds" 
                            value={formData.poIds} 
                            onChange={handleInputChange} 
                            onClick={() => setShowPOSuggestions(true)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md outline-none text-sm text-gray-700 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-bold" 
                            placeholder="Select Dispatched PO..." 
                            autoComplete="off"
                        />
                        
                        {showPOSuggestions && dispatchedPOs.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto custom-scrollbar animate-fade-in-up">
                                {dispatchedPOs.map(po => (
                                    <div 
                                        key={po._id} 
                                        onClick={() => {
                                            setFormData(prev => ({ 
                                                ...prev, 
                                                poIds: po.poNumber,
                                                supplierName: po.supplierName,
                                                skuCount: po.items.length, 
                                                // Estimate Invoice Value from PO Total (though real invoice may differ)
                                                invoiceValue: po.totalAmount
                                            }));
                                            setShowPOSuggestions(false);
                                        }}
                                        className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-sm text-gray-700 dark:text-gray-200 border-b border-gray-50 dark:border-gray-700 last:border-0"
                                    >
                                        <div className="font-bold text-primary">{po.poNumber}</div>
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>{po.supplierName}</span>
                                            <span>₹{po.totalAmount}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex items-center gap-2 mt-1">
                            <input 
                                type="checkbox" 
                                id="poNotPresent" 
                                name="isPoNotPresent"
                                checked={formData.isPoNotPresent}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <label htmlFor="poNotPresent" className="text-sm text-gray-600 dark:text-gray-400 select-none">PO not present / Direct Purchase</label>
                        </div>

                        {/* SKU Wise Quantity Check Section */}
                        {poItems.length > 0 && (
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-200 dark:border-gray-600 animate-fade-in">
                                <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Package size={14} className="text-primary" /> SKU Wise Physical Check
                                </h4>
                                <div className="space-y-4">
                                    {poItems.map((item, idx) => (
                                        <div key={idx} className="p-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-gray-800 dark:text-white leading-tight">{item.productName}</p>
                                                    {item.sku && <p className="text-[10px] text-gray-400 mt-0.5">SKU: {item.sku}</p>}
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] text-gray-400 uppercase font-black">Ordered</p>
                                                    <p className="text-sm font-black text-primary">{item.orderedQty}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 pt-2 border-t border-gray-50 dark:border-gray-700/50">
                                                <label className="text-[10px] font-black text-gray-500 uppercase flex-shrink-0">Physically Checked Qty:</label>
                                                <input 
                                                    type="number"
                                                    value={item.receivedQty}
                                                    onChange={(e) => {
                                                        const newItems = [...poItems];
                                                        newItems[idx].receivedQty = parseInt(e.target.value) || 0;
                                                        setPoItems(newItems);
                                                    }}
                                                    className={`w-full px-3 py-1.5 rounded-lg border text-sm font-black outline-none transition-all ${
                                                        item.receivedQty !== item.orderedQty 
                                                        ? 'bg-orange-50 border-orange-200 text-orange-700 focus:ring-orange-500/20' 
                                                        : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-white focus:ring-primary/20'
                                                    }`}
                                                />
                                            </div>
                                            {item.receivedQty !== item.orderedQty && (
                                                <div className="mt-2 text-[10px] font-bold text-orange-500 flex items-center gap-1">
                                                    <AlertCircle size={10} /> 
                                                    {item.receivedQty < item.orderedQty ? `Difference: -${item.orderedQty - item.receivedQty} (Shortage)` : `Difference: +${item.receivedQty - item.orderedQty} (Excess)`}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-6 flex justify-end gap-3">
                        <button type="submit" className="px-6 py-2 bg-blue-500 text-white rounded font-medium text-sm hover:bg-blue-600 shadow-md transition-all">Submit</button>
                        <button type="button" onClick={() => setFormData(prev => ({ ...prev, supplierName: '', invoiceNumber: '', invoiceValue: '', skuCount: '', location: '', poIds: '', isPoNotPresent: false }))} className="px-6 py-2 bg-white text-blue-500 border border-blue-500 rounded font-medium text-sm hover:bg-blue-50 transition-colors">Clear</button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
      )}

    </div>
  );
};

export default PhysicalValidation;
