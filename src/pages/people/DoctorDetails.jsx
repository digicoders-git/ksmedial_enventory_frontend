import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Award, Stethoscope, Activity, Building2, Phone, Mail, MapPin, Printer, Edit2, ArrowLeft, Star } from 'lucide-react';

const DoctorDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [doctor, setDoctor] = useState(null);

    // Simulate fetching data for view
    useEffect(() => {
        // In a real app, fetch data from API using id
        const mockDoctors = [
            { id: 1, name: 'Dr. Rajesh Gupta', qualification: 'MBBS, MD', speciality: 'Cardiologist', hospital: 'City Heart Center', mobile: '9876543210', email: 'rajesh@cityheart.com', location: 'Mumbai, MH', prescriptions: 145, rating: 5, status: 'Active' },
            { id: 2, name: 'Dr. Priya Desai', qualification: 'BDS, MDS', speciality: 'Dentist', hospital: 'Smile Care Clinic', mobile: '9988776655', email: 'priya@smilecare.com', location: 'Pune, MH', prescriptions: 56, rating: 4, status: 'Active' },
             // ... other mock doctors
        ];
        
        const doc = mockDoctors.find(d => d.id === parseInt(id));
        if (doc) {
            setDoctor(doc);
        }
    }, [id]);

    const handlePrint = () => {
        if (!doctor) return;
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
                    <div class="doc-spec">${doctor.speciality}</div>
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
                      <div class="value">${doctor.mobile}</div>
                    </div>
                    <div class="item">
                      <div class="label">Email Address</div>
                      <div class="value">${doctor.email || 'N/A'}</div>
                    </div>
                    <div class="item" style="grid-column: 1 / -1;">
                      <div class="label">Location</div>
                      <div class="value">${doctor.location}</div>
                    </div>
                  </div>

                  <div class="stats-section">
                    <div>
                      <div class="stat-num">${doctor.prescriptions}</div>
                      <div class="stat-lbl">Total Prescriptions</div>
                    </div>
                    <div>
                      <div class="stat-num">${doctor.rating} ⭐</div>
                      <div class="stat-lbl">Rating</div>
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

    if (!doctor) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in-up max-w-7xl mx-auto pb-10 space-y-8">
             {/* Navigation Header */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/people/doctors')}
                        className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-900 transition-all shadow-sm active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Doctor Profile</h1>
                        <p className="text-gray-500 text-sm font-medium">Manage and view doctor details</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button 
                        onClick={handlePrint}
                        className="px-5 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm focus:ring-2 focus:ring-gray-200 hover:text-primary"
                    >
                        <Printer size={18} /> Print
                    </button>
                    <button 
                         onClick={() => navigate(`/people/doctors/edit/${id}`)}
                        className="px-5 py-2 bg-gradient-to-r from-primary to-secondary text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary/30 active:scale-95 transition-all flex items-center gap-2"
                    >
                        <Edit2 size={18} /> Edit Profile
                    </button>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Profile Card (4 columns) */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-100/50 border border-gray-100 overflow-hidden relative group">
                        {/* Decorative Background */}
                        <div className="h-32 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12 blur-xl"></div>
                        </div>

                        <div className="px-6 pb-8 text-center relative">
                            {/* Avatar */}
                            <div className="relative -mt-16 mb-4 inline-block">
                                <div className="w-32 h-32 bg-white p-1.5 rounded-full shadow-2xl relative z-10 mx-auto">
                                    <div className="w-full h-full bg-blue-50 rounded-full flex items-center justify-center text-blue-600 font-bold text-4xl border border-blue-100">
                                        Dr
                                    </div>
                                </div>
                                {/* Active Status Indicator */}
                                <div className={`absolute bottom-2 right-2 w-6 h-6 border-4 border-white rounded-full ${doctor.status === 'Active' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                            </div>
                            
                            <h2 className="text-2xl font-bold text-gray-900 mb-1">{doctor.name}</h2>
                            <p className="text-blue-600 font-medium mb-6 flex items-center justify-center gap-1.5 bg-blue-50 inline-block px-3 py-1 rounded-full text-sm">
                                <Stethoscope size={14} /> {doctor.speciality}
                            </p>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 py-6 border-t border-gray-100 bg-gray-50/30 rounded-2xl mx-2">
                                <div className="text-center">
                                    <p className="text-2xl font-black text-gray-900">{doctor.prescriptions}</p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Total Scripts</p>
                                </div>
                                <div className="text-center border-l border-gray-200">
                                    <p className="text-2xl font-black text-orange-500 flex items-center justify-center gap-1">
                                        {doctor.rating} <Star size={16} className="fill-orange-500" />
                                    </p>
                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">Avg Rating</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Quick Contacts Widget */}
                    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h3>
                        <div className="space-y-3">
                            <button className="w-full py-3 px-4 bg-blue-50 text-blue-700 font-bold rounded-xl hover:bg-blue-100 transition-colors flex items-center justify-center gap-2 text-sm">
                                <Phone size={18} /> Call Doctor
                            </button>
                             <button className="w-full py-3 px-4 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm">
                                <Mail size={18} /> Send Email
                            </button>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Info (8 columns) */}
                <div className="lg:col-span-8 space-y-6">
                    
                    {/* Professional Info */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                                <Award size={24} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Professional Details</h3>
                                <p className="text-sm text-gray-500">Qualification and Specialization info</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Qualification</label>
                                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                   <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span> {doctor.qualification}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Speciality</label>
                                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                     <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> {doctor.speciality}
                                </p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Status</label>
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${doctor.status === 'Active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    <span className={`w-2 h-2 rounded-full ${doctor.status === 'Active' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                    {doctor.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Clinic & Location */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                         <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                                <Building2 size={24} />
                            </div>
                             <div>
                                <h3 className="text-lg font-bold text-gray-900">Clinic & Contact</h3>
                                <p className="text-sm text-gray-500">Location and contact information</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                             <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Hospital / Clinic</label>
                                <p className="text-lg font-semibold text-gray-900">{doctor.hospital}</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Mobile Number</label>
                                <p className="text-lg font-mono font-semibold text-gray-900 flex items-center gap-2">
                                    <Phone size={16} className="text-gray-400" /> {doctor.mobile}
                                </p>
                            </div>
                             <div>
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Email Address</label>
                                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Mail size={16} className="text-gray-400" /> {doctor.email || 'N/A'}
                                </p>
                            </div>
                            <div className="sm:col-span-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Location</label>
                                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <MapPin size={16} className="text-gray-400" /> {doctor.location}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DoctorDetails;
