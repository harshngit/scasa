import { jsPDF } from 'jspdf';

export interface InvoiceCharge {
  label: string;
  amount: number;
}

interface InvoiceData {
  billNumber: string;
  residentName: string;
  flatNumber: string;
  month: string;
  year: number;
  date: string;
  area?: string;
  charges: InvoiceCharge[]; // Dynamic charges array
  arrears?: number;
  interest?: number;
  creditBalance?: number;
  societyName?: string;
  registrationNumber?: string;
  address?: string;
  phoneNumber?: string;
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

export const generateInvoice = (data: InvoiceData) => {
  const doc = new jsPDF('landscape', 'mm', 'a4'); // Landscape orientation
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add text
  const addText = (text: string, x: number, y: number, fontSize: number = 10, align: 'left' | 'center' | 'right' = 'left', bold: boolean = false) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.text(text, x, y, { align });
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number) => {
    doc.setLineWidth(0.5);
    doc.line(x1, y1, x2, y2);
  };

  // Header
  addText(data.societyName || 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.', pageWidth / 2, yPos, 14, 'center', true);
  yPos += 7;

  if (data.registrationNumber) {
    addText(`Registration No.: ${data.registrationNumber}`, pageWidth / 2, yPos, 9, 'center');
    yPos += 5;
  }

  if (data.address) {
    addText(data.address, pageWidth / 2, yPos, 9, 'center');
    yPos += 5;
  }

  if (data.phoneNumber) {
    addText(`Tel No.: ${data.phoneNumber}`, pageWidth / 2, yPos, 9, 'center');
    yPos += 8;
  }

  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 8;

  // Bill Details - arranged in landscape layout
  const billDetailsX = pageWidth - margin - 80;
  addText(`Bill No.: ${data.billNumber}`, billDetailsX, yPos, 10);
  yPos += 6;
  addText(`Name: ${data.residentName}`, margin, yPos, 10);
  addText(`For: ${data.month.toUpperCase()} ${data.year}`, billDetailsX, yPos, 10);
  yPos += 6;
  addText(`Date: ${data.date}`, margin, yPos, 10);
  addText(`Flat: ${data.flatNumber}`, billDetailsX, yPos, 10);
  yPos += 10;

  // Charges Table Header - using more width in landscape
  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;
  const particularsX = margin + 5;
  const amountX = pageWidth - margin - 50;
  addText('PARTICULARS', particularsX, yPos, 10, 'left', true);
  addText('AMOUNT', amountX, yPos, 10, 'right', true);
  yPos += 6;
  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Charges - Dynamic from data.charges array
  const charges = data.charges.filter(charge => charge.label.trim() !== ''); // Filter out empty labels

  // Always show all charges (even if 0, to match the bill format)
  charges.forEach((charge, index) => {
    addText(`${index + 1}. ${charge.label.toUpperCase()}`, particularsX, yPos, 10);
    const amountStr = charge.amount >= 0
      ? charge.amount.toFixed(2)
      : `(${Math.abs(charge.amount).toFixed(2)})`;
    addText(amountStr, amountX, yPos, 10, 'right');
    yPos += 6;
  });

  yPos += 3;
  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  // Area (if provided) - shown in a box format
  if (data.area) {
    yPos += 2;
    const areaText = `Area: ${data.area}`;
    const textWidth = doc.getTextWidth(areaText);
    const boxPadding = 2;
    // Draw box around area
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.rect(margin + 5, yPos - 4, textWidth + boxPadding * 2, 6);
    addText(areaText, margin + 5 + boxPadding, yPos, 9);
    yPos += 8;
  }

  // Summary - Calculate subtotal from dynamic charges
  const subtotal = data.charges.reduce((sum, charge) => sum + charge.amount, 0);
  const arrears = data.arrears || 0;
  const interest = data.interest || 0;
  const creditBalance = data.creditBalance || 0;
  const netTotal = subtotal + arrears + interest - creditBalance;

  addText('SUB TOTAL.', particularsX, yPos, 10, 'left', true);
  addText(subtotal.toFixed(2), amountX, yPos, 10, 'right', true);
  yPos += 6;

  // Always show arrears, interest, and credit balance (even if 0)
  addText('+ ARREARS', particularsX, yPos, 10);
  addText(arrears.toFixed(2), amountX, yPos, 10, 'right');
  yPos += 6;

  addText('+ Interest @ 21% p.a.', particularsX, yPos, 10);
  addText(interest.toFixed(2), amountX, yPos, 10, 'right');
  yPos += 6;

  addText('- CR. BALANCE.', particularsX, yPos, 10);
  addText(creditBalance.toFixed(2), amountX, yPos, 10, 'right');
  yPos += 6;

  yPos += 3;
  // Double line before NET TOTAL
  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 2;
  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;

  addText('| NET TOTAL.', particularsX, yPos, 11, 'left', true);
  addText(netTotal.toFixed(2), amountX, yPos, 11, 'right', true);
  yPos += 8;

  // Amount in Words
  const amountInWords = numberToWords(Math.floor(netTotal));
  const paise = Math.round((netTotal % 1) * 100);
  const paiseWords = paise > 0 ? ` and ${numberToWords(paise)} Paise` : '';
  addText(`Rupees ${amountInWords}${paiseWords} Only.`, margin + 5, yPos, 10);
  yPos += 10;

  // Notes - with dashed line separator
  yPos += 2;
  addLine(margin, yPos, pageWidth - margin, yPos);
  yPos += 6;
  addText('DUE DATE: 20TH OF EVERY MONTH : INTEREST @ 21% PA FOR LATE PAYMENTS E. & O. E.', margin + 5, yPos, 8);
  yPos += 4;
  addText('PLEASE WRITE THE FLAT NO AND BILL NO BEHIND THE CHEQUE.', margin + 5, yPos, 8);
  yPos += 4;
  addText('THIS IS A COMPUTER GENERATED BILL SO SIGNATURE IS NOT REQUIRED.', margin + 5, yPos, 8);
  yPos += 6;
  addText('For HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.', pageWidth / 2, yPos, 9, 'center');

  // Save PDF
  const fileName = `Invoice_${data.flatNumber}_${data.month}_${data.year}.pdf`;
  doc.save(fileName);
};

