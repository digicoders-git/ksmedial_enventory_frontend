import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Printer, Download, Tag, FileText } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import api from '../../api/axios';
import { QRCodeCanvas } from 'qrcode.react';
import Barcode from 'react-barcode';

// Utility to convert number to words (Simplified for Indian Currency)
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

const ViewInvoice = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('invoice'); // 'invoice' or 'label'

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
                const items = mapItems(sale.items);

                setInvoice({
                    id: sale.invoiceNumber || id,
                    orderId: sale._id,
                    date: new Date(sale.createdAt).toLocaleDateString(),
                    displayDate: new Date(sale.createdAt).toISOString().split('T')[0],
                    customer: sale.customerName || 'Walk-in Customer',
                    contact: sale.customerId?.phone || 'N/A',
                    address: sale.customerId?.address || 'Fatehpur, Uttar Pradesh',
                    payment: sale.paymentMethod,
                    status: sale.status,
                    items: items,
                    subtotal: sale.subTotal || 0,
                    taxAmount: sale.taxAmount || 0,
                    discountAmount: sale.discountAmount || 0,
                    grandTotal: sale.totalAmount,
                    patientDetails: sale.patientDetails || {},
                    shippingDetails: sale.shippingDetails || {}
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

  const mapItems = (items) => items.map(i => {
      const product = i.productId || {}; 
      const isPopulated = typeof product === 'object';
      const taxRate = i.tax || 12;
      const soldPrice = i.price || i.rate || 0; 
      
      return {
          name: i.name || (isPopulated ? product.name : 'Item'),
          mfr: (isPopulated && product.manufacturer) ? product.manufacturer : 'Sun Pharma',
          batch: (isPopulated && product.batch) ? product.batch : 'GT07045',
          exp: (isPopulated && product.exp) ? new Date(product.exp).toLocaleDateString() : '04/27',
          qty: i.quantity,
          mrp: soldPrice, 
          discRate: 0, 
          discAmt: 0,
          taxable: (i.subtotal * (100 / (100 + taxRate))).toFixed(2),
          hsn: (isPopulated && product.hsn) ? product.hsn : '30049099',
          gstRate: taxRate,
          gstAmt: (i.subtotal - (i.subtotal * (100 / (100 + taxRate)))).toFixed(2),
          total: i.subtotal
      };
  });

  const handleDownloadPDF = async () => {
      const elementId = viewMode === 'invoice' ? 'invoice-content' : 'label-content';
      const input = document.getElementById(elementId);
      if (!input) return;

      try {
          const isLabel = viewMode === 'label';
          
          // Create Clone
          const clone = input.cloneNode(true);
          // Set explicit width for PDF generation consistency
          clone.style.width = isLabel ? '100mm' : '210mm'; 
          clone.style.minHeight = isLabel ? '150mm' : '297mm';
          if (isLabel) clone.style.height = '150mm'; // Fixed height for label A6 approx
          
          clone.style.position = 'absolute';
          clone.style.left = '-9999px';
          clone.style.top = '0';
          clone.style.background = 'white';
          clone.style.color = 'black';
          
          // Ensure centering doesn't mess up cloning
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
          
          // PDF Setup: A4 for Invoice, A6 for Label
          const format = isLabel ? 'a6' : 'a4';
          const orientation = 'p';
          
          const pdf = new jsPDF(orientation, 'mm', format);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
          
          pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
          pdf.save(`${viewMode}_${invoice.id}.pdf`);
      } catch (err) {
          console.error("PDF generation failed:", err);
      }
  };

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // --- GST Logic for Invoice ---
  const gstBreakdown = {};
  let totalTaxable = 0;
  let totalGst = 0;
  if(viewMode === 'invoice') {
    invoice.items.forEach(item => {
        const rate = item.gstRate;
        if (!gstBreakdown[rate]) gstBreakdown[rate] = { taxable: 0, gst: 0 };
        const taxVal = parseFloat(item.taxable);
        const gstVal = parseFloat(item.gstAmt);
        gstBreakdown[rate].taxable += taxVal;
        gstBreakdown[rate].gst += gstVal;
        totalTaxable += taxVal;
        totalGst += gstVal;
    });
  }

  return (
    <div className="min-h-screen bg-gray-100 p-4 md:p-8 font-sans print:p-0 print:bg-white text-black">
      
      {/* Action Header - Hidden on Print */}
      <div className="max-w-[210mm] mx-auto mb-6 flex justify-between items-center print:hidden">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-black font-semibold">
            <ArrowLeft size={18} /> Back
        </button>
        <div className="flex gap-2">
            {viewMode === 'invoice' ? (
                <button onClick={() => setViewMode('label')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white border border-transparent rounded hover:bg-blue-700 font-semibold shadow-sm transition-colors">
                    <Tag size={16} /> Show Label
                </button>
            ) : (
                <button onClick={() => setViewMode('invoice')} className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white border border-transparent rounded hover:bg-indigo-700 font-semibold shadow-sm transition-colors">
                    <FileText size={16} /> Show Invoice
                </button>
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
        {viewMode === 'invoice' ? (
            /* --- INVOICE VIEW --- */
            <div id="invoice-content" className="w-[210mm] min-h-[297mm] bg-white shadow-lg print:shadow-none print:w-full text-[10px] leading-tight text-black border border-black print:border-none p-2 box-border">
                {/* Header Title */}
                <div className="border border-black border-collapse">
                    <div className="border-b border-black text-center font-bold py-1 bg-white">
                        Tax Invoice/Bill of Supply/Cash Memo <span className="float-right mr-2 font-normal">(Original for Recipient)</span>
                    </div>

                    {/* Top Section */}
                    <div className="flex border-b border-black">
                        {/* Sold By */}
                        <div className="w-[40%] border-r border-black p-2 flex flex-col justify-between">
                            <div>
                                <div className="font-bold mb-1">Sold By</div>
                                <div className="flex items-start gap-2 mb-2">
                                    <img src="/KS2-Logo.png" alt="Logo" className="h-8 object-contain" />
                                    <div className="font-bold text-sm">KS Pharma Net Solutions Pvt. Ltd.</div>
                                </div>
                                <div><span className="font-bold">DL Number:</span> 20,RLF20UP2025001485,21B,WLF21B</div>
                                <div><span className="font-bold">GST:</span> 09AAAFCD7691C1ZH</div>
                                <div><span className="font-bold">FSSAI License No:</span> 12724066001158</div>
                                <div className="mt-1"><span className="font-bold">Registered Address:</span> 123, Health Avenue, Okhla Industrial Area, Phase-I, New Delhi-110020</div>
                            </div>
                        </div>

                        {/* Sold To */}
                        <div className="w-[35%] border-r border-black p-2 flex flex-col justify-between">
                            <div>
                                <div className="font-bold mb-1">Sold To</div>
                                <div className="mb-1"><span className="font-bold">Patient Name:</span> {invoice.patientDetails?.name || invoice.customer}</div>
                                <div className="mb-1"><span className="font-bold">Address:</span> {invoice.patientDetails?.address || invoice.address}</div>
                                <div className="mb-1"><span className="font-bold">Place of supply:</span> Uttar Pradesh</div>
                                <div className="mt-2">
                                    <div className="font-bold">Doctor Details:</div>
                                    <div>{invoice.patientDetails?.doctorName || 'Dr. Self'}</div>
                                    <div className="italic">{invoice.patientDetails?.doctorAddress}</div>
                                </div>
                            </div>
                        </div>

                        {/* Invoice Details */}
                        <div className="w-[25%] p-2 flex flex-col justify-start">
                            <div>
                                <div className="font-bold">Invoice no.: {invoice.id}</div>
                                <div className="font-bold">Date: {invoice.displayDate}</div>
                                <div className="font-bold">Order ID: {invoice.orderId.substring(0, 16)}...</div>
                                <div className="mt-4 flex flex-col items-center">
                                    <div className="w-20 h-20 bg-white p-1 border">
                                        <QRCodeCanvas value={`Invoice:${invoice.id}|Amt:${invoice.grandTotal}`} size={70} style={{ height: "auto", maxWidth: "100%", width: "100%" }} />
                                    </div>
                                    <div className="text-[8px] text-center mt-1 font-bold">Invoicing QR</div>
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
                                    <th className="border-r border-black px-1 py-1 w-[12%]">MFR. Name</th>
                                    <th className="border-r border-black px-1 py-1 w-[8%]">BATCH NO.</th>
                                    <th className="border-r border-black px-1 py-1 w-[6%]">EXP. DATE</th>
                                    <th className="border-r border-black px-1 py-1 w-[5%] text-center">QTY</th>
                                    <th className="border-r border-black px-1 py-1 w-[7%] text-right">MRP</th>
                                    <th className="border-r border-black px-1 py-1 w-[5%] text-right">DISC</th>
                                    <th className="border-r border-black px-1 py-1 w-[8%] text-right">TAXABLE AMT</th>
                                    <th className="border-r border-black px-1 py-1 w-[6%]">HSN</th>
                                    <th className="border-r border-black px-1 py-1 w-[4%] text-center">GST %</th>
                                    <th className="border-r border-black px-1 py-1 w-[7%] text-right">GST AMT</th>
                                    <th className="px-1 py-1 w-[8%] text-right">TOTAL</th>
                                </tr>
                            </thead>
                            <tbody className="text-[9px]">
                                {invoice.items.map((item, idx) => (
                                    <tr key={idx} className="border-b border-gray-300 last:border-0 hover:bg-gray-50">
                                        <td className="border-r border-black px-1 py-1 text-center">{idx + 1}</td>
                                        <td className="border-r border-black px-1 py-1 font-semibold">{item.name}</td>
                                        <td className="border-r border-black px-1 py-1 truncate max-w-[80px]">{item.mfr}</td>
                                        <td className="border-r border-black px-1 py-1">{item.batch}</td>
                                        <td className="border-r border-black px-1 py-1">{item.exp}</td>
                                        <td className="border-r border-black px-1 py-1 text-center font-bold">{item.qty}</td>
                                        <td className="border-r border-black px-1 py-1 text-right">{parseFloat(item.mrp).toFixed(2)}</td>
                                        <td className="border-r border-black px-1 py-1 text-right">0.00</td>
                                        <td className="border-r border-black px-1 py-1 text-right">{item.taxable}</td>
                                        <td className="border-r border-black px-1 py-1">{item.hsn}</td>
                                        <td className="border-r border-black px-1 py-1 text-center">{item.gstRate}</td>
                                        <td className="border-r border-black px-1 py-1 text-right">{item.gstAmt}</td>
                                        <td className="px-1 py-1 text-right font-bold">{item.total.toFixed(2)}</td>
                                    </tr>
                                ))}
                                {Array.from({ length: Math.max(0, 8 - invoice.items.length) }).map((_, i) => (
                                <tr key={`pad-${i}`} className="border-b border-gray-100 last:border-b-0 h-6">
                                    <td colSpan="13" className="border-r border-black"></td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Footer Section */}
                    <div className="flex border-b border-black">
                        <div className="w-[60%] border-r border-black flex flex-col">
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
                            <div className="p-2 text-[9px] flex-1">
                                <div className="font-bold mb-1">*All Values in (Rs)</div>
                                <div className="mb-1">Amount in Words:</div>
                                <div className="italic mb-2 capitalize font-bold">{numberToWords(invoice.grandTotal)}</div>
                                
                                <div className="mt-4 border-t border-gray-300 pt-2">
                                    <div className="font-bold">Terms & Conditions:</div>
                                    <ol className="list-decimal pl-4 text-[8px] space-y-0.5">
                                        <li>Goods once sold will not be taken back.</li>
                                        <li>Subject to Lucknow Jurisdiction.</li>
                                        <li>Check items before leaving the counter.</li>
                                    </ol>
                                </div>
                            </div>
                        </div>

                        <div className="w-[40%] flex flex-col">
                            <div className="flex-1">
                                <div className="flex justify-between px-2 py-1 border-b border-gray-200">
                                    <span>TOTAL QUANTITY:</span>
                                    <span className="font-bold">{invoice.items.reduce((s,i) => s+i.qty, 0)}</span>
                                </div>
                                <div className="flex justify-between px-2 py-1 border-b border-gray-200">
                                    <span>GROSS AMOUNT:</span>
                                    <span className="font-bold">₹{invoice.subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between px-2 py-1 border-b border-gray-200">
                                    <span>SHIPPING & CHARGES:</span>
                                    <span className="font-bold">₹0.00</span>
                                </div>
                                <div className="flex justify-between px-2 py-1 border-b border-black">
                                    <span>DISCOUNT:</span>
                                    <span className="font-bold">₹{invoice.discountAmount.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between px-2 py-3 bg-gray-100 font-bold text-lg">
                                    <span>PAYABLE AMOUNT:</span>
                                    <span>₹{invoice.grandTotal.toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Footer */}
                    <div className="flex items-end p-2 border-t border-black">
                        <div className="w-[50%]">
                            <div className="text-[8px] text-gray-500 mb-4">*Indicates change in Original MRP.<br/> All disputes subject to Lucknow Jurisdiction.<br/> Computer Generated Invoice.</div>
                            <div className="flex items-center gap-2">
                                <QRCodeCanvas value="https://kspharmanet.com/know-your-medicine" size={40} style={{ height: "auto", maxWidth: "100%", width: "40px" }} />
                                <span className="font-bold text-[8px]">Know your medicine</span>
                            </div>
                        </div>
                        <div className="w-[50%] flex flex-col items-end text-center">
                            <div className="font-bold text-[10px] mb-8">For KS Pharma Net</div>
                            <div className="border-t border-black w-32"></div>
                            <div className="text-[8px] font-bold mt-1">Authorized Signatory</div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            /* --- LABEL VIEW --- */
            <div id="label-content" className="w-[100mm] h-[150mm] bg-white border border-black p-0 box-border relative shadow-lg print:shadow-none mx-auto overflow-hidden text-black">
                <div style={{ fontFamily: 'Arial, sans-serif', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Header */}
                    <div className="border-b-2 border-black p-2">
                        <div className="flex justify-between items-start">
                            <div className="text-sm font-bold">ESSENTIAL SERVICES</div>
                            <div className="border-2 border-black px-2 py-0.5 text-xs font-bold">EL</div>
                        </div>
                        <div className="text-[10px] mt-2 leading-snug">
                            <div><strong>INV Date:</strong> {invoice.displayDate} {new Date().toLocaleTimeString()}</div>
                            <div><strong>GST No:</strong> 09AAAFCD7691C1ZH</div>
                            <div><strong>Order Date:</strong> {invoice.displayDate}</div>
                        </div>
                    </div>

                    {/* COD/Prepaid Strip */}
                    <div className="border-b-2 border-black py-2 bg-gray-100 text-center text-sm font-bold border-t border-black">
                         {invoice.payment === 'Cash' || invoice.payment === 'COD' ? 'CASH ON DELIVERY (COD)' : 'PREPAID'} | Amount To Be Collected: {invoice.grandTotal.toFixed(2)}
                    </div>

                    {/* QR and Order ID */}
                    <div className="flex border-b-2 border-black p-3 items-center">
                        <div className="w-24 h-24 mr-4 bg-white flex-shrink-0">
                            <QRCodeCanvas 
                                value={`OrderId:${invoice.orderId}|Amt:${invoice.grandTotal}`} 
                                size={96} 
                                level="M"
                                style={{ width: '100%', height: '100%' }}
                            />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <div className="text-xs font-bold uppercase mb-1 text-gray-600">ORDER ID</div>
                            <div className="text-lg font-bold break-all leading-none">{invoice.orderId.substring(0, 15).toUpperCase()}</div>
                        </div>
                    </div>

                    {/* Split Section: Barcode + Address */}
                    <div className="flex flex-1 min-h-0">
                         {/* Left: Vertical Barcode */}
                         <div className="w-12 border-r-2 border-black relative flex items-center justify-center bg-white">
                             <div className="absolute transform -rotate-90 whitespace-nowrap flex items-center gap-2">
                                 <Barcode 
                                     value={invoice.orderId.substring(invoice.orderId.length - 8)} 
                                     height={30} 
                                     width={1.5} 
                                     fontSize={10} 
                                     displayValue={false}
                                 />
                                 <span className="text-[9px] font-bold tracking-widest">AWB No.</span>
                             </div>
                         </div>

                         {/* Right: Addresses */}
                         <div className="flex-1 flex flex-col">
                             {/* Deliver To */}
                             <div className="flex-1 p-3 border-b-2 border-black overflow-hidden">
                                 <div className="text-[10px] font-bold text-gray-500 mb-1 uppercase">Deliver To</div>
                                 <div className="text-sm font-bold mb-1">{invoice.patientDetails?.name || invoice.customer}</div>
                                 <div className="text-xs leading-tight mb-2">
                                     {invoice.patientDetails?.address || invoice.address}
                                 </div>
                                 <div className="text-sm font-bold">Ph: {invoice.patientDetails?.mobile || invoice.contact}</div>
                             </div>

                             {/* Return Address */}
                             <div className="p-2 bg-gray-50 text-[9px]">
                                 <div className="font-bold mb-1">Return To: KS Pharma Net Solutions Pvt. Ltd</div>
                                 <div className="leading-tight text-gray-600">
                                     Plot No. 123, Health Avenue, Okhla Industrial Area, Phase-I, New Delhi-110020
                                 </div>
                                 <div className="mt-1">Ph: 011-41666666 | care@kspharma.com</div>
                             </div>
                         </div>
                    </div>
                </div>
            </div>
        )}
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
              #invoice-content, #label-content { 
                  margin: 0 auto; 
                  box-shadow: none;
                  border: none !important;
                  width: 100% !important;
                  height: auto !important;
              }
              .border { border-color: black !important; }
              .bg-gray-100 { background-color: #f3f4f6 !important; }
              
              /* Reset for full page */
              #label-content {
                  width: 100mm !important;
                  height: 150mm !important;
                  margin: 5mm auto;
                  border: 1px solid black !important;
                  page-break-after: always;
              }
          }
      `}</style>
    </div>
  );
};

export default ViewInvoice;
