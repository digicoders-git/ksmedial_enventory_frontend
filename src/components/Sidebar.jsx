import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Pill, 
  ShoppingCart, 
  Truck, 
  Users, 
  BarChart2, 
  Settings, 
  Bell, 
  Cpu,
  ChevronDown, 
  ChevronRight,
  LogOut,
  X,
  User,
  Shield,
  Activity,
  HelpCircle,
  CreditCard 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import Swal from 'sweetalert2';

const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const { shop, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const [openMenus, setOpenMenus] = React.useState({});

  const toggleSubMenu = (label) => {
    setOpenMenus(prev => ({ ...prev, [label]: !prev[label] }));
  };


  const handleLogout = () => {
    Swal.fire({
      title: 'Are you sure?',
      text: "You will be logged out of your session.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0D9488',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, logout!'
    }).then((result) => {
      if (result.isConfirmed) {
        logout();
        navigate('/login');
      }
    });
  };

  const user = {
    name: shop?.ownerName || 'Shop Owner',
    role: shop?.shopName || 'PharmaNet Shop',
    image: shop?.image || `https://ui-avatars.com/api/?name=${shop?.ownerName || 'Shop'}&background=0D9488&color=fff`
  };

  // UPDATED MENU STRUCTURE BASED ON USER REQUEST
  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/' },
    
    // 2. Inventory
    { 
      label: 'Inventory', 
      icon: <Package size={20} />, 
      path: '/inventory',
      subItems: [
        { label: 'Inventory Dashboard', path: '/inventory/dashboard' },
        { label: 'Location Master', path: '/inventory/locations' },
        { label: 'Stock List', path: '/inventory/stock' },
        { label: 'Physical Validation', path: '/inventory/physical-validation' },
        { label: 'Stock IN (Purchase)', path: '/inventory/stock-in' },
        { label: 'Stock OUT', path: '/inventory/stock-out' },
        { label: 'Expiry Management', path: '/inventory/expiry' },
        { label: 'Low Stock Alerts', path: '/inventory/low-stock' },
        { label: 'Units Management', path: '/inventory/units' },
        { label: 'Packing Materials', path: '/inventory/packing-materials' },
        { label: 'Stock Adjustment', path: '/inventory/adjustment' }
      ]
    },

    // 3. Medicines (Product Master)
    { 
      label: 'Medicines', 
      icon: <Pill size={20} />, 
      path: '/medicines',
      subItems: [
         { label: 'Medicine List', path: '/medicines/list' }, // Was inventory/medicines
         { label: 'Add Medicine', path: '/medicines/add' },   // Was inventory/medicines/add
         { label: 'Medicine Groups', path: '/medicines/groups' }, // Was inventory/groups
         { label: 'Categories', path: '/medicines/categories' },
         { label: 'Prescription Check', path: '/medicines/prescriptions' }
      ]
    },

    // 4. Sales & Billing
    { 
      label: 'Sales & Billing', 
      icon: <ShoppingCart size={20} />, 
      path: '/sales',
      subItems: [
        { label: 'POS / Billing', path: '/sales/pos' }, // Was sales/new
        { label: 'Invoices', path: '/sales/invoices' },
        { label: 'Online Orders', path: '/sales/online-orders' },
        { label: 'Sales Return', path: '/sales/return' }
      ]
    },

    // 5. Purchase & Suppliers
    {
      label: 'Purchase',
      icon: <Truck size={20} />,
      path: '/purchase',
      subItems: [
        { label: 'Supplier List', path: '/purchase/suppliers' },
        { label: 'GRN Waitlist', path: '/purchase/grn/waitlist', badge: 'New' },
        { label: 'Put Away Bucket', path: '/purchase/putaway' },
        { label: 'Add GRN (Receive)', path: '/purchase/grn/add' },
        { label: 'GRN History', path: '/purchase/grn' },
        { label: 'Purchase Invoices', path: '/purchase/invoices' },
        { label: 'Purchase Return', path: '/purchase/return' }
      ]
    },

    // 6. Customers
    {
      label: 'Customers',
      icon: <Users size={20} />,
      path: '/people',
      subItems: [
        { label: 'Customers', path: '/people/customers' },
        { label: 'Doctors', path: '/people/doctors' }
      ]
    },

    // 7. Reports
    { 
      label: 'Reports', 
      icon: <BarChart2 size={20} />, 
      path: '/reports',
      subItems: [
        { label: 'Inventory Reports', path: '/reports/inventory' },
        { label: 'Sales Reports', path: '/reports/sales' },
        { label: 'Profit Reports', path: '/reports/profit' },
        { label: 'Group Wise Analysis', path: '/reports/groups' }
      ]
    },

    // 8. Configuration
    {
      label: 'Configuration',
      icon: <Settings size={20} />,
      path: '/config',
      subItems: [
        { label: 'General Settings', path: '/config/general' },
        { label: 'Inventory Settings', path: '/config/inventory' },
        { label: 'Roles & Permissions', path: '/config/roles' }
      ]
    },

    // 9. Notifications
    { label: 'Notifications', icon: <Bell size={20} />, path: '/notifications', badge: unreadCount },


    // 10. App Settings
    { label: 'App Settings', icon: <Cpu size={20} />, path: '/app-settings' },
  ];

  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef(null);

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleValidation = (feature) => {
    setShowUserMenu(false);
    Swal.fire({
      icon: 'info',
      title: `${feature}`,
      text: 'This advanced feature is coming soon in the next update!',
      timer: 2000,
      showConfirmButton: false,
      toast: true,
      position: 'top-end',
      background: '#1f2937',
      color: '#fff'
    });
  };

  const handleNavClick = () => {
    if (window.innerWidth < 1024) {
      toggleSidebar();
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black/50 transition-opacity lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={toggleSidebar} />
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-gray-900 text-gray-300 transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:h-screen shadow-xl border-r border-gray-800`}>
        {/* Brand */}
        <div className="flex items-center justify-between p-4 h-16 border-b border-gray-800 bg-gray-900">
          <div className="flex items-center gap-2 text-white font-bold text-xl cursor-pointer" onClick={() => { navigate('/'); handleNavClick(); }}>
            <img src="/KS2-Logo.png" alt="Pharma One Logo" className="w-160 h-12 object-contain" />
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* User */}
        <div className="p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex items-center gap-3 relative" ref={userMenuRef}>
            <img src={user.image} alt="User" className="w-10 h-10 rounded-full border-2 border-accent cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)} />
            <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setShowUserMenu(!showUserMenu)}>
              <p className="text-sm font-semibold text-white truncate">{user.name}</p>
              <p className="text-xs text-accent truncate">{user.role}</p>
            </div>
            <button 
              className={`text-gray-400 hover:text-white transition-transform ${showUserMenu ? 'rotate-90 text-white' : ''}`}
              onClick={() => setShowUserMenu(!showUserMenu)}
            >
              <Settings size={18} />
            </button>

            {/* Advanced Settings Dropdown */}
            {showUserMenu && (
              <div className="absolute top-12 right-0 left-0 mt-2 w-56 bg-gray-800 rounded-xl shadow-2xl border border-gray-700 overflow-hidden z-50 transform origin-top-right transition-all animate-fade-in-up">
                <div className="p-3 border-b border-gray-700 bg-gray-800/50">
                   <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Account</p>
                </div>
                <div className="p-1">
                  <button onClick={() => { setShowUserMenu(false); navigate('/account/profile'); handleNavClick(); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                    <User size={16} className="text-blue-400" /> My Profile
                  </button>
                  <button onClick={() => { setShowUserMenu(false); navigate('/account/security'); handleNavClick(); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                    <Shield size={16} className="text-green-400" /> Security & 2FA
                  </button>
                    <button onClick={() => { setShowUserMenu(false); navigate('/account/billing'); handleNavClick(); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                    <CreditCard size={16} className="text-purple-400" /> Plan & Billing
                  </button>
                   <button onClick={() => { setShowUserMenu(false); navigate('/account/activity'); handleNavClick(); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                    <Activity size={16} className="text-orange-400" /> Activity Log
                  </button>
                </div>
                <div className="border-t border-gray-700 p-1">
                   <button onClick={() => { setShowUserMenu(false); navigate('/account/support'); handleNavClick(); }} className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white rounded-lg flex items-center gap-2 transition-colors">
                    <HelpCircle size={16} className="text-teal-400" /> Help & Support
                  </button>
                  <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg flex items-center gap-2 transition-colors">
                    <LogOut size={16} /> Logout
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Menu */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1 custom-scrollbar">
          {navItems.map((item, index) => (
            <div key={index}>
              {item.subItems ? (
                <div>
                  <button 
                    onClick={() => toggleSubMenu(item.label)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors duration-200 group ${openMenus[item.label] ? 'bg-secondary text-white' : 'hover:bg-gray-800 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`${openMenus[item.label] ? 'text-accent' : 'text-gray-400 group-hover:text-accent'}`}>{item.icon}</span>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    {openMenus[item.label] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </button>
                  {openMenus[item.label] && (
                    <div className="pl-10 pr-2 mt-1 space-y-1">
                      {item.subItems.map((sub, subIndex) => (
                        <NavLink 
                          key={subIndex} 
                          to={sub.path}
                          onClick={handleNavClick}
                          className={({ isActive }) => `block px-3 py-2 text-sm rounded-md transition-colors ${isActive ? 'text-accent bg-gray-800/50' : 'text-gray-400 hover:text-white hover:bg-gray-800/30'}`}
                        >
                          {sub.label}
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <NavLink 
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) => `flex items-center justify-between px-3 py-2.5 rounded-lg transition-all duration-200 group ${isActive ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'hover:bg-gray-800 hover:text-white'}`}
                >
                  {({ isActive }) => (
                    <>
                      <div className="flex items-center gap-3">
                        <span className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-accent'}>{item.icon}</span>
                        <span className="text-sm font-medium">{item.label}</span>
                      </div>
                      {item.badge && <span className="bg-danger text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">{item.badge}</span>}
                    </>
                  )}
                </NavLink>
              )}
            </div>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-400 hover:bg-gray-800 hover:text-red-300 transition-colors">
            <LogOut size={20} />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
