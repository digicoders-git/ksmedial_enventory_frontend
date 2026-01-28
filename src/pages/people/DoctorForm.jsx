import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { User, Award, Stethoscope, Activity, Building2, Phone, Mail, MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import Swal from 'sweetalert2';

const DoctorForm = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        name: '',
        qualification: '',
        speciality: '',
        status: 'Active',
        hospital: '',
        mobile: '',
        email: '',
        location: ''
    });

    // Simulate fetching data for edit
    useEffect(() => {
        if (isEditing) {
            // In a real app, fetch data from API using id
            // For now, I'll mock it based on the mock data from DoctorList
             // This is just a placeholder to simulate data loading
            const mockDoctors = [
                { id: 1, name: 'Dr. Rajesh Gupta', qualification: 'MBBS, MD', speciality: 'Cardiologist', hospital: 'City Heart Center', mobile: '9876543210', email: 'rajesh@cityheart.com', location: 'Mumbai, MH', prescriptions: 145, rating: 5, status: 'Active' },
                { id: 2, name: 'Dr. Priya Desai', qualification: 'BDS, MDS', speciality: 'Dentist', hospital: 'Smile Care Clinic', mobile: '9988776655', email: 'priya@smilecare.com', location: 'Pune, MH', prescriptions: 56, rating: 4, status: 'Active' },
                 // ... other mock doctors
            ];
            
            const doctor = mockDoctors.find(d => d.id === parseInt(id));
            if (doctor) {
                setFormData(doctor);
            }
        }
    }, [id, isEditing]);


    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = (e) => {
        e.preventDefault();
        // Here you would typically save to an API
        Swal.fire({
            title: isEditing ? 'Updated!' : 'Added!',
            text: `Doctor profile has been ${isEditing ? 'updated' : 'created'} successfully.`,
            icon: 'success',
            timer: 2000,
            showConfirmButton: false
        }).then(() => {
             navigate('/people/doctors');
        });
    };

    return (
        <div className="animate-fade-in-up max-w-4xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button 
                    onClick={() => navigate('/people/doctors')}
                    className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500 hover:text-gray-700 transition-all shadow-sm"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">
                        {isEditing ? 'Edit Doctor Profile' : 'Add New Doctor'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isEditing ? 'Update the existing doctor details below.' : 'Fill in the information to register a new doctor.'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                 {/* Personal Info Section */}
                 <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-500"></div>
                    <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <span className="p-2 bg-blue-50 text-blue-600 rounded-lg"><User size={18} /></span>
                        Personal Information
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5 ">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Doctor Name <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                    <User size={18} />
                                </div>
                                <input 
                                    required
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Dr. Rajesh Gupta"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Qualification
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                    <Award size={18} />
                                </div>
                                <input 
                                    name="qualification"
                                    value={formData.qualification}
                                    onChange={handleInputChange}
                                    placeholder="e.g. MBBS, MD"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Speciality
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                    <Stethoscope size={18} />
                                </div>
                                <input 
                                    name="speciality"
                                    value={formData.speciality}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Cardiologist"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                         <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Status
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-blue-600 transition-colors">
                                    <Activity size={18} />
                                </div>
                                <select 
                                    name="status"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all appearance-none cursor-pointer"
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Clinic & Contact Info */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-purple-500"></div>
                     <h4 className="text-base font-bold text-gray-800 flex items-center gap-2 mb-6">
                        <span className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Building2 size={18} /></span>
                        Clinic & Contact Details
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Hospital / Clinic Name
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    <Building2 size={18} />
                                </div>
                                <input 
                                    name="hospital"
                                    value={formData.hospital}
                                    onChange={handleInputChange}
                                    placeholder="e.g. City Heart Center"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Mobile Number <span className="text-red-500">*</span>
                            </label>
                            <div className="relative group">
                                <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    <Phone size={18} />
                                </div>
                                <input 
                                    required
                                    name="mobile"
                                    value={formData.mobile}
                                    onChange={handleInputChange}
                                    placeholder="e.g. 9876543210"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Email Address
                            </label>
                            <div className="relative group">
                                 <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input 
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="e.g. doctor@email.com"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>

                        <div className="md:col-span-2 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                                Location / Address
                            </label>
                            <div className="relative group">
                                 <div className="absolute left-0 top-0 bottom-0 w-12 flex items-center justify-center text-gray-400 group-focus-within:text-purple-600 transition-colors">
                                    <MapPin size={18} />
                                </div>
                                <input 
                                    name="location"
                                    value={formData.location}
                                    onChange={handleInputChange}
                                    placeholder="e.g. Mumbai, MH"
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-purple-500/10 focus:border-purple-500 outline-none text-sm font-medium transition-all placeholder:text-gray-400"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                    <button 
                        type="button"
                        onClick={() => navigate('/people/doctors')} 
                        className="px-6 py-3 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:text-gray-900 text-sm transition-all shadow-sm"
                    >
                        Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="px-10 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold hover:shadow-lg hover:shadow-blue-500/30 active:scale-95 transition-all text-sm flex items-center gap-2"
                    >
                        <CheckCircle size={18} strokeWidth={2.5} />
                        {isEditing ? 'Update Profile' : 'Save Doctor'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default DoctorForm;
