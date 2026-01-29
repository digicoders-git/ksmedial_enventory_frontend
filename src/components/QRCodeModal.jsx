import React, { useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Printer, Download, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react'; // Kept for reference but unused in rendered output if we use img

const QRCodeModal = ({ isOpen, onClose, medicine, medicines = [] }) => {
  const printRef = useRef();

  if (!isOpen) return null;

  // ... (keep existing helper functions like generateQRData, handlePrint, handleDownload)
  const generateQRData = (med) => {
    return JSON.stringify({
      id: med.id,
      name: med.name,
      generic: med.generic,
      company: med.company,
      mrp: med.mrp,
      batch: med.batch || 'N/A',
      expiry: med.expiry || 'N/A',
      barcode: `MED${String(med.id).padStart(6, '0')}`,
      timestamp: new Date().toISOString()
    });
  };

  const isBatchMode = medicines.length > 0;
  const itemsToDisplay = isBatchMode ? medicines : [medicine];

  const handlePrint = () => {
    const printContent = printRef.current;
    const windowPrint = window.open('', '', 'width=800,height=600');
    
    windowPrint.document.write(`
      <html>
        <head>
          <title>Print QR Codes - ${isBatchMode ? 'Batch' : medicine?.name}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                margin: 0;
                padding: 0;
              }
            }
            body {
              font-family: Arial, sans-serif;
              padding: 20px;
            }
            .qr-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              page-break-inside: avoid;
            }
            .qr-item {
              border: 2px solid #e5e7eb;
              border-radius: 12px;
              padding: 16px;
              text-align: center;
              background: white;
              page-break-inside: avoid;
            }
            .qr-item h3 {
              margin: 0 0 8px 0;
              font-size: 14px;
              font-weight: bold;
              color: #1f2937;
            }
            .qr-item p {
              margin: 4px 0;
              font-size: 11px;
              color: #6b7280;
            }
            .qr-code-wrapper {
              margin: 12px 0;
              display: flex;
              justify-content: center;
            }
            .barcode {
              font-family: 'Courier New', monospace;
              font-size: 10px;
              font-weight: bold;
              color: #374151;
              margin-top: 8px;
              letter-spacing: 1px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #0d9488;
              padding-bottom: 15px;
            }
            .header h1 {
              margin: 0;
              color: #0d9488;
              font-size: 24px;
            }
            .header p {
              margin: 5px 0 0 0;
              color: #6b7280;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>KS4 PharmaNet - Inventory QR Codes</h1>
            <p>Generated on: ${new Date().toLocaleString('en-IN')}</p>
          </div>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    
    windowPrint.document.close();
    windowPrint.focus();
    
    setTimeout(() => {
      windowPrint.print();
      windowPrint.close();
    }, 250);
  };

  const handleDownload = async (medName, medId) => {
    try {
      const med = medicines.length > 0 ? medicines.find(m => m.id === medId) : medicine;
      const data = generateQRData(med);
      const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(data)}`;
      
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const downloadLink = document.createElement('a');
      downloadLink.download = `QR_${medName.replace(/\s+/g, '_')}.png`;
      downloadLink.href = blobUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
      alert("Could not download image directly. Opening in new tab.");
      const med = medicines.length > 0 ? medicines.find(m => m.id === medId) : medicine;
       const url = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateQRData(med))}`;
      window.open(url, '_blank');
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in relative">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-accent/10 to-transparent">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/20 rounded-lg">
                <QrCode size={24} className="text-accent" />
              </div>
              <div>
                <h3 className="font-bold text-xl text-gray-800 dark:text-white">
                  {isBatchMode ? `Batch QR Codes (${medicines.length} items)` : `QR Code - ${medicine?.name}`}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {isBatchMode ? 'Print multiple QR codes at once' : 'Scan to view medicine details'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div ref={printRef}>
            <div className={`grid ${isBatchMode ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 place-items-center'} gap-6`}>
              {itemsToDisplay.map((med) => (
                <div 
                  key={med.id} 
                  className="border-2 border-gray-200 dark:border-gray-700 rounded-xl p-6 bg-white dark:bg-gray-750 hover:shadow-lg transition-shadow"
                >
                  {/* Medicine Info */}
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-1">{med.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{med.generic}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{med.company}</p>
                  </div>

                  {/* QR Code */}
                  <div className="flex justify-center my-6 bg-white p-4 rounded-lg">
                    <img 
                        id={`qr-${med.id}`}
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(generateQRData(med))}`}
                        alt="QR Code"
                        className="w-[150px] h-[150px]"
                    />
                  </div>

                  {/* Details */}
                  <div className="space-y-2 text-sm border-t border-gray-200 dark:border-gray-700 pt-4">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">MRP:</span>
                      <span className="font-bold text-gray-800 dark:text-white">₹{med.mrp?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Stock:</span>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">{med.stock} {med.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Group:</span>
                      <span className="text-accent font-medium">{med.group}</span>
                    </div>
                  </div>

                  {/* Barcode */}
                  <div className="mt-4 text-center">
                    <div className="font-mono text-xs font-bold text-gray-600 dark:text-gray-400 tracking-wider bg-gray-100 dark:bg-gray-700 py-2 rounded">
                      MED{String(med.id).padStart(6, '0')}
                    </div>
                  </div>

                  {/* Individual Download (only in single mode) */}
                  {!isBatchMode && (
                    <button
                      onClick={() => handleDownload(med.name, med.id)}
                      className="w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm font-medium"
                    >
                      <Download size={16} />
                      Download QR
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-750 flex justify-between items-center">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p className="font-medium">📱 Scan QR code to view complete medicine details</p>
            <p className="text-xs mt-1">Each QR contains: ID, Name, Generic, Company, MRP, Batch & Expiry</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-gray-600 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
            >
              Close
            </button>
            <button
              onClick={handlePrint}
              className="px-5 py-2.5 bg-accent text-white font-bold rounded-xl shadow-lg hover:bg-teal-700 hover:shadow-xl transition-all flex items-center gap-2"
            >
              <Printer size={18} />
              Print {isBatchMode ? 'All' : 'QR Code'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default QRCodeModal;
