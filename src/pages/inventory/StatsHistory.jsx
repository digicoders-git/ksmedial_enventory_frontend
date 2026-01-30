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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={24} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            <p className="text-gray-500 text-sm mt-1">Complete transaction history and analytics</p>
          </div>
        </div>
        <button
          onClick={() => alert('Export feature coming soon!')}
          className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-bold hover:bg-gray-50 hover:border-gray-300 transition-all text-sm flex items-center gap-2"
        >
          <Download size={16} />
          Export
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Records</p>
          <p className="text-3xl font-bold text-gray-800">{stats.totalTransactions}</p>
        </div>
        {type === 'value' && (
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Amount</p>
            <p className="text-3xl font-bold text-emerald-600">₹{stats.totalAmount.toLocaleString()}</p>
          </div>
        )}
        {(type === 'movement' || type === 'value') && (
          <>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Quantity</p>
              <p className="text-3xl font-bold text-gray-800">{stats.totalQuantity}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs text-green-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingUp size={12} /> Increases
              </p>
              <p className="text-3xl font-bold text-green-600">{stats.increases}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
              <p className="text-xs text-red-600 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                <TrendingDown size={12} /> Decreases
              </p>
              <p className="text-3xl font-bold text-red-600">{stats.decreases}</p>
            </div>
          </>
        )}
      </div>

      {/* Visual Timeline Chart */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="text-primary" size={20} />
            <h4 className="font-bold text-gray-800">Activity Timeline (Last 7 Days)</h4>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-green-500"></div>
              <span className="text-gray-600 font-medium">Increases</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500"></div>
              <span className="text-gray-600 font-medium">Decreases</span>
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-2 h-64 bg-gray-50/50 p-6 rounded-xl border border-gray-100 mt-6 relative">
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
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full flex justify-center items-end gap-1 h-48">
                  <div
                    className="w-5 bg-gradient-to-t from-green-500 to-green-400 rounded-t-md transition-all duration-500 hover:from-green-600 hover:to-green-500 relative group/bar shadow-sm"
                    style={{ height: `${Math.max((day.increases / maxValue) * 180, day.increases > 0 ? 4 : 0)}px` }}
                  >
                    {day.increases > 0 && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-green-600 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-10 border border-green-100">
                        +{day.increases}
                      </span>
                    )}
                  </div>

                  <div
                    className="w-5 bg-gradient-to-t from-red-500 to-red-400 rounded-t-md transition-all duration-500 hover:from-red-600 hover:to-red-500 relative group/bar shadow-sm"
                    style={{ height: `${Math.max((day.decreases / maxValue) * 180, day.decreases > 0 ? 4 : 0)}px` }}
                  >
                    {day.decreases > 0 && (
                      <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-bold text-red-600 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-white px-2 py-1 rounded-lg shadow-md whitespace-nowrap z-10 border border-red-100">
                        -{day.decreases}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-center mt-2">
                  <p className="text-xs font-bold text-gray-700">{day.label}</p>
                  <p className="text-[10px] text-gray-400">{day.date}</p>
                </div>
              </div>
            ));
          })()}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search products, users, details..."
              className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none transition-all text-sm font-medium"
            />
          </div>

          <div className="relative">
            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-11 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none font-semibold text-gray-700 text-sm transition-all"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>

          <div className="relative">
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [newSortBy, newSortOrder] = e.target.value.split('-');
                setSortBy(newSortBy);
                setSortOrder(newSortOrder);
              }}
              className="w-full pl-4 pr-10 py-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-primary/10 focus:border-primary outline-none appearance-none font-semibold text-gray-700 text-sm transition-all"
            >
              <option value="date-desc">Latest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="amount-desc">Highest Amount</option>
              <option value="amount-asc">Lowest Amount</option>
              <option value="quantity-desc">Highest Qty</option>
              <option value="quantity-asc">Lowest Qty</option>
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        {paginatedData.length > 0 ? (
          <div className="space-y-3">
            {paginatedData.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all overflow-hidden group"
              >
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 cursor-pointer flex items-center justify-between hover:bg-gray-50/50 transition-colors"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex flex-col gap-1 items-start">
                        <span className={`px-3 py-1.5 rounded-lg text-[10px] uppercase font-black border ${getTypeBadge(item.type, item.source)}`}>
                            {item.source || item.type}
                        </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800">{item.productName}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">{item.details}</p>
                    </div>
                  </div>
                    <div className="flex items-center gap-6">
                      {item.source && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.source === 'SALE') navigate(`/sales/invoices/view/${item.originalId}`);
                            else if (item.source === 'PURCHASE') navigate(`/purchase/invoices/view/${item.originalId}`);
                            else if (item.source === 'SALE_RETURN') navigate(`/sales/return/view/${item.originalId}`);
                            else if (item.source === 'ADJUSTMENT' || item.source === 'PURCHASE_RETURN') navigate(`/inventory/stock-out/view/${item.originalId}`);
                          }}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-all"
                          title="View Document"
                        >
                          <Printer size={18} />
                        </button>
                      )}
                      {item.amount && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-semibold">Amount</p>
                        <p className="text-lg font-bold text-emerald-600">₹{item.amount.toLocaleString()}</p>
                      </div>
                    )}
                    {item.quantity && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400 font-semibold">Quantity</p>
                        <p className="text-lg font-bold text-gray-800">{item.quantity}</p>
                      </div>
                    )}
                    <div className="text-right">
                      <p className="text-xs text-gray-400 font-semibold">Date</p>
                      <p className="text-sm font-bold text-gray-700">
                        {new Date(item.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    <ChevronDown
                      className={`text-gray-400 transition-transform ${expandedItems[item.id] ? 'rotate-180' : ''}`}
                      size={20}
                    />
                  </div>
                </div>

                {expandedItems[item.id] && (
                  <div className="px-4 pb-4 pt-2 bg-gray-50/50 border-t border-gray-100 animate-fade-in">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {item.batch && (
                        <div>
                          <p className="text-gray-400 font-semibold mb-1">Batch</p>
                          <p className="text-gray-800 font-bold">{item.batch}</p>
                        </div>
                      )}
                      {item.category && (
                        <div>
                          <p className="text-gray-400 font-semibold mb-1">Category</p>
                          <p className="text-gray-800 font-bold">{item.category}</p>
                        </div>
                      )}
                      {item.user && (
                        <div>
                          <p className="text-gray-400 font-semibold mb-1">User</p>
                          <p className="text-gray-800 font-bold">{item.user}</p>
                        </div>
                      )}
                      {item.reference && (
                        <div>
                          <p className="text-gray-400 font-semibold mb-1">Reference</p>
                          <p className="text-gray-800 font-bold">{item.reference}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-gray-400 font-semibold mb-1">Time</p>
                        <p className="text-gray-800 font-bold">
                          {new Date(item.date).toLocaleTimeString('en-IN')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <FileText className="opacity-30" size={40} />
            </div>
            <p className="font-bold text-lg text-gray-500">No Records Found</p>
            <p className="text-sm mt-1">Try adjusting your filters</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-bold text-gray-800">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-gray-800">{Math.min(endIndex, filteredData.length)}</span> of{' '}
              <span className="font-bold text-gray-800">{filteredData.length}</span> records
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
              >
                Previous
              </button>

              <div className="flex items-center gap-1">
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
                        className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${
                          currentPage === pageNum
                            ? 'bg-primary text-white shadow-lg shadow-primary/20'
                            : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                    return (
                      <span key={pageNum} className="text-gray-400 px-1">
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
                className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 font-semibold hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm"
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
