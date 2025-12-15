import { jsPDF } from 'jspdf';

interface Vendor {
  id: string;
  vendor_name: string;
  email: string;
  phone_number: string;
  work_details: string | null;
}

interface InvoiceItem {
  id: string;
  srNo: number;
  description: string;
  charges: number;
}

interface VendorInvoiceData {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendor: Vendor;
  items: InvoiceItem[];
  totalAmount: number;
  notes?: string;
}

const numberToWords = (num: number): string => {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';
  if (num < 20) return ones[num];
  if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 !== 0 ? ' ' + ones[num % 10] : '');
  if (num < 1000) {
    return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 !== 0 ? ' ' + numberToWords(num % 100) : '');
  }
  if (num < 100000) {
    return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 !== 0 ? ' ' + numberToWords(num % 1000) : '');
  }
  if (num < 10000000) {
    return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 !== 0 ? ' ' + numberToWords(num % 100000) : '');
  }
  return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 !== 0 ? ' ' + numberToWords(num % 10000000) : '');
};

export const generateVendorInvoice = (data: VendorInvoiceData) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;
  doc.setCharSpace(0);

  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize: number = 12, align: 'left' | 'center' | 'right' = 'left', isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.text(String(text), x, y, { align });
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.line(x1, y1, x2, y2);
  };

  // Society Header - Centered
  addText('HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.', pageWidth / 2, yPos, 16, 'center', true);
  yPos += 7;
  addText('(Regn No. : TNA/(TNA)/HSG/(TC)/11999/2000.)', pageWidth / 2, yPos, 11, 'center');
  yPos += 6;
  addText('MANPADA, THANE (WEST)-400 610.', pageWidth / 2, yPos, 11, 'center');
  yPos += 6;
  addText('TEL NO.022 35187410', pageWidth / 2, yPos, 11, 'center');
  yPos += 12;

  // Invoice Title
  addText('INVOICE', pageWidth / 2, yPos, 20, 'center', true);
  yPos += 10;

  // Invoice Details
  const leftX = margin;
  const rightX = pageWidth - margin;

  addText(`Invoice Number: ${data.invoiceNumber}`, leftX, yPos, 11);
  addText(`Date: ${new Date(data.invoiceDate).toLocaleDateString('en-IN')}`, rightX, yPos, 11, 'right');
  yPos += 6;
  addText(`Due Date: ${new Date(data.dueDate).toLocaleDateString('en-IN')}`, rightX, yPos, 11, 'right');
  yPos += 10;

  // Bill To Section (Left) and Invoice Details (Right) - side by side
  const billToY = yPos;
  addText('Bill To:', leftX, billToY, 12, 'left', true);
  let billToCurrentY = billToY + 6;
  addText(data.vendor.vendor_name, leftX, billToCurrentY, 12);
  billToCurrentY += 5;
  addText(data.vendor.email, leftX, billToCurrentY, 10);
  billToCurrentY += 4;
  addText(data.vendor.phone_number, leftX, billToCurrentY, 10);
  billToCurrentY += 4;
  if (data.vendor.work_details) {
    addText(data.vendor.work_details, leftX, billToCurrentY, 10);
    billToCurrentY += 4;
  }

  // Invoice Details (Right aligned) - same starting Y as Bill To
  const invoiceDetailsY = billToY;
  addText(`Invoice No: ${data.invoiceNumber}`, rightX, invoiceDetailsY, 11, 'right');
  addText(`Date: ${new Date(data.invoiceDate).toLocaleDateString('en-IN')}`, rightX, invoiceDetailsY + 6, 11, 'right');
  addText(`Due Date: ${new Date(data.dueDate).toLocaleDateString('en-IN')}`, rightX, invoiceDetailsY + 12, 11, 'right');

  // Set yPos to the maximum of both sections
  yPos = Math.max(billToCurrentY, invoiceDetailsY + 18);
  yPos += 8;

  // Items Table Header
  const tableWidth = pageWidth - 2 * margin;
  const srNoColWidth = 25;
  const amountColWidth = 50;
  const descColWidth = tableWidth - srNoColWidth - amountColWidth;
  const tableStartX = leftX;

  // Table header line
  addLine(tableStartX, yPos, tableStartX + tableWidth, yPos);
  yPos += 6;
  
  // Headers
  addText('Sr.No', tableStartX + 5, yPos, 11, 'left', true);
  addText('Description', tableStartX + srNoColWidth + 5, yPos, 11, 'left', true);
  addText('Amount (Rs.)', tableStartX + srNoColWidth + descColWidth + amountColWidth - 5, yPos, 11, 'right', true);
  yPos += 5;
  
  // Line below headers
  addLine(tableStartX, yPos, tableStartX + tableWidth, yPos);

  // Items
  data.items.forEach((item) => {
    yPos += 6;
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin + 10;
      addLine(tableStartX, yPos, tableStartX + tableWidth, yPos);
      yPos += 6;
      addText('Sr.No', tableStartX + 5, yPos, 11, 'left', true);
      addText('Description', tableStartX + srNoColWidth + 5, yPos, 11, 'left', true);
      addText('Amount (Rs.)', tableStartX + srNoColWidth + descColWidth + amountColWidth - 5, yPos, 11, 'right', true);
      yPos += 5;
      addLine(tableStartX, yPos, tableStartX + tableWidth, yPos);
      yPos += 6;
    }

    addText(item.srNo.toString(), tableStartX + 5, yPos, 10);

    // Description with wrapping
    const descLines = doc.splitTextToSize(item.description, descColWidth - 10);
    let descY = yPos;
    descLines.forEach((line: string, index: number) => {
      addText(line, tableStartX + srNoColWidth + 5, descY, 10);
      if (index < descLines.length - 1) {
        descY += 5;
      }
    });

    // Amount with Rs. prefix and proper formatting
    const amountText = `Rs. ${item.charges.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
    addText(
      amountText,
      tableStartX + srNoColWidth + descColWidth + amountColWidth - 5,
      yPos,
      10,
      'right'
    );

    yPos = Math.max(yPos, descY);
    yPos += 5;
    
    // Line after each item
    addLine(tableStartX, yPos, tableStartX + tableWidth, yPos);
  });

  // Total Section - right aligned
  yPos += 8;
  const totalLabelX = tableStartX + srNoColWidth + descColWidth;
  addText('Total Amount', totalLabelX, yPos, 12, 'left', true);
  addText(
    `Rs. ${data.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`,
    tableStartX + tableWidth,
    yPos,
    12,
    'right',
    true
  );
  yPos += 8;

  // Amount in Words Block - centered in bordered box
  const amountWords = `Amount in Words: ${numberToWords(Math.floor(data.totalAmount))} Rupees Only`;
  const blockHeight = 14;
  const blockWidth = tableWidth;
  const blockStartY = yPos;
  
  // Draw border box
  addLine(tableStartX, blockStartY, tableStartX + blockWidth, blockStartY); // Top
  addLine(tableStartX, blockStartY + blockHeight, tableStartX + blockWidth, blockStartY + blockHeight); // Bottom
  addLine(tableStartX, blockStartY, tableStartX, blockStartY + blockHeight); // Left
  addLine(tableStartX + blockWidth, blockStartY, tableStartX + blockWidth, blockStartY + blockHeight); // Right
  
  // Centered text in box
  addText(amountWords, tableStartX + blockWidth / 2, blockStartY + 9, 11, 'center');
  yPos += blockHeight + 8;

  // Notes Section
  addText('Notes:', leftX, yPos, 11, 'left', true);
  yPos += 6;
  if (data.notes && data.notes.trim()) {
    const notesLines = doc.splitTextToSize(data.notes, pageWidth - 2 * margin);
    notesLines.forEach((line: string) => {
      addText(line, leftX, yPos, 10);
      yPos += 4;
    });
  } else {
    addText('No additional Notes', leftX, yPos, 10);
    yPos += 4;
  }
  yPos += 5;

  // Footer
  yPos = pageHeight - 30;
  addLine(leftX, yPos, pageWidth - margin, yPos);
  yPos += 8;
  addText('For HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.', pageWidth / 2, yPos, 10, 'center');
  yPos += 5;
  addText('Authorized Signatory', pageWidth / 2, yPos, 10, 'center');

  const fileName = `Invoice_${data.invoiceNumber}_${data.vendor.vendor_name.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
};

