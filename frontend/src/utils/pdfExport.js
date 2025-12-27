import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export const downloadPdf = async (elementRef, filename = 'document.pdf') => {
  if (!elementRef.current) return false;
  
  try {
    const canvas = await html2canvas(elementRef.current, { 
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    // Split into pages if too long
    const pageHeight = pdf.internal.pageSize.getHeight();
    let heightLeft = pdfHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
    heightLeft -= pageHeight;

    while (heightLeft >= 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
    }
    
    pdf.save(filename);
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};

export const shareContent = async (title, text, url = window.location.href) => {
  try {
    if (navigator.share) {
      await navigator.share({
        title,
        text,
        url
      });
      return true;
    } else {
      await navigator.clipboard.writeText(url);
      return 'copied';
    }
  } catch (error) {
    console.error('Error sharing:', error);
    return false;
  }
};
