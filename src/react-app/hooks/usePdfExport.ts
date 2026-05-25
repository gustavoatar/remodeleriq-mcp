import { useState, useCallback } from 'react';

interface PdfExportOptions {
  filename?: string;
  elementId?: string;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPdf = useCallback(async (options: PdfExportOptions = {}) => {
    const { 
      filename = 'RemodelerIQ-Report', 
      elementId = 'report-content',
      onComplete,
      onError
    } = options;

    setIsExporting(true);

    try {
      // Dynamic import to avoid loading the library until needed
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error('Report content not found');
      }

      // Add pdf-exporting class to show header/footer and clean up UI
      document.body.classList.add('pdf-exporting');
      
      // Show PDF header/footer elements
      const pdfHeader = element.querySelector('.pdf-header');
      const pdfFooter = element.querySelector('.pdf-footer');
      if (pdfHeader) (pdfHeader as HTMLElement).style.display = 'block';
      if (pdfFooter) (pdfFooter as HTMLElement).style.display = 'block';

      // Dispatch event to tell React components to expand for PDF
      window.dispatchEvent(new CustomEvent('pdf-export-start'));
      
      // Wait for React to re-render with expanded state
      await new Promise(resolve => setTimeout(resolve, 300));

      // Also force-show any hidden elements that might have been missed
      const hiddenElements: { el: HTMLElement; display: string; height: string; overflow: string; maxHeight: string }[] = [];
      
      // Find elements that are hidden or collapsed
      element.querySelectorAll('*').forEach((el) => {
        const htmlEl = el as HTMLElement;
        const style = window.getComputedStyle(htmlEl);
        
        // Skip elements that should stay hidden (like tooltips, modals)
        if (htmlEl.closest('[role="dialog"]') || htmlEl.closest('[role="tooltip"]')) return;
        
        // If element has height 0 or is display none, show it
        if (style.display === 'none' || style.maxHeight === '0px' || style.height === '0px') {
          hiddenElements.push({
            el: htmlEl,
            display: htmlEl.style.display,
            height: htmlEl.style.height,
            overflow: htmlEl.style.overflow,
            maxHeight: htmlEl.style.maxHeight
          });
          htmlEl.style.display = style.display === 'none' ? 'block' : htmlEl.style.display;
          htmlEl.style.height = 'auto';
          htmlEl.style.maxHeight = 'none';
          htmlEl.style.overflow = 'visible';
        }
      });

      // Small delay for final DOM updates
      await new Promise(resolve => setTimeout(resolve, 100));

      // Generate date string for filename
      const dateStr = new Date().toISOString().split('T')[0];
      const fullFilename = `${filename}-${dateStr}.pdf`;

      // PDF options for good quality output
      const pdfOptions = {
        margin: [15, 12, 15, 12] as [number, number, number, number],
        filename: fullFilename,
        image: { type: 'jpeg' as const, quality: 0.92 },
        html2canvas: { 
          scale: 2,
          useCORS: true,
          letterRendering: true,
          logging: false,
          backgroundColor: '#ffffff'
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait' as const
        },
        pagebreak: { 
          mode: ['avoid-all', 'css', 'legacy'] as const,
          before: '.pdf-page-break-before',
          after: '.pdf-page-break-after',
          avoid: '.pdf-no-break'
        }
      };

      await html2pdf().set(pdfOptions).from(element).save();

      // Restore hidden elements
      hiddenElements.forEach(({ el, display, height, overflow, maxHeight }) => {
        el.style.display = display;
        el.style.height = height;
        el.style.overflow = overflow;
        el.style.maxHeight = maxHeight;
      });

      // Tell React components to collapse back
      window.dispatchEvent(new CustomEvent('pdf-export-end'));

      // Hide PDF header/footer elements again
      if (pdfHeader) (pdfHeader as HTMLElement).style.display = '';
      if (pdfFooter) (pdfFooter as HTMLElement).style.display = '';

      // Remove pdf-exporting class
      document.body.classList.remove('pdf-exporting');
      
      onComplete?.();
    } catch (error) {
      // Clean up on error
      document.body.classList.remove('pdf-exporting');
      window.dispatchEvent(new CustomEvent('pdf-export-end'));
      console.error('PDF export failed:', error);
      onError?.(error instanceof Error ? error : new Error('PDF export failed'));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return { exportToPdf, isExporting };
}
