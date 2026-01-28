# 📱 QR Code System for KS4PharmaNet Inventory

## Overview
This document explains the advanced QR code generation system implemented for the inventory management system.

## Features Implemented

### 1. **Individual QR Code Generation**
- Each medicine item can generate its own unique QR code
- QR code contains comprehensive medicine information:
  - Medicine ID
  - Medicine Name
  - Generic Name
  - Company Name
  - MRP (Maximum Retail Price)
  - Batch Number
  - Expiry Date
  - Unique Barcode (Format: MED000001)
  - Timestamp of QR generation

### 2. **Batch QR Code Generation**
- Select multiple medicines using checkboxes
- Generate QR codes for all selected items at once
- Useful for printing labels for new stock arrivals
- Displays count of selected items in the header button

### 3. **Print Functionality**
- Professional print layout optimized for A4 paper
- 3-column grid layout for efficient label printing
- Includes company header with branding
- Each QR label contains:
  - Medicine name and generic name
  - Company name
  - QR code (150x150px for batch, 200x200px for single)
  - MRP, Stock, and Group information
  - Barcode identifier
- Print-friendly CSS with page break controls

### 4. **Download Functionality**
- Download individual QR codes as PNG images
- File naming: `QR_MedicineName.png`
- High-quality SVG to PNG conversion

## Technical Implementation

### Libraries Used
```bash
npm install qrcode.react
```

### Components Created

#### 1. **QRCodeModal.jsx** (`src/components/QRCodeModal.jsx`)
Main modal component for displaying and managing QR codes.

**Props:**
- `isOpen` (boolean): Controls modal visibility
- `onClose` (function): Callback to close modal
- `medicine` (object): Single medicine object for individual QR
- `medicines` (array): Array of medicines for batch QR generation

**Key Functions:**
- `generateQRData(med)`: Creates JSON string with medicine details
- `handlePrint()`: Opens print dialog with formatted layout
- `handleDownload(medName)`: Downloads QR as PNG image

#### 2. **Updated MedicineList.jsx**
Enhanced with QR code functionality.

**New State:**
```javascript
const [qrModal, setQrModal] = useState({ isOpen: false, medicine: null, medicines: [] });
const [selectedItems, setSelectedItems] = useState([]);
```

**New Functions:**
- `handleGenerateQR(medicine)`: Opens modal for single medicine
- `handleBatchQR()`: Opens modal for selected medicines
- `toggleSelectItem(id)`: Toggle individual checkbox
- `toggleSelectAll()`: Select/deselect all medicines

### QR Code Data Structure

```json
{
  "id": 1,
  "name": "Dolo 650",
  "generic": "Paracetamol",
  "company": "Micro Labs",
  "mrp": 30.00,
  "batch": "DL2024A",
  "expiry": "2025-12-31",
  "barcode": "MED000001",
  "timestamp": "2026-01-27T09:08:52.000Z"
}
```

## Usage Guide

### For Single Medicine QR:
1. Navigate to Medicine Master page (`/medicines/list`)
2. Click the QR icon (purple) in the Actions column for any medicine
3. QR modal opens with medicine details and QR code
4. Options:
   - **Print**: Opens print dialog
   - **Download**: Downloads QR as PNG
   - **Close**: Closes the modal

### For Batch QR Generation:
1. Navigate to Medicine Master page
2. Select medicines using checkboxes (individual or "Select All")
3. Click "Generate QR (X)" button in header (X = count of selected items)
4. Modal opens showing all selected medicines in a grid
5. Click "Print All" to print all QR codes at once

## Print Layout

### Single QR Print:
- Centered layout
- Large QR code (200x200px)
- Complete medicine details
- Professional formatting

### Batch QR Print:
- 3-column grid layout
- Smaller QR codes (150x150px) for space efficiency
- Fits approximately 9-12 QR codes per A4 page
- Auto page breaks for multiple pages

## Scanning QR Codes

### Recommended QR Scanner Apps:
- **Android**: QR & Barcode Scanner (by Gamma Play)
- **iOS**: Built-in Camera app or QR Code Reader
- **Desktop**: Online QR scanners or browser extensions

### What Happens When Scanned:
1. Scanner reads the JSON data
2. Displays all medicine information
3. Can be used for:
   - Quick stock verification
   - Medicine identification
   - Batch tracking
   - Expiry monitoring
   - Integration with mobile apps (future enhancement)

## Future Enhancements

### Planned Features:
1. **Mobile App Integration**
   - Scan QR to add to cart in mobile POS
   - Quick stock lookup
   - Expiry alerts

2. **Advanced Barcode Integration**
   - Generate both QR and traditional barcodes
   - Support for different barcode formats (EAN-13, Code 128)

3. **Batch Label Printing**
   - Custom label sizes (30mm x 20mm, 40mm x 30mm)
   - Thermal printer support
   - Label templates

4. **QR Analytics**
   - Track QR scan frequency
   - Popular items by scans
   - Stock movement tracking

5. **Dynamic QR Codes**
   - Update stock levels in real-time
   - Link to online product pages
   - Customer-facing information

## Styling & Dark Mode

The QR modal is fully compatible with dark mode:
- Dark background: `dark:bg-gray-800`
- Dark borders: `dark:border-gray-700`
- Dark text: `dark:text-white`
- Proper contrast for all elements

## Troubleshooting

### QR Code Not Generating:
- Ensure `qrcode.react` is installed
- Check medicine data has all required fields
- Verify modal state is properly set

### Print Issues:
- Check browser print settings
- Ensure "Background graphics" is enabled
- Try different browsers (Chrome recommended)

### Download Issues:
- Allow pop-ups for the domain
- Check browser download permissions
- Ensure sufficient storage space

## Installation Steps

```bash
# Navigate to frontend directory
cd "Inventry Panel/frontend"

# Install QR code library
npm install qrcode.react

# Restart development server
npm run dev
```

## Code Example

```jsx
// Generate QR for a single medicine
<button onClick={() => handleGenerateQR(medicine)}>
  <QrCode size={16} />
</button>

// Generate QR for selected medicines
<button onClick={handleBatchQR}>
  Generate QR ({selectedItems.length})
</button>

// QR Modal Component
<QRCodeModal 
  isOpen={qrModal.isOpen}
  onClose={() => setQrModal({ isOpen: false, medicine: null, medicines: [] })}
  medicine={qrModal.medicine}
  medicines={qrModal.medicines}
/>
```

## Best Practices

1. **Always include batch and expiry data** when generating QR codes
2. **Print QR codes on durable labels** for long-term use
3. **Test QR codes** after printing to ensure scannability
4. **Use high-quality printers** for best results
5. **Store QR labels** in a dry, clean environment

## Support

For issues or questions:
- Check this documentation first
- Review component code in `src/components/QRCodeModal.jsx`
- Check browser console for errors
- Ensure all dependencies are installed

---

**Last Updated**: January 27, 2026
**Version**: 1.0.0
**Author**: KS4PharmaNet Development Team
