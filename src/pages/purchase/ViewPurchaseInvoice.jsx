import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Printer, Download, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { QRCodeCanvas } from 'qrcode.react'; 
import api from '../../api/axios';

// Utility to convert number to words
const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const format = (n) => {
        if (n < 20) return a[n];
        const digit = n % 10;
        if (n < 100) return b[Math.floor(n / 10)] + (digit ? '-' + a[digit] : ' ');
        if (n < 1000) return a[Math.floor(n / 100)] + 'Hundred ' + (n % 100 === 0 ? '' : 'and ' + format(n % 100));
        return format(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? format(n % 1000) : '');
    };
    
    if (num === 0) return "Zero ";
    return "Rupees " + format(Math.floor(num)) + "Only"; 
};

const ViewPurchaseInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/purchases/${id}`);
            if (data.success) {
                const p = data.purchase;
                const items = mapItems(p.items);

                // Calculate Summary from items to be safe
                const subTotal = items.reduce((sum, item) => sum + parseFloat(item.taxable), 0);
                const taxAmount = items.reduce((sum, item) => sum + parseFloat(item.gstAmt), 0);
                
                setInvoice({
                    id: p.invoiceNumber || p._id, // Use Invoice Number if available
                    grnId: p._id,
                    externalInvoice: p.externalInvoiceNumber || 'N/A',
                    date: p.invoiceDate ? new Date(p.invoiceDate).toLocaleDateString() : new Date(p.createdAt).toLocaleDateString(),
                    displayDate: p.invoiceDate ? new Date(p.invoiceDate).toISOString().split('T')[0] : new Date(p.createdAt).toISOString().split('T')[0],
                    
                    // Supplier (Sold By)
                    supplierName: p.supplierId?.name || 'Unknown Supplier',
                    supplierAddress: p.supplierId?.address || 'N/A',
                    supplierGst: p.supplierId?.gstNumber || 'N/A',
                    supplierPhone: p.supplierId?.phone || 'N/A',
                    supplierDL: p.supplierId?.drugLicenseNumber || 'N/A',

                    payment: p.paymentStatus,
                    status: p.status,
                    items: items,
                    subtotal: subTotal,
                    taxAmount: taxAmount,
                    discountAmount: p.discount || 0,
                    grandTotal: p.grandTotal,
                    notes: p.notes,
                    invoiceFile: p.invoiceFile
                });
            } else {
                setError("Invoice not found");
            }
        } catch (err) {
            console.error("Error fetching invoice:", err);
            setError("Failed to load invoice");
        } finally {
            setLoading(false);
        }
    };
    fetchInvoice();
  }, [id]);

  useEffect(() => {
      if (!loading && invoice && searchParams.get('autoPrint') === 'true') {
          setTimeout(() => {
              window.print();
          }, 1000);
      }
  }, [loading, invoice, searchParams]);

  const mapItems = (items) => items.map(i => {
      const qty = i.receivedQty || i.quantity || 0;
      const rate = i.purchasePrice || i.baseRate || i.rate || 0;
      
      // Calculate tax rate if not explicit
      let taxRate = i.gst || i.tax || 0;
      if (!taxRate && (i.cgst || i.sgst)) {
          taxRate = (i.cgst || 0) + (i.sgst || 0) + (i.igst || 0);
      }

      const taxableValue = i.amount || (rate * qty);
      const gstAmt = taxableValue * (taxRate / 100);
      const lineTotal = taxableValue + gstAmt;

      return {
          name: i.productName || i.productId?.name || 'Item',
          batch: i.batchNumber || 'N/A',
          exp: i.expiryDate ? new Date(i.expiryDate).toLocaleDateString() : '-',
          qty: qty,
          mrp: i.mrp || 0,
          rate: rate,
          taxable: taxableValue.toFixed(2),
          hsn: i.hsnCode || i.productId?.hsnCode || '-',
          gstRate: taxRate,
          gstAmt: gstAmt.toFixed(2),
          total: lineTotal // Taxable + Tax
      };
  });

  const handleDownloadPDF = async () => {
      const input = document.getElementById('invoice-content');
      if (!input) return;

      try {
          const clone = input.cloneNode(true);
          clone.style.width = '210mm'; 
          clone.style.minHeight = '297mm';
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          clone.style.top = '0';
          clone.style.background = 'white';
          clone.style.color = 'black';
          clone.style.margin = '0';
          clone.style.transform = 'none';
          
          document.body.appendChild(clone);

          const canvas = await html2canvas(clone, { 
              scale: 3, 
              useCORS: true,
              logging: false,
              backgroundColor: '#ffffff'
          });

          document.body.removeChild(clone);

          const imgData = canvas.toDataURL('image/png');
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`purchase_invoice_${invoice.id}.pdf`);
      } catch (err) {
          console.error("PDF generation failed:", err);
      }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !invoice) {
      return <div className="p-10 text-center text-red-500 font-bold">{error || "Invoice not found"}</div>;
  }

  // --- GST Logic ---
  const gstBreakdown = {};
  let totalTaxable = 0;
  let totalGst = 0;

  invoice.items.forEach(item => {
      const rate = item.gstRate || 0;
      if (!gstBreakdown[rate]) gstBreakdown[rate] = { taxable: 0, gst: 0 };
      const taxVal = parseFloat(item.taxable);
      const gstVal = parseFloat(item.gstAmt);
      gstBreakdown[rate].taxable += taxVal;
      gstBreakdown[rate].gst += gstVal;
      totalTaxable += taxVal;
      totalGst += gstVal;
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans print:p-0 print:bg-white text-black">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black font-semibold">
            <ArrowLeft size={18} /> Back
        </button>
        <div className="flex gap-2">
            {invoice.invoiceFile && (
                <a 
                    href={`${import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5001'}${invoice.invoiceFile}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded hover:bg-emerald-100 font-semibold shadow-sm"
                >
                    <FileText size={16} /> View Original
                </a>
            )}
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded hover:bg-gray-50 font-semibold shadow-sm">
                <Download size={16} /> PDF
            </button>
            <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-[#007242] text-white rounded hover:bg-[#005a34] font-semibold shadow-sm">
                <Printer size={16} /> Print
            </button>
        </div>
      </div>

      <div className="flex justify-center">
            {/* --- INVOICE VIEW --- */}
            <div id="invoice-content" className="w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none print:w-full text-[10px] leading-tight text-black border border-black print:border-none p-2 box-border">
                {/* Header Title */}
                <div className="border border-black border-collapse">
                    <div className="border-b border-black text-center font-bold py-1 bg-white uppercase">
                        Purchase Invoice / GRN <span className="float-right mr-2 font-normal capitalize">(Original for Recipient)</span>
                    </div>

                    {/* Top Section */}
                    <div className="flex border-b border-black">
                        {/* Sold By (Supplier) */}
                        <div className="w-[40%] border-r border-black p-2 flex flex-col justify-between">
                            <div>
                                <div className="font-bold mb-1 uppercase underline">Sold By (Supplier)</div>
                                <div className="flex items-start gap-2 mb-2">
                                    <div className="font-bold text-sm uppercase">{invoice.supplierName}</div>
                                </div>
                                <div><span className="font-bold">Address:</span> {invoice.supplierAddress}</div>
                                <div><span className="font-bold">GSTIN:</span> {invoice.supplierGst}</div>
                                <div><span className="font-bold">Phone:</span> {invoice.supplierPhone}</div>
                                <div><span className="font-bold">DL No:</span> {invoice.supplierDL}</div>
                            </div>
                        </div>

                        {/* Sold To (Company - US) */}
                        <div className="w-[35%] border-r border-black p-2 flex flex-col justify-between">
                            <div>
                                <div className="font-bold mb-1 uppercase underline">Sold To (Buyer)</div>
                                <div className="flex items-start gap-2 mb-2">
                                    <img src="/KS2-Logo.png" alt="Logo" className="h-6 object-contain" />
                                    <div className="font-bold text-sm">KS Pharma Net Solutions Pvt. Ltd.</div>
                                </div>
                                <div><span className="font-bold">Address:</span> 123, Health Avenue, Okhla Industrial Area, Phase-I, New Delhi-110020</div>
                                <div><span className="font-bold">GSTIN:</span> 09AAAFCD7691C1ZH</div>
                                <div><span className="font-bold">Phone:</span> 011-41666666</div>
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="w-[25%] p-2 flex flex-col justify-start">
                            <div>
                                <div className="font-bold">Invoice No.: {invoice.externalInvoice !== 'N/A' ? invoice.externalInvoice : invoice.id}</div>
                                <div className="font-bold">GRN ID: {invoice.grnId.substr(-8).toUpperCase()}</div>
                                <div className="font-bold">Date: {invoice.displayDate}</div>
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white p-1 border">
                                        <QRCodeCanvas value={`PurchInv:${invoice.id}|Amt:${invoice.grandTotal}`} size={70} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                    </div>
                                    <div className="text-[8px] text-center mt-1 font-bold">GRN Tracking QR</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="border-b border-black">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-black bg-gray-50 text-[8px] uppercase tracking-tighter">
                                    <th className="border-r border-black px-1 py-1 w-[3%]">SR</th>
                                    <th className="border-r border-black px-1 py-1 w-[20%]">PRODUCT NAME</th>
                                    <th className="border-r border-black px-1 py-1 w-[10%]">BATCH</th>
                                    <th className="border-r border-black px-1 py-1 w-[8%]">EXPIRY</th>
                                    <th className="border-r border-black px-1 py-1 w-[6%]">HSN</th>
                                    <th className="border-r border-black px-1 py-1 w-[6%] text-center">QTY</th>
                                    <th className="border-r border-black px-1 py-1 w-[8%] text-right">RATE</th>
                                    <th className="border-r border-black px-1 py-1 w-[10%] text-right">TAXABLE</th>
                                    <th className="border-r border-black px-1 py-1 w-[5%] text-center">GST%</th>
                                    <th className="border-r border-black px-1 py-1 w-[8%] text-right">GST AMT</th>
                                    <th className="px-1 py-1 w-[10%] text-right">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody className="text-[9px]">
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-300 last:border-0 hover:bg-gray-50">
                                        <td className="border-r border-black px-1 py-1 text-center">{idx + 1}</td>
                                        <td className="border-r border-black px-1 py-1 font-semibold">{item.name}</td>
                                        <td className="border-r border-black px-1 py-1 font-mono uppercase">{item.batch}</td>
                                        <td className="border-r border-black px-1 py-1">{item.exp}</td>
                                        <td className="border-r border-black px-1 py-1">{item.hsn}</td>
                                        <td className="border-r border-black px-1 py-1 text-center font-bold">{item.qty}</td>
                                        <td className="border-r border-black px-1 py-1 text-right">{parseFloat(item.rate).toFixed(2)}</td>
                                        <td className="border-r border-black px-1 py-1 text-right">{item.taxable}</td>
                                        <td className="border-r border-black px-1 py-1 text-center">{item.gstRate}</td>
                                        <td className="border-r border-black px-1 py-1 text-right">{item.gstAmt}</td>
                                        <td className="px-1 py-1 text-right font-bold">{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {/* Padding Rows */}
                                {Array.from({ length: Math.max(0, 10 - invoice.items.length) }).map((_, i) => (
                                <tr key={`pad-${i}`} className="border-b border-gray-100 last:border-b-0 h-6">
                                    <td colSpan="11" className="border-r border-black"></td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Section */}
                    <div className="flex border-b border-black">
                        <div className="w-[65%] border-r border-black flex flex-col">
                            {/* GST Breakdown */}
                            <div className="border-b border-black">
                                <table className="w-full text-center text-[8px] border-collapse">
                                    <thead>
                                        <tr className="border-b border-black bg-gray-50">
                                            <th className="border-r border-black px-1">GST %</th>
                                            <th className="border-r border-black px-1">Taxable Amt</th>
                                            <th className="border-r border-black px-1">CGST</th>
                                            <th className="border-r border-black px-1">SGST</th>
                                            <th className="px-1">IGST</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(gstBreakdown).map(([rate, data]) => (
                                            <tr key={rate} className="border-b border-gray-100">
                                                <td className="border-r border-black px-1">{rate}%</td>
                                                <td className="border-r border-black px-1">{data.taxable.toFixed(2)}</td>
                                                <td className="border-r border-black px-1">{(data.gst / 2).toFixed(2)}</td>
                                                <td className="border-r border-black px-1">{(data.gst / 2).toFixed(2)}</td>
                                                <td className="px-1">0.00</td>
                                            </tr>
                                        ))}
                                        <tr className="font-bold bg-gray-50 border-t border-black">
                                            <td className="border-r border-black px-1">Total</td>
                                            <td className="border-r border-black px-1">{totalTaxable.toFixed(2)}</td>
                                            <td className="border-r border-black px-1">{(totalGst / 2).toFixed(2)}</td>
                                            <td className="border-r border-black px-1">{(totalGst / 2).toFixed(2)}</td>
                                            <td className="px-1">0.00</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div className="p-2 text-[9px] flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="font-bold mb-1">*All Values in (Rs)</div>
                                    <div className="mb-1">Amount in Words:</div>
                                    <div className="italic mb-2 capitalize font-bold">{numberToWords(invoice.grandTotal)}</div>
                                </div>
                                {invoice.notes && (
                                    <div className="mt-2 text-[8px] italic border-t pt-1">
                                        <strong>Notes:</strong> {invoice.notes}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="w-[35%] flex flex-col">
                            <div className="flex-1">
                                <div className="flex justify-between px-2 py-1 border-b border-gray-200">
                                    <span>TOTAL QTY:</span>
                                    <span className="font-bold">{invoice.items.reduce((s,i) => s+i.qty, 0)}</span>
                                </div>
                                <div className="flex justify-between px-2 py-1 border-b border-gray-200">
                                    <span>TAXABLE AMOUNT:</span>
                                    <span className="font-bold">₹{totalTaxable.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between px-2 py-1 border-b border-black">
                                    <span>TOTAL GST:</span>
                                    <span className="font-bold">₹{totalGst.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between px-2 py-3 bg-gray-100 font-bold text-lg">
                                    <span>GRAND TOTAL:</span>
                                    <span>₹{invoice.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="flex items-end p-2 border-t border-black">
                        <div className="w-[50%]">
                            <div className="text-[8px] text-gray-500 mb-2">
                                Declaration:<br/>
                                We declare that this purchase invoice shows the actual price of the goods described and that all particulars are true and correct.
                            </div>
                        </div>
                        <div className="w-[50%] flex flex-col items-end text-center">
                            <div className="font-bold text-[10px] mb-8">For KS Pharma Net Solutions Pvt. Ltd</div>
                            <div className="border-t border-black w-32"></div>
                            <div className="text-[8px] font-bold mt-1">Authorized Signatory</div>
                        </div>
                    </div>
                </div>
            </div>
      </div>

      <style>{`
          @media print {
              @page { margin: 0; }
              body { 
                  margin: 0; 
                  padding: 0; 
                  background: white; 
                  -webkit-print-color-adjust: exact; 
              }
              #invoice-content { 
                  margin: 0 auto; 
                  box-shadow: none;
                  border: none !important;
                  width: 100% !important;
                  height: auto !important;
              }
              .border { border-color: black !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
          }
      `}</style>
    </div>
  );
};

export default ViewPurchaseInvoice;
