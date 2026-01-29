import React, { useState, useEffect, useMemo } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight, BarChart3, Filter } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const UnitsManagement = () => {
  const [units, setUnits] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState({ name: '', code: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(8);

  // Fetch Units
  const fetchUnits = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/units');
      if (data.success) {
        setUnits(data.units);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
      Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Failed to fetch units data!',
          confirmButtonColor: 'var(--color-primary)'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUnits();
  }, []);

  const handleOpenModal = (unit = null) => {
    if (unit) {
      setCurrentUnit(unit);
      setIsEditing(true);
    } else {
      setCurrentUnit({ name: '', code: '' });
      setIsEditing(false);
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!currentUnit.name || !currentUnit.code) {
      Swal.fire({
          icon: 'warning',
          title: 'Missing Fields',
          text: 'Please fill all fields properly',
          confirmButtonColor: 'var(--color-primary)'
      });
      return;
    }

    try {
      if (isEditing) {
        const { data } = await api.put(`/units/${currentUnit._id}`, {
          name: currentUnit.name,
          code: currentUnit.code
        });
        
        if (data.success) {
            setUnits(units.map(u => u._id === currentUnit._id ? data.unit : u));
            Swal.fire({
                icon: 'success',
                title: 'Updated!',
                text: 'Unit updated successfully',
                timer: 1500,
                showConfirmButton: false
            });
        }
      } else {
        const { data } = await api.post('/units', {
            name: currentUnit.name,
            code: currentUnit.code
        });

        if (data.success) {
            setUnits([...units, data.unit]);
            Swal.fire({
                icon: 'success',
                title: 'Created!',
                text: 'New unit added successfully',
                timer: 1500,
                showConfirmButton: false
            });
        }
      }
      setIsModalOpen(false);
    } catch (error) {
        console.error(error);
        Swal.fire('Error', error.response?.data?.message || 'Operation failed', 'error');
    }
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
            await api.delete(`/units/${id}`);
            setUnits(units.filter(u => u._id !== id));
            Swal.fire({
                icon: 'success',
                title: 'Deleted!',
                text: 'Unit has been deleted.',
                timer: 1500,
                showConfirmButton: false
            });
        } catch (error) {
            Swal.fire('Error', 'Failed to delete unit', 'error');
        }
      }
    });
  };

  // Derived State (Search & Pagination)
  const { filteredUnits, totalPages, paginatedData } = useMemo(() => {
      const filtered = units.filter(u => 
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        u.code.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      const totalPgs = Math.ceil(filtered.length / itemsPerPage);
      const start = (currentPage - 1) * itemsPerPage;
      const paged = filtered.slice(start, start + itemsPerPage);

      return { filteredUnits: filtered, totalPages: totalPgs, paginatedData: paged };
  }, [units, searchTerm, currentPage, itemsPerPage]);

  const toggleSort = () => {
      // Basic sort toggle simple implementation
      setUnits([...units].reverse());
  };

  const goToPage = (page) => {
      if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  return (
    <>
      <div className="animate-fade-in-up space-y-6 pb-10">
         {/* Top Header & Stats */}
         <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Package className="text-primary" /> Units Management
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Configure global measurement units for inventory items.</p>
                </div>
                <button 
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-sm group"
                >
                    <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                    <span>Add New Unit</span>
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Package size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Units</p>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white">{units.length}</h3>
                    </div>
                </div>
                 <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                    <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl">
                        <BarChart3 size={24} />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active</p>
                        <h3 className="text-2xl font-black text-gray-800 dark:text-white">{units.length}</h3>
                    </div>
                </div>
            </div>
         </div>

         {/* Main Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30 flex flex-col sm:flex-row justify-between gap-4">
             <div className="relative w-full max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
               <input 
                 type="text" 
                 placeholder="Search units..." 
                 value={searchTerm}
                 onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                 className="w-full pl-9 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white"
               />
             </div>
             <button onClick={toggleSort} className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                <Filter size={16} /> Sort List
             </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto min-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4 w-16">#</th>
                  <th className="px-6 py-4">Unit Name</th>
                  <th className="px-6 py-4">Code / Symbol</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {loading ? (
                    [...Array(5)].map((_, i) => (
                        <tr key={i} className="animate-pulse">
                            <td className="px-6 py-4"><div className="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                            <td className="px-6 py-4"><div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                            <td className="px-6 py-4"><div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded ml-auto"></div></td>
                        </tr>
                    ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((unit, index) => (
                    <tr key={unit._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="px-6 py-4 text-gray-400 font-mono text-xs">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                      <td className="px-6 py-4 font-bold text-gray-800 dark:text-gray-200">{unit.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 font-mono tracking-wide">
                          {unit.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                          <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">Active</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => handleOpenModal(unit)}
                            className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(unit._id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                         <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-full mb-3">
                            <Search size={24} className="text-gray-300 dark:text-gray-500" />
                         </div>
                         <p className="text-sm">No units found matching "{searchTerm}"</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          {filteredUnits.length > 0 && (
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                      Showing <span className="font-bold">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold">{Math.min(currentPage * itemsPerPage, filteredUnits.length)}</span> of <span className="font-bold">{filteredUnits.length}</span> units
                  </p>
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={() => goToPage(currentPage - 1)} 
                        disabled={currentPage === 1}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                      >
                          <ChevronLeft size={16} />
                      </button>
                      <div className="flex items-center gap-1">
                          {[...Array(totalPages)].map((_, i) => (
                              <button 
                                key={i}
                                onClick={() => goToPage(i+1)}
                                className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors ${
                                    currentPage === i + 1 
                                    ? 'bg-primary text-white shadow-md shadow-primary/20' 
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                              >
                                {i + 1}
                              </button>
                          ))}
                      </div>
                       <button 
                        onClick={() => goToPage(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        className="p-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                      >
                          <ChevronRight size={16} />
                      </button>
                  </div>
              </div>
          )}
        </div>
      </div>

      {/* Modal - Kept Structure but enhanced styles */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-scale-up overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
               <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{isEditing ? 'Edit Measurement Unit' : 'Add New Unit'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Define measurement standards</p>
               </div>
               <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 p-2 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Unit Name</label>
                <div className="relative">
                  <Package className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    autoFocus
                    value={currentUnit.name}
                    onChange={(e) => setCurrentUnit({...currentUnit, name: e.target.value})}
                    placeholder="e.g. Kilogram"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Abbreviation Code</label>
                <div className="relative">
                   <Edit2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input 
                    type="text" 
                    value={currentUnit.code}
                    onChange={(e) => setCurrentUnit({...currentUnit, code: e.target.value})}
                    placeholder="e.g. kg"
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-medium font-mono text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-700/30">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm">Cancel</button>
              <button onClick={handleSave} className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm flex items-center gap-2">
                <Save size={16} /> <span>{isEditing ? 'Update' : 'Save Unit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnitsManagement;
