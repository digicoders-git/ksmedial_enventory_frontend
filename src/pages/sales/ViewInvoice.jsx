import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download, Share2, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Helper to add Logo
    const img = new Image();
    img.src = KS2Logo;
    
    img.onload = () => {
        // Logo
        doc.addImage(img, 'PNG', 14, 10, 45, 20);

        // Company Info
        doc.setFontSize(11);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('KS Pharma Net', 14, 40);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text('123, Health Avenue, Medical District', 14, 46);
        doc.text('Phone: +91 98765 43210', 14, 51);
        doc.text('Email: support@kspharma.com', 14, 56);

        // Invoice Header
        doc.setFontSize(36);
        doc.setTextColor(230, 230, 230);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', pageWidth - 14, 25, { align: 'right' });
        
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`#${invoice.id}`, pageWidth - 14, 38, { align: 'right' });
        
        // Status Badge
        const statusX = pageWidth - 30;
        const statusY = 48;
        doc.setDrawColor(220, 252, 231);
        doc.setFillColor(240, 253, 244);
        doc.roundedRect(statusX, statusY, 16, 6, 1, 1, 'FD');
        doc.setTextColor(22, 101, 52);
        doc.setFontSize(8);
        doc.text(invoice.status.toUpperCase(), statusX + 8, statusY + 4.2, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text(`Issued: ${invoice.date}`, pageWidth - 14, 62, { align: 'right' });

        doc.setDrawColor(245);
        doc.line(14, 75, pageWidth - 14, 75);

        // Bill To & Payment Info (Dual Column)
        doc.setFontSize(8);
        doc.setTextColor(160);
        doc.setFont('helvetica', 'bold');
        doc.text('BILL TO', 14, 85);
        doc.text('PAYMENT INFO', pageWidth - 14, 85, { align: 'right' });

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(invoice.customer, 14, 93);
        
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.setFont('helvetica', 'normal');
        const splitAddress = doc.splitTextToSize(invoice.address, 70);
        doc.text(splitAddress, 14, 100);
        doc.text(`Tel: ${invoice.contact}`, 14, 100 + (splitAddress.length * 5));

        // Right side - Payment info details
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text('Payment Mode:', pageWidth - 45, 93, { align: 'right' });
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.payment, pageWidth - 14, 93, { align: 'right' });
        
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Payment ID:', pageWidth - 45, 100, { align: 'right' });
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('TXN-8829102', pageWidth - 14, 100, { align: 'right' });

        // Items Table
        const tableColumn = ["#", "Item Name", "Qty", "Rate", "Tax", "Total"];
        const tableRows = invoice.items.map((item, index) => [
            index + 1,
            item.name,
            item.qty,
            `Rs. ${item.rate.toFixed(2)}`,
            `${item.tax}%`,
            `Rs. ${(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 125,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 114, 66], textColor: [255, 255, 255], fontSize: 9, fontStyle: 'bold' },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { halign: 'center' },
                2: { halign: 'center' },
                3: { halign: 'right' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });

        // Summary Area
        const finalY = doc.lastAutoTable.finalY + 15;
        
        // Note
        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text('Note:', 14, finalY);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        const noteText = "Goods once sold will not be taken back. Terms & conditions apply.";
        const splitNote = doc.splitTextToSize(noteText, 80);
        doc.text(splitNote, 14, finalY + 5);

        // Calculation
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Subtotal`, pageWidth - 60, finalY);
        doc.setTextColor(0);
        doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
        
        doc.setTextColor(100);
        doc.text(`Discount`, pageWidth - 60, finalY + 8);
        doc.setTextColor(239, 68, 68);
        doc.text(`-Rs. ${invoice.discountAmount.toFixed(2)}`, pageWidth - 14, finalY + 8, { align: 'right' });
        
        doc.setTextColor(100);
        doc.text(`Total Tax (GST)`, pageWidth - 60, finalY + 16);
        doc.setTextColor(0);
        doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 16, { align: 'right' });

        doc.setDrawColor(230);
        doc.line(pageWidth - 70, finalY + 22, pageWidth - 14, finalY + 22);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'black');
        doc.text(`GRAND TOTAL`, pageWidth - 70, finalY + 32);
        doc.setTextColor(0, 114, 66);
        doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, pageWidth - 14, finalY + 32, { align: 'right' });

        doc.save(`${invoice.id}_invoice.pdf`);
    };
    
    // Fallback if image fails to load
    img.onerror = () => {
        doc.setFontSize(22);
        doc.setTextColor(0, 114, 66);
        doc.text('KS PHARMA NET', 14, 22);
        doc.save(`${invoice.id}_invoice.pdf`);
    }
  };

  useEffect(() => {
    // Mock Fetch - In real app, fetch from API using ID
    // Simulating a fetch delay
    setTimeout(() => {
        setInvoice({
            id: id || 'INV-2024-001',
            date: '2024-01-26',
            customer: 'Rahul Sharma',
            contact: '+91 98765 43210',
            address: 'Sector 45, Near City Hospital, Mumbai, Maharashtra - 400001',
            payment: 'UPI',
            status: 'Paid',
            items: [
                { name: 'Dolo 650mg Tablet', qty: 2, rate: 30, discount: 0, tax: 18 },
                { name: 'Azithral 500mg', qty: 1, rate: 120, discount: 10, tax: 18 },
                { name: 'Vitamin C 500mg', qty: 5, rate: 5, discount: 0, tax: 12 },
                { name: 'Crosin Syrup', qty: 1, rate: 45, discount: 5, tax: 12 },
                 { name: 'Pan 40 Tablet', qty: 10, rate: 12, discount: 0, tax: 18 },
            ],
            subtotal: 440,
            taxAmount: 79.2,
            discountAmount: 17,
            grandTotal: 502.2
        });
    }, 500);
  }, [id]);

  if (!invoice) return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-fade-in print:p-0 print:bg-white">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors bg-white px-4 py-2 rounded-lg border border-gray-200 shadow-sm hover:shadow-md"
        >
            <ArrowLeft size={18} /> Back
        </button>
        
        <div className="flex gap-2">
            <button 
                onClick={handleDownloadPDF}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 shadow-sm transition-all"
            >
                <Download size={18} /> Download PDF
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg shadow-md hover:shadow-lg hover:bg-secondary transition-all"
            >
                <Printer size={18} /> Print Invoice
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 p-8 md:p-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8">
                <div className="flex flex-col gap-4">
                    <img src="/KS2-Logo.png" alt="Logo" className="h-20 w-auto object-contain" />
                    <div className="space-y-1.5 text-sm text-gray-500">
                        <h2 className="text-xl font-bold text-gray-900">KS Pharma Net</h2>
                        <div className="flex items-center gap-2"><MapPin size={14} className="text-primary"/> 123, Health Avenue, Medical District</div>
                        <div className="flex items-center gap-2"><Phone size={14} className="text-primary"/> +91 98765 43210</div>
                        <div className="flex items-center gap-2"><Mail size={14} className="text-primary"/> support@kspharma.com</div>
                    </div>
                </div>

                <div className="text-right w-full md:w-auto">
                    <h1 className="text-5xl font-black text-gray-900/10 uppercase tracking-tight leading-none mb-2">Invoice</h1>
                    <div className="text-2xl font-bold text-gray-800">#{invoice.id}</div>
                    
                    <div className="mt-6 flex flex-col items-end gap-2">
                        <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase border border-green-100 inline-block">
                             {invoice.status}
                        </div>
                        <div className="text-sm text-gray-500 font-medium">
                            Issued: <span className="text-gray-900 font-bold">{invoice.date}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Billing Details */}
        <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Bill To</h3>
                <div className="text-lg font-bold text-gray-900 mb-2">{invoice.customer}</div>
                <div className="text-sm text-gray-500 leading-relaxed max-w-xs">{invoice.address}</div>
                <div className="mt-3 text-sm font-medium text-gray-700">Tel: {invoice.contact}</div>
            </div>
            
            <div className="md:text-right">
                 <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Payment Info</h3>
                 <div className="space-y-2 text-sm">
                    <div className="flex md:justify-end justify-between gap-8">
                        <span className="text-gray-500">Payment Mode</span>
                        <span className="font-bold text-gray-900">{invoice.payment}</span>
                    </div>
                     <div className="flex md:justify-end justify-between gap-8">
                        <span className="text-gray-500">Payment ID</span>
                        <span className="font-bold text-gray-900">TXN-8829102</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Items Table */}
        <div className="px-8 md:px-12 pb-8">
            <div className="border rounded-xl overflow-hidden border-gray-200">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-gray-900 font-bold uppercase text-xs tracking-wider">
                            <th className="py-4 px-6 w-16 text-center">#</th>
                            <th className="py-4 px-6 w-1/3">Item Name</th>
                            <th className="py-4 px-6 text-center">Qty</th>
                            <th className="py-4 px-6 text-right">Rate</th>
                            <th className="py-4 px-6 text-right">Tax</th>
                            <th className="py-4 px-6 text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {invoice.items.map((item, index) => (
                            <tr key={index} className="hover:bg-gray-50/50 transition-colors">
                                <td className="py-4 px-6 text-center text-gray-500 font-medium">{index + 1}</td>
                                <td className="py-4 px-6 font-semibold text-gray-800">{item.name}</td>
                                <td className="py-4 px-6 text-center text-gray-600 font-medium">{item.qty}</td>
                                <td className="py-4 px-6 text-right text-gray-600">₹{item.rate.toFixed(2)}</td>
                                <td className="py-4 px-6 text-right text-xs text-gray-500 flex flex-col items-end gap-1">
                                    <span>{item.tax}% GST</span>
                                    <span className="text-gray-400">₹{((item.qty * item.rate * item.tax)/100).toFixed(2)}</span>
                                </td>
                                <td className="py-4 px-6 text-right font-bold text-gray-900">₹{(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-gray-50 p-8 md:p-12 flex flex-col md:flex-row justify-end items-start gap-12 print:break-inside-avoid">
             <div className="flex-1 text-xs text-gray-500 space-y-2 max-w-sm">
                <p className="font-bold text-gray-900 text-sm">Note:</p>
                <p>Goods once sold will not be taken back or exchanged. Please ensure the products are correct before leaving the counter.</p>
                <p className="mt-4 pt-4 border-t border-gray-200">
                    Terms & Conditions apply. For any discrepancies, contact us within 24 hours.
                </p>
             </div>

             <div className="w-full md:w-80 space-y-4">
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Subtotal</span>
                    <span>₹{invoice.subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Discount</span>
                    <span className="text-red-500">-₹{invoice.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Total Tax (GST)</span>
                    <span>₹{invoice.taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 pt-4 mt-2">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-lg">Grand Total</span>
                        <span className="text-xs text-gray-500 font-normal">Inclusive of all taxes</span>
                    </div>
                    <span className="font-black text-primary text-2xl">₹{invoice.grandTotal.toFixed(2)}</span>
                </div>
             </div>
        </div>
        
        {/* Print Only Footer - Signatures */}
        <div className="hidden print:flex justify-between items-end px-12 pb-12 mt-12">
            <div className="text-center">
                <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Customer Signature</p>
            </div>
            <div className="text-center">
                 <div className="h-16 w-32 border-b border-gray-400 mb-2"></div>
                <p className="text-xs font-bold uppercase text-gray-600">Authorized Signatory</p>
            </div>
        </div>

      </div>
      <style>{`
          @media print {
              @page { margin: 0; size: auto; }
              body { 
                background: white; 
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              /* Hide all non-printable elements by default if they aren't caught by print:hidden */
              body > *:not(#root) { display: none; }
              
              /* Ensure the invoice container takes full width */
              .max-w-4xl {
                  max-width: none !important;
                  width: 100% !important;
                  margin: 0 !important;
                  box-shadow: none !important;
                  border: none !important;
              }
              
              /* Force background colors to print */
              * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
              }
              
              /* Ensure text is dark and readable */
              p, div, span, h1, h2, h3, h4, th, td {
                  color: #000 !important;
              }
              .text-primary {
                  color: #007242 !important;
              }
              .text-red-500 {
                  color: #ef4444 !important;
              }
              
              /* Remove any overflow clipping */
              .overflow-hidden {
                  overflow: visible !important;
              }
              
              /* Adjust padding for print */
              .p-8, .md:p-12 {
                  padding: 20px !important;
              }
          }
      `}</style>
    </div>
  );
};

export default ViewInvoice;
