import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';

// Components
import ComingSoon from './components/ComingSoon';

// Inventory Pages
import InventoryDashboard from './pages/inventory/InventoryDashboard';
import StockList from './pages/inventory/StockList';
import InventoryStockIn from './pages/inventory/InventoryStockIn';
import InventoryStockOut from './pages/inventory/InventoryStockOut';
import ExpiryManagement from './pages/inventory/ExpiryManagement';
import LowStockAlerts from './pages/inventory/LowStockAlerts';
import UnitsManagement from './pages/inventory/UnitsManagement';
import StockAdjustment from './pages/inventory/StockAdjustment';
import StatsHistory from './pages/inventory/StatsHistory';
import ExpiryReport from './pages/inventory/ExpiryReport';
import ViewStockOut from './pages/inventory/ViewStockOut';

// Medicine Pages (Re-mapped to existing files in inventory folder for now to avoid move conflicts)
import MedicineList from './pages/inventory/MedicineList';
import MedicineMaster from './pages/inventory/MedicineMaster';
import MedicineGroups from './pages/inventory/MedicineGroups';
import MedicineCategories from './pages/inventory/MedicineCategories';
import PrescriptionManagement from './pages/inventory/PrescriptionManagement';

// Sales Pages
import SalesEntry from './pages/sales/SalesEntry';
import InvoiceList from './pages/sales/InvoiceList';
import ViewInvoice from './pages/sales/ViewInvoice';
import ViewSalesReturn from './pages/sales/ViewSalesReturn';
import SalesReturn from './pages/sales/SalesReturn';
import OnlineOrders from './pages/sales/OnlineOrders';
import SupplierList from './pages/purchase/SupplierList';
import PurchaseInvoices from './pages/purchase/PurchaseInvoices';
import ViewPurchaseInvoice from './pages/purchase/ViewPurchaseInvoice';
import PurchaseReturn from './pages/purchase/PurchaseReturn';
import ViewPurchaseReturn from './pages/purchase/ViewPurchaseReturn';
import GRNList from './pages/purchase/GRNList';
import AddGRN from './pages/purchase/AddGRN';
import ViewGRN from './pages/purchase/ViewGRN';
import CustomerList from './pages/people/CustomerList';
import DoctorList from './pages/people/DoctorList';
import DoctorForm from './pages/people/DoctorForm';
import DoctorDetails from './pages/people/DoctorDetails';

// Reports
import GroupWiseReport from './pages/reports/GroupWiseReport';
import InventoryReport from './pages/reports/InventoryReport';
import ViewInventoryReport from './pages/reports/ViewInventoryReport';
import SalesReport from './pages/reports/SalesReport';
import ViewSalesReport from './pages/reports/ViewSalesReport';
import ProfitReport from './pages/reports/ProfitReport';
import ViewProfitReport from './pages/reports/ViewProfitReport';

// Config Pages
import GeneralSettings from './pages/config/GeneralSettings';
import InventorySettings from './pages/config/InventorySettings';
import RolesPermissions from './pages/config/RolesPermissions';
import Notifications from './pages/Notifications';
import AppSettings from './pages/AppSettings';

// Account Pages
import Profile from './pages/account/Profile';
import Security from './pages/account/Security';
import PlanBilling from './pages/account/PlanBilling';
import ActivityLog from './pages/account/ActivityLog';
import HelpSupport from './pages/account/HelpSupport';

import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
           {/* Default Route */}
          <Route index element={<Dashboard />} />
          
          {/* =======================
              2. INVENTORY ROUTES 
             ======================= */}
          <Route path="inventory/dashboard" element={<InventoryDashboard />} />
          <Route path="inventory/stock" element={<StockList />} />
          <Route path="inventory/stock-in" element={<InventoryStockIn />} />
          <Route path="inventory/stock-out" element={<InventoryStockOut />} />
          <Route path="inventory/expiry" element={<ExpiryManagement />} />
          <Route path="inventory/expiry-report" element={<ExpiryReport />} />
          <Route path="inventory/low-stock" element={<LowStockAlerts />} />
          <Route path="inventory/units" element={<UnitsManagement />} />
          <Route path="inventory/adjustment" element={<StockAdjustment />} />
          <Route path="inventory/stats-history" element={<StatsHistory />} />


          {/* =======================
              3. MEDICINES ROUTES 
             ======================= */}
          <Route path="medicines/list" element={<MedicineList />} />
          <Route path="medicines/add" element={<MedicineMaster />} />
          <Route path="medicines/groups" element={<MedicineGroups />} />
          <Route path="medicines/categories" element={<MedicineCategories />} />
          <Route path="medicines/prescriptions" element={<PrescriptionManagement />} />


          {/* =======================
              4. SALES ROUTES 
             ======================= */}
          <Route path="sales/pos" element={<SalesEntry />} />
          <Route path="sales/pos/edit/:id" element={<SalesEntry />} />
          <Route path="sales/invoices" element={<InvoiceList />} />
          <Route path="sales/online-orders" element={<OnlineOrders />} />
          <Route path="sales/return" element={<SalesReturn />} />


          {/* =======================
              5. PURCHASE ROUTES 
             ======================= */}
          <Route path="purchase/suppliers" element={<SupplierList />} />
          <Route path="purchase/invoices" element={<PurchaseInvoices />} />
          <Route path="purchase/return" element={<PurchaseReturn />} />
          <Route path="purchase/return/view/:id" element={<ViewPurchaseReturn />} />
          <Route path="purchase/grn" element={<GRNList />} />
          <Route path="purchase/grn/add" element={<AddGRN />} />
          <Route path="purchase/grn/view/:id" element={<ViewGRN />} />

          {/* =======================
              6. CUSTOMERS ROUTES 
             ======================= */}
          <Route path="people/customers" element={<CustomerList />} />
          <Route path="people/doctors" element={<DoctorList />} />
          <Route path="people/doctors/add" element={<DoctorForm />} />
          <Route path="people/doctors/edit/:id" element={<DoctorForm />} />
          <Route path="people/doctors/view/:id" element={<DoctorDetails />} />

          {/* =======================
              7. REPORTS ROUTES 
             ======================= */}
          <Route path="reports/inventory" element={<InventoryReport />} />
          <Route path="reports/inventory/view" element={<ViewInventoryReport />} />
          <Route path="reports/sales" element={<SalesReport />} />
          <Route path="reports/sales/view" element={<ViewSalesReport />} />
          <Route path="reports/profit" element={<ProfitReport />} />
          <Route path="reports/profit/view" element={<ViewProfitReport />} />
          <Route path="reports/groups" element={<GroupWiseReport />} />

           {/* =======================
              8. CONFIG & OTHERS 
             ======================= */}
           <Route path="config/general" element={<GeneralSettings />} />
           <Route path="config/inventory" element={<InventorySettings />} />
           <Route path="config/roles" element={<RolesPermissions />} />
           <Route path="notifications" element={<Notifications />} />
           <Route path="app-settings" element={<AppSettings />} />

           {/* =======================
              9. ACCOUNT ROUTES 
             ======================= */}
           <Route path="account/profile" element={<Profile />} />
           <Route path="account/security" element={<Security />} />
           <Route path="account/billing" element={<PlanBilling />} />
           <Route path="account/activity" element={<ActivityLog />} />
           <Route path="account/support" element={<HelpSupport />} />

          {/* Fallback for legacy routes if any */}
          <Route path="inventory/*" element={<Navigate to="/inventory/dashboard" replace />} />
        </Route>

        {/* Standalone Pages (No Layout) */}
        <Route path="/sales/invoices/view/:id" element={<ViewInvoice />} />
        <Route path="/purchase/invoices/view/:id" element={<ViewPurchaseInvoice />} />
        <Route path="/sales/return/view/:id" element={<ViewSalesReturn />} />
        <Route path="/inventory/stock-out/view/:id" element={<ViewStockOut />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
