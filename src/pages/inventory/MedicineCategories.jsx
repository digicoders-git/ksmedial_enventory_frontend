import React, { useState, useEffect } from 'react';
import { Plus, Search, Tag, Edit3, Trash2, Activity, ChevronRight, X, Grid, List, FileText, Calendar, Box } from 'lucide-react';
import Swal from 'sweetalert2';
import { useInventory } from '../../context/InventoryContext';
import api from '../../api/axios';

const MedicineCategories = () => {
  const { inventory } = useInventory();
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showListModal, setShowListModal] = useState(false);
  const [selectedCategoryForList, setSelectedCategoryForList] = useState(null);

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch categories
      const { data } = await api.get('/categories');

      if (data.success) {
        setCategories(data.categories.map(c => ({
          id: c._id,
          name: c.name,
          description: c.description,
          color: c.color,
          count: inventory.filter(i => i.category === c.name).length, // Calc count from inventory
          icon: Activity
        })));
      }
    } catch (error) {
      console.error("Fetch categories error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [inventory]);

  const [currentCategory, setCurrentCategory] = useState({ name: '', description: '', color: 'bg-blue-50 text-blue-600', parentId: '' });

  const colors = [
      'bg-red-50 text-red-600', 
      'bg-blue-50 text-blue-600', 
      'bg-green-50 text-green-600', 
      'bg-purple-50 text-purple-600', 
      'bg-orange-50 text-orange-600',
      'bg-teal-50 text-teal-600'
  ];

  const handleOpenModal = (category = null) => {
      if (category) {
          setCurrentCategory(category);
          setIsEditing(true);
      } else {
          setCurrentCategory({ name: '', description: '', color: colors[0], parentId: '' });
          setIsEditing(false);
      }
      setShowAddModal(true);
  };

  const handleSave = async () => {
      if (!currentCategory.name) {
          Swal.fire('Error', 'Category name is required', 'error');
          return; 
      }

      try {
        let response;
        if (isEditing) {
             response = await api.put(`/categories/${currentCategory.id}`, currentCategory);
        } else {
             response = await api.post('/categories', currentCategory);
        }

        const data = response.data;

        if (data.success) {
          fetchData();
          setShowAddModal(false);
          Swal.fire('Success!', `Category ${isEditing ? 'updated' : 'added'} successfully.`, 'success');
        }
      } catch (error) {
        Swal.fire('Error', 'Failed to save category', 'error');
      }
  };

  const handleDelete = (id) => {
      Swal.fire({
          title: 'Delete Category?',
          text: "This will remove the category permanently.",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#3085d6',
          confirmButtonText: 'Yes, delete it!'
      }).then(async (result) => {
          if (result.isConfirmed) {
            try {
              const { data } = await api.delete(`/categories/${id}`);
              if (data.success) {
                setCategories(categories.filter(c => c.id !== id));
                Swal.fire('Deleted!', 'Category has been removed.', 'success');
              }
            } catch (error) {
              Swal.fire('Error', 'Failed to delete category', 'error');
            }
          }
      });
  };

  const openListModal = (cat) => {
      setSelectedCategoryForList(cat);
      setShowListModal(true);
  };

  const IconWrapper = ({ icon: Icon, colorClass }) => (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
      {Icon ? <Icon size={20} /> : <Activity size={20} />}
    </div>
  );

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      <div className="space-y-6 animate-fade-in-up pb-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Therapeutic Categories</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Classify medicines by their therapeutic use.</p>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-xl font-bold hover:bg-secondary shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-95 transition-all text-sm"
          >
            <Plus size={18} />
            <span>Add Category</span>
          </button>
        </div>

        {/* Filters & View Toggle */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="relative w-full sm:w-80">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Search categories..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
               />
            </div>
            
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-700 p-1 rounded-lg border border-gray-200 dark:border-gray-600">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                >
                   <Grid size={18} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 text-primary shadow-sm' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}
                >
                   <List size={18} />
                </button>
            </div>
        </div>

        {/* Content */}
        {viewMode === 'grid' ? (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-300 group relative overflow-hidden flex flex-col">
                   <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-4">
                         <IconWrapper icon={cat.icon} colorClass={`${cat.color} dark:bg-opacity-20`} />
                         <div className="flex gap-1">
                             <button 
                                onClick={() => handleOpenModal(cat)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 hover:bg-primary/5 dark:hover:bg-primary/10 rounded-lg transition-colors"
                             >
                                <Edit3 size={16} />
                             </button>
                             <button 
                                onClick={() => handleDelete(cat.id)}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                             >
                                <Trash2 size={16} />
                             </button>
                         </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2 truncate">{cat.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">{cat.description}</p>
                   </div>
                   
                   <div className="px-6 py-4 bg-gray-50/50 dark:bg-gray-700/50 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <Tag size={14} className="text-gray-400" />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{cat.count} Items</span>
                       </div>
                        <button 
                         onClick={() => openListModal(cat)}
                         className="text-xs font-bold text-primary dark:text-primary-400 flex items-center gap-1 hover:gap-2 transition-all hover:text-secondary"
                       >
                          Filter View <ChevronRight size={12} />
                       </button>
                   </div>
                </div>
              ))}
           </div>
        ) : (
           <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
              <table className="w-full text-left text-sm">
                 <thead className="bg-gray-50 dark:bg-gray-750 border-b border-gray-100 dark:border-gray-700 text-gray-500 dark:text-gray-400 uppercase">
                    <tr>
                       <th className="px-6 py-4 font-semibold">Category Name</th>
                       <th className="px-6 py-4 font-semibold">Description</th>
                       <th className="px-6 py-4 text-center font-semibold">Items</th>
                       <th className="px-6 py-4 text-center font-semibold">Actions</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                    {filteredCategories.map((cat) => (
                       <tr key={cat.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-6 py-4">
                             <div className="flex items-center gap-3">
                                <IconWrapper icon={cat.icon} colorClass={`${cat.color} dark:bg-opacity-20`} />
                                <span className="font-bold text-gray-800 dark:text-gray-200">{cat.name}</span>
                             </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400 max-w-sm truncate">{cat.description}</td>
                          <td className="px-6 py-4 text-center">
                             <span className="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2.5 py-1 rounded-full text-xs font-bold">{cat.count}</span>
                          </td>
                          <td className="px-6 py-4 text-center">
                             <div className="flex justify-center gap-2">
                                <button 
                                    onClick={() => handleOpenModal(cat)}
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors"
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button 
                                    onClick={() => handleDelete(cat.id)}
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                                <button 
                                    onClick={() => openListModal(cat)}
                                    className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-primary dark:hover:text-primary-400 transition-colors"
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
           </div>
        )}
      </div>

      {/* Compact Add Category Modal - Fixed Positioning */}
      {showAddModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowAddModal(false)}></div>
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-2xl relative z-10 animate-scale-up overflow-hidden ring-1 ring-black/5 dark:ring-white/10">
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
              <h3 className="font-bold text-gray-800 dark:text-white text-lg">{isEditing ? 'Edit Category' : 'New Category'}</h3>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors bg-white dark:bg-gray-700 p-1 rounded-full shadow-sm hover:shadow-md dark:shadow-none"
              >
                  <X size={18} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Category Name</label>
                <input 
                  type="text" 
                  autoFocus
                  placeholder="e.g. Analgesics" 
                  value={currentCategory.name}
                  onChange={(e) => setCurrentCategory({...currentCategory, name: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500" 
                />
              </div>
              
               <div className="space-y-1">
                   <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Parent Category</label>
                   <select 
                        value={currentCategory.parentId}
                        onChange={(e) => setCurrentCategory({...currentCategory, parentId: e.target.value})}
                        className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm transition-all cursor-pointer text-gray-800 dark:text-white"
                   >
                      <option value="">None (Top Level)</option>
                      {categories.filter(c => c.id !== currentCategory.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                   </select>
               </div>
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Description</label>
                <textarea 
                  rows="2" 
                  placeholder="What kind of medicines belong here?" 
                  value={currentCategory.description}
                  onChange={(e) => setCurrentCategory({...currentCategory, description: e.target.value})}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none text-sm resize-none transition-all text-gray-800 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500"
                ></textarea>
              </div>

               <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-widest">Color Tag</label>
                <div className="flex gap-3 pt-1">
                   {colors.map((col, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => setCurrentCategory({...currentCategory, color: col})}
                        className={`w-6 h-6 rounded-full cursor-pointer border-2 transition-transform ${col} ${currentCategory.color === col ? 'ring-2 ring-primary scale-110 border-white dark:border-gray-800' : 'border-transparent hover:scale-110'}`}
                      ></div>
                   ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50/30 dark:bg-gray-700/30">
              <button 
                onClick={() => setShowAddModal(false)} 
                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-700 hover:border-gray-300 dark:hover:border-gray-500 transition-all text-xs uppercase tracking-wider"
              >
                Cancel
              </button>
              <button 
                onClick={handleSave} 
                className="px-5 py-2 rounded-lg bg-primary text-white font-bold hover:bg-secondary shadow-md active:scale-95 transition-all text-xs uppercase tracking-wider"
              >
                {isEditing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Medicine List Modal */}
      {showListModal && selectedCategoryForList && (
        <MedicineListModal 
          category={selectedCategoryForList} 
          onClose={() => setShowListModal(false)}
          inventory={inventory}
        />
      )}
    </>
  );
};

const MedicineListModal = ({ category, onClose, inventory }) => {
    const categoryMedicines = inventory.filter(item => 
        item.category?.toLowerCase() === category.name.toLowerCase()
    );

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-gray-900/70 backdrop-blur-md animate-fade-in" onClick={onClose}></div>
            <div className="bg-white dark:bg-gray-800 w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl relative z-10 animate-scale-up overflow-hidden flex flex-col border border-white/20">
                
                {/* Header */}
                <div className="px-8 py-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-700/50">
                    <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${category.color} dark:bg-opacity-20 shadow-inner`}>
                            {category.icon ? <category.icon size={28} /> : <Tag size={28} />}
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight">{category.name} Items</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest">{categoryMedicines.length} Medicines Linked</span>
                                <span className="text-gray-400 text-xs">Therapeutic category management</span>
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
                <div className="flex-1 overflow-y-auto p-0">
                    {categoryMedicines.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-gray-50/50 dark:bg-gray-700/30 sticky top-0 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700">Medicine Details</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700">SKU / Batch</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700 text-right">Price</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700 text-right">Current Stock</th>
                                        <th className="px-8 py-4 font-black uppercase text-[10px] text-gray-500 tracking-widest border-b border-gray-100 dark:border-gray-700 text-center">Expiry</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                                    {categoryMedicines.map((item) => (
                                        <tr key={item.id} className="group hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-all">
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
                                                    <span className="font-mono text-[10px] font-black text-blue-500 uppercase tracking-widest">{item.sku}</span>
                                                    <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase">BATCH: {item.batch}</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-right font-black text-gray-800 dark:text-gray-100">
                                                ₹{item.rate.toFixed(2)}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-base font-black ${item.stock <= (item.reorderLevel || 20) ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>
                                                        {item.stock}
                                                    </span>
                                                    <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Available Units</span>
                                                </div>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full border border-gray-200 dark:border-gray-600">
                                                    <Calendar size={12} className="text-gray-400" />
                                                    <span className="text-[10px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-tighter">{item.exp || 'N/A'}</span>
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
                            <h4 className="text-xl font-black text-gray-800 dark:text-white uppercase tracking-tight">Empty Category</h4>
                            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs mx-auto">No medicines have been assigned to this therapeutic category yet.</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-8 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-8 py-2.5 bg-gray-800 dark:bg-gray-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-gray-900 shadow-lg shadow-gray-200 dark:shadow-none transition-all active:scale-95"
                    >
                        Close View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MedicineCategories;
