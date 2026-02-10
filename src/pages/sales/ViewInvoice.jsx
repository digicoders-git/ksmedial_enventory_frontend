import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Phone, Mail, Printer, ArrowLeft, Download, Share2, FileText, Package } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import KS2Logo from '/KS2-Logo.png'; 
import api from '../../api/axios';

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for auto-print param
  const queryParams = new URLSearchParams(window.location.search);
  const autoPrint = queryParams.get('autoPrint') === 'true';

  useEffect(() => {
    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/sales/${id}`);
            if (data.success) {
                const sale = data.sale;
                setInvoice({
                    id: sale.invoiceNumber,
                    date: new Date(sale.createdAt).toLocaleDateString(),
                    customer: sale.customerName || 'Walk-in Customer',
                    contact: sale.customerId?.phone || 'N/A',
                    address: sale.customerId?.address || 'N/A',
                    payment: sale.paymentMethod,
                    status: sale.status,
                    items: sale.items.map(i => ({
                        name: i.name,
                        qty: i.quantity,
                        rate: i.price,
                        tax: i.tax || 18,
                        total: i.subtotal
                    })),
                    subtotal: sale.subTotal || 0,
                    taxAmount: sale.taxAmount || 0,
                    discountAmount: sale.discountAmount || 0,
                    grandTotal: sale.totalAmount,
                    patientDetails: sale.patientDetails,
                    shippingDetails: sale.shippingDetails || { packingType: 'Box', boxCount: 1, polyCount: 0, isColdStorage: false } // Default if missing
                });
            }
        } catch (error) {
            console.error("Error fetching invoice:", error);
        } finally {
            setLoading(false);
        }
    };
    fetchInvoice();
  }, [id]);

  useEffect(() => {
      if (!loading && invoice && autoPrint) {
          setTimeout(() => {
              window.print();
          }, 1000);
      }
  }, [loading, invoice, autoPrint]);

  // Generate QR Data for scanning
  const qrData = invoice ? encodeURIComponent(`
INVOICE DETAILS - KS Pharma Net
-------------------------------
Invoice No: ${invoice.id}
Date: ${invoice.date}
Customer: ${invoice.customer}
Total Amount: Rs. ${invoice.grandTotal.toFixed(2)}
Payment: ${invoice.payment}
Status: ${invoice.status}
-------------------------------
Thank you for your business!
  `.trim()) : '';

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${qrData}`;

  const handlePrintLabel = () => {
      if (!invoice) return;

      const w = window.open('', '_blank');
      // Use invoice data directly
      const details = {
          patient: invoice.patientDetails || {},
          shipping: invoice.shippingDetails || { packingType: 'Box', boxCount: 1, polyCount: 0, isColdStorage: false }
      };
      
      // Fallbacks if patient details are empty but generic customer exists
      if (!details.patient.name) details.patient.name = invoice.customer;
      if (!details.patient.mobile) details.patient.mobile = invoice.contact;
      if (!details.patient.address) details.patient.address = invoice.address;

      w.document.write(`
          <html>
          <head>
              <title>Shipping Label - ${invoice.id}</title>
              <style>
                  body { font-family: sans-serif; padding: 20px; border: 2px solid #000; max-width: 400px; margin: 20px auto; }
                  h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin: 0 0 20px 0; }
                  .row { margin: 10px 0; display: flex; justify-content: space-between; }
                  .label { font-weight: bold; font-size: 0.9em; text-transform: uppercase; color: #555; }
                  .value { font-weight: bold; font-size: 1.1em; margin-bottom: 5px; }
                  .box { border: 2px solid #000; padding: 15px; margin-top: 20px; text-align: center; font-weight: bold; font-size: 1.4em; background: #f9f9f9; }
                  .cold { background: #e0f7fa; color: #006064; padding: 8px; text-align: center; font-weight: bold; margin-bottom: 15px; border: 2px dashed #0097a7; font-size: 1.2em; }
                  .section { margin-bottom: 20px; }
                  .address { white-space: pre-wrap; line-height: 1.4; }
                  @media print {
                      body { border: none; margin: 0; padding: 0; max-width: 100%; }
                      .no-print { display: none; }
                  }
              </style>
          </head>
          <body>
              ${details.shipping.isColdStorage ? '<div class="cold">❄️ COLD STORAGE ITEM ❄️</div>' : ''}
              <h1>SHIPPING LABEL</h1>
              
              <div class="section">
                  <div class="label">SHIP TO:</div>
                  <div class="value" style="font-size: 1.3em;">${details.patient.name || 'Valued Customer'}</div>
                  <div class="address">${details.patient.address || 'Address Not Provided'}</div>
                  <div style="margin-top: 5px;">Ph: <strong>${details.patient.mobile || 'N/A'}</strong></div>
              </div>

              <div class="section" style="text-align: right; border-top: 1px dotted #ccc; padding-top: 10px;">
                  <div class="label">FROM:</div>
                  <div class="value">KS Pharma Net</div>
                  <div class="address">123, Health Avenue, Medical District\nNew Delhi - 110001</div>
                  <div>Ph: +91 98765 43210</div>
              </div>

              <div class="row" style="border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 10px 0;">
                  <div>
                      <span class="label">Inv #:</span> <strong>${invoice.id}</strong>
                  </div>
                  <div>
                      <span class="label">Date:</span> <strong>${invoice.date}</strong>
                  </div>
              </div>
              
              <div class="box">
                  ${details.shipping.packingType.toUpperCase()}<br/>
                  <span style="font-size: 0.7em; font-weight: normal;">CONTENTS:</span><br/>
                  ${details.shipping.boxCount} BOX / ${details.shipping.polyCount} POLY
              </div>
              
              ${details.patient.doctorName ? `
              <div style="margin-top: 20px; font-size: 0.9em; border-top: 1px dotted #ccc; padding-top: 10px;">
                  <span class="label">Ref. Doctor:</span><br/>
                  <strong>Dr. ${details.patient.doctorName}</strong><br/>
                  ${details.patient.doctorAddress || ''}
              </div>` : ''}

              <script>
                  window.onload = function() { window.print(); }
              </script>
          </body>
          </html>
      `);
      w.document.close();
  };

  const handleDownloadPDF = () => {
    if (!invoice) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const img = new Image();
    img.src = KS2Logo;
    
    img.onload = () => {
        // Add QR Code to PDF
        const qrImg = new Image();
        qrImg.crossOrigin = "anonymous";
        qrImg.src = qrCodeUrl;
        
        qrImg.onload = () => {
            doc.addImage(img, 'PNG', 14, 10, 45, 20);
            // QR Code in Top Right corner of PDF
            doc.addImage(qrImg, 'PNG', pageWidth - 44, 45, 30, 30);
            doc.setFontSize(7);
            doc.setTextColor(150);
            doc.text('SCAN TO VERIFY', pageWidth - 29, 78, { align: 'center' });

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

        doc.setFontSize(36);
        doc.setTextColor(230, 230, 230);
        doc.setFont('helvetica', 'bold');
        doc.text('INVOICE', pageWidth - 14, 25, { align: 'right' });
        
        doc.setFontSize(16);
        doc.setTextColor(0);
        doc.text(`#${invoice.id}`, pageWidth - 14, 38, { align: 'right' });
        
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
        const splitAddress = doc.splitTextToSize(invoice.address || 'N/A', 70);
        doc.text(splitAddress, 14, 100);
        doc.text(`Tel: ${invoice.contact}`, 14, 100 + (splitAddress.length * 5));

        doc.text('Payment Mode:', pageWidth - 45, 93, { align: 'right' });
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.payment, pageWidth - 14, 93, { align: 'right' });

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100);
        doc.text('Invoice No:', pageWidth - 45, 100, { align: 'right' });
        doc.setTextColor(0);
        doc.setFont('helvetica', 'bold');
        doc.text(invoice.id, pageWidth - 14, 100, { align: 'right' });

        const tableColumn = ["#", "Item Name", "Rate", "Qty", "Tax", "Total"];
        const tableRows = invoice.items.map((item, index) => [
            index + 1,
            item.name,
            `Rs. ${item.rate.toFixed(2)}`,
            item.qty,
            `${item.tax}%`,
            `Rs. ${item.total.toFixed(2)}`
        ]);

        autoTable(doc, {
            startY: 125,
            head: [tableColumn],
            body: tableRows,
            theme: 'striped',
            headStyles: { fillColor: [0, 114, 66], textColor: [255, 255, 255], halign: 'center' },
            bodyStyles: { fontSize: 9 },
            columnStyles: {
                0: { halign: 'center', cellWidth: 10 },
                1: { halign: 'left' },
                2: { halign: 'right' },
                3: { halign: 'center' },
                4: { halign: 'right' },
                5: { halign: 'right' },
            },
            margin: { left: 14, right: 14 },
        });

        const finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Subtotal`, pageWidth - 60, finalY);
        doc.setTextColor(0);
        doc.text(`Rs. ${invoice.subtotal.toFixed(2)}`, pageWidth - 14, finalY, { align: 'right' });
        
        doc.text(`Discount`, pageWidth - 60, finalY + 8);
        doc.setTextColor(239, 68, 68);
        doc.text(`-Rs. ${invoice.discountAmount.toFixed(2)}`, pageWidth - 14, finalY + 8, { align: 'right' });
        
        doc.setTextColor(100);
        doc.text(`Total Tax`, pageWidth - 60, finalY + 16);
        doc.setTextColor(0);
        doc.text(`Rs. ${invoice.taxAmount.toFixed(2)}`, pageWidth - 14, finalY + 16, { align: 'right' });

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`GRAND TOTAL`, pageWidth - 70, finalY + 32);
        doc.setTextColor(0, 114, 66);
        doc.text(`Rs. ${invoice.grandTotal.toFixed(2)}`, pageWidth - 14, finalY + 32, { align: 'right' });

        doc.save(`${invoice.id}_invoice.pdf`);
        }; // End qrImg.onload
    }; // End img.onload

    img.onerror = () => {
        doc.text('SALES INVOICE', 14, 22);
        doc.save(`${invoice.id}_invoice.pdf`);
    };
  };
  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 p-4 md:p-8 animate-fade-in print:p-0 print:bg-white">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row justify-between items-center gap-4 print:hidden">
        <button 
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate('/sales/invoices');
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors bg-white dark:bg-gray-800 px-6 py-3 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md font-bold active:scale-95"
        >
            <ArrowLeft size={18} strokeWidth={2.5} /> 
            <span className="uppercase text-xs tracking-widest">Back to List</span>
        </button>
        
        <div className="flex gap-3 w-full sm:w-auto">
            <button 
                onClick={handleDownloadPDF}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all font-bold active:scale-95"
            >
                <Download size={18} strokeWidth={2.5} />
                <span className="uppercase text-xs tracking-widest">PDF</span>
            </button>
            <button 
                onClick={handlePrintLabel}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 shadow-sm transition-all font-bold active:scale-95"
            >
                <Package size={18} strokeWidth={2.5} />
                <span className="uppercase text-xs tracking-widest">Label</span>
            </button>
            <button 
                onClick={() => window.print()} 
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-primary text-white rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 hover:bg-secondary transition-all font-black active:scale-95"
            >
                <Printer size={18} strokeWidth={3} />
                <span className="uppercase text-xs tracking-widest">Print Invoice</span>
            </button>
        </div>
      </div>

      {/* Invoice Card */}
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:max-w-none print:w-full">
        
        {/* Top Branding Section */}
        <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 border-b border-gray-100 dark:border-gray-700 p-6 md:p-12">
            <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
                <div className="flex flex-col gap-6 w-full lg:w-1/2">
                    <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm w-fit">
                        <img src="/KS2-Logo.png" alt="Logo" className="h-16 md:h-20 w-auto object-contain" />
                    </div>
                    <div className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
                        <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">KS Pharma Net</h2>
                        <div className="flex items-start gap-3">
                            <MapPin size={16} className="text-primary shrink-0 mt-0.5"/> 
                            <span className="font-medium text-gray-600 dark:text-gray-300">123, Health Avenue, Medical District, New Delhi - 110001</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Phone size={16} className="text-primary shrink-0"/> 
                            <span className="font-bold text-gray-800 dark:text-gray-200">+91 98765 43210</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Mail size={16} className="text-primary shrink-0"/> 
                            <span className="font-medium">support@kspharma.com</span>
                        </div>
                    </div>
                </div>

                <div className="text-left lg:text-right w-full lg:w-auto lg:pt-0 pt-8 border-t lg:border-t-0 border-gray-100 dark:border-gray-700">
                    <h1 className="text-6xl md:text-8xl font-black text-gray-900/5 dark:text-white/5 uppercase tracking-tighter leading-none mb-1 -mt-2 lg:block hidden">Invoice</h1>
                    <div className="flex flex-col lg:items-end">
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-2">Invoice Number</span>
                        <div className="text-3xl font-black text-gray-800 dark:text-white leading-none">#{invoice.id}</div>
                    </div>
                    
                    <div className="mt-8 flex flex-col lg:items-end gap-6">
                        <div className="flex flex-col lg:items-end">
                            <span className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Scan & Verify</span>
                            <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg ring-4 ring-primary/5">
                                <img src={qrCodeUrl} alt="Invoice QR" className="w-20 h-20 md:w-24 md:h-24 mix-blend-multiply dark:mix-blend-normal rounded-lg" />
                            </div>
                        </div>
                        <div className="flex flex-col lg:items-end gap-2">
                            <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm
                                ${invoice.status === 'Completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                                 {invoice.status}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400 font-bold whitespace-nowrap">
                                ISSUED: <span className="text-gray-900 dark:text-white">{invoice.date}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Billing Details */}
        <div className="p-8 md:p-12 grid md:grid-cols-2 gap-12">
            <div>
                <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Bill To</h3>
                {invoice.patientDetails?.name ? (
                     <>
                        <div className="text-lg font-bold text-gray-900 mb-1">{invoice.patientDetails.name}</div>
                        <div className="text-sm text-gray-600 mb-1">
                            {invoice.patientDetails.age && <span className="mr-3">Age: {invoice.patientDetails.age}</span>}
                            {invoice.patientDetails.gender && <span>Sex: {invoice.patientDetails.gender}</span>}
                        </div>
                        <div className="text-sm text-gray-500 leading-relaxed max-w-xs">{invoice.patientDetails.address}</div>
                        <div className="mt-2 text-sm font-medium text-gray-700">Mob: {invoice.patientDetails.mobile || invoice.contact}</div>
                        
                        {(invoice.patientDetails.doctorName || invoice.patientDetails.doctorAddress) && (
                            <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                <span className="text-[10px] font-bold text-primary uppercase tracking-widest block mb-1">Prescribed By</span>
                                {invoice.patientDetails.doctorName && <div className="text-sm font-bold text-gray-800">Dr. {invoice.patientDetails.doctorName}</div>}
                                {invoice.patientDetails.doctorAddress && <div className="text-xs text-gray-500">{invoice.patientDetails.doctorAddress}</div>}
                            </div>
                        )}
                     </>
                ) : (
                     <>
                        <div className="text-lg font-bold text-gray-900 mb-2">{invoice.customer}</div>
                        <div className="text-sm text-gray-500 leading-relaxed max-w-xs">{invoice.address}</div>
                        <div className="mt-3 text-sm font-medium text-gray-700">Tel: {invoice.contact}</div>
                     </>
                )}
            </div>
            
            <div className="md:text-right">
                 <h3 className="text-xs font-bold uppercase text-gray-400 tracking-wider mb-4">Payment Info</h3>
                 <div className="space-y-2 text-sm">
                    <div className="flex md:justify-end justify-between gap-8">
                        <span className="text-gray-500">Payment Mode</span>
                        <span className="font-bold text-gray-900">{invoice.payment}</span>
                    </div>
                     <div className="flex md:justify-end justify-between gap-8">
                        <span className="text-gray-500">Invoice No</span>
                        <span className="font-bold text-gray-900">{invoice.id}</span>
                    </div>
                 </div>
            </div>
        </div>

        {/* Items Table - Optimized for Mobile */}
        <div className="px-6 md:px-12 pb-8">
            <div className="border rounded-2xl overflow-hidden border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[600px] md:min-w-0">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-200 font-black uppercase text-[10px] tracking-widest">
                                <th className="py-5 px-6 w-12 text-center">#</th>
                                <th className="py-5 px-6">Item Name</th>
                                <th className="py-5 px-6 text-right">Rate</th>
                                <th className="py-5 px-6 text-center">Qty</th>
                                <th className="py-5 px-6 text-right">Tax (GST)</th>
                                <th className="py-5 px-6 text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {invoice.items.map((item, index) => (
                                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors">
                                    <td className="py-5 px-6 text-center text-gray-400 font-black italic">{index + 1}</td>
                                    <td className="py-5 px-6">
                                        <div className="font-bold text-gray-900 dark:text-white text-base">{item.name}</div>
                                        <div className="text-[10px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest mt-0.5">HSN: 3004 / Batch: 2024A</div>
                                    </td>
                                    <td className="py-5 px-6 text-right font-bold text-gray-700 dark:text-gray-300">₹{item.rate.toFixed(2)}</td>
                                    <td className="py-5 px-6 text-center">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-lg text-xs font-black text-gray-700 dark:text-gray-300">
                                            {item.qty < 10 ? `0${item.qty}` : item.qty}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{item.tax}% GST</span>
                                            <span className="font-bold text-gray-500 text-xs">₹{((item.qty * item.rate * item.tax)/100).toFixed(2)}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 text-right font-black text-gray-900 dark:text-white text-base">
                                        ₹{(item.qty * item.rate * (1 + item.tax/100)).toFixed(2)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            {/* Mobile Helper Text */}
            <p className="md:hidden text-center text-[10px] text-gray-400 font-black uppercase tracking-widest mt-4 animate-pulse">
                ← Swipe to see full details →
            </p>
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
                    <span>Rs. {invoice.subtotal.toFixed(2)}</span>
                </div>
                 <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Discount</span>
                    <span className="text-red-500">-Rs. {invoice.discountAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                    <span className="font-medium">Total Tax (GST)</span>
                    <span>Rs. {invoice.taxAmount.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between border-t border-gray-200 pt-4 mt-2">
                    <div className="flex flex-col">
                        <span className="font-black text-gray-900 text-lg">Grand Total</span>
                        <span className="text-xs text-gray-500 font-normal">Inclusive of all taxes</span>
                    </div>
                    <span className="font-black text-primary text-2xl">Rs. {invoice.grandTotal.toFixed(2)}</span>
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
