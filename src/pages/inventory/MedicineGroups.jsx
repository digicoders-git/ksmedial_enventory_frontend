import React, { useState,useEffect } from 'react';
import { Plus, Search, Layers, Edit3, Trash2, Package, ChevronRight, X, Save, LayoutGrid, List, FileText, Calendar, Box } from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const MedicineGroups = () => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [showListModal, setShowListModal] = useState(false);
  const [selectedGroupForList, setSelectedGroupForList] = useState(null);
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Moved colors map outside or use stable reference
  const colors = [
      'bg-blue-100 text-blue-600',
      'bg-green-100 text-green-600',
      'bg-purple-100 text-purple-600',
      'bg-red-100 text-red-600',
      'bg-orange-100 text-orange-600',
      'bg-teal-100 text-teal-600',
      'bg-indigo-100 text-indigo-600',
      'bg-pink-100 text-pink-600'
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/groups');
      
      if (data.success) {
        setGroups(data.groups.map(g => ({
          id: g._id,
          name: g.name,
          description: g.description,
          count: g.count || 0, // Use backend count
          color: colors[Math.floor(Math.random() * colors.length)] // Assign random color
        })));
      }
    } catch (error) {
      console.error("Fetch groups error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const [currentGroup, setCurrentGroup] = useState({ name: '', description: '' });

  const handleOpenModal = (group = null) => {
      if (group) {
          setCurrentGroup(group);
          setIsEditing(true);
      } else {
          setCurrentGroup({ name: '', description: '' });
          setIsEditing(false);
      }
      setShowAddModal(true);
  };

  const handleSave = async () => {
      if (!currentGroup.name) {
          Swal.fire('Error', 'Group name is required', 'error');
          return;
      }

      try {
        let response;
        if (isEditing) {
             response = await api.put(`/groups/${currentGroup.id}`, currentGroup);
        } else {
             response = await api.post('/groups', currentGroup);
        }

        const data = response.data;

        if (data.success) {
          fetchData();
          setShowAddModal(false);
          Swal.fire('Success!', `Group ${isEditing ? 'updated' : 'added'} successfully.`, 'success');
        }
      } catch (error) {
        Swal.fire('Error', error.response?.data?.message || 'Failed to save group', 'error');
      }
  };

  const handleDelete = (id) => {
      Swal.fire({
          title: 'Delete Group?',
          text: "This action cannot be undone. Associated medicines might be affected.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const { data } = await api.delete(`/groups/${id}`);
              if (data.success) {
                setGroups(groups.filter(g => g.id !== id));
                Swal.fire('Deleted!', 'Group has been removed.', 'success');
              }
            } catch (error) {
              Swal.fire('Error', 'Failed to delete group', 'error');
            }
          }
      });
  };

  const getRandomColor = () => {
      return colors[Math.floor(Math.random() * colors.length)];
  };

  const openListModal = (group) => {
      setSelectedGroupForList(group);
      setShowListModal(true);
  };

  return (
    <>
      <div className="space-y-6 animate-fade-in-up relative pb-10">
        
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <Layers className="text-primary dark:text-primary-400" /> Medicine Groups
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Organize your medicines into logical categories.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary hover:bg-secondary text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-primary/20 active:scale-95 group"
          >
            <Plus size={18} className="group-hover:rotate-90 transition-transform" />
            <span>Add New Group</span>
          </button>
        </div>

        {/* Search & Stats */}
        <div className="flex flex-col xl:flex-row gap-6">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="md:col-span-2 bg-white dark:bg-gray-800 p-1 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center">
                <div className="p-4 text-gray-400 dark:text-gray-500">
                   <Search size={20} />
                </div>
                <input 
                 type="text" 
                 placeholder="Search groups..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full bg-transparent outline-none text-sm placeholder:text-gray-400 dark:placeholder:text-gray-500 dark:text-white py-4 pr-4"
               />
               
               {/* View Switcher Controls */}
               <div className="flex gap-1 p-2 border-l border-gray-100 dark:border-gray-700 ml-2">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-primary/10 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                    title="Table View"
                  >
                    <List size={18} />
                  </button>
               </div>
             </div>
             
             <div className="bg-[#007242] dark:bg-gray-800 text-white p-6 rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <p className="text-white/80 text-[10px] font-black uppercase tracking-widest mb-1">Total Groups</p>
                  <h3 className="text-3xl font-bold">{groups.length}</h3>
                </div>
                <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm relative z-10">
                  <Layers size={24} />
                </div>
                <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
             </div>
          </div>
        </div>

        {/* Content View */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map((group) => (
              <div key={group.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 group relative overflow-hidden flex flex-col h-full">
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${group.color} shadow-sm dark:bg-opacity-20`}>
                      <Package size={28} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                          onClick={() => handleOpenModal(group)}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors hover:scale-110 active:scale-95"
                          title="Edit Group"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button 
                          onClick={() => handleDelete(group.id)}
                          className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors hover:scale-110 active:scale-95"
                          title="Delete Group"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">{group.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">{group.description}</p>
                </div>
                
                <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-gray-800 dark:text-white">{group.count}</span>
                      <span className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 tracking-tighter">Medicines</span>
                  </div>
                  <button 
                    onClick={() => openListModal(group)}
                    className="text-sm text-primary dark:text-primary-400 font-bold flex items-center gap-1 hover:gap-2 transition-all hover:text-secondary dark:hover:text-secondary-400"
                  >
                      View List <ChevronRight size={16} />
                  </button>
                </div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 dark:from-gray-700 to-transparent rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              </div>
            ))}
            {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <NoResults message="No groups found." />
            )}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto text-sm">
              <table className="w-full text-left">
                <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-100 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500 dark:text-gray-400">Icon</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500 dark:text-gray-400">Group Name</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500 dark:text-gray-400">Description</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500 dark:text-gray-400 text-right">Items</th>
                    <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-gray-500 dark:text-gray-400 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                  {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).map((group) => (
                    <tr key={group.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${group.color} dark:bg-opacity-20`}>
                          <Package size={20} />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-bold text-gray-800 dark:text-gray-200">{group.name}</span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs">{group.description}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-black text-gray-800 dark:text-gray-100 mr-1">{group.count}</span>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-tighter">Units</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-2">
                           <button 
                              onClick={() => handleOpenModal(group)}
                              className="p-2 hover:bg-primary/10 text-gray-400 hover:text-primary rounded-lg transition-all active:scale-95"
                              title="Edit"
                           >
                              <Edit3 size={16} />
                           </button>
                           <button 
                              onClick={() => handleDelete(group.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 rounded-lg transition-all active:scale-95"
                              title="Delete"
                           >
                              <Trash2 size={16} />
                           </button>
                           <button 
                              onClick={() => openListModal(group)}
                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg transition-all active:scale-95"
                              title="View Items"
                           >
                              <ChevronRight size={16} />
                           </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {groups.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                 <div className="py-12"><NoResults message="No groups found matching your search." /></div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-scale-up overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-400 rounded-lg">
                      <Layers size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 dark:text-white text-lg">{isEditing ? 'Edit Group' : 'Add New Group'}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Categorize medicines efficiently</p>
                  </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-2 rounded-full shadow-sm hover:shadow-md border border-gray-100 dark:border-gray-600"
              >
                  <X size={20} />
              </button>
            </div>
            
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Group Name</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Antibiotics" 
                  value={currentGroup.name}
                  onChange={(e) => setCurrentGroup({...currentGroup, name: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm font-medium transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">Description</label>
                <textarea 
                  rows="3" 
                  placeholder="Brief description of this category..." 
                  value={currentGroup.description}
                  onChange={(e) => setCurrentGroup({...currentGroup, description: e.target.value})}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-700/30">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-sm"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-sm flex items-center gap-2"
              >
                <Save size={18} />
                <span>{isEditing ? 'Update Group' : 'Save Group'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Medicine List Modal */}
      {showListModal && selectedGroupForList && (
        <MedicineListModal 
          group={selectedGroupForList} 
          onClose={() => setShowListModal(false)}
        />
      )}
    </>
  );
};

const MedicineListModal = ({ group, onClose }) => {
    const [groupMedicines, setGroupMedicines] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchItems = async () => {
             try {
                 // Fetch products for this group (category)
                 const { data } = await api.get(`/products?category=${encodeURIComponent(group.name)}`);
                 if(data.success) {
                     setGroupMedicines(data.products);
                 }
             } catch (error) {
                 console.error("Failed to load group items", error);
             } finally {
                 setLoading(false);
             }
        };
        fetchItems();
    }, [group]);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative z-10 animate-scale-up overflow-hidden flex flex-col border border-white/20">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${group.color} dark:bg-opacity-20 shadow-inner`}>
                            <Package size={28} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{group.name} List</h3>
                            <div className="flex items-center gap-2 mt-1">
                                {loading ? (
                                    <span className="text-primary text-xs font-bold animate-pulse">Loading items...</span>
                                ) : (
                                    <>
                                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{groupMedicines.length} Items Found</span>
                                        <span className="text-gray-400 text-xs">Category management panel</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-3 bg-white dark:bg-gray-700 text-gray-400 hover:text-red-500 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-600 transition-all hover:rotate-90"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-0 relative">
                    {loading ? (
                         <div className="flex flex-col items-center justify-center h-64">
                             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                             <p className="mt-4 text-gray-500 text-sm font-medium">Fetching medicines...</p>
                         </div>
                    ) : groupMedicines.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50/50 dark:bg-gray-700/30 sticky top-0 backdrop-blur-sm z-10">
                                    <tr>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700">Medicine Details</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700">SKU / Batch</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700 text-right">Price</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700 text-right">Current Stock</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700 text-center">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {groupMedicines.map((item) => (
                                        <tr key={item._id || item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all">
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                                                        <FileText size={16} />
                                                    </div>
                                                    <span className="font-bold text-gray-800 dark:text-gray-200">{item.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-mono text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.sku || 'N/A'}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500">BATCH: {item.batchNumber}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-gray-800 dark:text-gray-100">
                                                ₹{item.sellingPrice?.toFixed(2) || '0.00'}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-base font-black ${item.quantity <= (item.reorderLevel || 20) ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
                                                        {item.quantity}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Units</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{item.expiryDate || 'N/A'}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-50/50 dark:bg-gray-800/30 h-full">
                            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 border-4 border-white dark:border-gray-600 shadow-xl">
                                <Box size={40} className="text-gray-300" />
                            </div>
                            <h4 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">No Inventory Data</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">There are currently no medicines mapped to this group in your inventory database.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-800 dark:bg-gray-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-900 shadow-lg shadow-gray-200 dark:shadow-none transition-all active:scale-95"
                    >
                        Close Panel
                    </button>
                </div>
            </div>
        </div>
    );
};

const NoResults = ({ message }) => (
    <div className="col-span-full py-12 text-center text-gray-400 dark:text-gray-500 flex flex-col items-center w-full">
        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700/50 rounded-full flex items-center justify-center mb-4">
            <Search size={32} className="opacity-50" />
        </div>
        <p className="text-lg font-bold text-gray-600 dark:text-gray-300">{message}</p>
        <p className="text-sm">Try adjusting your filters or search term.</p>
    </div>
);

export default MedicineGroups;
