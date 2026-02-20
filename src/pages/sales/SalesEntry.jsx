import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Trash2, Printer, Plus, Minus, CreditCard, Banknote, Smartphone, XCircle, CheckCircle, Package, ChevronLeft, ChevronRight, ChevronUp, ChevronDown } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import Swal from 'sweetalert2';
import api from '../../api/axios';

const getPackSize = (packingStr) => {
    if (!packingStr) return 1;
    const match = packingStr.toString().match(/(\d+)$/);
    return match ? parseInt(match[0]) : 1;
};

const SalesEntry = () => {
  const navigate = useNavigate();
  const { inventory, sellItems, loading: inventoryLoading } = useInventory();
  const [cart, setCart] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [viewMode, setViewMode] = useState('table');
  const { id } = useParams();
  const isEditing = !!id;

  const [categories, setCategories] = useState(['All']);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [customGst, setCustomGst] = useState('');

  // Focus Refs
  const itemSearchRef = useRef(null);
  const customerInputRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const processBtnRef = useRef(null);

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
            // Autofocus on load
            setTimeout(() => itemSearchRef.current?.focus(), 100);
        }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchInvoice = async () => {
        if (!isEditing || inventory.length === 0) return;
        try {
            setLoading(true);
            const { data } = await api.get(`/sales/${id}`);
            if (data.success && data.sale) {
                const sale = data.sale;
                if (sale.customer) {
                    setSelectedCustomer(sale.customer);
                    setCustomerSearch(sale.customer.name);
                } else {
                    setCustomerSearch(sale.customerName || 'Walk-in');
                }
                setPaymentMode(sale.paymentMethod || 'Cash');
                setCustomGst(sale.gstRate || '');
                const populatedCart = sale.items.map(item => {
                    const invItem = inventory.find(p => p.id === item.productId?._id || p.id === item.productId);
                    const packSize = invItem ? getPackSize(invItem.packing) : 1;
                    return {
                        id: item.productId?._id || item.productId,
                        name: item.name,
                        qty: item.quantity,
                        rate: item.price,
                        amount: item.subtotal,
                        stock: invItem ? invItem.stock + (item.quantity * packSize) : item.quantity 
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

  const [patientDetails, setPatientDetails] = useState({ name: '', age: '', gender: 'Male', mobile: '', address: '', doctorName: '', doctorAddress: '' });
  const [shippingDetails, setShippingDetails] = useState({ packingType: 'Box', boxCount: 0, polyCount: 0, isColdStorage: false });
  const [showExtraDetails, setShowExtraDetails] = useState(false);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    const currentQty = existingItem ? (Number(existingItem.qty) || 0) : 0;
    const packSize = getPackSize(product.packing);
    const neededUnits = (currentQty + 1) * packSize;

    if (neededUnits > product.stock) {
      Swal.fire({
          icon: 'warning',
          title: 'Stock Limit Reached',
          text: `Only ${Math.floor(product.stock / packSize)} Strips (${product.stock} Units) available!`,
          timer: 1500,
          showConfirmButton: false
      });
      return;
    }

    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, qty: currentQty + 1, amount: (currentQty + 1) * item.rate }
          : item
      ));
    } else {
      setCart([...cart, { ...product, qty: 1, amount: product.rate }]);
    }
  };

  const updateQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const currentQty = Number(item.qty) || 0;
        const newQty = currentQty + delta;
        if (newQty <= 0) return item; 
        
        const product = inventory.find(p => p.id === id);
        const packSize = getPackSize(product.packing);
        
        if ((newQty * packSize) > product.stock) {
            Swal.fire({
                icon: 'warning',
                title: 'Insufficient Stock',
                text: `Max available: ${Math.floor(product.stock / packSize)} Strips`,
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

  const handleManualQtyChange = (id, value) => {
    // Allow empty string for typing
    if (value === '') {
        setCart(cart.map(item => item.id === id ? { ...item, qty: '', amount: 0 } : item));
        return;
    }

    const newQty = parseInt(value);
    if (isNaN(newQty) || newQty < 0) return;

    const product = inventory.find(p => p.id === id);
    if (!product) return;

    const packSize = getPackSize(product.packing);
    
    if ((newQty * packSize) > product.stock) {
        Swal.fire({
            icon: 'warning',
            title: 'Stock Limit',
            text: `Only ${Math.floor(product.stock / packSize)} Strips available`,
            toast: true,
            position: 'top-end', 
            timer: 2000,
            showConfirmButton: false
        });
        return;
    }

    setCart(cart.map(item => 
      item.id === id 
        ? { ...item, qty: newQty, amount: newQty * item.rate }
        : item
    ));
  };

  const handleQtyBlur = (id) => {
      setCart(cart.map(item => {
          if (item.id === id) {
              if (item.qty === '' || item.qty === 0) {
                  return { ...item, qty: 1, amount: 1 * item.rate };
              }
          }
          return item;
      }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(item => item.id !== id));
  };

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
                  
                  // Auto-fill patient details
                  setPatientDetails(prev => ({
                      ...prev,
                      name: data.customer.name,
                      mobile: data.customer.phone || '',
                      address: data.customer.address || ''
                  }));
                  setShowExtraDetails(true);

                  Swal.fire('Success', 'Customer added and selected.', 'success');
                  // Move focus to payment after adding customer
                  setTimeout(() => paymentSelectRef.current?.focus(), 300);
              }
          } catch (error) {
              Swal.fire('Error', error.response?.data?.message || 'Failed to add customer', 'error');
          }
      }
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
                itemSearchRef.current?.focus();
            }
        })
    }
  }

  const subTotal = cart.reduce((sum, item) => sum + (item.qty * item.rate), 0);
  const gstRate = customGst !== '' ? parseFloat(customGst) || 0 : 0;
  const totalTax = (subTotal * gstRate) / 100;
  const discountAmount = 0;
  const grandTotal = subTotal + totalTax - discountAmount;

  const handleProcessSale = () => {
    if (cart.length === 0) {
      Swal.fire('Empty Cart', 'Please add items to process sale.', 'info');
      return;
    }
    
    // Validate mandatory customer details
    if (!patientDetails.name || !patientDetails.mobile) {
      Swal.fire({
        icon: 'warning',
        title: 'Customer Details Required',
        text: 'Please fill Customer Name and Mobile Number before proceeding.',
        confirmButtonColor: '#007242'
      });
      setShowExtraDetails(true);
      return;
    }
    Swal.fire({
        title: isEditing ? 'Update Invoice' : 'Confirm Payment',
        html: `<div class="text-left font-sans">Total: <b>Rs. ${grandTotal.toFixed(2)}</b></div>`,
        icon: 'success',
        showCancelButton: true,
        confirmButtonText: isEditing ? 'Update Bill' : 'Complete Sale',
        confirmButtonColor: '#007242',
    }).then(async (result) => {
        if (result.isConfirmed) {
            const saleData = cart.map(item => ({ id: item.id, qty: item.qty }));
            const metadata = { 
                customer: selectedCustomer || (customerSearch ? { name: customerSearch } : 'Walk-in'), 
                paymentMode,
                totalAmount: grandTotal,
                subTotal,
                tax: totalTax,
                discount: discountAmount,
                patientDetails,
                shippingDetails
            };
            const response = await sellItems(saleData, metadata, isEditing ? id : null);
            if (response.success) {
                setCart([]);
                setSelectedCustomer(null);
                setCustomerSearch('');
                setCustomGst('');
                // Reset patient and shipping details for next correct entry
                setPatientDetails({ name: '', age: '', gender: 'Male', mobile: '', address: '', doctorName: '', doctorAddress: '' });
                setShippingDetails({ packingType: 'Box', boxCount: 0, polyCount: 0, isColdStorage: false });
                setShowExtraDetails(false);

                // Sales Success Options
                Swal.fire({
                    icon: 'success',
                    title: 'Sale Completed!',
                    text: 'Invoice generated successfully.',
                    showDenyButton: true,
                    showCancelButton: true,
                    confirmButtonText: 'View Invoice',
                    denyButtonText: 'Print Now',
                    cancelButtonText: 'New Sale',
                    confirmButtonColor: '#003B5C',
                    denyButtonColor: '#007242', 
                    cancelButtonColor: '#6b7280'
                }).then((action) => {
                    if (action.isConfirmed) {
                        navigate(`/sales/invoices/view/${response.saleId}`);
                    } else if (action.isDenied) {
                        navigate(`/sales/invoices/view/${response.saleId}?autoPrint=true`);
                    } else {
                        // Stay on POS for new sale (items cleared above)
                        itemSearchRef.current?.focus();
                    }
                });
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
          item.batch?.toLowerCase().includes(searchLower) ||
          item.brand?.toLowerCase().includes(searchLower)
        );
        const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
        return matchesSearch && matchesCategory;
    });
    const totalPgs = Math.ceil(filtered.length / itemsPerPage);
    const start = (currentPage - 1) * itemsPerPage;
    return { filteredInventory: filtered, paginatedInventory: filtered.slice(start, start + itemsPerPage), totalPages: totalPgs };
  }, [inventory, searchTerm, activeCategory, currentPage, itemsPerPage]);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(customerSearch.toLowerCase()) ||
    c.phone?.includes(customerSearch)
  );

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // Keyboard navigation helpers
  const handleCustomerInputKeyDown = (e) => {
    if (e.key === 'Enter') {
        if (selectedCustomer) {
             paymentSelectRef.current?.focus();
             setShowCustomerDropdown(false);
        } else if (filteredCustomers.length > 0) {
             // Select first matching customer if not explicitly selected
             const c = filteredCustomers[0];
             setSelectedCustomer(c);
             setCustomerSearch(c.name);
             setPatientDetails(prev => ({
                ...prev,
                name: c.name,
                mobile: c.phone || '',
                address: c.address || ''
            }));
            setShowExtraDetails(true);
            setShowCustomerDropdown(false);
            paymentSelectRef.current?.focus();
        } else {
            // New Customer - Maybe trigger adding? Or just move focus?
            // If they press Enter on an unknown name, let's focus payment but keep name as text
            paymentSelectRef.current?.focus();
        }
    } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        // Ideally navigate dropdown list, but for now let's just show it
        setShowCustomerDropdown(true);
    }
  };

  const handlePaymentKeyDown = (e) => {
      if (e.key === 'Enter') {
          handleProcessSale();
      }
  };

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-6 bg-gray-50/50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100 font-sans">
      
      {/* 1. Item Catalog Section */}
      <div className="flex flex-col gap-5 w-full">
        <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-200/60 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-2 items-center shrink-0">
           <div className="relative w-full md:w-72 lg:w-80 group shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    ref={itemSearchRef}
                    type="text" 
                    placeholder="Search medicines... (Press Enter to Add)" 
                    value={searchTerm}
                    onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && paginatedInventory.length > 0) {
                            const item = paginatedInventory[0];
                            if (item.stock > 0) {
                                addToCart(item);
                                setSearchTerm('');
                            }
                        }
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border-none rounded-xl focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
           </div>
           <div className="flex items-center gap-2">
                <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
                    <button onClick={() => setViewMode('grid')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 text-primary' : 'text-gray-500'}`}>Grid</button>
                    <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-lg text-xs font-bold ${viewMode === 'table' ? 'bg-white dark:bg-gray-600 text-primary' : 'text-gray-500'}`}>Table</button>
                </div>
                <select value={itemsPerPage} onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }} className="bg-gray-100 dark:bg-gray-700 text-xs font-bold px-3 py-2 rounded-xl border-none">
                    <option value={10}>10 Rows</option>
                    <option value={20}>20 Rows</option>
                    <option value={50}>50 Rows</option>
                </select>
           </div>
           <div className="flex-1 overflow-x-auto no-scrollbar">
              <div className="flex gap-1">
                  {categories.map(cat => (
                      <button key={cat} onClick={() => { setActiveCategory(cat); setCurrentPage(1); }} className={`px-4 py-2 rounded-lg text-xs font-bold whitespace-nowrap ${activeCategory === cat ? 'bg-primary text-white' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{cat}</button>
                  ))}
              </div>
           </div>
        </div>

        <div className="w-full max-h-[400px] overflow-y-auto">
           {inventoryLoading ? (
               <div className="h-64 flex flex-col items-center justify-center text-gray-400">
                   <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mb-4"></div>
                   <p className="font-medium">Loading Medicines...</p>
               </div>
            ) : (
               <div className="flex flex-col gap-6">
                 {viewMode === 'grid' ? (
                   <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                     {paginatedInventory.map((item) => (
                       <div key={item.id} onClick={() => item.stock > 0 && addToCart(item)} className={`bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-100 dark:border-gray-700 shadow-sm transition-all ${item.stock === 0 ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer hover:-translate-y-1 hover:shadow-xl'}`}>
                         <div className="flex justify-between items-start mb-3">
                           <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${item.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{item.stock} left</span>
                           <Plus size={16} className="text-gray-300" />
                         </div>
                         <h3 className="font-bold text-sm truncate">{item.name}</h3>
                         <p className="text-[10px] text-gray-400">{item.brand || 'Generic'}</p>
                         <div className="mt-3 font-black text-primary">Rs. {item.rate}</div>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                     <div className="overflow-x-auto">
                       <table className="w-full text-left border-collapse">
                         <thead>
                           <tr className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                             <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400">Medicine & Brand</th>
                             <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400">Batch & Expiry</th>
                             <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400">Price</th>
                             <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Stock</th>
                             <th className="px-4 py-4 text-[10px] font-black uppercase text-gray-400 text-center">Action</th>
                           </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                           {paginatedInventory.map((item) => (
                             <tr key={item.id} onClick={() => item.stock > 0 && addToCart(item)} className="hover:bg-gray-50/80 transition-colors cursor-pointer capitalize">
                               <td className="px-4 py-3.5">
                                 <p className="font-bold text-sm">{item.name}</p>
                                 <p className="text-[10px] text-primary font-black uppercase">{item.brand || 'Generic'}</p>
                               </td>
                               <td className="px-4 py-3.5">
                                 <p className="text-xs">B: {item.batch || 'N/A'}</p>
                                 <p className="text-[10px] text-gray-400">Exp: {item.exp ? new Date(item.exp).toLocaleDateString() : 'N/A'}</p>
                               </td>
                               <td className="px-4 py-3.5 font-bold">₹{item.rate}</td>
                               <td className="px-4 py-3.5 text-center">
                                 <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${item.stock > 10 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>{item.stock} Units</span>
                               </td>
                               <td className="px-4 py-3.5 text-center">
                                 <button className="p-2 bg-primary text-white rounded-lg"><Plus size={16} /></button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                   </div>
                 )}
               </div>
            )}
        </div>
      </div>

      {/* 2. Cart Section */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4"><ShoppingCart className="text-primary"/> Current Order</h2>
            {cart.length === 0 ? <div className="text-center text-gray-400 py-10">Cart is empty. Search items above to add.</div> : (
                  <table className="w-full text-left">
                      <thead>
                        <tr className="text-[10px] font-black uppercase text-gray-400 border-b">
                          <th className="py-2">Item</th>
                          <th className="py-2 text-center">Qty</th>
                          <th className="py-2 text-right">Rate</th>
                          <th className="py-2 text-right">Amount</th>
                          <th className="py-2"></th>
                        </tr>
                      </thead>
                      <tbody>
                            {cart.map(item => (
                                <tr key={item.id} className="border-b last:border-0 hover:bg-gray-50 dark:hover:bg-gray-750">
                                      <td className="py-3 font-bold text-xs">{item.name}</td>
                                      <td className="py-3 text-center">
                                          <div className="flex justify-center gap-2 items-center">
                                                <button onClick={() => updateQty(item.id, -1)} className="p-1 bg-gray-100 rounded focus:ring-2 focus:ring-primary"><Minus size={14}/></button>
                                                <input 
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                                                    onBlur={() => handleQtyBlur(item.id)}
                                                    className="w-12 text-center text-xs font-bold border border-gray-200 rounded focus:border-primary outline-none py-1 mx-1" 
                                                />
                                                <button onClick={() => updateQty(item.id, 1)} className="p-1 bg-gray-100 rounded focus:ring-2 focus:ring-primary"><Plus size={14}/></button>
                                          </div>
                                      </td>
                                      <td className="py-3 text-right text-xs">₹{item.rate}</td>
                                      <td className="py-3 text-right text-xs font-bold">₹{item.amount.toFixed(2)}</td>
                                      <td className="py-3 text-right"><button onClick={() => removeFromCart(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={14}/></button></td>
                                </tr>
                            ))}
                      </tbody>
                  </table>
            )}
            {cart.length > 0 && (
                <div className="flex justify-end pt-4 border-t border-gray-100 mt-2">
                    <button onClick={clearCart} className="text-xs text-red-500 font-bold hover:underline flex items-center gap-1"><Trash2 size={12}/> Clear Cart</button>
                </div>
            )}
      </div>

      {/* 3. Customer Section */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
           <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><User className="text-primary"/> Customer Details</h2>
           <div className="relative">
                <div className="bg-gray-50 dark:bg-gray-750 rounded-xl p-1 flex items-center border border-gray-200 dark:border-gray-600 focus-within:border-primary ring-focus">
                    <div className="p-2.5 text-gray-400"><Search size={18} /></div>
                    <input 
                        ref={customerInputRef}
                        type="text" 
                        placeholder="Search Customer by Name or Phone (Enter to Select & Move to Payment)" 
                        value={customerSearch}
                        onFocus={() => setShowCustomerDropdown(true)}
                        onKeyDown={handleCustomerInputKeyDown}
                        onChange={(e) => {
                            setCustomerSearch(e.target.value);
                            setSelectedCustomer(null);
                            setShowCustomerDropdown(true);
                        }}
                        className="bg-transparent w-full text-sm outline-none font-medium p-1" 
                    />
                    {selectedCustomer && (
                        <div className="flex items-center gap-2 pr-2">
                            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">Selected</span>
                            <button onClick={() => {setSelectedCustomer(null); setCustomerSearch('');}} className="p-1 text-gray-400 hover:text-red-500">
                                <XCircle size={16} />
                            </button>
                        </div>
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
                                        setPatientDetails(prev => ({
                                            ...prev,
                                            name: c.name,
                                            mobile: c.phone || '',
                                            address: c.address || ''
                                        }));
                                        setShowExtraDetails(true);
                                        paymentSelectRef.current?.focus();
                                    }}
                                    className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0"
                                >
                                    <p className="font-bold text-sm">{c.name}</p>
                                    <p className="text-xs text-gray-500">{c.phone}</p>
                                </div>
                            ))
                        ) : (
                            <div className="p-4 text-center">
                                <p className="text-xs text-gray-500">No customer found. <span className="font-bold">"{customerSearch}"</span></p>
                                <button onClick={handleQuickAddCustomer} className="mt-2 text-xs font-bold text-primary">+ Add New Customer</button>
                            </div>
                        )}
                    </div>
                )}
            </div>
            
            <div className="mt-4">
                 <button 
                     onClick={() => setShowExtraDetails(!showExtraDetails)} 
                     className="text-xs font-bold text-gray-500 flex items-center gap-1 hover:text-primary transition-colors"
                 >
                     {showExtraDetails ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                     {showExtraDetails ? 'Hide Patient & Shipping Details' : 'Show Patient & Shipping Details'}
                 </button>
                 
                 {showExtraDetails && (
                     <div className="mt-3 p-4 rounded-xl bg-gray-50/50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4">
                         {/* Patient Info */}
                         <div className="space-y-3">
                            <h4 className="text-xs font-black uppercase text-gray-400">Patient info</h4>
                            <div className="grid grid-cols-2 gap-2">
                                <input placeholder="Patient Name" value={patientDetails.name} onChange={e => setPatientDetails({...patientDetails, name: e.target.value})} className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" />
                                <input placeholder="Mobile" value={patientDetails.mobile} onChange={e => setPatientDetails({...patientDetails, mobile: e.target.value})} className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" />
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <input placeholder="Age" value={patientDetails.age} onChange={e => setPatientDetails({...patientDetails, age: e.target.value})} className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" />
                                <select value={patientDetails.gender} onChange={e => setPatientDetails({...patientDetails, gender: e.target.value})} className="col-span-2 w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary">
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                             <input placeholder="Address" value={patientDetails.address} onChange={e => setPatientDetails({...patientDetails, address: e.target.value})} className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" />
                         </div>

                         {/* Shipping Info */}
                         <div className="space-y-3">
                             <h4 className="text-xs font-black uppercase text-gray-400">Shipping & Doctor</h4>
                             <div className="grid grid-cols-2 gap-2">
                                 <input placeholder="Doctor Name" value={patientDetails.doctorName} onChange={e => setPatientDetails({...patientDetails, doctorName: e.target.value})} className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" />
                                 <input placeholder="Doctor Address" value={patientDetails.doctorAddress} onChange={e => setPatientDetails({...patientDetails, doctorAddress: e.target.value})} className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" />
                             </div>
                             <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                 <div className="flex gap-4 mb-2">
                                     <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="pack" checked={shippingDetails.packingType === 'Box'} onChange={() => setShippingDetails({...shippingDetails, packingType: 'Box'})}/> Box</label>
                                     <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="pack" checked={shippingDetails.packingType === 'Poly'} onChange={() => setShippingDetails({...shippingDetails, packingType: 'Poly'})}/> Poly</label>
                                     <label className="flex items-center gap-1 cursor-pointer ml-auto text-xs"><input type="checkbox" checked={shippingDetails.isColdStorage} onChange={e => setShippingDetails({...shippingDetails, isColdStorage: e.target.checked})}/> <span className="text-blue-500 font-bold">Cold ❄️</span></label>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                     <input type="number" placeholder="Box Count" value={shippingDetails.boxCount} onChange={e => setShippingDetails({...shippingDetails, boxCount: Number(e.target.value)})} className="w-full p-1.5 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none" />
                                     <input type="number" placeholder="Poly Count" value={shippingDetails.polyCount} onChange={e => setShippingDetails({...shippingDetails, polyCount: Number(e.target.value)})} className="w-full p-1.5 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none" />
                                 </div>
                             </div>
                         </div>
                     </div>
                 )}
            </div>
      </div>

      {/* 4. Payment & Totals Section */}
      <div className="w-full bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6 flex flex-col md:flex-row gap-8 items-center">
            <div className="flex-1 w-full space-y-4">
                 <div className="space-y-2">
                      <label className="text-xs uppercase font-bold text-gray-400 block">Payment Method</label>
                      <select 
                          ref={paymentSelectRef}
                          value={paymentMode} 
                          onChange={(e) => setPaymentMode(e.target.value)}
                          onKeyDown={handlePaymentKeyDown}
                          className="w-full md:w-3/4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-lg font-bold outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                      >
                          <option value="Cash">Cash 💵</option>
                          <option value="Card">Card 💳</option>
                          <option value="UPI">UPI 📱</option>
                          <option value="Credit">Credit (Udhaar) ⏳</option>
                          <option value="Bank Transfer">Bank Transfer 🏦</option>
                      </select>
                      <p className="text-[10px] text-gray-400">Press <span className="font-bold border px-1 rounded">Enter</span> to complete sale</p>
                 </div>
            </div>

            <div className="flex-1 w-full bg-gray-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
                 <div className="space-y-2">
                      <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>₹{subTotal.toFixed(2)}</span></div>
                      <div className="flex justify-between items-center text-sm text-gray-500">
                        <span>GST</span>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={customGst} 
                            onChange={(e) => setCustomGst(e.target.value)}
                            className="w-16 px-2 py-1 text-xs text-right border border-gray-300 dark:border-gray-600 rounded outline-none focus:border-primary dark:bg-gray-700"
                          />
                          <span>%</span>
                          <span className="font-bold">₹{totalTax.toFixed(2)}</span>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-dashed border-gray-300 dark:border-gray-600 flex justify-between items-end">
                           <span className="text-sm font-black uppercase text-gray-600 dark:text-gray-400">Grand Total</span>
                           <span className="text-4xl font-black text-primary">₹{grandTotal.toFixed(2)}</span>
                      </div>
                 </div>
                 <div className="mt-6">
                      <button 
                          ref={processBtnRef}
                          onClick={handleProcessSale} 
                          disabled={cart.length === 0} 
                          className="w-full bg-primary hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/30 disabled:opacity-50 disabled:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
                      >
                          <CheckCircle size={20} />
                          {isEditing ? 'Update Bill' : 'Process Payment'}
                      </button>
                 </div>
            </div>
      </div>
    </div>
  );
};

export default SalesEntry;
