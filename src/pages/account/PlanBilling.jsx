import React from 'react';
import { CreditCard, CheckCircle, Download, ExternalLink, Zap } from 'lucide-react';

const PlanBilling = () => {
  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Plan & Billing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Manage your subscription and billing history.</p>
        </div>
        <button className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold rounded-lg shadow-lg hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-2">
           <Zap size={18} /> Upgrade Plan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Current Plan Card */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 p-4 opacity-10">
              <Zap size={150} />
           </div>
           <dvi className="relative z-10">
             <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Premium Plan</span>
             <h2 className="text-4xl font-bold mt-4">₹ 4,999<span className="text-lg font-normal text-gray-400">/mo</span></h2>
             <p className="text-gray-400 text-sm mt-2">Next billing on Feb 28, 2026</p>
             
             <div className="mt-8 space-y-3">
               <div className="flex items-center gap-2">
                 <CheckCircle className="text-green-400" size={18} />
                 <span className="text-sm font-medium">Unlimited Inventory Items</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle className="text-green-400" size={18} />
                 <span className="text-sm font-medium">Multi-branch Management (upto 5)</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle className="text-green-400" size={18} />
                 <span className="text-sm font-medium">Advanced Reports & Analytics</span>
               </div>
               <div className="flex items-center gap-2">
                 <CheckCircle className="text-green-400" size={18} />
                 <span className="text-sm font-medium">Priority 24/7 Support</span>
               </div>
             </div>

             <button className="w-full mt-8 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold py-3 rounded-lg transition-colors">
               Manage Subscription
             </button>
           </dvi>
        </div>

        {/* Billing Info & Payment Method */}
        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">Payment Method</h3>
             
             <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-600 rounded-lg hover:border-accent transition-colors cursor-pointer group">
               <div className="flex items-center gap-4">
                 <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                    <CreditCard size={24} />
                 </div>
                 <div>
                   <p className="font-bold text-gray-800 dark:text-white group-hover:text-accent transition-colors">Visa ending in 4242</p>
                   <p className="text-xs text-gray-500">Expiry 12/28</p>
                 </div>
               </div>
               <span className="text-xs font-bold text-gray-400 uppercase border border-gray-200 dark:border-gray-600 px-2 py-1 rounded">Default</span>
             </div>
             
             <button className="mt-4 text-sm text-accent font-bold hover:underline flex items-center gap-1">
               <ExternalLink size={14} /> Add new payment method
             </button>
           </div>

           {/* Invoices Table */}
           <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
             <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">Billing History</h3>
                <button className="text-xs text-gray-500 hover:text-gray-800 dark:hover:text-white">View All</button>
             </div>
             
             <div className="overflow-x-auto">
               <table className="w-full text-left">
                 <thead className="bg-gray-50 dark:bg-gray-700 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">
                   <tr>
                     <th className="px-4 py-3 rounded-l-lg">Invoice ID</th>
                     <th className="px-4 py-3">Date</th>
                     <th className="px-4 py-3">Amount</th>
                     <th className="px-4 py-3">Status</th>
                     <th className="px-4 py-3 rounded-r-lg text-right">Action</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                   <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                     <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">#INV-2024-001</td>
                     <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Jan 01, 2026</td>
                     <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200">₹ 4,999.00</td>
                     <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">Paid</span></td>
                     <td className="px-4 py-3 text-right">
                       <button className="text-gray-400 hover:text-accent"><Download size={16} /></button>
                     </td>
                   </tr>
                   <tr className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50">
                     <td className="px-4 py-3 text-sm font-medium text-gray-800 dark:text-gray-200">#INV-2023-128</td>
                     <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">Dec 01, 2025</td>
                     <td className="px-4 py-3 text-sm font-bold text-gray-800 dark:text-gray-200">₹ 4,999.00</td>
                     <td className="px-4 py-3"><span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full">Paid</span></td>
                     <td className="px-4 py-3 text-right">
                       <button className="text-gray-400 hover:text-accent"><Download size={16} /></button>
                     </td>
                   </tr>
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PlanBilling;
