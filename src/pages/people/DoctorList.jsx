import React, { useState, useEffect, useCallback } from 'react';
import { Search, Stethoscope, Phone, MapPin, Plus, FileText, Activity, User, Star, Award, Building2, Printer, Eye, Edit2, Trash2, X, Mail, CheckCircle, GraduationCap, LayoutGrid, List, ChevronLeft, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const DoctorList = () => {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSpeciality, setFilterSpeciality] = useState('All');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

    // State
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDoctors, setTotalDoctors] = useState(0);

    const fetchDoctors = useCallback(async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/doctors', {
                params: {
                    keyword: searchTerm,
                    pageNumber: page,
                    pageSize: 12
                }
            });
            if (data.success) {
                setDoctors(data.doctors);
                setPage(data.page);
                setTotalPages(data.pages);
                setTotalDoctors(data.total);
            }
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoading(false);
        }
    }, [page, searchTerm]);

    useEffect(() => {
        fetchDoctors();
    }, [fetchDoctors]);

    const specialities = ['All', ...new Set(doctors.map(d => d.specialization))];

    const filteredDoctors = doctors.filter(doctor => {
        if (filterSpeciality === 'All') return true;
        return doctor.specialization === filterSpeciality;
    });

    const topPrescriber = doctors.length > 0 ? doctors.reduce((prev, current) => ((prev.totalPrescriptions || 0) > (current.totalPrescriptions || 0)) ? prev : current, doctors[0]) : null;

    // --- Actions ---

    const handleAdd = () => {
        navigate('/people/doctors/add');
    };

    const handleEdit = (doctor) => {
        navigate(`/people/doctors/edit/${doctor._id}`);
    };

    const handleView = (doctor) => {
         navigate(`/people/doctors/view/${doctor._id}`);
    };

    const handleNewRx = (doctor) => {
        navigate('/sales/pos', { state: { doctor: { _id: doctor._id, name: doctor.name } } });
    };

    const handleDelete = (id) => {
        Swal.fire({
            title: 'Are you sure?',
            text: "You won't be able to revert this!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete it!'
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await api.delete(`/doctors/${id}`);
                    fetchDoctors(); // Refresh list
                    Swal.fire('Deleted!', 'Doctor has been deleted.', 'success');
                } catch (err) {
                    Swal.fire('Error', 'Failed to delete doctor', 'error');
                }
            }
        });
    };

    const handlePrint = (doctor) => {
        const printWindow = window.open('', '', 'height=600,width=800');
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Doctor Profile - ${doctor.name}</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #1f2937; background: white; }
                .container { max-width: 800px; margin: 0 auto; border: 2px solid #e5e7eb; }
                .header { background: linear-gradient(135deg, #2563EB 0%, #1E40AF 100%); padding: 30px; color: white; display: flex; justify-content: space-between; align-items: center; }
                .logo-text { font-size: 24px; font-weight: bold; }
                .sub-text { font-size: 14px; opacity: 0.9; }
                .profile-header { padding: 30px; background: #Eff6FF; display: flex; align-items: center; gap: 20px; border-bottom: 2px solid #DBEAFE; }
                .avatar { width: 80px; height: 80px; background: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 30px; font-weight: bold; color: #2563EB; border: 4px solid #BFDBFE; }
                .doc-name { font-size: 28px; font-weight: bold; color: #1e3a8a; }
                .doc-spec { color: #60A5FA; font-weight: bold; font-size: 14px; text-transform: uppercase; background: white; padding: 4px 12px; border-radius: 4px; display: inline-block; margin-top: 5px; }
                .content { padding: 30px; }
                .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                .item { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
                .label { font-size: 11px; color: #6b7280; font-weight: bold; text-transform: uppercase; margin-bottom: 5px; }
                .value { font-size: 16px; color: #1f2937; font-weight: 500; }
                .stats-section { margin-top: 30px; background: #1f2937; color: white; padding: 20px; border-radius: 8px; display: flex; justify-content: space-around; text-align: center; }
                .stat-num { font-size: 24px; font-weight: bold; color: #60A5FA; }
                .stat-lbl { font-size: 12px; opacity: 0.8; text-transform: uppercase; }
                .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
                @media print { body { padding: 0; } .container { border: none; } }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div>
                    <div class="logo-text">KS4 PharmaNet</div>
                    <div class="sub-text">Doctor Profile Report</div>
                  </div>
                  <div style="text-align: right;">
                    <div style="font-weight: bold;">${new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })}</div>
                    <div style="font-size: 12px; opacity: 0.8;">Generated Report</div>
                  </div>
                </div>
                
                <div class="profile-header">
                  <div class="avatar">Dr</div>
                  <div>
                    <div class="doc-name">${doctor.name}</div>
                    <div class="doc-spec">${doctor.specialization}</div>
                  </div>
                </div>

                <div class="content">
                  <div class="grid">
                    <div class="item">
                      <div class="label">Qualification</div>
                      <div class="value">${doctor.qualification}</div>
                    </div>
                    <div class="item">
                      <div class="label">Hospital / Clinic</div>
                      <div class="value">${doctor.hospital}</div>
                    </div>
                    <div class="item">
                      <div class="label">Contact Number</div>
                      <div class="value">${doctor.phone || doctor.mobile}</div>
                    </div>
                    <div class="item">
                      <div class="label">Email Address</div>
                      <div class="value">${doctor.email || 'N/A'}</div>
                    </div>
                    <div class="item" style="grid-column: 1 / -1;">
                      <div class="label">Location</div>
                      <div class="value">${doctor.address || doctor.location || 'N/A'}</div>
                    </div>
                  </div>

                  <div class="stats-section">
                    <div>
                      <div class="stat-num">${doctor.totalPrescriptions || 0}</div>
                      <div class="stat-lbl">Total Prescriptions</div>
                    </div>
                    <div>
                      <div class="stat-num">${doctor.status}</div>
                      <div class="stat-lbl">Current Status</div>
                    </div>
                  </div>

                  <div class="footer">
                    <p>KS4 PharmaNet &copy; ${new Date().getFullYear()} &bull; Pharmacy Management System</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 250);
    };

    if (loading && doctors.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up space-y-6 max-w-7xl mx-auto pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Stethoscope className="text-primary" /> Doctor Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Manage doctor profiles and track prescription history.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleAdd}
                        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-secondary shadow-md active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Plus size={18} /> Add Doctor
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Doctors</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">{totalDoctors}</h3>
                         <div className="flex items-center gap-1 text-green-500 text-xs font-medium mt-1">
                            <Activity size={14} /> Active Network
                        </div>
                    </div>
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <User size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Total Prescriptions</p>
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mt-1">
                            {doctors.reduce((acc, curr) => acc + (curr.totalPrescriptions || 0), 0)}
                        </h3>
                         <div className="flex items-center gap-1 text-blue-500 text-xs font-medium mt-1">
                            <FileText size={14} /> Script Sales
                        </div>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl">
                        <FileText size={24} />
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:shadow-md transition-shadow">
                    <div>
                        <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">Top Prescriber</p>
                        <h3 className="text-xl font-bold text-gray-800 dark:text-white mt-1">{topPrescriber?.name || 'N/A'}</h3>
                         <div className="flex items-center gap-1 text-purple-500 text-xs font-medium mt-1">
                            <Star size={14} /> {topPrescriber?.totalPrescriptions || 0} Scripts
                        </div>
                    </div>
                    <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl">
                        <Award size={24} />
                    </div>
                </div>
            </div>

             {/* Filters & Search & View Toggle */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col xl:flex-row gap-4 justify-between items-center">
                <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
                    <div className="relative w-full sm:w-80">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
                       <input 
                         type="text" 
                         placeholder="Search by name, qualification, clinic, or contact..." 
                         value={searchTerm}
                         onChange={(e) => setSearchTerm(e.target.value)}
                         className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                       />
                    </div>
                    
                    {/* View Toggle Buttons */}
                    <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600 shrink-0 self-start sm:self-auto">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewMode('list')}
                            className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-800 dark:text-white' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center gap-2 overflow-x-auto w-full xl:w-auto no-scrollbar mask-linear-fade pr-4">
                    {specialities.length > 5 && (
                        specialities.map((spec) => (
                        <button
                            key={spec}
                            onClick={() => setFilterSpeciality(spec)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap active:scale-95 border
                                ${filterSpeciality === spec 
                                    ? 'bg-gray-800 dark:bg-primary text-white shadow-lg border-gray-800 dark:border-primary' 
                                    : 'bg-white dark:bg-gray-700 border-gray-100 dark:border-gray-600 text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 hover:border-gray-200 dark:hover:border-gray-500'}`}
                        >
                            {spec}
                        </button>
                    )))}
                </div>
            </div>

            {/* List Content */}
            {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                    {filteredDoctors.map((doctor) => (
                        <div key={doctor._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col">
                            
                             {/* Header Band */}
                             <div className="h-1.5 bg-gradient-to-r from-blue-400 to-indigo-600"></div>

                            <div className="p-6 flex-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-sm text-xl font-bold shrink-0">
                                            Dr
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-800 dark:text-white text-lg leading-tight line-clamp-1">{doctor.name}</h3>
                                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/20 inline-block px-2 py-0.5 rounded mt-1">{doctor.specialization}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${doctor.status === 'Active' ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                            {doctor.status}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 mb-6 bg-gray-50/50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                                     <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Building2 size={14} /> Hospital</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-200 truncate max-w-[140px]">{doctor.hospital}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Award size={14} /> Qualification</span>
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{doctor.qualification}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><Phone size={14} /> Contact</span>
                                        <span className="font-mono font-medium text-gray-700 dark:text-gray-200">{doctor.phone || doctor.mobile}</span>
                                    </div>
                                     <div className="flex items-center justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2"><FileText size={14} /> Total Referred</span>
                                        <span className="font-bold text-primary">{doctor.totalPrescriptions || 0}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Action Footer */}
                            <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30 flex items-center justify-between gap-3">
                                <div className="flex gap-1">
                                    <button onClick={() => handleView(doctor)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View Profile">
                                        <Eye size={18} />
                                    </button>
                                    <button onClick={() => handlePrint(doctor)} className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors" title="Print Profile">
                                        <Printer size={18} />
                                    </button>
                                    <button onClick={() => handleEdit(doctor)} className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Edit Profile">
                                        <Edit2 size={18} />
                                    </button>
                                    <button onClick={() => handleDelete(doctor._id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <button 
                                    className="px-3 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:bg-secondary transition-all flex items-center gap-1 shadow-md shadow-primary/20"
                                    onClick={() => handleNewRx(doctor)}
                                >
                                    <Plus size={14} /> New Rx
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden animate-fade-in-up">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-xs uppercase text-gray-500 dark:text-gray-400 font-semibold tracking-wider">
                                    <th className="px-6 py-4">Doctor Name</th>
                                    <th className="px-6 py-4">Speciality</th>
                                    <th className="px-6 py-4">Clinic / Hospital</th>
                                    <th className="px-6 py-4">Mobile</th>
                                    <th className="px-6 py-4 text-center">Scripts</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                {filteredDoctors.map((doctor) => (
                                    <tr key={doctor._id} className="hover:bg-gray-50/80 dark:hover:bg-gray-700/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold border border-blue-100 dark:border-blue-800">
                                                    Dr
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 dark:text-white text-sm">{doctor.name}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500">{doctor.qualification}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                                                {doctor.specialization}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">
                                                <Building2 size={14} className="text-gray-400 dark:text-gray-500" />
                                                {doctor.hospital}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-mono text-gray-600 dark:text-gray-300">
                                            {doctor.phone || 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="font-bold text-gray-800 dark:text-white">{doctor.totalPrescriptions || 0}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${doctor.status === 'Active' ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${doctor.status === 'Active' ? 'bg-green-500 dark:bg-green-400' : 'bg-gray-400'}`}></span>
                                                {doctor.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                 <button onClick={() => handleView(doctor)} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors" title="View">
                                                    <Eye size={16} />
                                                </button>
                                                <button onClick={() => handleEdit(doctor)} className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors" title="Edit">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(doctor._id)} className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Delete">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                        Showing page <span className="font-bold text-gray-800 dark:text-white">{page}</span> of <span className="font-bold text-gray-800 dark:text-white">{totalPages}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                            disabled={page === 1}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <button
                            onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={page === totalPages}
                            className="p-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-gray-600 dark:text-gray-300"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DoctorList;
