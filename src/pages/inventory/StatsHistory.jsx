import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, TrendingUp, TrendingDown, Calendar, Download, Search, ChevronDown, BarChart3, FileText, Printer } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

const StatsHistory = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { type = 'products', title = 'History' } = location.state || {};

  const { inventory, transactions } = useInventory();



  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [expandedItems, setExpandedItems] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Generate history data based on type
  const generateHistoryData = () => {
    const now = new Date();
    const data = [];

    switch(type) {
      case 'products':
        inventory.forEach((item) => {
          data.push({
            id: `prod-${item.id}`,
            date: item.createdAt ? new Date(item.createdAt) : now,
            type: 'ADDED',
            productName: item.name,
            category: item.category,
            quantity: item.stock,
            batch: item.batch,
            user: 'Admin',
            details: `Initial stock: ${item.stock} units`
          });
        });
        break;

      case 'value':
        for(let i = 0; i < 20; i++) {
          const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
          const qty = Math.floor(Math.random() * 50) + 1;
          const isIncrease = Math.random() > 0.5;
          data.push({
            id: `val-${i}`,
            date: new Date(now - Math.random() * 30 * 24 * 60 * 60 * 1000),
            type: isIncrease ? 'INCREASE' : 'DECREASE',
            productName: randomItem.name,
            quantity: qty,
            amount: qty * randomItem.rate,
            rate: randomItem.rate,
            user: ['Admin', 'Manager', 'Staff'][Math.floor(Math.random() * 3)],
            reason: isIncrease ? 'Purchase' : 'Sale',
            details: `${isIncrease ? 'Added' : 'Sold'} ${qty} units @ ₹${randomItem.rate}`
          });
        }
        break;

      case 'alerts':
        inventory.filter(item => item.stock <= (item.reorderLevel || 20)).forEach((item, idx) => {
          data.push({
            id: `alert-${idx}`,
            date: item.updatedAt ? new Date(item.updatedAt) : now, // Last time it was low
            type: item.stock === 0 ? 'OUT_OF_STOCK' : 'LOW_STOCK',
            productName: item.name,
            currentStock: item.stock,
            threshold: item.reorderLevel || 20,
            batch: item.batch,
            severity: item.stock === 0 ? 'critical' : item.stock < (item.reorderLevel / 2) ? 'high' : 'medium',
            details: `Stock level: ${item.stock} units (Threshold: ${item.reorderLevel || 20} units)`
          });
        });
        break;

      case 'movement':
        if (transactions.length > 0) {
          transactions.forEach((tx, idx) => {
            tx.items.forEach((item, itemIdx) => {
              data.push({
                id: `move-${idx}-${itemIdx}`,
                originalId: tx.id,
                date: tx.date,
                type: tx.type,
                source: tx.source,
                productName: item.name,
                quantity: item.qty || item.quantity,
                amount: tx.totalAmount,
                batch: item.batch || 'N/A',
                user: tx.user || 'System',
                reference: tx.reference || (tx.id ? `TXN-${tx.id.slice(-6).toUpperCase()}` : `TXN-${1000 + idx}`),
                details: `${tx.reason || (tx.type === 'IN' ? 'Restocked' : 'Dispatched')} - ${item.qty || item.quantity} units ${tx.reference ? '[Ref: '+tx.reference+']' : ''}`
              });
            });
          });
        }
        break;

      case 'prescriptions':
        for(let i = 0; i < 15; i++) {
          const randomItem = inventory[Math.floor(Math.random() * inventory.length)];
          data.push({
            id: `rx-${i}`,
            date: new Date(now - Math.random() * 15 * 24 * 60 * 60 * 1000),
            type: ['VERIFIED', 'PENDING', 'REJECTED'][Math.floor(Math.random() * 3)],
            productName: randomItem.name,
            patientName: `Patient ${i + 1}`,
            doctorName: `Dr. ${['Smith', 'Johnson', 'Williams', 'Brown'][Math.floor(Math.random() * 4)]}`,
            quantity: Math.floor(Math.random() * 10) + 1,
            verifiedBy: 'Pharmacist',
            details: `Prescription #RX${1000 + i}`
          });
        }
        break;

      default:
        break;
    }

    return data;
  };

  const historyData = useMemo(() => generateHistoryData(), [type, inventory, transactions]);

  // Filter and sort data
  const filteredData = useMemo(() => {
    let filtered = [...historyData];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.productName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.user?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.details?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Date filter
    const now = new Date();
    if (dateFilter === 'today') {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate.toDateString() === now.toDateString();
      });
    } else if (dateFilter === 'week') {
      const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => new Date(item.date) >= weekAgo);
    } else if (dateFilter === 'month') {
      const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(item => new Date(item.date) >= monthAgo);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'amount') {
        comparison = (a.amount || 0) - (b.amount || 0);
      } else if (sortBy === 'quantity') {
        comparison = (a.quantity || 0) - (b.quantity || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [historyData, searchTerm, dateFilter, sortBy, sortOrder]);

  // Calculate stats
  const stats = useMemo(() => {
    const totalTransactions = filteredData.length;
    const totalAmount = filteredData.reduce((sum, item) => sum + (item.amount || 0), 0);
    const totalQuantity = filteredData.reduce((sum, item) => sum + (item.quantity || 0), 0);
    const increases = filteredData.filter(item => 
      item.type === 'INCREASE' || item.type === 'IN' || item.type === 'ADDED' || item.type === 'VERIFIED'
    ).length;
    const decreases = filteredData.filter(item => 
      item.type === 'DECREASE' || item.type === 'OUT' || item.type === 'LOW_STOCK' || item.type === 'OUT_OF_STOCK'
    ).length;

    return { totalTransactions, totalAmount, totalQuantity, increases, decreases };
  }, [filteredData]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, sortBy, sortOrder]);

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getTypeBadge = (itemType, source) => {
    if (source === 'SALE') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (source === 'PURCHASE') return 'bg-blue-50 text-blue-700 border-blue-200';
    if (source === 'SALE_RETURN') return 'bg-purple-50 text-purple-700 border-purple-200';
    if (source === 'PURCHASE_RETURN') return 'bg-orange-50 text-orange-700 border-orange-200';
    if (source === 'ADJUSTMENT') return 'bg-amber-50 text-amber-700 border-amber-200';

    const badges = {
      'ADDED': 'bg-blue-50 text-blue-700 border-blue-200',
      'INCREASE': 'bg-green-50 text-green-700 border-green-200',
      'DECREASE': 'bg-red-50 text-red-700 border-red-200',
      'IN': 'bg-green-50 text-green-700 border-green-200',
      'OUT': 'bg-orange-50 text-orange-700 border-orange-200',
      'LOW_STOCK': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'OUT_OF_STOCK': 'bg-red-50 text-red-700 border-red-200',
      'VERIFIED': 'bg-green-50 text-green-700 border-green-200',
      'PENDING': 'bg-yellow-50 text-yellow-700 border-yellow-200',
      'REJECTED': 'bg-red-50 text-red-700 border-red-200',
    };
    return badges[itemType] || 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-xl shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95"
          >
            <ArrowLeft size={20} strokeWidth={3} />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-800 dark:text-white uppercase tracking-tight leading-none">{title}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1.5 opacity-90">Complete transaction history and analytics</p>
          </div>
        </div>
        <button
          onClick={() => alert('Export feature coming soon!')}
          className="w-full sm:w-auto px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-black uppercase tracking-widest text-[11px] rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all flex items-center justify-center gap-2 shadow-sm active:scale-95"
        >
          <Download size={18} strokeWidth={3} /> Export Data
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
          <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Total Records</p>
          <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalTransactions}</p>
        </div>
        {type === 'value' && (
          <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1.5 opacity-70">Total Amount</p>
            <p className="text-3xl font-black text-emerald-600">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        )}
        {(type === 'movement' || type === 'value') && (
          <>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Total Quantity</p>
              <p className="text-3xl font-black text-gray-800 dark:text-white">{stats.totalQuantity}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest mb-1.5 opacity-70 flex items-center gap-1.5">
                <TrendingUp size={12} strokeWidth={3} /> Increases
              </p>
              <p className="text-3xl font-black text-emerald-600">{stats.increases}</p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
              <p className="text-[10px] text-rose-600 font-black uppercase tracking-widest mb-1.5 opacity-70 flex items-center gap-1.5">
                <TrendingDown size={12} strokeWidth={3} /> Decreases
              </p>
              <p className="text-3xl font-black text-rose-600">{stats.decreases}</p>
            </div>
          </>
        )}
      </div>

      {/* Visual Timeline Chart */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <BarChart3 className="text-primary" size={20} strokeWidth={2.5} />
            </div>
            <h4 className="font-black text-gray-800 dark:text-white uppercase tracking-tight">Activity Timeline</h4>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <div className="flex items-center gap-1.5 text-emerald-600">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></div>
              <span>Increases</span>
            </div>
            <div className="flex items-center gap-1.5 text-rose-600">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/20"></div>
              <span>Decreases</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto no-scrollbar -mx-2 px-2">
          <div className="flex items-end justify-around gap-2 h-64 bg-gray-50/50 dark:bg-gray-900/10 p-4 sm:p-6 rounded-2xl border border-gray-100 dark:border-gray-800/50 min-w-[450px] lg:min-w-0 relative mt-4">
            {(() => {
              const days = [];
              const now = new Date();
              for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dayData = filteredData.filter(item => {
                  const itemDate = new Date(item.date);
                  return itemDate.toDateString() === date.toDateString();
                });

                const increases = dayData.filter(item =>
                  item.type === 'INCREASE' || item.type === 'IN' || item.type === 'ADDED' || item.type === 'VERIFIED'
                ).length;

                const decreases = dayData.filter(item =>
                  item.type === 'DECREASE' || item.type === 'OUT' || item.type === 'LOW_STOCK' || item.type === 'OUT_OF_STOCK'
                ).length;

                days.push({
                  label: date.toLocaleDateString('en-IN', { weekday: 'short' }),
                  date: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
                  increases,
                  decreases,
                  total: increases + decreases
                });
              }

              const maxValue = Math.max(...days.map(d => Math.max(d.increases, d.decreases)), 1);

              return days.map((day, idx) => (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group max-w-[60px]">
                  <div className="w-full flex justify-center items-end gap-1 h-44">
                    <div
                      className="w-4 sm:w-5 bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg transition-all duration-500 hover:from-emerald-600 hover:to-emerald-500 relative group/bar shadow-sm"
                      style={{ height: `${Math.max((day.increases / maxValue) * 160, day.increases > 0 ? 6 : 0)}px` }}
                    >
                      {day.increases > 0 && (
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-emerald-600 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-10 border border-emerald-100 dark:border-emerald-900/50">
                          +{day.increases}
                        </span>
                      )}
                    </div>

                    <div
                      className="w-4 sm:w-5 bg-gradient-to-t from-rose-500 to-rose-400 rounded-t-lg transition-all duration-500 hover:from-rose-600 hover:to-rose-500 relative group/bar shadow-sm"
                      style={{ height: `${Math.max((day.decreases / maxValue) * 160, day.decreases > 0 ? 6 : 0)}px` }}
                    >
                      {day.decreases > 0 && (
                        <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-[10px] font-black text-rose-600 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white dark:bg-gray-800 px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-10 border border-rose-100 dark:border-rose-900/50">
                          -{day.decreases}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-center mt-3">
                    <p className="text-[10px] font-black text-gray-700 dark:text-gray-300 uppercase tracking-tight">{day.label}</p>
                    <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{day.date}</p>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sm:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history records..."
              className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-bold text-gray-800 dark:text-white"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={18} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none font-bold text-gray-800 dark:text-white text-sm transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="w-full pl-4 pr-10 py-3 bg-gray-50/50 dark:bg-gray-900/30 border border-gray-100 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none font-bold text-gray-800 dark:text-white text-sm transition-all"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="quantity-desc">Highest Qty</option>
              <option value="quantity-asc">Lowest Qty</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="space-y-4">
        {paginatedData.length > 0 ? (
          paginatedData.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-all overflow-hidden group border-l-4 border-l-primary"
            >
              <div
                onClick={() => toggleExpand(item.id)}
                className="p-5 cursor-pointer"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="flex flex-col gap-2 items-start shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] uppercase font-black border tracking-widest ${getTypeBadge(item.type, item.source)}`}>
                        {item.source || item.type.replace('_', ' ')}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <Calendar size={12} strokeWidth={3} />
                        {new Date(item.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h4 className="font-black text-gray-800 dark:text-white truncate">{item.productName}</h4>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium italic">{item.details}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-6 pt-4 lg:pt-0 border-t sm:border-t-0 border-gray-50 dark:border-gray-700/50">
                    <div className="flex items-center gap-6">
                      {item.amount && (
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5 opacity-70">Value</p>
                          <p className="text-lg font-black text-emerald-600 leading-none">₹{item.amount.toLocaleString()}</p>
                        </div>
                      )}
                      {item.quantity && (
                        <div className="text-left sm:text-right">
                          <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-0.5 opacity-70">Qty</p>
                          <p className="text-lg font-black text-gray-800 dark:text-white leading-none">{item.quantity}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {item.source && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.source === 'SALE') navigate(`/sales/invoices/view/${item.originalId}`);
                            else if (item.source === 'PURCHASE') navigate(`/purchase/invoices/view/${item.originalId}`);
                            else if (item.source === 'SALE_RETURN') navigate(`/sales/return/view/${item.originalId}`);
                            else if (item.source === 'ADJUSTMENT' || item.source === 'PURCHASE_RETURN') navigate(`/inventory/stock-out/view/${item.originalId}`);
                          }}
                          className="p-3 bg-gray-50 dark:bg-gray-900/50 text-primary border border-gray-100 dark:border-gray-700 rounded-xl hover:bg-primary hover:text-white transition-all active:scale-95 shadow-sm"
                          title="View Document"
                        >
                          <Printer size={18} strokeWidth={2.5} />
                        </button>
                      )}
                      <div className={`p-2 rounded-lg transition-colors ${expandedItems[item.id] ? 'bg-primary/10 text-primary' : 'text-gray-400'}`}>
                        <ChevronDown
                          className={`transition-transform duration-300 ${expandedItems[item.id] ? 'rotate-180' : ''}`}
                          size={20}
                          strokeWidth={3}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {expandedItems[item.id] && (
                <div className="px-5 pb-5 pt-0 animate-fade-in-up">
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-800">
                    {item.batch && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Batch</p>
                        <p className="text-sm text-gray-800 dark:text-white font-black">{item.batch}</p>
                      </div>
                    )}
                    {item.category && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Category</p>
                        <p className="text-sm text-gray-800 dark:text-white font-black">{item.category}</p>
                      </div>
                    )}
                    {item.user && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Generated By</p>
                        <p className="text-sm text-gray-800 dark:text-white font-black">{item.user}</p>
                      </div>
                    )}
                    {item.reference && (
                      <div>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Reference</p>
                        <p className="text-sm text-gray-800 dark:text-white font-black">{item.reference}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1.5 opacity-70">Exact Time</p>
                      <p className="text-sm text-gray-800 dark:text-white font-black">
                        {new Date(item.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-20 flex flex-col items-center justify-center text-gray-400">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-900 rounded-full flex items-center justify-center mb-6 shadow-inner tracking-tighter">
              <FileText className="opacity-20" size={48} strokeWidth={1.5} />
            </div>
            <p className="font-black text-xl text-gray-800 dark:text-white uppercase tracking-tight">No Records Found</p>
            <p className="text-sm mt-2 font-medium">Try adjusting your filters to find what you're looking for.</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm transition-all">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center lg:text-left">
              Showing <span className="text-gray-800 dark:text-white">{startIndex + 1}</span> to{' '}
              <span className="text-gray-800 dark:text-white">{Math.min(endIndex, filteredData.length)}</span> of{' '}
              <span className="text-gray-800 dark:text-white">{filteredData.length}</span> records
            </p>

            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 lg:pb-0 w-full lg:w-auto justify-center">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm active:scale-95"
              >
                Prev
              </button>

              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, idx) => {
                  const pageNum = idx + 1;
                  if (
                    pageNum === 1 ||
                    pageNum === totalPages ||
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-xl text-[11px] font-black transition-all shadow-sm active:scale-95 ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-110'
                            : 'bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 text-gray-400 hover:text-primary'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="text-gray-400 dark:text-gray-600 font-black text-[10px] px-1">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700 rounded-xl text-[11px] font-black uppercase tracking-widest text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white dark:hover:bg-gray-800 transition-all shadow-sm active:scale-95"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsHistory;
