import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Ticket, Trash2, Printer, Grid, List, Filter, Plus, Minus, CreditCard, Banknote, Smartphone, XCircle, CheckCircle, Package } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const SalesEntry = () => {
  const navigate = useNavigate();
  const { inventory, sellItems, loading: inventoryLoading } = useInventory();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;
  const { id } = useParams();
  const isEditing = !!id;

  const [categories, setCategories] = useState(['All']);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [loading, setLoading] = useState(true);

  // Fetch Categories & Customers
  useEffect(() => {
    const fetchData = async () => {
        try {
            const [catRes, custRes] = await Promise.all([
                api.get('/categories'),
                api.get('/customers')
            ]);
            if (catRes.data.success) {
                setCategories(['All', ...catRes.data.categories.map(c => c.name)]);
            }
            if (custRes.data.success) {
                setCustomers(custRes.data.customers);
            }
        } catch (error) {
            console.error("Error fetching POS data:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  // Loads data if editing
  useEffect(() => {
    const fetchInvoice = async () => {
        if (!isEditing || inventory.length === 0) return;
        
        try {
            setLoading(true);
            const { data } = await api.get(`/sales/${id}`);
            if (data.success && data.sale) {
                const sale = data.sale;
                
                // Set customer
                if (sale.customer) {
                    setSelectedCustomer(sale.customer);
                    setCustomerSearch(sale.customer.name);
                } else {
                    setCustomerSearch(sale.customerName || 'Walk-in');
                }
                
                // Set payment mode
                setPaymentMode(sale.paymentMethod || 'Cash');
                
                // Sync cart with inventory to ensure stock/price details are fresh
                const populatedCart = sale.items.map(item => {
                    const invItem = inventory.find(p => p.id === item.productId?._id || p.id === item.productId);
                    return {
                        id: item.productId?._id || item.productId,
                        name: item.name,
                        qty: item.quantity,
                        rate: item.price,
                        amount: item.subtotal,
                        stock: invItem ? invItem.stock + item.quantity : item.quantity // Add back current qty to stock limit
                    };
                });
                setCart(populatedCart);
            }
        } catch (error) {
            console.error("Error loading invoice for edit:", error);
            Swal.fire('Error', 'Failed to load invoice details', 'error');
        } finally {
            setLoading(false);
        }
    };
    fetchInvoice();
  }, [isEditing, id, inventory]);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    const currentQty = existingItem ? existingItem.qty : 0;

    if (currentQty + 1 > product.stock) {
      Swal.fire({
          icon: 'warning',
          title: 'Stock Limit Reached',
          text: `Only ${product.stock} units available!`,
          timer: 1500,
          showConfirmButton: false
      });
      return;
    }

    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, qty: item.qty + 1, amount: (item.qty + 1) * item.rate }
          : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1, amount: product.rate }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQty = item.qty + delta;
        
        if (newQty <= 0) return item; 

        const product = inventory.find(p => p.id === id);
        if (newQty > product.stock) {
            Swal.fire({
                icon: 'warning',
                title: 'Insufficient Stock',
                text: `Max available: ${product.stock}`,
                toast: true,
                position: 'top-end',
                timer: 2000,
                showConfirmButton: false
            });
          return item;
        }
        return { ...item, qty: newQty, amount: newQty * item.rate };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const clearCart = () => {
      if(cart.length > 0) {
          Swal.fire({
              title: 'Clear Cart?',
              text: "Are you sure you want to remove all items?",
              icon: 'warning',
              showCancelButton: true,
              confirmButtonColor: '#d33',
              confirmButtonText: 'Yes, Clear it!'
          }).then((result) => {
              if (result.isConfirmed) {
                  setCart([]);
                  setSelectedCustomer(null);
                  setCustomerSearch('');
                  Swal.fire('Cleared!', 'Cart is now empty.', 'success');
              }
          })
      }
  }

    const handleQuickAddCustomer = async () => {
        const { value: formValues } = await Swal.fire({
            title: 'Quick Add Customer',
            html: `
                <input id="swal-name" class="swal2-input" placeholder="Full Name" value="${customerSearch}">
                <input id="swal-phone" class="swal2-input" placeholder="Phone Number">
                <input id="swal-address" class="swal2-input" placeholder="Address (Optional)">
            `,
            focusConfirm: false,
            showCancelButton: true,
            confirmButtonText: 'Add Customer',
            confirmButtonColor: '#007242',
            preConfirm: () => {
                const name = document.getElementById('swal-name').value;
                const phone = document.getElementById('swal-phone').value;
                const address = document.getElementById('swal-address').value;
                if (!name || !phone) {
                    Swal.showValidationMessage('Name and Phone are required');
                    return false;
                }
                return { name, phone, address };
            }
        });

        if (formValues) {
            try {
                Swal.fire({ title: 'Saving...', didOpen: () => Swal.showLoading() });
                const { data } = await api.post('/customers', formValues);
                if (data.success) {
                    setCustomers([...customers, data.customer]);
                    setSelectedCustomer(data.customer);
                    setCustomerSearch(data.customer.name);
                    setShowCustomerDropdown(false);
                    Swal.fire('Success', 'Customer added and selected.', 'success');
                }
            } catch (error) {
                Swal.fire('Error', error.response?.data?.message || 'Failed to add customer', 'error');
            }
        }
    };

  const subTotal = cart.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const totalTax = cart.reduce((sum, item) => {
      const prod = inventory.find(p => p.id === item.id);
      const taxRate = prod?.tax || 18;
      return sum + (item.qty * item.rate * (taxRate / 100));
  }, 0);
  const discountAmount = 0; // Can be made dynamic with a state
  const grandTotal = subTotal + totalTax - discountAmount;

  const handleProcessSale = () => {
    if (cart.length === 0) {
      Swal.fire('Empty Cart', 'Please add items to process sale.', 'info');
      return;
    }

    Swal.fire({
        title: isEditing ? 'Update Invoice' : 'Confirm Payment',
        html: `
            <div class="text-left py-2">
                <div class="flex justify-between mb-1">
                    <span class="text-gray-500">Customer:</span>
                    <span class="font-bold">${selectedCustomer ? selectedCustomer.name : 'Walk-in'}</span>
                </div>
                <div class="flex justify-between mb-1">
                    <span class="text-gray-500">Items:</span>
                    <span class="font-bold">${cart.length}</span>
                </div>
                <div class="flex justify-between mb-1 border-t pt-1 mt-2">
                    <span class="text-gray-800 font-bold">Total Amount:</span>
                    <span class="text-primary font-black text-lg">Rs. ${grandTotal.toFixed(2)}</span>
                </div>
                <div class="flex justify-between mt-2">
                    <span class="text-gray-500">Payment Via:</span>
                    <span class="badge bg-primary/10 text-primary border-none px-2 rounded font-bold">${paymentMode}</span>
                </div>
            </div>
        `,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: isEditing ? 'Update Bill' : 'Complete Sale & Print',
        confirmButtonColor: '#007242',
        cancelButtonColor: '#d33'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const saleData = cart.map(item => ({ id: item.id, qty: item.qty }));
            const metadata = { 
                customer: selectedCustomer || (customerSearch ? { name: customerSearch } : 'Walk-in'), 
                paymentMode,
                totalAmount: grandTotal,
                subTotal: subTotal,
                tax: totalTax,
                discount: discountAmount
            };
            
            const response = await sellItems(saleData, metadata, isEditing ? id : null);
            
            if (response.success) {
                setCart([]);
                setSelectedCustomer(null);
                setCustomerSearch('');
                Swal.fire({
                    icon: 'success',
                    title: isEditing ? 'Invoice Updated!' : 'Sale Successful!',
                    text: response.message,
                    timer: 2000,
                    showConfirmButton: false
                });
                if (isEditing) {
                    setTimeout(() => navigate('/sales/invoices'), 2000);
                }
            } else {
                Swal.fire('Failed', response.message, 'error');
            }
        }
    });
  };

  const { filteredInventory, paginatedInventory, totalPages } = useMemo(() => {
    const filtered = inventory.filter(item => {
        const searchLower = searchTerm.toLowerCase().trim();
        const matchesSearch = !searchLower || (
          item.name.toLowerCase().includes(searchLower) ||
          item.sku?.toLowerCase().includes(searchLower) ||
          item.batch?.toLowerCase().includes(searchLower)
        );
          
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        
        return matchesSearch && matchesCategory;
    });

    const totalPgs = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    const paged = filtered.slice(start, start + itemsPerPage);

    return { filteredInventory: filtered, paginatedInventory: paged, totalPages: totalPgs };
  }, [inventory, searchTerm, activeCategory, currentPage, itemsPerPage]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-4 bg-gray-50/50 dark:bg-gray-900 min-h-[calc(100vh-5rem)] text-gray-800 dark:text-gray-100 font-sans">
      
      {/* Left Panel: Catalog */}
      <div className="flex flex-col gap-5 w-full">
        
        {/* Header Section: Search & Filter */}
        <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-2 items-center shrink-0">
           {/* Search Input */}
           <div className="relative w-full md:w-72 lg:w-80 group shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    type="text" 
                    placeholder="Search medicines, SKU or scan QR..." 
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-primary/10 focus:shadow-sm outline-none transition-all font-medium text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm"
                />
           </div>
           
           {/* Vertical Divider (Hidden on mobile) */}
           <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 hidden md:block mx-2"></div>
           
           {/* Categories */}
           <div className="flex-1 w-full min-w-0 overflow-x-auto [&::-webkit-scrollbar]:hidden mask-linear-fade">
              <div className="flex gap-1">
                  {categories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => {
                            setActiveCategory(cat);
                            setCurrentPage(1);
                        }}
                        className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all duration-200 border border-transparent ${
                            activeCategory === cat 
                            ? 'bg-primary text-white shadow-md shadow-primary/20' 
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                          {cat}
                      </button>
                  ))}
              </div>
           </div>
        </div>

        {/* Product Grid */}
        <div className="w-full">
           {inventoryLoading ? (
               <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                   <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                   <p className="font-medium animate-pulse">Loading Medicines...</p>
               </div>
            ) : (
              <div className="flex flex-col gap-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                  {paginatedInventory.map((item) => (
                    <div 
                      key={item.id} 
                      onClick={() => item.stock > 0 && addToCart(item)}
                      className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl hover:border-primary/20 dark:hover:border-primary/20 transition-all duration-300 group flex flex-col justify-between relative overflow-hidden h-full ${item.stock === 0 ? 'opacity-60 grayscale cursor-not-allowed bg-gray-50 dark:bg-gray-800/50' : 'cursor-pointer hover:-translate-y-1'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wide border ${
                          item.stock > 10 ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-800' : 
                          item.stock > 0 ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-100 dark:border-orange-800' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-100 dark:border-red-800'
                        }`}>
                          {item.stock > 0 ? `${item.stock} left` : 'No Stock'}
                        </span>
                        {item.stock > 0 && (
                          <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 dark:text-gray-500 flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
                            <Plus size={16} strokeWidth={3} />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 flex items-center justify-center text-primary mb-3 group-hover:scale-110 transition-transform duration-300">
                          <Package size={32} />
                        </div>
                        <h3 className="font-bold text-gray-800 dark:text-gray-100 leading-snug group-hover:text-primary transition-colors line-clamp-2 w-full text-base">{item.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">{item.brand || 'Generic'} • {item.sku || 'SKU'}</p>
                      </div>
                      
                      <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700 w-full text-center">
                        <p className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">Rs. {item.rate}</p>
                      </div>
                    </div>
                  ))}
                  {filteredInventory.length === 0 && (
                    <div className="col-span-full h-64 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-800 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                        <Search size={32} className="opacity-40" />
                      </div>
                      <p className="font-medium text-lg text-gray-500 dark:text-gray-400">No medicines found</p>
                      <p className="text-sm">Try adjusting your search or filters</p>
                    </div>
                  )}
                </div>

                {filteredInventory.length > itemsPerPage && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      {`Showing `}
                      <span className="text-gray-900 dark:text-white">{(currentPage - 1) * itemsPerPage + 1}</span>
                      {` - `}
                      <span className="text-gray-900 dark:text-white">{Math.min(currentPage * itemsPerPage, filteredInventory.length)}</span>
                      {` of `}
                      <span className="text-gray-900 dark:text-white">{filteredInventory.length}</span>
                      {` items`}
                    </p>
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar max-w-full pb-2 sm:pb-0">
                      <button 
                        onClick={() => goToPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                      >
                        Prev
                      </button>
                      
                      <div className="flex items-center gap-1.5 px-2">
                        {[...Array(totalPages)].map((_, i) => {
                          const pageNum = i + 1;
                          if (totalPages > 5 && Math.abs(pageNum - currentPage) > 1 && pageNum !== 1 && pageNum !== totalPages) {
                            if (pageNum === 2 || pageNum === totalPages - 1) return <span key={pageNum} className="text-gray-300 dark:text-gray-600">...</span>;
                            return null;
                          }
                          
                          return (
                            <button 
                              key={pageNum}
                              onClick={() => goToPage(pageNum)}
                              className={`w-9 h-9 rounded-xl text-xs font-black transition-all shadow-sm active:scale-95 ${
                                currentPage === pageNum 
                                ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110' 
                                : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-primary'
                              }`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button 
                        onClick={() => goToPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-100 dark:border-gray-600 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-600 transition-all shadow-sm active:scale-95"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>

      {/* Right Panel: Cart */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl flex flex-col shrink-0 z-10">
          
          {/* Cart Header */}
          <div className="p-5 border-b border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 z-10 rounded-t-2xl">
               <div className="flex justify-between items-center mb-4">
                   <h2 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-white">
                       <ShoppingCart size={24} className="text-primary" /> {isEditing ? 'Edit Invoice' : 'Current Order'}
                   </h2>
                   <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400">
                       {isEditing ? id : '#POS-' + Date.now().toString().slice(-6)}
                   </div>
               </div>
               
               {/* Customer Input */}
               <div className="relative">
                   <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-1 flex items-center border border-gray-200 dark:border-gray-600 focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all">
                       <div className="p-2.5 text-gray-400 dark:text-gray-500"><User size={18} /></div>
                       <input 
                           type="text" 
                           placeholder="Search Customer (Name/Phone)" 
                           value={customerSearch}
                           onFocus={() => setShowCustomerDropdown(true)}
                           onChange={(e) => {
                               setCustomerSearch(e.target.value);
                               setSelectedCustomer(null);
                               setShowCustomerDropdown(true);
                           }}
                           className="bg-transparent w-full text-sm text-gray-700 dark:text-gray-200 placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none font-medium" 
                       />
                       {selectedCustomer && (
                           <button onClick={() => {setSelectedCustomer(null); setCustomerSearch('');}} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                               <XCircle size={16} />
                           </button>
                       )}
                   </div>
                   
                   {showCustomerDropdown && customerSearch.trim().length > 0 && !selectedCustomer && (
                       <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-[100] max-h-60 overflow-y-auto">
                           {filteredCustomers.length > 0 ? (
                               filteredCustomers.map(c => (
                                   <div 
                                       key={c._id}
                                       onClick={() => {
                                           setSelectedCustomer(c);
                                           setCustomerSearch(c.name);
                                           setShowCustomerDropdown(false);
                                       }}
                                       className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                   >
                                       <p className="font-bold text-sm text-gray-800 dark:text-gray-100">{c.name}</p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">{c.phone}</p>
                                   </div>
                               ))
                           ) : (
                               <div className="p-4 text-center">
                                   <p className="text-xs text-gray-500">No customer found. Will treat as walk-in: <span className="font-bold">"{customerSearch}"</span></p>
                                   <button 
                                       onClick={() => setShowCustomerDropdown(false)}
                                       className="mt-2 text-xs font-bold text-primary"
                                   >
                                       Use this name
                                   </button>
                               </div>
                           )}
                       </div>
                   )}
               </div>
          </div>

          {/* Cart Items List */}
          <div className="p-3 space-y-2 bg-gray-50/30 dark:bg-gray-900/30 max-h-[500px] overflow-y-auto custom-scrollbar">
               {cart.length === 0 ? (
                   <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600 gap-3 min-h-[200px]">
                       <div className="w-20 h-20 bg-gray-50 dark:bg-gray-750 rounded-full flex items-center justify-center">
                            <ShoppingCart size={40} className="opacity-20" />
                       </div>
                       <div className="text-center">
                            <p className="text-gray-900 dark:text-gray-300 font-semibold">Your cart is empty</p>
                            <p className="text-sm dark:text-gray-500">Tap on items to add them to the sale</p>
                       </div>
                   </div>
               ) : (
                   cart.map((item) => (
                       <div key={item.id} className="bg-white dark:bg-gray-750 p-3 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-3 group hover:border-primary/30 transition-all">
                           <div className="flex flex-col items-center gap-1">
                                <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 flex items-center justify-center transition-colors">
                                    <Plus size={12} strokeWidth={3} />
                                </button>
                                <span className="font-bold text-sm text-gray-800 dark:text-white w-6 text-center">{item.qty}</span>
                                <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-600 flex items-center justify-center transition-colors">
                                    <Minus size={12} strokeWidth={3} />
                                </button>
                           </div>
                           
                           <div className="flex-1 min-w-0">
                               <h4 className="font-bold text-gray-800 dark:text-white text-sm truncate">{item.name}</h4>
                               <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">₹{item.rate} / unit</p>
                           </div>

                           <div className="flex flex-col items-end gap-1">
                               <span className="font-bold text-gray-900 dark:text-white text-base">₹{item.amount.toFixed(2)}</span>
                               <button 
                                    onClick={() => removeFromCart(item.id)} 
                                    className="p-1.5 rounded-lg text-gray-300 dark:text-gray-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                    title="Remove Item"
                                >
                                   <Trash2 size={14} />
                               </button>
                           </div>
                       </div>
                   ))
               )}
          </div>

          {/* Payment Footer */}
          <div className="bg-white dark:bg-gray-800 p-5 border-t border-gray-200 dark:border-gray-700 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-20 rounded-b-2xl">
               <div className="space-y-3 mb-6">
                   <div className="flex justify-between text-sm">
                       <span className="text-gray-500 dark:text-gray-400 font-medium">Subtotal</span>
                       <span className="font-bold text-gray-900 dark:text-white">Rs. {subTotal.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                       <span className="text-gray-500 dark:text-gray-400 font-medium">Tax</span>
                       <span className="font-bold text-gray-900 dark:text-white">Rs. {totalTax.toFixed(2)}</span>
                   </div>
                   <div className="flex justify-between items-end pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
                       <span className="text-gray-500 dark:text-gray-400 font-bold">Total to Pay</span>
                       <span className="text-2xl font-black text-gray-900 dark:text-white">Rs. {grandTotal.toFixed(2)}</span>
                   </div>
               </div>

               {/* Payment Methods */}
               <div className="grid grid-cols-3 gap-3 mb-4">
                    {['Cash', 'Card', 'UPI'].map(mode => (
                        <button 
                            key={mode}
                            onClick={() => setPaymentMode(mode)}
                            className={`flex flex-col items-center justify-center py-2.5 rounded-xl border-2 transition-all duration-200 ${
                                paymentMode === mode 
                                ? 'bg-primary/5 dark:bg-primary/10 border-primary text-primary shadow-sm' 
                                : 'bg-transparent border-gray-100 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                            }`}
                        >
                            {mode === 'Cash' ? <Banknote size={20} /> : mode === 'Card' ? <CreditCard size={20} /> : <Smartphone size={20} />}
                            <span className="text-[11px] font-bold uppercase mt-1">{mode}</span>
                        </button>
                    ))}
               </div>

               <div className="flex gap-4">
                   <button 
                        onClick={clearCart}
                        disabled={cart.length === 0}
                        className="px-4 py-3.5 rounded-xl border border-red-100 dark:border-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 dark:hover:border-red-900/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Clear Cart"
                   >
                       <Trash2 size={20} />
                   </button>
                   <button 
                        onClick={handleProcessSale}
                        disabled={cart.length === 0}
                        className="flex-1 py-3.5 rounded-xl bg-gradient-to-r from-primary to-emerald-600 text-white font-bold hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                       {isEditing ? <CheckCircle size={20} /> : <Printer size={20} />}
                       <span>{isEditing ? 'Save Changes' : 'Process Payment'}</span>
                   </button>
               </div>
          </div>
      </div>

    </div>
  );
};

export default SalesEntry;
