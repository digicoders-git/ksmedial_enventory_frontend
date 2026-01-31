import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Upload, FileText, ChevronRight, Calendar, ArrowLeft, Printer, ZoomIn, User, MapPin, Phone, ChevronLeft } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const PrescriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, verified, rejected
  const [selectedRx, setSelectedRx] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // State
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Prescriptions
  const fetchPrescriptions = async () => {
      try {
          const { data } = await api.get('/prescriptions');
          if (data.success) {
              const mapped = data.prescriptions.map(p => ({
                  ...p,
                  id: p._id,
                  // Ensure date is formatted if string or date obj
                  date: p.date ? new Date(p.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
              }));
              setPrescriptions(mapped);
          }
      } catch (error) {
          console.error("Error fetching prescriptions:", error);
          Swal.fire('Error', 'Failed to load prescriptions', 'error');
      } finally {
          setLoading(false);
      }
  };

  React.useEffect(() => {
      fetchPrescriptions();
  }, []);

  const [uploadData, setUploadData] = useState({
      patient: '',
      age: '',
      gender: 'Male',
      phone: '',
      address: '',
      doctor: '',
      notes: '',
      urgency: 'Normal',
      image: null
  });

  const calculateRxAge = (dateString) => {
      const today = new Date();
      const rxDate = new Date(dateString);
      const diffTime = Math.abs(today - rxDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
      return `${diffDays} Day${diffDays !== 1 ? 's' : ''}`;
  };

  // Filter & Pagination Logic
  const { filteredPrescriptions, totalPages, paginationInfo } = useMemo(() => {
    // Step 1: Filter by Tab & Search
    let filtered = prescriptions.filter(item => item.status.toLowerCase() === activeTab);
    
    // Step 2: Search Filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item => 
        item.patient.toLowerCase().includes(searchLower) ||
        item.doctor.toLowerCase().includes(searchLower) ||
        item.id.toString().includes(searchLower)
      );
    }

    // Step 3: Pagination
    const totalItems = filtered.length;
    const totalPgs = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = filtered.slice(startIndex, endIndex);

    return {
      filteredPrescriptions: paginatedItems,
      totalPages: totalPgs,
      paginationInfo: {
        totalItems,
        startIndex: startIndex + 1,
        endIndex: Math.min(endIndex, totalItems),
        currentPage
      }
    };
  }, [prescriptions, activeTab, searchTerm, currentPage, itemsPerPage]);

  function handleSearchChange(value) {
    setSearchTerm(value);
    setCurrentPage(1);
  }

  function handleTabChange(tab) {
    setActiveTab(tab);
    setCurrentPage(1);
  }

  function handleItemsPerPageChange(value) {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  }

  function goToPage(page) {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }

  async function handleVerify(id) {
    Swal.fire({
      title: 'Approve Prescription?',
      text: 'This will mark the prescription as verified and ready for dispensing.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      confirmButtonColor: '#007242'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const { data } = await api.put(`/prescriptions/${id}/status`, { status: 'Verified' });
          if (data.success) {
            setPrescriptions(prev => prev.map(item => item.id === id ? { ...item, status: 'Verified' } : item));
            if (selectedRx && selectedRx.id === id) {
              setSelectedRx(prev => ({ ...prev, status: 'Verified' }));
            }
            Swal.fire('Approved!', 'Prescription has been verified.', 'success');
          }
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Verification failed', 'error');
        }
      }
    });
  }

  async function handleReject(id) {
    Swal.fire({
      title: 'Reject Prescription',
      input: 'text',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'e.g. Unclear image, Date expired...',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Reject'
    }).then(async (result) => {
      if (result.isConfirmed && result.value) {
        try {
          const { data } = await api.put(`/prescriptions/${id}/status`, { status: 'Rejected', reason: result.value });
          if (data.success) {
            setPrescriptions(prev => prev.map(item => item.id === id ? { ...item, status: 'Rejected', reason: result.value } : item));
            if (selectedRx && selectedRx.id === id) {
              setSelectedRx(prev => ({ ...prev, status: 'Rejected', reason: result.value }));
            }
            Swal.fire('Rejected', 'Prescription marked as rejected.', 'error');
          }
        } catch (err) {
          console.error(err);
          Swal.fire('Error', 'Rejection failed', 'error');
        }
      }
    });
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  }

  async function handleUploadSubmit(e) {
    e.preventDefault();
    if (!uploadData.patient || !uploadData.image) {
      Swal.fire('Error', 'Patient Name and Prescription Image are required', 'error');
      return;
    }

    try {
      const payload = {
        patient: uploadData.patient,
        age: uploadData.age || 0,
        gender: uploadData.gender,
        phone: uploadData.phone,
        address: uploadData.address,
        doctor: uploadData.doctor,
        urgency: uploadData.urgency,
        image: uploadData.image,
        notes: uploadData.notes
      };

      const { data } = await api.post('/prescriptions', payload);

      if (data.success) {
        const newRx = {
          ...data.prescription,
          id: data.prescription._id,
          date: new Date(data.prescription.date).toISOString().split('T')[0]
        };
        setPrescriptions([newRx, ...prescriptions]);
        setShowUploadModal(false);
        setUploadData({ patient: '', age: '', gender: 'Male', phone: '', address: '', doctor: '', notes: '', urgency: 'Normal', image: null });
        Swal.fire({
          icon: 'success',
          title: 'Uploaded!',
          text: 'Prescription has been queued for verification.',
          confirmButtonColor: '#007242'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire('Error', err.response?.data?.message || 'Upload failed', 'error');
    }
  }

  // --- DETAIL PAGE VIEW ---
  if (selectedRx) {
    return (
        <div className="animate-fade-in-up pb-10">
            {/* Top Navigation Bar */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky top-0 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-md z-20 py-2">
                <button 
                    onClick={() => setSelectedRx(null)}
                    className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 transition-colors font-bold px-4 py-2 rounded-lg hover:bg-white dark:hover:bg-gray-800 hover:shadow-sm"
                >
                    <ArrowLeft size={20} /> Back to List
                </button>
                
                <div className="flex items-center gap-3">
                     <span className={`px-4 py-1.5 rounded-full text-sm font-bold uppercase tracking-wide border flex items-center gap-2
                        ${selectedRx.status === 'Pending' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-900/30' :
                          selectedRx.status === 'Verified' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30' : 
                          'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-900/30'}`}>
                        {selectedRx.status === 'Pending' ? <Clock size={16} /> : 
                         selectedRx.status === 'Verified' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                        {selectedRx.status}
                    </span>
                    <button className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm hover:shadow-md transition-all">
                        <Printer size={18} />
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
                
                {/* Left Column: Image Viewer (7 Cols) */}
                <div className="lg:col-span-7 bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col group border border-gray-800">
                     <div className="absolute top-4 left-4 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold border border-white/10">
                         Original Scan
                     </div>
                     <div className="flex-1 flex items-center justify-center p-4 overflow-hidden relative">
                         <img 
                            src={selectedRx.image} 
                            alt="Prescription Scan" 
                            className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
                         />
                     </div>
                     <div className="bg-gray-800 p-4 flex justify-between items-center border-t border-gray-700">
                         <div className="text-gray-400 text-xs">
                             Uploaded on <span className="text-gray-300 font-bold">{selectedRx.date}</span>
                         </div>
                         <button className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg text-sm font-bold transition-all">
                             <ZoomIn size={16} /> Full Screen
                         </button>
                     </div>
                </div>

                {/* Right Column: Details & Actions (5 Cols) */}
                <div className="lg:col-span-5 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar">
                    
                    {/* Patient Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700">
                        <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <User size={16} /> Patient Information
                        </h3>
                        
                        <div className="flex items-start gap-4 mb-6">
                            <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-2xl font-bold border-4 border-blue-100 dark:border-blue-900/30">
                                {selectedRx.patient.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedRx.patient}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{selectedRx.age} Years • {selectedRx.gender}</p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 text-sm">
                                <Phone size={16} className="text-gray-400 dark:text-gray-500" />
                                <span className="font-bold text-gray-700 dark:text-gray-300">{selectedRx.phone}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">{selectedRx.address}</span>
                            </div>
                             <div className="flex items-center gap-3 text-sm">
                                <User size={16} className="text-gray-400 dark:text-gray-500" />
                                <span className="text-gray-600 dark:text-gray-400">Ref By: <span className="font-bold text-purple-600 dark:text-purple-400">{selectedRx.doctor}</span></span>
                            </div>
                        </div>
                    </div>

                    {/* Rx Details Card */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 flex-1">
                         <h3 className="text-sm font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <FileText size={16} /> Verification Details
                        </h3>

                        {selectedRx.status === 'Rejected' && selectedRx.reason && (
                             <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 mb-4">
                               <p className="text-xs font-bold text-red-500 dark:text-red-400 uppercase mb-1">Reason for Rejection</p>
                               <p className="text-red-700 dark:text-red-300 font-bold text-sm">{selectedRx.reason}</p>
                             </div>
                        )}

                        <div className="space-y-4">
                             <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600">
                                 <div className="flex justify-between items-center mb-2">
                                     <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Prescription Urgency</span>
                                     <span className={`px-2 py-1 rounded text-xs font-bold ${selectedRx.urgency === 'High' ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                         {selectedRx.urgency} Priority
                                     </span>
                                 </div>
                                 <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                                     <div className={`h-1.5 rounded-full ${selectedRx.urgency === 'High' ? 'bg-red-500' : 'bg-blue-500 w-[40%]'}`}></div>
                                 </div>
                             </div>

                             <div className="grid grid-cols-2 gap-4">
                                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Items Count</p>
                                      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{selectedRx.items}</p>
                                  </div>
                                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-100 dark:border-gray-600 text-center">
                                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold">Rx Age</p>
                                      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{calculateRxAge(selectedRx.date)}</p>
                                  </div>
                             </div>
                        </div>

                         <div className="mt-8 space-y-3">
                            {selectedRx.status === 'Pending' ? (
                                <>
                                    <button 
                                        onClick={() => handleVerify(selectedRx.id)}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-green-600 to-green-500 text-white font-bold shadow-lg shadow-green-500/30 hover:shadow-green-500/40 hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        <CheckCircle size={18} /> Approve & Verify
                                    </button>
                                    <button 
                                        onClick={() => handleReject(selectedRx.id)}
                                        className="w-full py-3.5 rounded-xl border-2 border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-sm flex items-center justify-center gap-2"
                                    >
                                        <XCircle size={18} /> Reject Prescription
                                    </button>
                                </>
                            ) : (
                                <div className={`text-center py-4 rounded-xl border-2 border-dashed ${selectedRx.status === 'Verified' ? 'border-green-200 dark:border-green-900/30 bg-green-50/50 dark:bg-green-900/20' : 'border-red-200 dark:border-red-900/30 bg-red-50/50 dark:bg-red-900/20'}`}>
                                    <p className={`font-bold ${selectedRx.status === 'Verified' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                        Processed: {selectedRx.status}
                                    </p>
                                </div>
                            )}
                         </div>
                    </div>
                </div>
            </div>
        </div>
    );
  }

  // --- LIST VIEW ---
  return (
    <>
    <div className="space-y-6 animate-fade-in-up pb-10">
      
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div className="flex items-center gap-4 w-full xl:w-auto">
           <div className="p-4 bg-primary/10 dark:bg-primary/20 rounded-2xl text-primary shadow-sm border border-primary/10">
              <FileText size={28} strokeWidth={2.5} />
           </div>
           <div>
              <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">Prescription Verification</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Review and approve data before dispensing.</p>
           </div>
        </div>
        <button 
            onClick={() => setShowUploadModal(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-black shadow-lg shadow-primary/20 hover:bg-secondary active:scale-95 transition-all text-[11px] uppercase tracking-widest"
        >
            <Upload size={18} strokeWidth={3} /> Upload New Rx
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Pending Stats */}
         <div 
            onClick={() => handleTabChange('pending')}
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group ${activeTab === 'pending' ? 'ring-2 ring-primary/20' : ''}`}
         >
            <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 group-hover:bg-orange-100 dark:group-hover:bg-orange-900/30 transition-colors">
                <Clock size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Pending Review</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{prescriptions.filter(i => i.status === 'Pending').length}</h3>
                <p className="text-xs text-orange-600 dark:text-orange-400 font-semibold mt-1">Awaiting Action</p>
            </div>
         </div>

         {/* Verified Stats */}
         <div 
            onClick={() => handleTabChange('verified')}
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group ${activeTab === 'verified' ? 'ring-2 ring-green-500/20' : ''}`}
         >
            <div className="p-3 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 group-hover:bg-green-100 dark:group-hover:bg-green-900/30 transition-colors">
                <CheckCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Verified Today</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{prescriptions.filter(i => i.status === 'Verified').length}</h3>
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold mt-1">Ready for Dispense</p>
            </div>
         </div>

         {/* Rejected Stats */}
         <div 
            onClick={() => handleTabChange('rejected')}
            className={`bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4 cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all group ${activeTab === 'rejected' ? 'ring-2 ring-red-500/20' : ''}`}
         >
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 transition-colors">
                <XCircle size={24} />
            </div>
            <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Rejected</p>
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{prescriptions.filter(i => i.status === 'Rejected').length}</h3>
                <p className="text-xs text-red-600 dark:text-red-400 font-semibold mt-1">Requires Review</p>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden flex flex-col min-h-[500px]">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex flex-col md:flex-row justify-between items-center gap-4 px-6 py-5">
               {/* Tabs */}
              <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700 w-full md:w-auto">
                  {['pending', 'verified', 'rejected'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`flex-1 md:flex-none px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-600 text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>
              
              {/* Search */}
              <div className="relative w-full md:w-80">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input 
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search Patient, Doctor or ID..." 
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 shadow-sm" 
                  />
              </div>
          </div>

          <div className="overflow-x-auto flex-1">
              <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50/50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase text-xs font-bold tracking-wider">
                      <tr>
                          <th className="px-6 py-4">ID</th>
                          <th className="px-6 py-4">Patient Details</th>
                          <th className="px-6 py-4">Doctor</th>
                          <th className="px-6 py-4">Date</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-center">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                      {filteredPrescriptions.length > 0 ? (
                          filteredPrescriptions.map(item => (
                              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                  <td className="px-6 py-4 font-mono font-medium text-gray-500 dark:text-gray-400">#{item.id}</td>
                                  <td className="px-6 py-4">
                                      <p className="font-bold text-gray-800 dark:text-white text-[15px]">{item.patient}</p>
                                      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">{item.age} Yrs • {item.gender}</p>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-bold">Dr</div>
                                        <span className="font-semibold text-gray-700 dark:text-gray-200">{item.doctor}</span>
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-gray-600 dark:text-gray-300">
                                     <div className="flex items-center gap-1.5 font-medium text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-fit">
                                        <Calendar size={12} /> {item.date}
                                     </div>
                                  </td>
                                  <td className="px-6 py-4">
                                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide inline-flex items-center gap-1.5
                                          ${item.status === 'Pending' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/30' :
                                            item.status === 'Verified' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30' : 
                                            'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30'}`}>
                                          <span className={`w-1.5 h-1.5 rounded-full ${
                                            item.status === 'Pending' ? 'bg-orange-500' :
                                            item.status === 'Verified' ? 'bg-green-500' : 
                                            'bg-red-500'
                                          }`}></span>
                                          {item.status}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <button 
                                        onClick={() => setSelectedRx(item)}
                                        className="py-2 px-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-600 dark:text-gray-300 hover:text-primary dark:hover:text-primary-400 hover:border-primary dark:hover:border-primary-400 hover:bg-primary/5 dark:hover:bg-primary/10 transition-all shadow-sm font-bold text-xs flex items-center gap-2 mx-auto" 
                                      >
                                          <Eye size={14} /> Review
                                      </button>
                                  </td>
                              </tr>
                          ))
                      ) : (
                            <tr>
                                <td colSpan="6" className="text-center py-24 text-gray-400 dark:text-gray-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                                            <FileText size={32} className="opacity-20" />
                                        </div>
                                        <p className="font-medium text-gray-500 dark:text-gray-400">No {activeTab} prescriptions found</p>
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try changing the filter or upload a new one.</p>
                                    </div>
                                </td>
                            </tr>
                      )}
                  </tbody>
              </table>
          </div>
          
          {/* Pagination Controls */}
          {paginationInfo.totalItems > 0 && (
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Items Info & Selector */}
                <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto justify-center lg:justify-start">
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium order-2 sm:order-1">
                    Showing <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                    <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                    <span className="font-black text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> items
                  </p>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm order-1 sm:order-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className="bg-transparent border-none text-sm font-black text-primary outline-none cursor-pointer focus:ring-0 p-0"
                    >
                      <option value="5">5</option>
                      <option value="10">10</option>
                      <option value="20">20</option>
                      <option value="50">50</option>
                    </select>
                  </div>
                </div>

                {/* Page Navigation */}
                {totalPages > 1 && (
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                      title="Previous Page"
                    >
                      <ChevronLeft size={18} strokeWidth={2.5} />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      {/* Sequential Page Logic for Premium Feel */}
                      {[...Array(totalPages)].map((_, idx) => {
                          const pg = idx + 1;
                          // Show first, last, current, and pages around current
                          if (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1)) {
                              return (
                                <button
                                  key={pg}
                                  onClick={() => goToPage(pg)}
                                  className={`min-w-[36px] sm:min-w-[40px] h-9 sm:h-10 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center shadow-sm active:scale-95
                                    ${currentPage === pg 
                                      ? 'bg-primary text-white shadow-primary/20 scale-105' 
                                      : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50 border border-gray-200 dark:border-gray-600'}`}
                                >
                                  {pg}
                                </button>
                              );
                          }
                          // Dots for gaps
                          if (pg === currentPage - 2 || pg === currentPage + 2) {
                              return <span key={pg} className="px-1 text-gray-400 font-black">...</span>;
                          }
                          return null;
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-90"
                      title="Next Page"
                    >
                      <ChevronRight size={18} strokeWidth={2.5} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
      </div>
    </div>

       {/* Upload Rx Modal - Fixed Positioning & Compact */}
       {showUploadModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowUploadModal(false)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl shadow-2xl relative z-10 animate-scale-up border border-white/20 dark:border-gray-700/50 flex flex-col max-h-[85vh] overflow-hidden">
            
            <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/80 dark:bg-gray-700/80 backdrop-blur-md">
              <div>
                <h3 className="font-bold text-gray-800 dark:text-white text-lg">Upload Prescription</h3>
                <p className="text-gray-500 dark:text-gray-400 text-xs">Add a new Rx for verification</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-1.5 rounded-full shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-600"
              >
                <XCircle size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
               
               {/* Image Upload Area */}
               <div className="w-full relative">
                  <label className={`flex flex-col items-center justify-center w-full h-36 border-2 border-dashed rounded-xl cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${uploadData.image ? 'border-primary bg-primary/5 dark:bg-primary/10' : 'border-gray-300 dark:border-gray-600'}`}>
                      {uploadData.image ? (
                          <div className="relative w-full h-full p-2">
                              <img src={uploadData.image} alt="Preview" className="w-full h-full object-contain rounded-lg" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors rounded-lg">
                                  <p className="text-white text-xs font-bold drop-shadow-md bg-black/50 px-2 py-1 rounded">Change Image</p>
                              </div>
                          </div>
                      ) : (
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-gray-400 dark:text-gray-500" />
                              <p className="mb-1 text-xs text-gray-500 dark:text-gray-400"><span className="font-bold text-gray-700 dark:text-gray-300">Click to upload</span></p>
                              <p className="text-[10px] text-gray-400 dark:text-gray-500">JPG, PNG or GIF</p>
                          </div>
                      )}
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                  </label>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Patient Name <span className="text-red-500">*</span></label>
                    <input 
                        type="text" 
                        placeholder="e.g. Rahul Sharma"
                        value={uploadData.patient}
                        onChange={(e) => setUploadData({ ...uploadData, patient: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm font-semibold text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
                   <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Age & Gender</label>
                    <div className="flex gap-2">
                        <input 
                            type="number" 
                            placeholder="Yrs"
                            value={uploadData.age}
                            onChange={(e) => setUploadData({ ...uploadData, age: e.target.value })}
                            className="w-20 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white"
                        />
                         <select 
                            value={uploadData.gender}
                            onChange={(e) => setUploadData({ ...uploadData, gender: e.target.value })}
                            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white cursor-pointer"
                        >
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                  </div>
               </div>

                <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Phone Number</label>
                        <input 
                            type="tel" 
                            placeholder="e.g. 9876543210"
                            value={uploadData.phone}
                            onChange={(e) => setUploadData({ ...uploadData, phone: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white"
                        />
                   </div>
                   <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Urgency</label>
                        <select 
                            value={uploadData.urgency}
                            onChange={(e) => setUploadData({ ...uploadData, urgency: e.target.value })}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white cursor-pointer"
                        >
                            <option value="Normal">Normal Priority</option>
                            <option value="High">High Priority</option>
                        </select>
                   </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Address</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Sector-45, Gurgaon"
                        value={uploadData.address}
                        onChange={(e) => setUploadData({ ...uploadData, address: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white"
                    />
                </div>

               <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Doctor Name</label>
                    <input 
                        type="text" 
                        placeholder="e.g. Dr. A. Gupta"
                        value={uploadData.doctor}
                        onChange={(e) => setUploadData({ ...uploadData, doctor: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
               </div>

               <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Remarks</label>
                    <textarea 
                        rows="2"
                        placeholder="Notes..."
                        value={uploadData.notes}
                        onChange={(e) => setUploadData({ ...uploadData, notes: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm resize-none text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    ></textarea>
               </div>

            </form>

            <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/50 dark:bg-gray-700/50">
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-xs uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUploadSubmit}
                  disabled={!uploadData.patient || !uploadData.image}
                  className="px-5 py-2 rounded-lg bg-primary text-white font-bold hover:bg-secondary shadow-md active:scale-95 transition-all text-xs uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Upload
                </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default PrescriptionManagement;
