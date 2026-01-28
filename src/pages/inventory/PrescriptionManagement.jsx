import React, { useState, useMemo } from 'react';
import { Search, Filter, Eye, CheckCircle, XCircle, Clock, Upload, FileText, ChevronRight, Calendar, ArrowLeft, Printer, ZoomIn, User, MapPin, Phone, ChevronLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const PrescriptionManagement = () => {
  const [activeTab, setActiveTab] = useState('pending'); // pending, verified, rejected
  const [selectedRx, setSelectedRx] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Search & Pagination State
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Mock Data
  const [prescriptions, setPrescriptions] = useState([
    { id: 101, patient: 'Rahul Kumar', age: 45, gender: 'Male', phone: '+91 98765 43210', address: 'Sector 45, Gurgaon', doctor: 'Dr. Sharma', date: '2024-01-25', status: 'Pending', items: 3, urgency: 'High', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop' },
    { id: 102, patient: 'Amit Verma', age: 32, gender: 'Male', phone: '+91 99887 76655', address: 'Indiranagar, Bangalore', doctor: 'Dr. Gupta', date: '2024-01-26', status: 'Pending', items: 2, urgency: 'Normal', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=800&auto=format&fit=crop' },
    { id: 103, patient: 'Sneha Singh', age: 28, gender: 'Female', phone: '+91 88776 65544', address: 'Koramangala, Bangalore', doctor: 'Dr. Mehra', date: '2024-01-24', status: 'Verified', items: 5, urgency: 'Normal', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=800&auto=format&fit=crop' },
    { id: 104, patient: 'Vikram Das', age: 60, gender: 'Male', phone: '+91 77665 54433', address: 'Salt Lake, Kolkata', doctor: 'Dr. Roy', date: '2024-01-23', status: 'Rejected', items: 1, urgency: 'Normal', reason: 'Unclear Image', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop' },
    { id: 105, patient: 'Priya Sharma', age: 35, gender: 'Female', phone: '+91 66554 43322', address: 'Andheri West, Mumbai', doctor: 'Dr. Desai', date: '2024-01-22', status: 'Pending', items: 4, urgency: 'High', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=800&auto=format&fit=crop' },
    { id: 106, patient: 'Arjun Reddy', age: 29, gender: 'Male', phone: '+91 55443 32211', address: 'Jubilee Hills, Hyderabad', doctor: 'Dr. Rao', date: '2024-01-21', status: 'Verified', items: 2, urgency: 'Normal', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=800&auto=format&fit=crop' },
    { id: 107, patient: 'Meera Iyer', age: 52, gender: 'Female', phone: '+91 44332 21100', address: 'Adyar, Chennai', doctor: 'Dr. Lakshmi', date: '2024-01-20', status: 'Pending', items: 6, urgency: 'High', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop' },
    { id: 108, patient: 'Rohan Mehta', age: 41, gender: 'Male', phone: '+91 33221 10099', address: 'Vastrapur, Ahmedabad', doctor: 'Dr. Patel', date: '2024-01-19', status: 'Verified', items: 3, urgency: 'Normal', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=800&auto=format&fit=crop' },
    { id: 109, patient: 'Kavita Gill', age: 26, gender: 'Female', phone: '+91 22110 09988', address: 'Model Town, Ludhiana', doctor: 'Dr. Singh', date: '2024-01-18', status: 'Rejected', items: 2, urgency: 'Normal', reason: 'Incomplete Rx', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=800&auto=format&fit=crop' },
    { id: 110, patient: 'Suresh Raina', age: 55, gender: 'Male', phone: '+91 11009 98877', address: 'Civil Lines, Kanpur', doctor: 'Dr. Tiwari', date: '2024-01-17', status: 'Pending', items: 4, urgency: 'Normal', image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=800&auto=format&fit=crop' },
    { id: 111, patient: 'Anjali Devi', age: 65, gender: 'Female', phone: '+91 99008 87766', address: 'Boring Road, Patna', doctor: 'Dr. Mishra', date: '2024-01-16', status: 'Verified', items: 7, urgency: 'High', image: 'https://images.unsplash.com/photo-1631549916768-4119b2e5f926?q=80&w=800&auto=format&fit=crop' },
    { id: 112, patient: 'Vijay Kumar', age: 38, gender: 'Male', phone: '+91 88990 07766', address: 'Rajendra Nagar, Raipur', doctor: 'Dr. Sahu', date: '2024-01-15', status: 'Pending', items: 2, urgency: 'Normal', image: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?q=80&w=800&auto=format&fit=crop' },
  ]);

  const [uploadData, setUploadData] = useState({
      patient: '',
      age: '',
      doctor: '',
      notes: '',
      image: null
  });

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

  // Handlers
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to page 1 on search
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1); // Reset to page 1 on tab change
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

  const handleVerify = (id) => {
      Swal.fire({
          title: 'Approve Prescription?',
          text: 'This will mark the prescription as verified and ready for dispensing.',
          icon: 'question',
          showCancelButton: true,
          confirmButtonText: 'Yes, Approve',
          confirmButtonColor: '#007242'
      }).then((result) => {
          if (result.isConfirmed) {
              setPrescriptions(prev => prev.map(item => item.id === id ? { ...item, status: 'Verified' } : item));
              if (selectedRx && selectedRx.id === id) {
                 setSelectedRx(prev => ({...prev, status: 'Verified'}));
              }
              Swal.fire('Approved!', 'Prescription has been verified.', 'success');
          }
      });
  };

  const handleReject = (id) => {
      Swal.fire({
          title: 'Reject Prescription',
          input: 'text',
          inputLabel: 'Reason for rejection',
          inputPlaceholder: 'e.g. Unclear image, Date expired...',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          confirmButtonText: 'Reject'
      }).then((result) => {
          if (result.isConfirmed && result.value) {
              setPrescriptions(prev => prev.map(item => item.id === id ? { ...item, status: 'Rejected', reason: result.value } : item));
              if (selectedRx && selectedRx.id === id) {
                 setSelectedRx(prev => ({...prev, status: 'Rejected', reason: result.value}));
              }
              Swal.fire('Rejected', 'Prescription marked as rejected.', 'error');
          }
      });
  };

  const handleFileChange = (e) => {
      const file = e.target.files[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setUploadData(prev => ({ ...prev, image: reader.result }));
          };
          reader.readAsDataURL(file);
      }
  };

  const handleUploadSubmit = (e) => {
      e.preventDefault();
      if (!uploadData.patient || !uploadData.image) {
          Swal.fire('Error', 'Patient Name and Prescription Image are required', 'error');
          return;
      }

      const newRx = {
          id: Date.now(),
          patient: uploadData.patient,
          age: uploadData.age || 'N/A',
          gender: 'Unknown',
          phone: 'N/A',
          address: 'N/A',
          doctor: uploadData.doctor || 'Self / Unknown',
          date: new Date().toISOString().split('T')[0],
          status: 'Pending',
          items: 0,
          urgency: 'Normal',
          image: uploadData.image
      };

      setPrescriptions([newRx, ...prescriptions]);
      setShowUploadModal(false);
      setUploadData({ patient: '', age: '', doctor: '', notes: '', image: null });
      Swal.fire({
          icon: 'success',
          title: 'Uploaded!',
          text: 'Prescription has been queued for verification.',
          confirmButtonColor: '#007242'
      });
  };

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
                                      <p className="text-2xl font-bold text-gray-800 dark:text-white mt-1">2 Days</p>
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
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Prescription Verification</h1>
           <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Review and approve customer prescriptions before dispensing.</p>
        </div>
        <button 
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-secondary shadow-md active:scale-95 transition-all flex items-center gap-2"
        >
            <Upload size={18} /> Upload New Rx
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
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex flex-col sm:flex-row justify-between items-center px-6 py-4">
               {/* Tabs */}
              <div className="flex bg-gray-100/80 dark:bg-gray-900/50 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
                  {['pending', 'verified', 'rejected'].map(tab => (
                      <button 
                        key={tab}
                        onClick={() => handleTabChange(tab)}
                        className={`px-5 py-2 rounded-lg text-sm font-bold capitalize transition-all ${activeTab === tab ? 'bg-white dark:bg-gray-600 text-gray-800 dark:text-white shadow-sm ring-1 ring-black/5 dark:ring-white/10' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                      >
                          {tab}
                      </button>
                  ))}
              </div>
              
              {/* Search */}
              <div className="relative w-full sm:w-72 mt-3 sm:mt-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                  <input 
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Search Patient, Doctor or ID..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
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
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                {/* Items Info */}
                <div className="flex items-center gap-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Showing <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.startIndex}</span> to{' '}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.endIndex}</span> of{' '}
                    <span className="font-bold text-gray-800 dark:text-gray-200">{paginationInfo.totalItems}</span> items
                  </p>
                  
                  {/* Items per page selector */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm text-gray-600 dark:text-gray-400">Show:</label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(e.target.value)}
                      className="px-3 py-1.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
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
                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Previous Page"
                    >
                      <ChevronLeft size={18} />
                    </button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {/* First Page */}
                      {currentPage > 2 && (
                        <>
                          <button
                            onClick={() => goToPage(1)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          >
                            1
                          </button>
                          {currentPage > 3 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                        </>
                      )}

                      {/* Previous Page */}
                      {currentPage > 1 && (
                        <button
                          onClick={() => goToPage(currentPage - 1)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                          {currentPage - 1}
                        </button>
                      )}

                      {/* Current Page */}
                      <button
                        className="px-3 py-1.5 rounded-lg text-sm font-bold bg-primary text-white shadow-sm"
                      >
                        {currentPage}
                      </button>

                      {/* Next Page */}
                      {currentPage < totalPages && (
                        <button
                          onClick={() => goToPage(currentPage + 1)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                        >
                          {currentPage + 1}
                        </button>
                      )}

                      {/* Last Page */}
                      {currentPage < totalPages - 1 && (
                        <>
                          {currentPage < totalPages - 2 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => goToPage(totalPages)}
                            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                      title="Next Page"
                    >
                      <ChevronRight size={18} />
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
                    <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Age</label>
                    <input 
                        type="number" 
                        placeholder="Yrs"
                        value={uploadData.age}
                        onChange={(e) => setUploadData({ ...uploadData, age: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                    />
                  </div>
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
