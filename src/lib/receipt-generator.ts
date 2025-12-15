import { jsPDF } from 'jspdf';

interface ReceiptData {
  receiptNumber: string;
  date: string;
  buildingNumber?: string;
  floor?: string;
  flatNumber: string;
  residentName: string;
  amount: number;
  paymentMethod: string;
  chequeNumber?: string;
  chequeDate?: string;
  billNumber?: string;
  billDate?: string;
  paymentType: 'Part' | 'Full';
  remarks?: string;
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

export const generateReceipt = (data: ReceiptData) => {
  const doc = new jsPDF('landscape', 'mm', 'a4'); // Landscape orientation
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper function to add text (always normal, not bold)
  const addText = (text: string, x: number, y: number, fontSize: number = 10, align: 'left' | 'center' | 'right' = 'left', maxWidth?: number) => {
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'normal'); // Always normal font
    if (maxWidth) {
      const lines = doc.splitTextToSize(text, maxWidth);
      doc.text(lines, x, y, { align });
      return lines.length;
    } else {
      doc.text(text, x, y, { align });
      return 1;
    }
  };

  // Helper function to add mixed text with inline bold/underlined name
  const addMixedText = (
    beforeText: string,
    boldText: string,
    afterText: string,
    x: number,
    y: number,
    fontSize: number = 10,
    maxWidth?: number
  ) => {
    doc.setFontSize(fontSize);
    let currentX = x;
    const lineHeight = fontSize * 0.4;

    // Split the entire text to see if it needs wrapping
    const fullText = beforeText + boldText + afterText;
    if (maxWidth) {
      const lines = doc.splitTextToSize(fullText, maxWidth);
      let remainingBefore = beforeText;
      let remainingBold = boldText;
      let remainingAfter = afterText;

      lines.forEach((line: string, lineIndex: number) => {
        const currentY = y + (lineIndex * lineHeight);
        let lineX = x;

        // Process the line character by character to identify which parts are bold
        let lineText = '';
        let isInBold = false;
        let boldStart = -1;

        // Find where bold text starts and ends in this line
        let beforePos = 0;
        let boldPos = 0;
        let afterPos = 0;

        // Calculate how much of each part fits in this line
        doc.setFont('helvetica', 'normal');
        let availableWidth = maxWidth;

        // Add before text
        if (remainingBefore) {
          doc.setFont('helvetica', 'normal');
          const beforeWidth = doc.getTextWidth(remainingBefore);
          if (beforeWidth <= availableWidth) {
            doc.text(remainingBefore, lineX, currentY, { align: 'left' });
            lineX += beforeWidth;
            availableWidth -= beforeWidth;
            remainingBefore = '';
          } else {
            // Split before text
            let beforeChars = '';
            for (let i = 0; i < remainingBefore.length; i++) {
              const testText = beforeChars + remainingBefore[i];
              if (doc.getTextWidth(testText) <= availableWidth) {
                beforeChars += remainingBefore[i];
              } else {
                break;
              }
            }
            doc.text(beforeChars, lineX, currentY, { align: 'left' });
            remainingBefore = remainingBefore.substring(beforeChars.length);
            lineX += doc.getTextWidth(beforeChars);
            availableWidth -= doc.getTextWidth(beforeChars);
          }
        }

        // Add bold text
        if (remainingBold && availableWidth > 0) {
          doc.setFont('helvetica', 'bold');
          const boldWidth = doc.getTextWidth(remainingBold);
          if (boldWidth <= availableWidth) {
            doc.text(remainingBold, lineX, currentY, { align: 'left' });
            const underlineY = currentY + 1.5;
            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);
            doc.line(lineX, underlineY, lineX + boldWidth, underlineY);
            lineX += boldWidth;
            availableWidth -= boldWidth;
            remainingBold = '';
          } else {
            // Split bold text
            let boldChars = '';
            for (let i = 0; i < remainingBold.length; i++) {
              const testText = boldChars + remainingBold[i];
              if (doc.getTextWidth(testText) <= availableWidth) {
                boldChars += remainingBold[i];
              } else {
                break;
              }
            }
            doc.text(boldChars, lineX, currentY, { align: 'left' });
            const underlineY = currentY + 1.5;
            doc.setLineWidth(0.5);
            doc.setDrawColor(0, 0, 0);
            doc.line(lineX, underlineY, lineX + doc.getTextWidth(boldChars), underlineY);
            remainingBold = remainingBold.substring(boldChars.length);
            lineX += doc.getTextWidth(boldChars);
            availableWidth -= doc.getTextWidth(boldChars);
          }
        }

        // Add after text
        if (remainingAfter && availableWidth > 0) {
          doc.setFont('helvetica', 'normal');
          let afterChars = '';
          for (let i = 0; i < remainingAfter.length; i++) {
            const testText = afterChars + remainingAfter[i];
            if (doc.getTextWidth(testText) <= availableWidth) {
              afterChars += remainingAfter[i];
            } else {
              break;
            }
          }
          if (afterChars) {
            doc.text(afterChars, lineX, currentY, { align: 'left' });
            remainingAfter = remainingAfter.substring(afterChars.length);
          }
        }
      });

      return lines.length;
    } else {
      // Single line - no wrapping needed
      doc.setFont('helvetica', 'normal');
      doc.text(beforeText, currentX, y, { align: 'left' });
      currentX += doc.getTextWidth(beforeText);

      doc.setFont('helvetica', 'bold');
      const boldWidth = doc.getTextWidth(boldText);
      doc.text(boldText, currentX, y, { align: 'left' });
      // Draw underline
      doc.setLineWidth(0.5);
      doc.setDrawColor(0, 0, 0);
      doc.line(currentX, y + 1.5, currentX + boldWidth, y + 1.5);
      currentX += boldWidth;

      doc.setFont('helvetica', 'normal');
      doc.text(afterText, currentX, y, { align: 'left' });

      return 1;
    }
  };

  // Helper function to add line
  const addLine = (x1: number, y1: number, x2: number, y2: number, style: 'solid' | 'dashed' = 'solid') => {
    doc.setLineWidth(0.5);
    if (style === 'dashed') {
      doc.setLineDashPattern([5, 5], 0);
    } else {
      doc.setLineDashPattern([], 0);
    }
    doc.line(x1, y1, x2, y2);
  };

  // Header (outside box)
  addText(data.societyName || 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.', pageWidth / 2, yPos, 12, 'center');
  yPos += 6;

  if (data.registrationNumber) {
    addText(`(Regn No. : ${data.registrationNumber}.)`, pageWidth / 2, yPos, 9, 'center');
    yPos += 5;
  }

  if (data.address) {
    addText(`${data.address}.`, pageWidth / 2, yPos, 9, 'center');
    yPos += 5;
  }

  if (data.phoneNumber) {
    addText(`TEL NO.${data.phoneNumber}`, pageWidth / 2, yPos, 9, 'center');
    yPos += 10;
  }

  // Start of dashed box - from RECEIPT title
  const boxMargin = 15; // Equal padding from all sides
  const boxX = margin + boxMargin;
  const boxWidth = pageWidth - (margin * 2) - (boxMargin * 2);
  const boxStartY = yPos;

  // RECEIPT Title (centered) - inside dashed box
  yPos += 8;
  addText('RECEIPT', pageWidth / 2, yPos, 18, 'center'); // Above 15px
  yPos += 12;

  // Receipt Details - Left and Right alignment (equal padding)
  const leftX = boxX + boxMargin;
  const rightX = boxX + boxWidth - 80;

  addText(`No. ${data.receiptNumber}`, leftX, yPos, 16); // Above 15px
  if (data.buildingNumber) {
    addText(`Building No.: ${data.buildingNumber}`, rightX, yPos, 16); // Changed to Building No.
  }
  yPos += 8;

  addText(`Date: ${data.date}`, leftX, yPos, 16); // Above 15px
  if (data.floor) {
    addText(`Floor: ${data.floor}`, rightX, yPos, 16); // Above 15px
  }
  yPos += 8;

  addText(`Flat No.: ${data.flatNumber}`, rightX, yPos, 16); // Above 15px
  yPos += 12;

  // Payment Information
  // Received with thanks from [BOLD NAME] the sum of Rupees [amount] only. By [payment method]
  const maxTextWidth = boxWidth - (boxMargin * 2); // Equal padding - text continues till dashed border

  // Amount in words
  const amountInWords = numberToWords(Math.floor(data.amount));
  const paise = Math.round((data.amount % 1) * 100);
  const paiseWords = paise > 0 ? ` and ${numberToWords(paise)} Paise` : '';
  const amountText = `the sum of Rupees ${amountInWords.toLowerCase()}${paiseWords} only.`;

  // Payment Method
  let paymentMethodText = '';
  if (data.chequeNumber || data.paymentMethod.toLowerCase().includes('cheque')) {
    paymentMethodText = `By Cheque No. ${data.chequeNumber || data.paymentMethod}`;
  } else if (data.paymentMethod.toLowerCase().includes('upi') || data.paymentMethod.toLowerCase().includes('online')) {
    paymentMethodText = `By ${data.paymentMethod}`;
  } else {
    paymentMethodText = `By ${data.paymentMethod}`;
  }

  // Combine: "Received with thanks from [NAME] the sum of Rupees [amount] only. By [method]"
  const beforeName = 'Received with thanks from ';
  const afterName = ` ${amountText} ${paymentMethodText}`;
  const linesReceived = addMixedText(beforeName, data.residentName, afterName, leftX, yPos, 16, maxTextWidth); // Above 15px
  yPos += linesReceived * 8;

  // Dated field and Payment Type and Bill Details - combined on one line
  let datedBillText = '';
  if (data.chequeDate) {
    datedBillText = `Dated ${data.chequeDate} `;
  } else {
    datedBillText = 'Dated ';
  }

  if (data.billNumber) {
    datedBillText += `in ${data.paymentType} payment of Bill No. ${data.billNumber}`;
    if (data.billDate) {
      datedBillText += ` dated ${data.billDate}.`;
    } else {
      datedBillText += '.';
    }
  }

  const linesDatedBill = addText(datedBillText, leftX, yPos, 16, 'left', maxTextWidth); // Above 15px
  yPos += linesDatedBill * 8;

  // Remarks - with text wrapping (format: Recd Agnst Bill No. [number] Dt.[date])
  if (data.remarks || (data.billNumber && data.billDate)) {
    let remarksText = '';
    if (data.billNumber && data.billDate) {
      // Format: Recd Agnst Bill No. [number] Dt.[date]
      const formattedDate = data.billDate.replace(/\./g, '.'); // Ensure proper date format
      remarksText = `Remarks: Recd Agnst Bill No. ${data.billNumber} Dt.${formattedDate}`;
    } else {
      remarksText = `Remarks: ${data.remarks}`;
    }
    const linesRemarks = addText(remarksText, leftX, yPos, 16, 'left', maxTextWidth); // Above 15px
    yPos += linesRemarks * 8;
  }

  // For society name - same font size and normal (not bold) to match remarks
  const societyName = data.societyName || 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.';
  const societyText = `For ${societyName}`;
  const linesSociety = addText(societyText, leftX, yPos, 16, 'left', maxTextWidth); // Same size as remarks, normal font
  yPos += linesSociety * 8; // Same spacing as remarks

  // Amount in figures
  addText(`Rs. ${data.amount.toFixed(2)}`, leftX, yPos, 18); // Above 15px
  yPos += 12;

  // Footer
  yPos += 8;
  addText('E. & O. E.', leftX, yPos, 16); // Above 15px
  addText('* Cheques subject to realisation.', pageWidth / 2, yPos, 16, 'center'); // Above 15px
  yPos += 8;

  // Draw dashed box border around everything from RECEIPT to end
  const boxHeight = yPos - boxStartY;
  doc.setLineWidth(1);
  doc.setDrawColor(0, 0, 0);
  doc.setLineDashPattern([5, 5], 0); // Dashed pattern
  doc.rect(boxX, boxStartY, boxWidth, boxHeight);
  doc.setLineDashPattern([], 0); // Reset to solid

  // Save PDF
  const fileName = `Receipt_${data.receiptNumber}_${data.flatNumber}.pdf`;
  doc.save(fileName);
};

// Generate multiple receipts in one PDF
export const generateAllReceipts = (receipts: ReceiptData[]) => {
  const doc = new jsPDF('landscape', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  receipts.forEach((data, index) => {
    if (index > 0) {
      doc.addPage();
    }

    let yPos = margin;

    // Helper function to add text (always normal, not bold)
    const addText = (text: string, x: number, y: number, fontSize: number = 10, align: 'left' | 'center' | 'right' = 'left', maxWidth?: number) => {
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', 'normal'); // Always normal font
      if (maxWidth) {
        const lines = doc.splitTextToSize(text, maxWidth);
        doc.text(lines, x, y, { align });
        return lines.length;
      } else {
        doc.text(text, x, y, { align });
        return 1;
      }
    };

    // Helper function to add mixed text with inline bold/underlined name
    const addMixedText = (
      beforeText: string,
      boldText: string,
      afterText: string,
      x: number,
      y: number,
      fontSize: number = 10,
      maxWidth?: number
    ) => {
      doc.setFontSize(fontSize);
      let currentX = x;
      const lineHeight = fontSize * 0.4;

      // Split the entire text to see if it needs wrapping
      const fullText = beforeText + boldText + afterText;
      if (maxWidth) {
        const lines = doc.splitTextToSize(fullText, maxWidth);
        let remainingBefore = beforeText;
        let remainingBold = boldText;
        let remainingAfter = afterText;

        lines.forEach((line: string, lineIndex: number) => {
          const currentY = y + (lineIndex * lineHeight);
          let lineX = x;

          // Calculate how much of each part fits in this line
          doc.setFont('helvetica', 'normal');
          let availableWidth = maxWidth;

          // Add before text
          if (remainingBefore) {
            doc.setFont('helvetica', 'normal');
            const beforeWidth = doc.getTextWidth(remainingBefore);
            if (beforeWidth <= availableWidth) {
              doc.text(remainingBefore, lineX, currentY, { align: 'left' });
              lineX += beforeWidth;
              availableWidth -= beforeWidth;
              remainingBefore = '';
            } else {
              // Split before text
              let beforeChars = '';
              for (let i = 0; i < remainingBefore.length; i++) {
                const testText = beforeChars + remainingBefore[i];
                if (doc.getTextWidth(testText) <= availableWidth) {
                  beforeChars += remainingBefore[i];
                } else {
                  break;
                }
              }
              doc.text(beforeChars, lineX, currentY, { align: 'left' });
              remainingBefore = remainingBefore.substring(beforeChars.length);
              lineX += doc.getTextWidth(beforeChars);
              availableWidth -= doc.getTextWidth(beforeChars);
            }
          }

          // Add bold text
          if (remainingBold && availableWidth > 0) {
            doc.setFont('helvetica', 'bold');
            const boldWidth = doc.getTextWidth(remainingBold);
            if (boldWidth <= availableWidth) {
              doc.text(remainingBold, lineX, currentY, { align: 'left' });
              const underlineY = currentY + 1.5;
              doc.setLineWidth(0.5);
              doc.setDrawColor(0, 0, 0);
              doc.line(lineX, underlineY, lineX + boldWidth, underlineY);
              lineX += boldWidth;
              availableWidth -= boldWidth;
              remainingBold = '';
            } else {
              // Split bold text
              let boldChars = '';
              for (let i = 0; i < remainingBold.length; i++) {
                const testText = boldChars + remainingBold[i];
                if (doc.getTextWidth(testText) <= availableWidth) {
                  boldChars += remainingBold[i];
                } else {
                  break;
                }
              }
              doc.text(boldChars, lineX, currentY, { align: 'left' });
              const underlineY = currentY + 1.5;
              doc.setLineWidth(0.5);
              doc.setDrawColor(0, 0, 0);
              doc.line(lineX, underlineY, lineX + doc.getTextWidth(boldChars), underlineY);
              remainingBold = remainingBold.substring(boldChars.length);
              lineX += doc.getTextWidth(boldChars);
              availableWidth -= doc.getTextWidth(boldChars);
            }
          }

          // Add after text
          if (remainingAfter && availableWidth > 0) {
            doc.setFont('helvetica', 'normal');
            let afterChars = '';
            for (let i = 0; i < remainingAfter.length; i++) {
              const testText = afterChars + remainingAfter[i];
              if (doc.getTextWidth(testText) <= availableWidth) {
                afterChars += remainingAfter[i];
              } else {
                break;
              }
            }
            if (afterChars) {
              doc.text(afterChars, lineX, currentY, { align: 'left' });
              remainingAfter = remainingAfter.substring(afterChars.length);
            }
          }
        });

        return lines.length;
      } else {
        // Single line - no wrapping needed
        doc.setFont('helvetica', 'normal');
        doc.text(beforeText, currentX, y, { align: 'left' });
        currentX += doc.getTextWidth(beforeText);

        doc.setFont('helvetica', 'bold');
        const boldWidth = doc.getTextWidth(boldText);
        doc.text(boldText, currentX, y, { align: 'left' });
        // Draw underline
        doc.setLineWidth(0.5);
        doc.setDrawColor(0, 0, 0);
        doc.line(currentX, y + 1.5, currentX + boldWidth, y + 1.5);
        currentX += boldWidth;

        doc.setFont('helvetica', 'normal');
        doc.text(afterText, currentX, y, { align: 'left' });

        return 1;
      }
    };

    // Helper function to add line
    const addLine = (x1: number, y1: number, x2: number, y2: number, style: 'solid' | 'dashed' = 'solid') => {
      doc.setLineWidth(0.5);
      if (style === 'dashed') {
        doc.setLineDashPattern([5, 5], 0);
      } else {
        doc.setLineDashPattern([], 0);
      }
      doc.line(x1, y1, x2, y2);
    };

    // Header (outside box)
    addText(data.societyName || 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.', pageWidth / 2, yPos, 12, 'center');
    yPos += 6;

    if (data.registrationNumber) {
      addText(`(Regn No. : ${data.registrationNumber}.)`, pageWidth / 2, yPos, 9, 'center');
      yPos += 5;
    }

    if (data.address) {
      addText(`${data.address}.`, pageWidth / 2, yPos, 9, 'center');
      yPos += 5;
    }

    if (data.phoneNumber) {
      addText(`TEL NO.${data.phoneNumber}`, pageWidth / 2, yPos, 9, 'center');
      yPos += 10;
    }

    // Start of dashed box - from RECEIPT title
    const boxMargin = 15; // Equal padding from all sides
    const boxX = margin + boxMargin;
    const boxWidth = pageWidth - (margin * 2) - (boxMargin * 2);
    const boxStartY = yPos;

    // RECEIPT Title (centered) - inside dashed box
    yPos += 8;
    addText('RECEIPT', pageWidth / 2, yPos, 18, 'center'); // Above 15px
    yPos += 12;

    // Receipt Details - Left and Right alignment (equal padding)
    const leftX = boxX + boxMargin;
    const rightX = boxX + boxWidth - 80;

    addText(`No. ${data.receiptNumber}`, leftX, yPos, 16); // Above 15px
    if (data.buildingNumber) {
      addText(`Building No.: ${data.buildingNumber}`, rightX, yPos, 16); // Changed to Building No.
    }
    yPos += 8;

    addText(`Date: ${data.date}`, leftX, yPos, 16); // Above 15px
    if (data.floor) {
      addText(`Floor: ${data.floor}`, rightX, yPos, 16); // Above 15px
    }
    yPos += 8;

    addText(`Flat No.: ${data.flatNumber}`, rightX, yPos, 16); // Above 15px
    yPos += 12;

    // Payment Information
    // Received with thanks from [BOLD NAME] the sum of Rupees [amount] only. By [payment method]
    const maxTextWidth = boxWidth - (boxMargin * 2); // Equal padding - text continues till dashed border

    // Amount in words
    const amountInWords = numberToWords(Math.floor(data.amount));
    const paise = Math.round((data.amount % 1) * 100);
    const paiseWords = paise > 0 ? ` and ${numberToWords(paise)} Paise` : '';
    const amountText = `the sum of Rupees ${amountInWords.toLowerCase()}${paiseWords} only.`;

    // Payment Method
    let paymentMethodText = '';
    if (data.chequeNumber || data.paymentMethod.toLowerCase().includes('cheque')) {
      paymentMethodText = `By Cheque No. ${data.chequeNumber || data.paymentMethod}`;
    } else if (data.paymentMethod.toLowerCase().includes('upi') || data.paymentMethod.toLowerCase().includes('online')) {
      paymentMethodText = `By ${data.paymentMethod}`;
    } else {
      paymentMethodText = `By ${data.paymentMethod}`;
    }

    // Combine: "Received with thanks from [NAME] the sum of Rupees [amount] only. By [method]"
    const beforeName = 'Received with thanks from ';
    const afterName = ` ${amountText} ${paymentMethodText}`;
    const linesReceived = addMixedText(beforeName, data.residentName, afterName, leftX, yPos, 16, maxTextWidth); // Above 15px
    yPos += linesReceived * 8;

    // Dated field and Payment Type and Bill Details - combined on one line
    let datedBillText = '';
    if (data.chequeDate) {
      datedBillText = `Dated ${data.chequeDate} `;
    } else {
      datedBillText = 'Dated ';
    }

    if (data.billNumber) {
      datedBillText += `in ${data.paymentType} payment of Bill No. ${data.billNumber}`;
      if (data.billDate) {
        datedBillText += ` dated ${data.billDate}.`;
      } else {
        datedBillText += '.';
      }
    }

    const linesDatedBill = addText(datedBillText, leftX, yPos, 16, 'left', maxTextWidth); // Above 15px
    yPos += linesDatedBill * 8;

    // Remarks - with text wrapping (format: Recd Agnst Bill No. [number] Dt.[date])
    if (data.remarks || (data.billNumber && data.billDate)) {
      let remarksText = '';
      if (data.billNumber && data.billDate) {
        // Format: Recd Agnst Bill No. [number] Dt.[date]
        const formattedDate = data.billDate.replace(/\./g, '.'); // Ensure proper date format
        remarksText = `Remarks: Recd Agnst Bill No. ${data.billNumber} Dt.${formattedDate}`;
      } else {
        remarksText = `Remarks: ${data.remarks}`;
      }
      const linesRemarks = addText(remarksText, leftX, yPos, 16, 'left', maxTextWidth); // Above 15px
      yPos += linesRemarks * 8;
    }

    // For society name - same font size and normal (not bold) to match remarks
    const societyName = data.societyName || 'HAPPY VALLEY PHASE-1 CO-OP HOUSING SOCIETY LTD.';
    const societyText = `For ${societyName}`;
    const linesSociety = addText(societyText, leftX, yPos, 16, 'left', maxTextWidth); // Same size as remarks, normal font
    yPos += linesSociety * 8; // Same spacing as remarks

    // Amount in figures
    addText(`Rs. ${data.amount.toFixed(2)}`, leftX, yPos, 18); // Above 15px
    yPos += 12;

    // Footer
    yPos += 8;
    addText('E. & O. E.', leftX, yPos, 16); // Above 15px
    addText('* Cheques subject to realisation.', pageWidth / 2, yPos, 16, 'center'); // Above 15px
    yPos += 8;

    // Draw dashed box border around everything from RECEIPT to end
    const boxHeight = yPos - boxStartY;
    doc.setLineWidth(1);
    doc.setDrawColor(0, 0, 0);
    doc.setLineDashPattern([5, 5], 0); // Dashed pattern
    doc.rect(boxX, boxStartY, boxWidth, boxHeight);
    doc.setLineDashPattern([], 0); // Reset to solid
  });

  // Save PDF
  doc.save('All_Receipts.pdf');
};
