import React from 'react';
import { MapPin, Phone, Mail, Globe } from 'lucide-react';

export const InvoiceViewer = ({ invoice, onClose, onPrint }) => {
  if (!invoice) return null;

  // Generate QR Data for scanning
  const qrData = encodeURIComponent(`
INVOICE DETAILS - KS Pharma Net
-------------------------------
Invoice No: ${invoice.id}
Date: ${invoice.date}
Customer: ${invoice.customer}
Total Amount: Rs. ${invoice.amount.toFixed(2)}
Payment: ${invoice.payment}
Status: ${invoice.status}
-------------------------------
Thank you for your business!
  `.trim());

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:p-0 print:bg-white print:fixed print:inset-0">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none overflow-hidden">
        
        {/* Modal Header - Hidden in Print */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 print:hidden bg-white">
          <h2 className="text-lg font-bold text-gray-800">Invoice Preview</h2>
          <div className="flex gap-2">
            <button 
              onClick={onPrint}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-secondary font-medium transition-colors flex items-center gap-2"
            >
              Print Invoice
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-gray-50/50 print:bg-white print:text-black print:p-0 print:overflow-visible">
          <div className="bg-white shadow-sm border border-gray-200/60 p-8 md:p-10 rounded-xl print:shadow-none print:border-none print:p-0 mx-auto max-w-3xl print:max-w-none" id="printable-invoice">
            
            {/* Invoice Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-8 mb-8">
              <div className="flex flex-col gap-4">
                 <img src="/KS2-Logo.png" alt="Company Logo" className="h-16 w-auto object-contain" />
                 <div className="text-sm text-gray-500 space-y-1">
                    <p className="font-bold text-gray-900 text-lg">KS Pharma Net</p>
                    <div className="flex items-center gap-2"><MapPin size={14} /> 123, Health Avenue, Medical District</div>
                    <div className="flex items-center gap-2"><Phone size={14} /> +91 98765 43210</div>
                    <div className="flex items-center gap-2"><Mail size={14} /> support@kspharma.com</div>
                 </div>
              </div>
              <div className="text-right flex flex-col items-end gap-2">
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Verify Invoice</span>
                        <div className="p-1 bg-white border border-gray-100 rounded-lg">
                            <img src={qrCodeUrl} alt="Verify bill" className="w-16 h-16" />
                        </div>
                    </div>
                    <div className="text-right">
                        <h1 className="text-4xl font-black text-gray-900 mb-2 uppercase tracking-tight text-primary">Invoice</h1>
                        <p className="text-sm font-bold text-gray-500">#{invoice.id}</p>
                    </div>
                </div>
                <div className="mt-2 inline-block bg-gray-50 rounded-lg p-3 text-left border border-gray-100">
                   <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-1">Date Issued</div>
                   <div className="font-bold text-gray-900">{invoice.date}</div>
                </div>
              </div>
            </div>

            {/* Bill To Info */}
            <div className="flex justify-between gap-8 mb-8">
                <div className="flex-1">
                    <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Bill To</h3>
                    <div className="font-bold text-xl text-gray-800 mb-1">{invoice.customer}</div>
                    <p className="text-sm text-gray-500 max-w-xs">
                        Sector 45, Near City Hospital,<br/>
                        Mumbai, Maharashtra - 400001
                    </p>
                </div>
                <div className="flex-1 text-right">
                     <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-2">Payment Details</h3>
                     <div className="space-y-1 text-sm">
                         <div className="flex justify-end gap-4"><span className="text-gray-500">Method:</span> <span className="font-bold">{invoice.payment}</span></div>
                         <div className="flex justify-end gap-4"><span className="text-gray-500">Status:</span> 
                            <span className={`font-bold ${invoice.status === 'Paid' ? 'text-green-600' : 'text-orange-600'}`}>{invoice.status}</span>
                         </div>
                     </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-y border-gray-200 text-gray-600 uppercase text-xs tracking-wider">
                            <th className="py-3 px-4 font-bold">#</th>
                            <th className="py-3 px-4 font-bold w-1/2">Item Description</th>
                            <th className="py-3 px-4 font-bold text-center">Qty</th>
                            <th className="py-3 px-4 font-bold text-right">Rate</th>
                            <th className="py-3 px-4 font-bold text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {/* Use invoice items if available, else mock data */}
                        {(invoice.itemsList || [
                            { name: 'Dolo 650mg Tablet', qty: 2, rate: 30 },
                            { name: 'Azithral 500mg', qty: 1, rate: 120 },
                            { name: 'Vitamin C 500mg', qty: 5, rate: 5 },
                            { name: 'Crosin Syrup', qty: 1, rate: 45 }
                        ]).slice(0, invoice.items || 4).map((item, idx) => (
                            <tr key={idx}>
                                <td className="py-3 px-4 text-gray-500">{idx + 1}</td>
                                <td className="py-3 px-4 font-medium text-gray-800">{item.name}</td>
                                <td className="py-3 px-4 text-center text-gray-600">{item.qty}</td>
                                <td className="py-3 px-4 text-right text-gray-600">₹{item.rate.toFixed(2)}</td>
                                <td className="py-3 px-4 text-right font-bold text-gray-800">₹{(item.qty * item.rate).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Summaries */}
            <div className="flex justify-end border-t border-gray-200 pt-6">
                <div className="w-64 space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Subtotal</span>
                        <span className="font-medium">₹{(invoice.amount * 0.82).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Tax (18% GST)</span>
                        <span className="font-medium">₹{(invoice.amount * 0.18).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-3 text-base">
                        <span className="font-bold text-gray-800">Grand Total</span>
                        <span className="font-black text-primary text-xl">₹{invoice.amount.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100 text-center">
                <p className="text-gray-900 font-bold text-sm mb-2">Thank you for your business!</p>
                <p className="text-xs text-gray-500">
                    Terms & Conditions: Goods once sold will not be taken back or exchanged. 
                    Please consult your doctor before consuming any medication.
                </p>
                <div className="mt-8 flex justify-between items-end px-10 invisible print:visible">
                    <div className="text-xs border-t border-gray-400 px-4 pt-1">Customer Signature</div>
                    <div className="text-xs border-t border-gray-400 px-4 pt-1">Authorized Signatory</div>
                </div>
            </div>

          </div>
        </div>
      </div>
      <style>{`
        @media print {
            body * {
                visibility: hidden;
            }
            .fixed {
                position: static;
                background: white;
            }
            #printable-invoice, #printable-invoice * {
                visibility: visible;
            }
            #printable-invoice {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 20px;
                border: none;
                box-shadow: none;
            }
        }
      `}</style>
    </div>
  );
};

export default InvoiceViewer;
