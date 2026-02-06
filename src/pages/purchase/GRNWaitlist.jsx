import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList, 
  Search, 
  Filter, 
  ArrowRight, 
  Calendar,
  CheckCircle,
  Clock,
  Package,
  FileText,
  Upload,
  RefreshCcw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import api from '../../api/axios';
import Swal from 'sweetalert2';
import Papa from 'papaparse';

const GRNWaitlist = () => {
    const navigate = useNavigate();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalRecords, setTotalRecords] = useState(0);

// Header Actions State
    const [autoGrn, setAutoGrn] = useState(false);
    const [physicalReceivingIdInput, setPhysicalReceivingIdInput] = useState('');
    const fileInputRef = React.useRef(null);
    
    // Filters State
    const [reGrn, setReGrn] = useState(false);
    const [filters, setFilters] = useState({
      priority: '',
      receivingId: '',
      supplier: '',
      invoiceNumber: ''
    });

    const handleAutoGrnToggle = async () => {
        const newState = !autoGrn;
        setAutoGrn(newState);
        
        // In a real scenario, this would trigger a backend setting update
        // await api.post('/settings/auto-grn', { enabled: newState });
        
        const result = await Swal.fire({
            title: newState ? 'Enable Auto GRN?' : 'Disable Auto GRN?',
            text: newState 
                ? "System will automatically process Small Items (< 5 lines) once physically validated."
                : "Manual approval will be required for all GRNs.",
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: newState ? 'Yes, Enable Auto GRN' : 'Yes, Disable',
            cancelButtonText: 'Cancel'
        });

        if (result.isConfirmed) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: `Auto GRN ${newState ? 'Enabled' : 'Disabled'}`,
                showConfirmButton: false,
                timer: 1500
            });
        } else {
            setAutoGrn(!newState); // Revert if cancelled
        }
    };

    const handleBulkUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async (results) => {
                console.log("Parsed CSV:", results.data);
                Swal.fire({
                    title: 'Processing Bulk GRN',
                    text: `Found ${results.data.length} records. Uploading...`,
                    timer: 2000,
                    didOpen: () => Swal.showLoading()
                }).then(() => {
                    Swal.fire('Success', 'Bulk GRN processed successfully (Simulation)', 'success');
                });
            },
            error: (error) => {
                Swal.fire('Error', 'Failed to parse CSV file', 'error');
            }
        });
        e.target.value = ''; 
    };
  
    const fetchEntries = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        // If Re-GRN is toggled, we might look for 'Rejected' or specific 'Re-GRN' status
        // otherwise default to 'Done' (Ready for GRN)
        params.append('status', reGrn ? 'Re-GRN' : 'Done'); 
        params.append('grnStatus', 'Pending');
        params.append('pageNumber', page);
        params.append('pageSize', pageSize);
        
        if (filters.supplier) params.append('supplier', filters.supplier);
        if (filters.receivingId) params.append('physicalReceivingId', filters.receivingId);
        if (filters.invoiceNumber) params.append('invoiceNumber', filters.invoiceNumber);
        
        const { data } = await api.get(`/physical-receiving?${params.toString()}`);
        
        if (data.success) {
          setEntries(data.data);
          setTotalPages(data.pages);
          setTotalRecords(data.total);
        }
      } catch (error) {
        console.error("Failed to fetch GRN waitlist", error);
        Swal.fire('Error', 'Failed to load waitlist', 'error');
      } finally {
        setLoading(false);
      }
    };
  
    useEffect(() => {
      fetchEntries();
    }, [page, pageSize, reGrn]); // Fetch on page/size change or filter toggle
  
    const handleSearch = () => {
        setPage(1); // Reset to page 1 on search
        fetchEntries();
    };
  
    const handleReset = () => {
        setFilters({ priority: '', receivingId: '', supplier: '', invoiceNumber: '' });
        setPhysicalReceivingIdInput('');
        setPage(1);
        fetchEntries();
    };
  
    const handleCreateGRN = (entry) => {
      navigate('/inventory/stock-in', { 
        state: { 
          prefill: {
            physicalId: entry.physicalReceivingId,
            entryData: entry
          } 
        } 
      });
    };
  
    const handleSubmitPhysicalId = async () => {
        if (!physicalReceivingIdInput) {
            Swal.fire('Warning', 'Please enter a Physical Receiving ID', 'warning');
            return;
        }
  
        try {
            // Try to find specifically this ID
            const { data } = await api.get(`/physical-receiving/${physicalReceivingIdInput}`);
            if (data.success) {
                const entry = data.data;
                if (entry.status !== 'Done') {
                     Swal.fire('Not Validated', 'This entry has not been physically validated yet.', 'warning');
                     return;
                }
                if (entry.grnStatus === 'Done') {
                     Swal.fire('Already Processed', 'GRN for this entry is already done.', 'info');
                     return;
                }
                handleCreateGRN(entry);
            }
        } catch (error) {
            Swal.fire('Not Found', 'Invalid Physical Receiving ID', 'error');
        }
    };
  
    return (
      <div className="animate-fade-in-up max-w-[1600px] mx-auto space-y-8 pb-10">
        
        <div>
             <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">
               GRN Waitlist -
             </h1>
        </div>
  
        {/* Main Action Bar */}
        <div className="bg-gray-100/50 dark:bg-gray-800/50 p-6 rounded-3xl border-b-4 border-gray-200 dark:border-gray-700">
             <div className="flex flex-col xl:flex-row items-center justify-center gap-6">
                 
                 {/* Auto GRN Toggle */}
                 <div className="flex items-center gap-3 self-center xl:self-auto">
                     <span className="font-bold text-gray-600 dark:text-gray-300 text-sm uppercase">Auto GRN:</span>
                     <button onClick={handleAutoGrnToggle} className={`transition-transform active:scale-95 ${autoGrn ? 'text-emerald-500' : 'text-gray-400'}`}>
                         {autoGrn ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                     </button>
                 </div>
  
                 {/* ID Input */}
                 <input 
                    type="text" 
                    value={physicalReceivingIdInput}
                    onChange={(e) => setPhysicalReceivingIdInput(e.target.value)}
                    placeholder="Physical Receiving ID" 
                    className="w-full xl:flex-1 p-3 border-2 border-blue-100 dark:border-gray-600 rounded-xl outline-none focus:border-cyan-400 font-bold text-gray-700 dark:text-white transition-colors shadow-sm"
                 />
  
                 {/* Actions */}
                 <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                     <button 
                          onClick={handleSubmitPhysicalId}
                          className="flex-1 xl:flex-none px-8 py-3 bg-cyan-500 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 transition-all active:scale-95 text-center"
                     >
                         Submit
                     </button>
                     <button 
                          onClick={handleReset}
                          className="flex-1 xl:flex-none px-8 py-3 bg-amber-400 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-amber-300 hover:shadow-lg hover:shadow-amber-500/30 transition-all active:scale-95 text-center"
                     >
                         Reset
                     </button>
                     <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileUpload} 
                        className="hidden" 
                        accept=".csv" 
                     />
                     <button 
                          onClick={handleBulkUploadClick}
                          className="flex-1 xl:flex-none px-8 py-3 bg-cyan-500 text-white font-black uppercase tracking-wider text-sm rounded-xl hover:bg-cyan-400 hover:shadow-lg hover:shadow-cyan-500/30 transition-all active:scale-95 flex items-center justify-center gap-2 text-center whitespace-nowrap"
                     >
                         Upload Bulk GRN <Upload size={18} />
                     </button>
                 </div>
  
             </div>
        </div>
  
        {/* Filter Bar */}
        <div className="flex flex-col xl:flex-row items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2 pr-4 border-r border-gray-100 dark:border-gray-700">
                <span className="font-bold text-gray-500 dark:text-gray-400 text-xs uppercase whitespace-nowrap">Filter results:</span>
                <div className="flex items-center gap-1">
                     <span className="font-bold text-gray-700 dark:text-gray-300 text-xs uppercase">Re-GRN:</span>
                     <button onClick={() => setReGrn(!reGrn)} className="text-sky-500">
                         {reGrn ? <ToggleRight size={24} /> : <ToggleLeft size={24} className="text-gray-400" />}
                     </button>
                 </div>
            </div>
            
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 w-full">
                <input 
                    placeholder="Priority" 
                    value={filters.priority}
                    onChange={(e) => setFilters({...filters, priority: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-xs font-medium"
                />
                <input 
                    placeholder="Receiving ID" 
                    value={filters.receivingId}
                    onChange={(e) => setFilters({...filters, receivingId: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-xs font-medium"
                />
                 <input 
                    placeholder="Supplier Name" 
                    value={filters.supplier}
                    onChange={(e) => setFilters({...filters, supplier: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-xs font-medium"
                />
                 <input 
                    placeholder="Invoice Number" 
                    value={filters.invoiceNumber}
                    onChange={(e) => setFilters({...filters, invoiceNumber: e.target.value})}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none text-xs font-medium"
                />
            </div>
  
            <button 
              onClick={handleSearch}
              className="px-8 py-2 bg-cyan-500 text-white font-bold uppercase text-xs rounded-lg hover:bg-cyan-400 transition-colors whitespace-nowrap w-full xl:w-auto"
            >
                Search
            </button>
        </div>
        
        {/* Pagination Info */}
        <div className="flex justify-between items-center text-xs text-gray-500 font-bold px-2">
            <span>Showing {(page - 1) * pageSize + 1} - {Math.min(page * pageSize, totalRecords)} of {totalRecords} records</span>
            <select 
                value={pageSize} 
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="border p-1 rounded bg-transparent"
            >
                <option value={10}>10 per page</option>
                <option value={20}>20 per page</option>
                <option value={50}>50 per page</option>
            </select>
        </div>
  
        {/* Table - Reused from previous implementation but adjusted styling if needed */}
         <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
           <div className="overflow-x-auto">
               <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold">
                      <tr>
                          <th className="px-6 py-4">Waitlist ID</th>
                          <th className="px-6 py-4">Creation Info</th>
                          <th className="px-6 py-4">Invoice Details</th>
                          <th className="px-6 py-4">Validation</th>
                          <th className="px-6 py-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {loading ? (
                         <tr><td colSpan="5" className="text-center py-10">Loading waitlist...</td></tr>
                      ) : entries.length === 0 ? (
                         <tr><td colSpan="5" className="text-center py-10 text-gray-400">
                             <div className="flex flex-col items-center gap-2">
                                 <CheckCircle size={32} className="text-green-500 opacity-50"/> 
                                 <span>All valid entries have been processed!</span>
                             </div>
                         </td></tr>
                      ) : (
                         entries.map(entry => (
                             <tr key={entry._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                 <td className="px-6 py-4">
                                     <div className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                         <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                                         {entry.physicalReceivingId}
                                     </div>
                                     <div className="text-xs text-gray-400 mt-1">{entry.systemId}</div>
                                     {entry.poIds && <div className="text-[10px] text-gray-400 mt-0.5">PO: {entry.poIds}</div>}
                                 </td>
                                 <td className="px-6 py-4">
                                      <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                                          <Calendar size={14} /> {new Date(entry.createdAt).toLocaleDateString()}
                                      </div>
                                      <div className="flex items-center gap-1.5 text-gray-400 text-xs mt-1">
                                          <Clock size={12} /> {new Date(entry.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                      </div>
                                 </td>
                                 <td className="px-6 py-4">
                                     <div className="font-bold text-gray-800 dark:text-white">{entry.supplierName}</div>
                                     <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                                         <span className="bg-gray-100 dark:bg-gray-700 px-1.5 rounded text-[10px] font-mono">INV: {entry.invoiceNumber}</span>
                                         <span>₹{entry.invoiceValue}</span>
                                     </div>
                                 </td>
                                 <td className="px-6 py-4">
                                     <div className="text-xs font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded inline-block">
                                         Validated by {entry.validatedBy}
                                     </div>
                                     <div className="text-[10px] text-gray-400 mt-1">
                                         {entry.validationDate ? new Date(entry.validationDate).toLocaleDateString() : '-'}
                                     </div>
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                     <button 
                                          onClick={() => handleCreateGRN(entry)}
                                          className="group inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-bold text-xs hover:shadow-lg hover:shadow-cyan-500/20 transition-all transform hover:-translate-y-0.5"
                                     >
                                         Create GRN <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                     </button>
                                 </td>
                             </tr>
                         ))
                      )}
                  </tbody>
               </table>
           </div>
           
           {/* Pagination Footer */}
           {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
                <button 
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    Previous
                </button>
                <div className="flex gap-1">
                    {[...Array(totalPages)].map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setPage(i + 1)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-bold transition-all ${
                                page === i + 1 
                                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/30' 
                                : 'bg-white text-gray-600 border hover:bg-gray-50'
                            }`}
                        >
                            {i + 1}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                    Next
                </button>
            </div>
           )}
         </div>
  
      </div>
    );
  };

export default GRNWaitlist;
