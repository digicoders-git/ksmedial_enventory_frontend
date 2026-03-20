import { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, User, Trash2, Printer, Plus, Minus, CreditCard, Banknote, Smartphone, XCircle, CheckCircle, Package, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Calendar, MapPin } from 'lucide-react';
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
  const { inventory, sellItems, loading: inventoryLoading, fetchInventory } = useInventory();
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
  const [showPatientNameSuggestions, setShowPatientNameSuggestions] = useState(false);
  const [showPatientMobileSuggestions, setShowPatientMobileSuggestions] = useState(false);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [loading, setLoading] = useState(true);
  const [customGst, setCustomGst] = useState('');

  // Keyboard Navigation States
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchesForSelection, setBatchesForSelection] = useState([]);
  const [selectedProductForBatch, setSelectedProductForBatch] = useState(null);
  const [highlightedBatchIndex, setHighlightedBatchIndex] = useState(0);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [cartHighlightedIndex, setCartHighlightedIndex] = useState(-1);
  const [cartColumnIndex, setCartColumnIndex] = useState(0); // 0: Qty, 1: Remove
  const [focusedSection, setFocusedSection] = useState('search');
  const [customerHighlightedIndex, setCustomerHighlightedIndex] = useState(0);

  // Focus Refs
  const itemSearchRef = useRef(null);
  const customerInputRef = useRef(null);
  const patientNameRef = useRef(null);
  const patientMobileRef = useRef(null);
  const patientAgeRef = useRef(null);
  const paymentSelectRef = useRef(null);
  const processBtnRef = useRef(null);
  const batchModalRef = useRef(null);
  const patientAddressRef = useRef(null);
  const patientGenderRef = useRef(null);
  const doctorNameRef = useRef(null);
  const doctorAddressRef = useRef(null);
  const boxCountRef = useRef(null);
  const polyCountRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [catRes, custRes] = await Promise.all([
                api.get('/categories'),
                api.get('/customers'),
                fetchInventory() // Ensure inventory is fresh on mount
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
  }, []); // Run only once on mount

  useEffect(() => {
    // Refresh inventory whenever window gets focus (e.g. returning from another tab where GRN was added)
    const handleFocus = () => fetchInventory();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchInventory]);

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

  const addToCart = (product, batchData = null) => {
    const batchKey = batchData?._id || product.batch;
    const existingItem = cart.find(item => item.id === product.id && item.batchKey === batchKey);
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
        item.id === product.id && item.batchKey === batchKey
          ? { ...item, qty: currentQty + 1, amount: (currentQty + 1) * item.rate }
          : item
      ));
    } else {
      const cartItem = { 
        ...product, 
        qty: 1, 
        amount: product.rate,
        batchId: batchData?._id,
        batchKey: batchKey,
        batchNumber: batchData?.batchNumber || product.batch,
        expiryDate: batchData?.expiryDate || product.exp
      };
      setCart([...cart, cartItem]);
    }
  };

  const fetchBatchesForProduct = async (product) => {
    try {
      setLoadingBatches(true);
      const { data } = await api.get(`/batches/product/${product.id}`);
      if (data.success && data.batches) {
        const activeBatches = data.batches.filter(b => b.status === 'Active' && b.quantity > 0);
        return activeBatches;
      }
      return [];
    } catch (error) {
      console.error('Error fetching batches:', error);
      return [];
    } finally {
      setLoadingBatches(false);
    }
  };

  const handleProductSelection = async (product) => {
    if (product.stock === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Out of Stock',
        text: 'This product is currently out of stock.',
        timer: 1500,
        showConfirmButton: false
      });
      return;
    }
    
    // Try to fetch batches from API
    const batches = await fetchBatchesForProduct(product);
    
    // If API returns multiple batches, show modal
    if (batches.length > 1) {
      setSelectedProductForBatch(product);
      setBatchesForSelection(batches);
      setHighlightedBatchIndex(0);
      setShowBatchModal(true);
    } 
    // If API returns single batch, use it
    else if (batches.length === 1) {
      addToCart(product, batches[0]);
      setSearchTerm('');
      setHighlightedIndex(-1);
    } 
    // If no batches from API, use product's existing batch data (from inventory context)
    else {
      addToCart(product, null);
      setSearchTerm('');
      setHighlightedIndex(-1);
    }
  };

  const handleBatchSelection = (batch) => {
    if (selectedProductForBatch) {
      addToCart(selectedProductForBatch, batch);
      setShowBatchModal(false);
      setBatchesForSelection([]);
      setSelectedProductForBatch(null);
      setHighlightedBatchIndex(0);
      setSearchTerm('');
      setHighlightedIndex(-1);
      itemSearchRef.current?.focus();
    }
  };

  const updateQty = (id, batchKey, delta) => {
    setCart(cart.map(item => {
      if (item.id === id && item.batchKey === batchKey) {
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

  const removeFromCart = (id, batchKey) => {
    setCart(cart.filter(item => !(item.id === id && item.batchKey === batchKey)));
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
    if (!patientDetails.name.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Patient Name Required',
        text: 'Please enter the patient or customer name.',
        confirmButtonColor: '#007242'
      });
      setShowExtraDetails(true);
      setTimeout(() => patientNameRef.current?.focus(), 500);
      return;
    }

    if (!patientDetails.mobile || patientDetails.mobile.length !== 10) {
      Swal.fire({
        icon: 'warning',
        title: 'Valid Mobile Required',
        text: 'Please enter a valid 10-digit mobile number.',
        confirmButtonColor: '#007242'
      });
      setShowExtraDetails(true);
      setTimeout(() => patientMobileRef.current?.focus(), 500);
      return;
    }

    if (!patientDetails.age || isNaN(patientDetails.age) || patientDetails.age <= 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Valid Age Required',
        text: 'Please enter a valid age for the patient.',
        confirmButtonColor: '#007242'
      });
      setShowExtraDetails(true);
      setTimeout(() => patientAgeRef.current?.focus(), 500);
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
            // Verify customer based on mobile number
            let finalCustomer = null;
            if (patientDetails.mobile) {
                // Check if this mobile exists in our list
                finalCustomer = customers.find(c => c.phone === patientDetails.mobile);
                
                if (!finalCustomer && patientDetails.name) {
                    // Create New Customer automatically as requested
                    try {
                        const custRes = await api.post('/customers', {
                            name: patientDetails.name,
                            phone: patientDetails.mobile,
                            address: patientDetails.address
                        });
                        if (custRes.data.success) {
                            finalCustomer = custRes.data.customer;
                            setCustomers(prev => [...prev, finalCustomer]);
                        }
                    } catch (err) {
                        console.error("Auto-customer creation failed:", err);
                    }
                }
            }

            const saleData = cart.map(item => ({ id: item.id, qty: item.qty }));
            const metadata = { 
                customer: finalCustomer || (patientDetails.name ? { name: patientDetails.name } : (customerSearch ? { name: customerSearch } : 'Walk-in')),
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
        e.preventDefault();
        if (customerSearch.trim() === '') {
            // If search is empty, and Enter is pressed, maybe focus payment?
            setShowCustomerDropdown(false);
            paymentSelectRef.current?.focus();
        } else if (customerHighlightedIndex >= 0 && filteredCustomers[customerHighlightedIndex]) {
             const c = filteredCustomers[customerHighlightedIndex];
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
        setShowCustomerDropdown(true);
        setCustomerHighlightedIndex(prev => 
            prev < filteredCustomers.length - 1 ? prev + 1 : prev
        );
    } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setCustomerHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
    }
  };

  const handlePaymentKeyDown = (e) => {
      if (e.key === 'Enter') {
          e.preventDefault();
          handleProcessSale();
      }
  };

  useEffect(() => {
    if (showBatchModal && batchModalRef.current) {
      batchModalRef.current.focus();
    }
  }, [showBatchModal]);

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (showBatchModal) return;
      
      if (e.key === 'F2') {
        e.preventDefault();
        setFocusedSection('search');
        itemSearchRef.current?.focus();
        setHighlightedIndex(-1);
        setCartHighlightedIndex(-1);
      } else if (e.key === 'F3') {
           if (cart.length > 0) {
             e.preventDefault();
             setFocusedSection('cart');
             setCartHighlightedIndex(0);
           }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setFocusedSection('patient');
        setShowExtraDetails(true);
        setTimeout(() => customerInputRef.current?.focus(), 100);
      } else if (e.key === 'F5') {
        e.preventDefault();
        setFocusedSection('payment');
        setTimeout(() => paymentSelectRef.current?.focus(), 100);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart.length, showBatchModal, focusedSection]);

  const handlePatientNameKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const matches = customers.filter(c => c.name.toLowerCase().includes(patientDetails.name.toLowerCase()));
        if (matches.length > 0) {
            const first = matches[0];
            setSelectedCustomer(first);
            setCustomerSearch(first.name);
            setPatientDetails({
                ...patientDetails,
                name: first.name,
                mobile: first.phone || '',
                address: first.address || ''
            });
            setShowPatientNameSuggestions(false);
        }
        patientMobileRef.current?.focus();
    }
  };

  const handlePatientMobileKeyDown = (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const matches = customers.filter(c => c.phone?.includes(patientDetails.mobile));
        if (matches.length > 0) {
            const first = matches[0];
            setSelectedCustomer(first);
            setCustomerSearch(first.name);
            setPatientDetails({
                ...patientDetails,
                name: first.name,
                mobile: first.phone || '',
                address: first.address || ''
            });
            setShowPatientMobileSuggestions(false);
        }
        patientAgeRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col gap-6 p-2 lg:p-6 bg-gray-50/50 dark:bg-gray-900 min-h-screen text-gray-800 dark:text-gray-100 font-sans">
      
      {/* Batch Selection Modal */}
      {showBatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div 
            ref={batchModalRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden border-2 border-primary"
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                setShowBatchModal(false);
                setBatchesForSelection([]);
                setSelectedProductForBatch(null);
                itemSearchRef.current?.focus();
              } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setHighlightedBatchIndex(prev => 
                  prev < batchesForSelection.length - 1 ? prev + 1 : prev
                );
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setHighlightedBatchIndex(prev => prev > 0 ? prev - 1 : 0);
              } else if (e.key === 'Enter') {
                e.preventDefault();
                if (batchesForSelection[highlightedBatchIndex]) {
                  handleBatchSelection(batchesForSelection[highlightedBatchIndex]);
                }
              }
            }}
            tabIndex={0}
          >
            <div className="bg-gradient-to-r from-primary to-emerald-600 p-6 text-white">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Package size={28} />
                Select Batch for {selectedProductForBatch?.name}
              </h2>
              <p className="text-sm mt-2 opacity-90">Multiple batches available. Use ↑↓ to navigate, Enter to select, Esc to cancel</p>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {loadingBatches ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-3">
                  {batchesForSelection.map((batch, idx) => (
                    <div
                      key={batch._id}
                      onClick={() => handleBatchSelection(batch)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        highlightedBatchIndex === idx
                          ? 'border-primary bg-primary/5 shadow-lg scale-[1.02]'
                          : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-black text-sm">
                              Batch: {batch.batchNumber}
                            </span>
                            <span className={`px-3 py-1 rounded-lg font-bold text-xs ${
                              new Date(batch.expiryDate) < new Date(Date.now() + 90*24*60*60*1000)
                                ? 'bg-red-100 text-red-600'
                                : 'bg-emerald-100 text-emerald-600'
                            }`}>
                              <Calendar size={12} className="inline mr-1" />
                              Exp: {new Date(batch.expiryDate).toLocaleDateString('en-IN')}
                            </span>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Available Qty</p>
                              <p className="font-black text-lg text-primary">{batch.quantity} Units</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">MRP</p>
                              <p className="font-bold text-lg">₹{batch.mrp}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                              <p className="font-bold flex items-center gap-1">
                                <MapPin size={14} className="text-primary" />
                                {batch.rackLocation || 'N/A'}
                              </p>
                            </div>
                          </div>
                        </div>
                        {highlightedBatchIndex === idx && (
                          <div className="ml-4">
                            <CheckCircle size={32} className="text-primary" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowBatchModal(false);
                  setBatchesForSelection([]);
                  setSelectedProductForBatch(null);
                  itemSearchRef.current?.focus();
                }}
                className="px-6 py-2.5 rounded-xl font-bold text-gray-600 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
              >
                Cancel (Esc)
              </button>
              <button
                onClick={() => {
                  if (batchesForSelection[highlightedBatchIndex]) {
                    handleBatchSelection(batchesForSelection[highlightedBatchIndex]);
                  }
                }}
                className="px-6 py-2.5 rounded-xl font-bold bg-primary text-white hover:bg-emerald-700 transition-all shadow-lg"
              >
                Select Batch (Enter)
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Item Catalog Section */}
      <div className="flex flex-col gap-5 w-full">
        <div className={`bg-white dark:bg-gray-800 p-2 rounded-2xl border transition-all ${focusedSection === 'search' ? 'border-primary ring-2 ring-primary/20 shadow-md' : 'border-gray-200/60 dark:border-gray-700 shadow-sm'} flex flex-col md:flex-row gap-2 items-center shrink-0`}>
           <div className="relative w-full md:w-72 lg:w-80 group shrink-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 group-focus-within:text-primary transition-colors" size={18} />
                <input 
                    ref={itemSearchRef}
                    type="text" 
                    placeholder="Search... (↑↓ Navigate | Enter Select | Tab/→ Cart | F2 Focus)" 
                    value={searchTerm}
                    onChange={(e) => { 
                      setSearchTerm(e.target.value); 
                      setCurrentPage(1); 
                      setHighlightedIndex(-1);
                      setFocusedSection('search');
                    }}
                    onFocus={() => setFocusedSection('search')}
                    onKeyDown={(e) => {
                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setHighlightedIndex(prev => 
                              prev < paginatedInventory.length - 1 ? prev + 1 : prev
                            );
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                        } else if (e.key === 'Enter') {
                            e.preventDefault();
                            if (highlightedIndex >= 0 && paginatedInventory[highlightedIndex]) {
                                handleProductSelection(paginatedInventory[highlightedIndex]);
                            } else if (paginatedInventory.length > 0) {
                                handleProductSelection(paginatedInventory[0]);
                            }
                        } else if (e.key === 'Tab') {
                            if (e.shiftKey) {
                                e.preventDefault();
                                processBtnRef.current?.focus();
                            } else if (cart.length > 0) {
                                e.preventDefault();
                                setFocusedSection('cart');
                                setCartHighlightedIndex(0);
                                setCartColumnIndex(0);
                                document.getElementById('cart-section-container')?.focus();
                            } else {
                                e.preventDefault();
                                setFocusedSection('customer');
                                customerInputRef.current?.focus();
                            }
                        } else if (e.key === 'ArrowRight' && cart.length > 0) {
                            e.preventDefault();
                            setFocusedSection('cart');
                            setCartHighlightedIndex(0);
                        } else if (e.key === 'PageDown') {
                            e.preventDefault();
                            goToPage(currentPage + 1);
                            setHighlightedIndex(0);
                        } else if (e.key === 'PageUp') {
                            e.preventDefault();
                            goToPage(currentPage - 1);
                            setHighlightedIndex(0);
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
                           {paginatedInventory.map((item, idx) => (
                             <tr 
                               key={item.id} 
                               onClick={() => item.stock > 0 && handleProductSelection(item)} 
                               className={`transition-colors cursor-pointer capitalize ${
                                 highlightedIndex === idx 
                                   ? 'bg-primary/10 ring-2 ring-primary ring-inset' 
                                   : 'hover:bg-gray-50/80 dark:hover:bg-gray-700/50'
                               }`}
                             >
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
      <div 
        id="cart-section-container"
        className={`w-full bg-white dark:bg-gray-800 rounded-2xl border-2 shadow-sm p-4 transition-all ${
          focusedSection === 'cart' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700'
        }`}
        tabIndex={focusedSection === 'cart' ? 0 : -1}
        onKeyDown={(e) => {
          if (focusedSection !== 'cart' || cart.length === 0) return;
          
          if (e.key === 'Tab') {
            e.preventDefault();
            if (e.shiftKey) {
                setFocusedSection('search');
                itemSearchRef.current?.focus();
            } else {
                setFocusedSection('customer');
                customerInputRef.current?.focus();
            }
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setCartHighlightedIndex(prev => prev < cart.length - 1 ? prev + 1 : prev);
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setCartHighlightedIndex(prev => prev > 0 ? prev - 1 : 0);
          } else if (e.key === 'ArrowLeft') {
            e.preventDefault();
            setCartColumnIndex(prev => Math.max(0, prev - 1));
          } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            setCartColumnIndex(prev => Math.min(1, prev + 1));
          } else if (e.key === 'Enter') {
            e.preventDefault();
            if (cartColumnIndex === 1 && cartHighlightedIndex >= 0) {
              const item = cart[cartHighlightedIndex];
              if (item) {
                removeFromCart(item.id, item.batchKey);
                setCartHighlightedIndex(prev => Math.max(0, prev - 1));
              }
            }
          } else if ((e.key === '+' || e.key === '=') && cartHighlightedIndex >= 0) {
            e.preventDefault();
            const item = cart[cartHighlightedIndex];
            if (item) updateQty(item.id, item.batchKey, 1);
          } else if ((e.key === '-' || e.key === '_') && cartHighlightedIndex >= 0) {
            e.preventDefault();
            const item = cart[cartHighlightedIndex];
            if (item) updateQty(item.id, item.batchKey, -1);
          } else if (e.key === 'Delete' && cartHighlightedIndex >= 0) {
            e.preventDefault();
            const item = cart[cartHighlightedIndex];
            if (item) {
              removeFromCart(item.id, item.batchKey);
              setCartHighlightedIndex(prev => Math.max(0, prev - 1));
            }
          } else if (e.key === 'Escape') {
            e.preventDefault();
            setFocusedSection('search');
            itemSearchRef.current?.focus();
            setCartHighlightedIndex(-1);
          }
        }}
      >
            <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
              <ShoppingCart className="text-primary"/> 
              Current Order
              {focusedSection === 'cart' && cart.length > 0 && (
                <span className="text-xs font-normal text-primary ml-auto animate-pulse">
                  ↑↓ Navigate Rows | ←→ Navigate Cells | +/- Qty | Enter/Del Remove | Tab Next
                </span>
              )}
            </h2>
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
                            {cart.map((item, idx) => (
                                <tr 
                                  key={`${item.id}-${item.batchKey}-${idx}`}
                                  className={`border-b last:border-0 transition-all ${
                                    focusedSection === 'cart' && cartHighlightedIndex === idx
                                      ? 'bg-primary/5 scale-[1.01]'
                                      : 'hover:bg-gray-50 dark:hover:bg-gray-750'
                                  }`}
                                >
                                      <td className="py-3 font-bold text-xs">{item.name}</td>
                                      <td className="py-3 text-center">
                                          <div className={`flex justify-center gap-2 items-center p-1 rounded transition-colors ${focusedSection === 'cart' && cartHighlightedIndex === idx && cartColumnIndex === 0 ? 'ring-2 ring-primary bg-white' : ''}`}>
                                                <button onClick={() => updateQty(item.id, item.batchKey, -1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Minus size={14}/></button>
                                                <input 
                                                    type="number"
                                                    value={item.qty}
                                                    onChange={(e) => handleManualQtyChange(item.id, e.target.value)}
                                                    onBlur={() => handleQtyBlur(item.id)}
                                                    className="w-12 text-center text-xs font-bold border border-gray-200 rounded outline-none py-1 mx-1" 
                                                    tabIndex={-1}
                                                />
                                                <button onClick={() => updateQty(item.id, item.batchKey, 1)} className="p-1 bg-gray-100 rounded hover:bg-gray-200"><Plus size={14}/></button>
                                          </div>
                                      </td>
                                      <td className="py-3 text-right text-xs">₹{item.rate}</td>
                                      <td className="py-3 text-right text-xs font-bold">₹{item.amount.toFixed(2)}</td>
                                      <td className="py-3 text-right">
                                        <button 
                                          onClick={() => removeFromCart(item.id, item.batchKey)} 
                                          className={`p-1.5 rounded transition-colors ${focusedSection === 'cart' && cartHighlightedIndex === idx && cartColumnIndex === 1 ? 'ring-2 ring-red-500 bg-red-50 text-red-600' : 'text-red-400 hover:text-red-600'}`}
                                          tabIndex={-1}
                                        >
                                          <Trash2 size={14}/>
                                        </button>
                                      </td>
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
      <div className={`w-full bg-white dark:bg-gray-800 rounded-2xl border shadow-sm p-5 transition-all ${focusedSection === 'customer' || focusedSection === 'patient' ? 'border-primary ring-2 ring-primary/20' : 'border-gray-200 dark:border-gray-700'}`}>
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
                                    className={`p-3 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-0 transition-colors ${
                                        customerHighlightedIndex === filteredCustomers.indexOf(c)
                                            ? 'bg-primary/10 ring-2 ring-primary ring-inset'
                                            : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                                    }`}
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
                                <div className="relative">
                                    <input 
                                        ref={patientNameRef}
                                        placeholder="Patient Name" 
                                        value={patientDetails.name} 
                                        onFocus={() => {
                                          setShowPatientNameSuggestions(true);
                                          setFocusedSection('patient');
                                        }}
                                        onBlur={() => setTimeout(() => setShowPatientNameSuggestions(false), 200)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            patientAgeRef.current?.focus();
                                          } else if (e.key === 'ArrowRight') {
                                            e.preventDefault();
                                            patientMobileRef.current?.focus();
                                          } else if (e.key === 'Tab') {
                                            e.preventDefault();
                                            patientMobileRef.current?.focus();
                                          } else {
                                            handlePatientNameKeyDown(e);
                                          }
                                        }}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setPatientDetails({...patientDetails, name: val});
                                            setShowPatientNameSuggestions(true);
                                        }} 
                                        className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" 
                                    />
                                    {showPatientNameSuggestions && patientDetails.name.length > 1 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[110] max-h-40 overflow-y-auto">
                                            {customers.filter(c => c.name.toLowerCase().includes(patientDetails.name.toLowerCase())).map(c => (
                                                <div 
                                                    key={c._id}
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setCustomerSearch(c.name);
                                                        setPatientDetails({
                                                            ...patientDetails,
                                                            name: c.name,
                                                            mobile: c.phone || '',
                                                            address: c.address || ''
                                                        });
                                                        setShowPatientNameSuggestions(false);
                                                    }}
                                                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-[11px] border-b last:border-0"
                                                >
                                                    <p className="font-bold">{c.name}</p>
                                                    <p className="text-gray-400">{c.phone}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="relative">
                                    <input 
                                        ref={patientMobileRef}
                                        placeholder="Mobile" 
                                        value={patientDetails.mobile} 
                                        onFocus={() => {
                                          setShowPatientMobileSuggestions(true);
                                          setFocusedSection('patient');
                                        }}
                                        onBlur={() => setTimeout(() => setShowPatientMobileSuggestions(false), 200)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'ArrowDown') {
                                            e.preventDefault();
                                            // Focus gender select or age? Age is below name, Gender is below Mobile
                                            document.getElementById('patient-gender-select')?.focus();
                                          } else if (e.key === 'ArrowLeft') {
                                            e.preventDefault();
                                            patientNameRef.current?.focus();
                                          } else if (e.key === 'Tab') {
                                            e.preventDefault();
                                            patientAgeRef.current?.focus();
                                          } else {
                                            handlePatientMobileKeyDown(e);
                                          }
                                        }}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                                            setPatientDetails({...patientDetails, mobile: val});
                                            setShowPatientMobileSuggestions(true);
                                        }} 
                                        className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" 
                                    />
                                    {showPatientMobileSuggestions && patientDetails.mobile.length > 2 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-[110] max-h-40 overflow-y-auto">
                                            {customers.filter(c => c.phone?.includes(patientDetails.mobile)).map(c => (
                                                <div 
                                                    key={c._id}
                                                    onClick={() => {
                                                        setSelectedCustomer(c);
                                                        setCustomerSearch(c.name);
                                                        setPatientDetails({
                                                            ...patientDetails,
                                                            name: c.name,
                                                            mobile: c.phone || '',
                                                            address: c.address || ''
                                                        });
                                                        setShowPatientMobileSuggestions(false);
                                                    }}
                                                    className="p-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer text-[11px] border-b last:border-0"
                                                >
                                                    <p className="font-bold">{c.phone}</p>
                                                    <p className="text-gray-400">{c.name}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                <input 
                                    ref={patientAgeRef}
                                    placeholder="Age" 
                                    value={patientDetails.age} 
                                    onChange={e => {
                                        const val = e.target.value.replace(/\D/g, '').slice(0, 3);
                                        setPatientDetails({...patientDetails, age: val});
                                    }} 
                                    onFocus={() => setFocusedSection('patient')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        paymentSelectRef.current?.focus();
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        patientNameRef.current?.focus();
                                      } else if (e.key === 'ArrowRight') {
                                        e.preventDefault();
                                        document.getElementById('patient-gender-select')?.focus();
                                      } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        document.getElementById('patient-address-input')?.focus();
                                      } else if (e.key === 'Tab') {
                                        e.preventDefault();
                                        document.getElementById('patient-gender-select')?.focus();
                                      }
                                    }}
                                    className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" 
                                />
                                <select 
                                    ref={patientGenderRef}
                                    id="patient-gender-select"
                                    value={patientDetails.gender} 
                                    onChange={e => setPatientDetails({...patientDetails, gender: e.target.value})} 
                                    onFocus={() => setFocusedSection('patient')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        patientMobileRef.current?.focus();
                                      } else if (e.key === 'ArrowLeft') {
                                        e.preventDefault();
                                        patientAgeRef.current?.focus();
                                      } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        patientAddressRef.current?.focus();
                                      } else if (e.key === 'Tab') {
                                        e.preventDefault();
                                        patientAddressRef.current?.focus();
                                      }
                                    }}
                                    className="col-span-2 w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <input 
                              ref={patientAddressRef}
                              id="patient-address-input"
                              placeholder="Address" 
                              value={patientDetails.address} 
                              onChange={e => setPatientDetails({...patientDetails, address: e.target.value})} 
                              onFocus={() => setFocusedSection('patient')}
                              onKeyDown={(e) => {
                                if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  patientAgeRef.current?.focus();
                                } else if (e.key === 'Tab' && !e.shiftKey) {
                                  e.preventDefault();
                                  doctorNameRef.current?.focus();
                                } else if (e.key === 'Enter') {
                                  e.preventDefault();
                                  doctorNameRef.current?.focus();
                                }
                              }}
                              className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" 
                            />
                          </div>

                         {/* Shipping Info */}
                         <div className="space-y-3">
                             <h4 className="text-xs font-black uppercase text-gray-400">Shipping & Doctor</h4>
                             <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    ref={doctorNameRef}
                                    placeholder="Doctor Name" 
                                    value={patientDetails.doctorName} 
                                    onChange={e => setPatientDetails({...patientDetails, doctorName: e.target.value})} 
                                    onFocus={() => setFocusedSection('patient')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowRight') {
                                        e.preventDefault();
                                        doctorAddressRef.current?.focus();
                                      } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        boxCountRef.current?.focus();
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        patientAddressRef.current?.focus();
                                      } else if (e.key === 'Tab' && !e.shiftKey) {
                                        e.preventDefault();
                                        doctorAddressRef.current?.focus();
                                      } else if (e.key === 'Tab' && e.shiftKey) {
                                        e.preventDefault();
                                        patientAddressRef.current?.focus();
                                      }
                                    }}
                                    className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" 
                                  />
                                  <input 
                                    ref={doctorAddressRef}
                                    placeholder="Doctor Address" 
                                    value={patientDetails.doctorAddress} 
                                    onChange={e => setPatientDetails({...patientDetails, doctorAddress: e.target.value})} 
                                    onFocus={() => setFocusedSection('patient')}
                                    onKeyDown={(e) => {
                                      if (e.key === 'ArrowLeft') {
                                        e.preventDefault();
                                        doctorNameRef.current?.focus();
                                      } else if (e.key === 'ArrowDown') {
                                        e.preventDefault();
                                        polyCountRef.current?.focus();
                                      } else if (e.key === 'ArrowUp') {
                                        e.preventDefault();
                                        patientAddressRef.current?.focus();
                                      } else if (e.key === 'Tab' && !e.shiftKey) {
                                        e.preventDefault();
                                        boxCountRef.current?.focus();
                                      } else if (e.key === 'Tab' && e.shiftKey) {
                                        e.preventDefault();
                                        doctorNameRef.current?.focus();
                                      }
                                    }}
                                    className="w-full p-2 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none focus:border-primary" 
                                  />
                              </div>
                             <div className="bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-600">
                                 <div className="flex gap-4 mb-2">
                                     <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="pack" checked={shippingDetails.packingType === 'Box'} onChange={() => setShippingDetails({...shippingDetails, packingType: 'Box'})}/> Box</label>
                                     <label className="flex items-center gap-1 cursor-pointer text-xs font-bold"><input type="radio" name="pack" checked={shippingDetails.packingType === 'Poly'} onChange={() => setShippingDetails({...shippingDetails, packingType: 'Poly'})}/> Poly</label>
                                     <label className="flex items-center gap-1 cursor-pointer ml-auto text-xs"><input type="checkbox" checked={shippingDetails.isColdStorage} onChange={e => setShippingDetails({...shippingDetails, isColdStorage: e.target.checked})}/> <span className="text-blue-500 font-bold">Cold ❄️</span></label>
                                 </div>
                                 <div className="grid grid-cols-2 gap-2">
                                      <input 
                                        ref={boxCountRef}
                                        type="number" 
                                        placeholder="Box Count" 
                                        value={shippingDetails.boxCount} 
                                        onChange={e => setShippingDetails({...shippingDetails, boxCount: Number(e.target.value)})} 
                                        onKeyDown={(e) => {
                                          if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            doctorNameRef.current?.focus();
                                          } else if (e.key === 'ArrowRight') {
                                            e.preventDefault();
                                            polyCountRef.current?.focus();
                                          } else if (e.key === 'Enter' || e.key === 'Tab') {
                                            e.preventDefault();
                                            setFocusedSection('payment');
                                            setTimeout(() => paymentSelectRef.current?.focus(), 50);
                                          }
                                        }}
                                        className="w-full p-1.5 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none" 
                                      />
                                      <input 
                                        ref={polyCountRef}
                                        type="number" 
                                        placeholder="Poly Count" 
                                        value={shippingDetails.polyCount} 
                                        onChange={e => setShippingDetails({...shippingDetails, polyCount: Number(e.target.value)})} 
                                        onKeyDown={(e) => {
                                          if (e.key === 'ArrowUp') {
                                            e.preventDefault();
                                            doctorAddressRef.current?.focus();
                                          } else if (e.key === 'ArrowLeft') {
                                            e.preventDefault();
                                            boxCountRef.current?.focus();
                                          } else if (e.key === 'Enter' || e.key === 'Tab') {
                                            e.preventDefault();
                                            setFocusedSection('payment');
                                            setTimeout(() => paymentSelectRef.current?.focus(), 50);
                                          }
                                        }}
                                        className="w-full p-1.5 text-xs rounded border dark:bg-gray-700 dark:border-gray-600 outline-none" 
                                      />
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
                          onFocus={() => setFocusedSection('payment')}
                          onKeyDown={(e) => {
                             if (e.key === 'ArrowDown') {
                               e.preventDefault();
                               const modes = ['Cash', 'Card', 'UPI', 'Credit', 'Bank Transfer'];
                               const idx = modes.indexOf(paymentMode);
                               if (idx < modes.length - 1) setPaymentMode(modes[idx + 1]);
                             } else if (e.key === 'ArrowUp') {
                               e.preventDefault();
                               const modes = ['Cash', 'Card', 'UPI', 'Credit', 'Bank Transfer'];
                               const idx = modes.indexOf(paymentMode);
                               if (idx > 0) setPaymentMode(modes[idx - 1]);
                             } else if (e.key === 'Enter') {
                               e.preventDefault();
                               handleProcessSale();
                             } else if (e.key === 'Tab') {
                               e.preventDefault();
                               processBtnRef.current?.focus();
                             }
                          }}
                          className={`w-full md:w-3/4 bg-gray-50 dark:bg-gray-700 border rounded-xl px-4 py-3 text-lg font-bold outline-none transition-all cursor-pointer ${focusedSection === 'payment' ? 'border-primary ring-4 ring-primary/30 shadow-lg' : 'border-gray-200 dark:border-gray-600'}`}
                      >
                          <option value="Cash">Cash 💵</option>
                          <option value="Card">Card 💳</option>
                          <option value="UPI">UPI 📱</option>
                          <option value="Credit">Credit (Udhaar) ⏳</option>
                          <option value="Bank Transfer">Bank Transfer 🏦</option>
                      </select>
                      <p className="text-[10px] text-gray-400">Navigate using ↑↓ | Press <span className="font-bold border px-1 rounded">Enter</span> to complete sale</p>
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
                          onKeyDown={(e) => {
                            if (e.key === 'Tab' && !e.shiftKey) {
                              e.preventDefault();
                              itemSearchRef.current?.focus();
                            } else if (e.key === 'Tab' && e.shiftKey) {
                              e.preventDefault();
                              paymentSelectRef.current?.focus();
                            }
                          }}
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
