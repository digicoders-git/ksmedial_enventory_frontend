import React, { useState } from 'react';
import { Package, Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import Swal from 'sweetalert2';

const UnitsManagement = () => {
  const [units, setUnits] = useState([
    { id: 1, name: 'Kilogram', code: 'kg' },
    { id: 2, name: 'Gram', code: 'gm' },
    { id: 3, name: 'Pieces', code: 'pcs' },
    { id: 4, name: 'Box', code: 'box' },
    { id: 5, name: 'Strip', code: 'strip' },
  ]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUnit, setCurrentUnit] = useState({ name: '', code: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleSave = () => {
    if (!currentUnit.name || !currentUnit.code) {
      Swal.fire('Error', 'Please fill all fields', 'error');
      return;
    }

    if (isEditing) {
      setUnits(units.map(u => u.id === currentUnit.id ? currentUnit : u));
      Swal.fire('Success', 'Unit updated successfully', 'success');
    } else {
      setUnits([...units, { ...currentUnit, id: units.length + 1 }]);
      Swal.fire('Success', 'Unit added successfully', 'success');
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
      if (result.isConfirmed) {
        setUnits(units.filter(u => u.id !== id));
        Swal.fire('Deleted!', 'Unit has been deleted.', 'success');
      }
    });
  };

  const filteredUnits = units.filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <div className="animate-fade-in-up max-w-[1200px] mx-auto pb-10">
         {/* Header */}
         <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 text-blue-600 dark:text-blue-400">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Units Management</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">Manage measurement units for products</p>
            </div>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-sm group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span>Add New Unit</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-gray-100/50 dark:shadow-none border border-gray-100 dark:border-gray-700 overflow-hidden">
          {/* Search */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-700/30">
             <div className="relative max-w-md">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search units by name or code..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary shadow-sm transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
               />
             </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                  <th className="px-6 py-4">Unit Name</th>
                  <th className="px-6 py-4">Code / Symbol</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filteredUnits.length > 0 ? (
                  filteredUnits.map((unit) => (
                    <tr key={unit.id} className="hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-gray-800 dark:text-gray-200">{unit.name}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 font-mono">
                          {unit.code}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(unit)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all"
                            title="Edit"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(unit.id)}
                            className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
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
                    <td colSpan="3" className="px-6 py-12 text-center">
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
        </div>
      </div>

      {/* Modern Modal (Fixed Positioning Issue) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-scale-up overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
               <div>
                  <h3 className="text-lg font-bold text-gray-800 dark:text-white">{isEditing ? 'Edit Measurement Unit' : 'Add New Unit'}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Define measurement standards</p>
               </div>
               <button 
                 onClick={() => setIsModalOpen(false)} 
                 className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-600/50 p-2 rounded-full transition-colors"
               >
                   <X size={18} />
               </button>
            </div>
            
            {/* Modal Body */}
            <div className="p-6 space-y-5">
              
              {/* Unit Name Input */}
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

              {/* Unit Code Input */}
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
                <p className="text-[11px] text-gray-400">Short symbol used in invoices (max 3-4 chars recommended)</p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-700/30">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave}
                className="px-6 py-2 rounded-lg bg-primary text-white font-semibold hover:bg-secondary shadow-lg shadow-primary/20 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <Save size={16} /> 
                <span>{isEditing ? 'Update' : 'Save Unit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UnitsManagement;
