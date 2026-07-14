import { useState, useCallback, useRef } from 'react';
import { Upload, FileText, X, AlertCircle, Loader2, CheckCircle, Edit3, ArrowRight, DollarSign, Briefcase, FileCheck, Ruler, ChevronDown, Check, Image, Sparkles, MapPin } from 'lucide-react';
import { ContractorFingerprint, buildContractorPulse, ContractorPulse, parseLicenseNumber } from '@/shared/contractorPulse';
import * as pdfjsLib from 'pdfjs-dist';
import { extractDetectedData } from './ProjectDataEditor';
import { extractBidTotal } from '@/shared/analysisEngine';
import { STATE_CODES, getStateNameFromCode, getUserSavedLocation } from '@/react-app/hooks/useGeolocation';
import { extractAllFallback } from '@/shared/regexFallback';
import { fetchWithResilience, getUserFriendlyError } from '@/shared/apiResilience';
import { detectProjectZip } from '@/shared/zipDetection';
import { detectUnits, UnitDetectionResult } from '@/shared/unitDetection';
import { getUnitConfig, normalizeProjectType } from '@/shared/unitTypeEngine';

// Configure PDF.js worker with multiple fallback strategies
// This handles Safari and mobile browser compatibility issues
const initializePdfWorker = () => {
  // Use jsdelivr CDN which mirrors npm packages directly (always has matching versions)
  const cdnWorkerUrl = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@5.7.284/build/pdf.worker.min.mjs';
  
  try {
    pdfjsLib.GlobalWorkerOptions.workerSrc = cdnWorkerUrl;
  } catch (e) {
    console.warn('Failed to set PDF.js worker, will use main thread:', e);
    // If worker setup fails entirely, PDF.js will fall back to main thread processing
  }
};

initializePdfWorker();

interface ContractorFingerprintExtract {
  legalBusinessName: string | null;
  dbaName: string | null;
  licenseNumber: string | null;
  licenseState: string | null;
  businessAddress: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  primaryContact: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

interface UploadAreaProps {
  onFileProcessed: (content: string, fileName: string, overrides?: { projectType?: string | null; squareFootage?: number | null; bidTotal?: number | null; stateCode?: string; contractorFingerprint?: ContractorFingerprintExtract | null; contractorPulse?: ContractorPulse | null; linearFeet?: number | null; unitCount?: number | null; contributeData?: boolean }) => void;
  onBack: () => void;
}

type UploadStatus = 'idle' | 'dragging' | 'processing' | 'preview' | 'error';

interface PreviewData {
  extractedText: string;
  fileName: string;
  bidTotal: number | null;
  contractorName: string | null;
  projectType: string | null;
  squareFootage: number | null;
  pageCount: number;
  extractionMethod: 'text' | 'vision';
  aiExtracted?: boolean;
  confidence?: {
    bidTotal: 'high' | 'medium' | 'low' | 'none';
    projectType: 'high' | 'medium' | 'low' | 'none';
    squareFootage: 'high' | 'medium' | 'low' | 'none';
    contractorInfo?: 'high' | 'medium' | 'low' | 'none';
  };
  contractorFingerprint?: ContractorFingerprintExtract | null;
  unitDetection?: UnitDetectionResult | null;
}

const ACCEPTED_TYPES = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/tiff': ['.tiff', '.tif'],
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MIN_TEXT_THRESHOLD = 100; // Minimum characters to consider text extraction successful

// Warning thresholds for large files
const LARGE_FILE_SIZE = 5 * 1024 * 1024; // 5MB - show warning
const MANY_PAGES_THRESHOLD = 8; // More than 8 pages - show warning

export default function UploadArea({ onFileProcessed, onBack }: UploadAreaProps) {
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [processingStep, setProcessingStep] = useState<string>('');
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [fileSizeWarning, setFileSizeWarning] = useState<string | null>(null);
  const [editedProjectType, setEditedProjectType] = useState<string | null>(null);
  const [editedSquareFootage, setEditedSquareFootage] = useState<string>('');
  const [editedBidTotal, setEditedBidTotal] = useState<string>('');
  const [editedStateCode, setEditedStateCode] = useState<string>('');
  const [editedWindowCount, setEditedWindowCount] = useState<string>('');
  const [editedYearBuilt, setEditedYearBuilt] = useState<string>('');
  // Linear feet for fence/gutter/railing projects
  const [editedLinearFeet, setEditedLinearFeet] = useState<string>('');
  // Anonymized data contribution — on by default, homeowner can opt out before analyzing.
  const [contributeData, setContributeData] = useState<boolean>(true);
  const [editingField, setEditingField] = useState<'projectType' | 'squareFootage' | 'bidTotal' | 'state' | 'windowCount' | 'yearBuilt' | 'linearFeet' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Common project types for selection
  const PROJECT_TYPES = [
    'Kitchen Remodel',
    'Bathroom Remodel', 
    'Full Home Renovation',
    'Basement Finishing',
    'Room Addition',
    'Deck/Patio',
    'Roofing',
    'Siding',
    'Flooring',
    'Painting',
    'HVAC',
    'Plumbing',
    'Electrical',
    'Window Replacement',
    // Linear feet projects
    'Fence',
    'Fence Repair',
    'Gutters',
    'Railings',
    'Crown Molding',
    'Baseboards',
    'Retaining Wall',
    // Per-unit projects
    'Interior Doors',
    'Exterior Doors',
    'Light Fixtures',
    'Outlets/Switches',
    'Water Heater',
    'Other'
  ];

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return 'File too large. Maximum size is 10MB.';
    }
    const isValidType = Object.keys(ACCEPTED_TYPES).includes(file.type);
    if (!isValidType) {
      return 'Invalid file type. Please upload a PDF or image (PNG, JPG, TIFF).';
    }
    return null;
  };

  // Standard text extraction from PDF with enhanced error handling
  const extractTextFromPDF = async (file: File): Promise<{ text: string; numPages: number }> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      
      const textParts: string[] = [];
      
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        setProcessingStep(`Extracting page ${pageNum} of ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        textParts.push(`--- Page ${pageNum} ---\n${pageText}`);
      }
      
      return { text: textParts.join('\n\n'), numPages: pdf.numPages };
    } catch (error) {
      console.error('PDF text extraction error:', error);
      // Re-throw with a more helpful message
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('undefined is not a function') || errorMsg.includes('worker')) {
        throw new Error('PDF processing failed due to browser compatibility. Please try using Chrome or refresh the page and try again.');
      }
      throw error;
    }
  };

  // Convert PDF pages to images for Vision AI with enhanced error handling
  const convertPDFToImages = async (file: File): Promise<Array<{ data: string; mimeType: string }>> => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const images: Array<{ data: string; mimeType: string }> = [];
      
      // Limit to 10 pages
      const maxPages = Math.min(pdf.numPages, 10);
      
      for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
        setProcessingStep(`Converting page ${pageNum} of ${maxPages} to image...`);
        const page = await pdf.getPage(pageNum);
        
        // Scale reduced from 2.0 to 1.5 for better cost efficiency
        // Combined with medium media_resolution on backend for optimal quality/cost balance
        const scale = 1.5;
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d')!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;
        
        // Render page to canvas
        await page.render({
          canvasContext: context,
          viewport: viewport,
          canvas: canvas
        }).promise;
        
        // Convert to base64 JPEG (smaller than PNG)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        const base64Data = dataUrl.replace(/^data:image\/jpeg;base64,/, '');
        
        images.push({
          data: base64Data,
          mimeType: 'image/jpeg'
        });
      }
      
      return images;
    } catch (error) {
      console.error('PDF to image conversion error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      if (errorMsg.includes('undefined is not a function') || errorMsg.includes('worker')) {
        throw new Error('PDF processing failed due to browser compatibility. Please try using Chrome or refresh the page and try again.');
      }
      throw error;
    }
  };

  // Convert direct image upload to base64
  const convertImageToBase64 = async (file: File): Promise<{ data: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64Data = result.replace(/^data:image\/\w+;base64,/, '');
        resolve({
          data: base64Data,
          mimeType: file.type
        });
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // Call Vision API to extract text from images
  const extractTextWithVision = async (images: Array<{ data: string; mimeType: string }>): Promise<string> => {
    const maxRetries = 3;
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      setProcessingStep(attempt > 1 
        ? `Retrying AI vision (attempt ${attempt}/${maxRetries})...` 
        : 'Using AI vision to read document...');
      
      try {
        const response = await fetch('/api/extract/vision', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ images })
        });
        
        if (!response.ok) {
          // Retry on transient errors (502, 503, 504)
          if ([502, 503, 504].includes(response.status) && attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * attempt)); // Exponential backoff
            continue;
          }
          
          // Check if response is JSON before parsing
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const error = await response.json();
            throw new Error(error.error || 'Vision extraction failed');
          }
          throw new Error(`Vision extraction failed (${response.status}). Please try again.`);
        }
        
        const result = await response.json();
        return result.text;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error('Unknown error');
        if (attempt < maxRetries && !lastError.message.includes('not configured')) {
          await new Promise(r => setTimeout(r, 1000 * attempt));
          continue;
        }
        throw lastError;
      }
    }
    
    throw lastError || new Error('Vision extraction failed after retries');
  };
  
  // Call structured extraction API to get bid total, project type, etc.
  const extractStructuredData = async (text: string): Promise<{
    bidTotal: number | null;
    projectType: string | null;
    squareFootage: number | null;
    contractorName: string | null;
    contractorFingerprint: ContractorFingerprintExtract | null;
    confidence: {
      bidTotal: 'high' | 'medium' | 'low' | 'none';
      projectType: 'high' | 'medium' | 'low' | 'none';
      squareFootage: 'high' | 'medium' | 'low' | 'none';
      contractorInfo: 'high' | 'medium' | 'low' | 'none';
    };
  } | null> => {
    setProcessingStep('Analyzing document with AI...');
    
    try {
      const response = await fetchWithResilience('/api/extract/structured', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      }, { timeoutMs: 45000, maxRetries: 2 });
      
      if (!response.ok) {
        console.warn('Structured extraction failed, using regex fallback');
        return extractAllFallback(text);
      }
      
      // Check content type before parsing
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.warn('Structured extraction returned non-JSON, using regex fallback');
        return extractAllFallback(text);
      }
      
      const result = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      console.warn('Structured extraction error, using regex fallback:', getUserFriendlyError(error));
      return extractAllFallback(text);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setStatus('processing');
    setErrorMessage('');
    setFileSizeWarning(null);

    // Check for large files and set warning (but continue processing)
    if (file.size > LARGE_FILE_SIZE) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setFileSizeWarning(`Large file (${sizeMB}MB) may take longer to process`);
    }

    try {
      let extractedText = '';
      let pageCount = 1;
      let extractionMethod: 'text' | 'vision' = 'text';

      if (file.type === 'application/pdf') {
        // Step 1: Try standard text extraction first (fast, free)
        setProcessingStep('Loading PDF document...');
        const { text, numPages } = await extractTextFromPDF(file);
        pageCount = numPages;
        
        // Add warning for many pages
        if (numPages > MANY_PAGES_THRESHOLD) {
          setFileSizeWarning(`Processing ${numPages} pages - this may take a moment`);
        }
        
        // Step 2: Check if text extraction was successful
        const cleanText = text.replace(/--- Page \d+ ---/g, '').trim();
        
        if (cleanText.length >= MIN_TEXT_THRESHOLD) {
          // Good text extraction - use it
          extractedText = text;
          extractionMethod = 'text';
        } else {
          // Poor text extraction - use Vision AI
          setProcessingStep('Document appears scanned. Using AI vision...');
          const images = await convertPDFToImages(file);
          extractedText = await extractTextWithVision(images);
          extractionMethod = 'vision';
          pageCount = images.length;
        }
      } else {
        // Direct image upload - use Vision AI
        setProcessingStep('Processing image with AI vision...');
        const image = await convertImageToBase64(file);
        extractedText = await extractTextWithVision([image]);
        extractionMethod = 'vision';
        pageCount = 1;
      }

      if (!extractedText.trim()) {
        setErrorMessage('Could not extract text from this document. Please ensure the file contains readable content.');
        setStatus('error');
        return;
      }

      // Try AI-powered structured extraction first (more accurate)
      const aiData = await extractStructuredData(extractedText);
      
      // Fall back to regex-based extraction
      setProcessingStep('Finalizing extraction...');
      const regexBidTotal = extractBidTotal(extractedText) ?? null;
      const regexDetected = extractDetectedData(extractedText, regexBidTotal);
      
      // If both AI and basic regex fail, use enhanced fallback
      let fallbackData = null;
      if (!aiData && !regexDetected.bidTotal) {
        setProcessingStep('Using enhanced extraction...');
        fallbackData = extractAllFallback(extractedText);
      }
      
      // Priority: AI data > basic regex > enhanced fallback
      const finalBidTotal = aiData?.bidTotal ?? regexDetected.bidTotal ?? fallbackData?.bidTotal ?? null;
      const finalProjectType = aiData?.projectType ?? regexDetected.projectType ?? fallbackData?.projectType ?? null;
      const finalSquareFootage = aiData?.squareFootage ?? regexDetected.squareFootage ?? fallbackData?.squareFootage ?? null;
      const finalContractorName = aiData?.contractorName ?? regexDetected.contractorName ?? fallbackData?.contractorName ?? null;
      const finalContractorFingerprint = aiData?.contractorFingerprint ?? null;
      
      // Determine confidence - AI is high, regex/fallback is medium/low
      const finalConfidence = aiData?.confidence ?? fallbackData?.confidence ?? {
        bidTotal: regexDetected.bidTotal ? 'medium' as const : 'none' as const,
        projectType: regexDetected.projectType ? 'medium' as const : 'none' as const,
        squareFootage: regexDetected.squareFootage ? 'low' as const : 'none' as const,
        contractorInfo: regexDetected.contractorName ? 'low' as const : 'none' as const,
      };
      
      // Detect unit counts (windows, doors, outlets, etc.)
      const unitDetectionResult = detectUnits(extractedText);
      
      setPreviewData({
        extractedText,
        fileName: file.name,
        bidTotal: finalBidTotal,
        contractorName: finalContractorName,
        projectType: finalProjectType,
        squareFootage: finalSquareFootage,
        pageCount,
        extractionMethod,
        aiExtracted: !!aiData,
        confidence: finalConfidence,
        contractorFingerprint: finalContractorFingerprint,
        unitDetection: unitDetectionResult
      });
      
      // Initialize edited values with detected values
      setEditedProjectType(finalProjectType);
      setEditedSquareFootage(finalSquareFootage ? String(finalSquareFootage) : '');
      setEditedBidTotal(finalBidTotal ? String(finalBidTotal) : '');
      
      // Initialize state from saved user location (don't default to GA - let user choose if not set)
      const savedLocation = getUserSavedLocation();
      setEditedStateCode(savedLocation?.stateCode || '');
      
      setEditingField(null);
      
      setStatus('preview');
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setErrorMessage(`Failed to process file: ${errorMsg}`);
      setStatus('error');
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');

    const file = e.dataTransfer.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setStatus('error');
      return;
    }

    processFile(file);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('dragging');
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setStatus('idle');
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      setErrorMessage(error);
      setStatus('error');
      return;
    }

    processFile(file);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const clearError = () => {
    setStatus('idle');
    setErrorMessage('');
    setSelectedFile(null);
    setPreviewData(null);
  };

  const handleConfirmAnalysis = () => {
    if (previewData) {
      // Build contractor pulse with distance analysis if we have fingerprint data
      let contractorPulse: ContractorPulse | null = null;
      if (previewData.contractorFingerprint) {
        // Use smart ZIP detection to find the project location
        const projectZip = detectProjectZip(previewData.extractedText);
        
        const parsed = parseLicenseNumber(previewData.contractorFingerprint.licenseNumber || '');
        const fingerprint: ContractorFingerprint = {
          legalBusinessName: previewData.contractorFingerprint.legalBusinessName || null,
          dbaName: previewData.contractorFingerprint.dbaName || null,
          licenseNumber: previewData.contractorFingerprint.licenseNumber || null,
          licenseType: parsed?.type || null,
          licenseState: previewData.contractorFingerprint.licenseState || previewData.contractorFingerprint.state || null,
          businessAddress: previewData.contractorFingerprint.businessAddress || null,
          city: previewData.contractorFingerprint.city || null,
          state: previewData.contractorFingerprint.state || null,
          zipCode: previewData.contractorFingerprint.zipCode || null,
          primaryContact: previewData.contractorFingerprint.primaryContact || null,
          phone: previewData.contractorFingerprint.phone || null,
          email: previewData.contractorFingerprint.email || null,
          website: previewData.contractorFingerprint.website || null,
          confidence: {
            businessName: 'medium',
            license: 'medium',
            address: 'medium',
            contact: 'medium'
          }
        };
        contractorPulse = buildContractorPulse(fingerprint, projectZip);
      }
      
      // Pass edited values as overrides
      // Calculate effective window count
      const windowItems = previewData.unitDetection?.items.filter(item => item.type === 'window') || [];
      const detectedWindows = windowItems.reduce((sum, item) => sum + item.quantity, 0);
      const windowCount = editedWindowCount 
        ? parseInt(editedWindowCount, 10) 
        : (detectedWindows > 0 ? detectedWindows : null);
      
      // Calculate effective year built
      const yearBuilt = editedYearBuilt 
        ? parseInt(editedYearBuilt, 10) 
        : null;
      
      // Calculate effective linear feet for fence/gutter/railing projects
      const linearFeet = editedLinearFeet 
        ? parseInt(editedLinearFeet, 10) 
        : null;
      
      const overrides = {
        projectType: editedProjectType,
        squareFootage: effectiveSquareFootage,
        bidTotal: effectiveBidTotal,
        stateCode: editedStateCode || undefined,
        contractorFingerprint: previewData.contractorFingerprint || null,
        contractorPulse,
        windowCount,
        yearBuilt,
        linearFeet,
        contributeData
      };
      onFileProcessed(previewData.extractedText, previewData.fileName, overrides);
    }
  };

  const handleReupload = () => {
    setStatus('idle');
    setPreviewData(null);
    setSelectedFile(null);
    setEditedProjectType(null);
    setEditedSquareFootage('');
    setEditedBidTotal('');
    setEditedStateCode('');
    setEditedYearBuilt('');
    setEditingField(null);
  };
  
  // Get the effective values (edited or detected)
  const effectiveProjectType = editedProjectType ?? previewData?.projectType ?? null;
  const effectiveSquareFootage = editedSquareFootage ? parseInt(editedSquareFootage, 10) : previewData?.squareFootage ?? null;
  const effectiveBidTotal = editedBidTotal ? parseInt(editedBidTotal.replace(/[^0-9]/g, ''), 10) : previewData?.bidTotal ?? null;
  const effectiveStateName = editedStateCode ? getStateNameFromCode(editedStateCode) : null;
  
  // Get all US states sorted alphabetically
  const stateOptions = Object.entries(STATE_CODES)
    .map(([name, code]) => ({ 
      name: name.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), 
      code 
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  // Preview step - show extracted data for confirmation
  if (status === 'preview' && previewData) {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
              <FileCheck className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-navy-900 mb-3">Review Extracted Data</h2>
            <p className="text-navy-600 text-lg">
              We've extracted the following from your bid. Please verify before analysis.
            </p>
          </div>

          {/* File info */}
          <div className="card-glass p-4 mb-6 flex items-center gap-4 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-brand-100 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-brand-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-navy-900 truncate">{previewData.fileName}</p>
              <div className="flex items-center gap-2 text-sm text-navy-500">
                <span>{previewData.pageCount} page{previewData.pageCount !== 1 ? 's' : ''}</span>
                {previewData.extractionMethod === 'vision' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    <Sparkles className="w-3 h-3" />
                    AI Vision
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={handleReupload}
              className="text-sm text-navy-500 hover:text-navy-700 flex items-center gap-1 transition-colors"
            >
              <Edit3 className="w-4 h-4" />
              Change
            </button>
          </div>

          {/* Extracted data cards */}
          <div className="grid gap-4 mb-8">
            {/* Editable Bid Total */}
            <div className="card-glass p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  effectiveBidTotal ? 'bg-green-100' : 'bg-navy-100'
                }`}>
                  <DollarSign className={`w-6 h-6 ${effectiveBidTotal ? 'text-green-600' : 'text-navy-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-navy-500">Bid Total</p>
                    {previewData?.aiExtracted && previewData?.confidence?.bidTotal && (
                      <ConfidenceBadge level={previewData.confidence.bidTotal} />
                    )}
                  </div>
                  {editingField === 'bidTotal' ? (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center flex-1">
                        <span className="text-navy-900 font-semibold mr-1">$</span>
                        <input
                          type="text"
                          value={editedBidTotal}
                          onChange={(e) => setEditedBidTotal(e.target.value.replace(/[^0-9,]/g, ''))}
                          onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                          placeholder="e.g., 25,000"
                          autoFocus
                          className="flex-1 px-3 py-2 border border-brand-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                        />
                      </div>
                      <button
                        onClick={() => setEditingField(null)}
                        className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('bidTotal')}
                      className="group flex items-center gap-2 text-left w-full"
                    >
                      {effectiveBidTotal ? (
                        <span className="font-semibold text-navy-900">${effectiveBidTotal.toLocaleString()}</span>
                      ) : (
                        <span className="text-navy-400 italic">Click to enter...</span>
                      )}
                      <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  )}
                </div>
                {effectiveBidTotal && editingField !== 'bidTotal' && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
            
            {/* Editable Project Type */}
            <div className="card-glass p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  effectiveProjectType ? 'bg-green-100' : 'bg-navy-100'
                }`}>
                  <Briefcase className={`w-6 h-6 ${effectiveProjectType ? 'text-green-600' : 'text-navy-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-navy-500">Project Type</p>
                    {previewData?.aiExtracted && previewData?.confidence?.projectType && (
                      <ConfidenceBadge level={previewData.confidence.projectType} />
                    )}
                  </div>
                  {editingField === 'projectType' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={editedProjectType || ''}
                          onChange={(e) => setEditedProjectType(e.target.value || null)}
                          autoFocus
                          className="w-full px-3 py-2 border border-brand-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer pr-8"
                        >
                          <option value="">Select project type...</option>
                          {PROJECT_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
                      </div>
                      <button
                        onClick={() => setEditingField(null)}
                        className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('projectType')}
                      className="group flex items-center gap-2 text-left w-full"
                    >
                      {effectiveProjectType ? (
                        <span className="font-semibold text-navy-900">{effectiveProjectType}</span>
                      ) : (
                        <span className="text-navy-400 italic">Click to select...</span>
                      )}
                      <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  )}
                </div>
                {effectiveProjectType && editingField !== 'projectType' && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
            
            {/* Editable State */}
            <div className="card-glass p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-navy-500 mb-1">Project Location</p>
                  {editingField === 'state' ? (
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <select
                          value={editedStateCode}
                          onChange={(e) => setEditedStateCode(e.target.value)}
                          autoFocus
                          className="w-full px-3 py-2 border border-brand-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500 appearance-none cursor-pointer pr-8"
                        >
                          {stateOptions.map(({ name, code }) => (
                            <option key={code} value={code}>{name}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-navy-400 pointer-events-none" />
                      </div>
                      <button
                        onClick={() => setEditingField(null)}
                        className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('state')}
                      className="group flex items-center gap-2 text-left w-full"
                    >
                      <span className="font-semibold text-navy-900">{effectiveStateName}</span>
                      <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  )}
                </div>
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
              </div>
            </div>
            
            {/* Editable Square Footage - hidden for window-only and linear-feet projects */}
            {(() => {
              // Determine if this is a window-only project
              const isWindowProject = effectiveProjectType?.toLowerCase().includes('window');
              const hasOtherTrades = !isWindowProject || 
                effectiveProjectType?.toLowerCase().includes('remodel') ||
                effectiveProjectType?.toLowerCase().includes('renovation') ||
                effectiveProjectType?.toLowerCase().includes('addition');
              
              // Hide square footage for window-only projects
              if (isWindowProject && !hasOtherTrades) return null;
              
              // Hide square footage for linear-feet projects (fence, gutter, railing, etc.)
              const normalizedType = normalizeProjectType(effectiveProjectType || '');
              const unitConfig = getUnitConfig(normalizedType);
              if (unitConfig.unitType === 'linear-feet') return null;
              
              return (
            <div className="card-glass p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  effectiveSquareFootage ? 'bg-green-100' : 'bg-navy-100'
                }`}>
                  <Ruler className={`w-6 h-6 ${effectiveSquareFootage ? 'text-green-600' : 'text-navy-400'}`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-navy-500">Square Footage</p>
                    {previewData?.aiExtracted && previewData?.confidence?.squareFootage && (
                      <ConfidenceBadge level={previewData.confidence.squareFootage} />
                    )}
                  </div>
                  {editingField === 'squareFootage' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedSquareFootage}
                        onChange={(e) => setEditedSquareFootage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        placeholder="e.g., 1500"
                        autoFocus
                        className="flex-1 px-3 py-2 border border-brand-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-brand-500"
                      />
                      <button
                        onClick={() => setEditingField(null)}
                        className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('squareFootage')}
                      className="group flex items-center gap-2 text-left w-full"
                    >
                      {effectiveSquareFootage ? (
                        <span className="font-semibold text-navy-900">{effectiveSquareFootage.toLocaleString()} sq ft</span>
                      ) : (
                        <span className="text-navy-400 italic">Click to enter...</span>
                      )}
                      <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-brand-500 transition-colors" />
                    </button>
                  )}
                </div>
                {effectiveSquareFootage && editingField !== 'squareFootage' && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </div>
              );
            })()}
            
            {/* Window Count - shown when windows detected or project type is windows */}
            {(() => {
              const windowItems = previewData.unitDetection?.items.filter(item => item.type === 'window') || [];
              const detectedWindows = windowItems.reduce((sum, item) => sum + item.quantity, 0);
              const isWindowProject = effectiveProjectType?.toLowerCase().includes('window');
              
              // Show if windows detected OR if project type is window-related
              if (detectedWindows === 0 && !isWindowProject) return null;
              
              // Effective window count: user edit > detected
              const effectiveWindowCount = editedWindowCount 
                ? parseInt(editedWindowCount, 10) 
                : detectedWindows || null;
              
              return (
                <div className="card-glass p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      effectiveWindowCount ? 'bg-cyan-100' : 'bg-navy-100'
                    }`}>
                      <svg className={`w-6 h-6 ${effectiveWindowCount ? 'text-cyan-600' : 'text-navy-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <line x1="12" y1="3" x2="12" y2="21" />
                        <line x1="3" y1="12" x2="21" y2="12" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-navy-500">Number of Windows</p>
                        {detectedWindows > 0 && !editedWindowCount && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-700 font-medium">
                            Auto-detected
                          </span>
                        )}
                      </div>
                      {editingField === 'windowCount' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editedWindowCount || (detectedWindows > 0 ? String(detectedWindows) : '')}
                            onChange={(e) => setEditedWindowCount(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                            placeholder="e.g., 4"
                            autoFocus
                            min="1"
                            className="flex-1 px-3 py-2 border border-cyan-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                          <button
                            onClick={() => setEditingField(null)}
                            className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingField('windowCount')}
                          className="group flex items-center gap-2 text-left w-full"
                        >
                          {effectiveWindowCount ? (
                            <span className="font-semibold text-navy-900">
                              {effectiveWindowCount} window{effectiveWindowCount !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="text-navy-400 italic">Click to enter...</span>
                          )}
                          <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-cyan-500 transition-colors" />
                        </button>
                      )}
                    </div>
                    {effectiveWindowCount && editingField !== 'windowCount' && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })()}
            
            {/* Linear Feet - shown for fence, gutter, railing projects */}
            {(() => {
              const normalizedType = normalizeProjectType(effectiveProjectType || '');
              const unitConfig = getUnitConfig(normalizedType);
              
              // Only show for linear-feet projects
              if (unitConfig.unitType !== 'linear-feet') return null;
              
              const effectiveLinearFeet = editedLinearFeet 
                ? parseInt(editedLinearFeet, 10) 
                : null;
              
              return (
                <div className="card-glass p-4 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      effectiveLinearFeet ? 'bg-orange-100' : 'bg-navy-100'
                    }`}>
                      <svg className={`w-6 h-6 ${effectiveLinearFeet ? 'text-orange-600' : 'text-navy-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12h18M3 12l3-3m-3 3l3 3M21 12l-3-3m3 3l-3 3" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm text-navy-500">Linear Feet</p>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 font-medium">
                          Required for {unitConfig.unitLabel}
                        </span>
                      </div>
                      {editingField === 'linearFeet' ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            value={editedLinearFeet}
                            onChange={(e) => setEditedLinearFeet(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                            placeholder="e.g., 150"
                            autoFocus
                            min="1"
                            className="flex-1 px-3 py-2 border border-orange-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
                          />
                          <button
                            onClick={() => setEditingField(null)}
                            className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingField('linearFeet')}
                          className="group flex items-center gap-2 text-left w-full"
                        >
                          {effectiveLinearFeet ? (
                            <span className="font-semibold text-navy-900">
                              {effectiveLinearFeet.toLocaleString()} linear feet
                            </span>
                          ) : (
                            <span className="text-orange-600 font-medium italic">Click to enter linear feet...</span>
                          )}
                          <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-orange-500 transition-colors" />
                        </button>
                      )}
                    </div>
                    {effectiveLinearFeet && editingField !== 'linearFeet' && (
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              );
            })()}
            
            {/* 
              =====================================================================
              YEAR BUILT FIELD - TEMPORARILY DISABLED
              =====================================================================
              Purpose: Collects home construction year for lead safety detection.
              - Pre-1978 homes may have lead paint
              - Triggers EPA RRP compliance checks in bid analysis
              - Flags if contractor doesn't mention lead-safe practices
              
              Why disabled: User feedback indicated this field gets in the way of 
              the "Analyze Bid" button and doesn't provide enough value currently.
              
              To re-enable: 
              1. Uncomment the JSX block below
              2. The editedYearBuilt state and editingField logic are still active
              3. The yearBuilt value is still passed to onAnalyze() at line ~498
              4. Lead safety detection in analysisEngine.ts will work automatically
              
              Related files:
              - src/shared/analysisEngine.ts (lead safety flag logic)
              - src/shared/safetyCompliance.ts (EPA RRP compliance checks)
              - src/react-app/pages/Home.tsx (effectiveYearBuilt calculation)
              - src/react-app/components/ReportView.tsx (displays lead warnings)
              =====================================================================
            */}
            {/* COMMENTED OUT - Year Built field
            <div className="card-glass p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  editedYearBuilt ? 'bg-amber-100' : 'bg-navy-100'
                }`}>
                  <svg className={`w-6 h-6 ${editedYearBuilt ? 'text-amber-600' : 'text-navy-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm text-navy-500">Year Built</p>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-navy-100 text-navy-500 font-medium">
                      Optional
                    </span>
                  </div>
                  {editingField === 'yearBuilt' ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editedYearBuilt}
                        onChange={(e) => setEditedYearBuilt(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingField(null)}
                        placeholder="e.g., 1965"
                        autoFocus
                        min="1800"
                        max={new Date().getFullYear()}
                        className="flex-1 px-3 py-2 border border-amber-300 rounded-lg bg-white text-navy-900 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        onClick={() => setEditingField(null)}
                        className="w-10 h-10 rounded-lg bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-colors flex-shrink-0"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingField('yearBuilt')}
                      className="group flex items-center gap-2 text-left w-full"
                    >
                      {editedYearBuilt ? (
                        <span className="font-semibold text-navy-900">{editedYearBuilt}</span>
                      ) : (
                        <span className="text-navy-400 italic">Enter if known (for lead safety check)...</span>
                      )}
                      <Edit3 className="w-4 h-4 text-navy-300 group-hover:text-amber-500 transition-colors" />
                    </button>
                  )}
                </div>
                {editedYearBuilt && editingField !== 'yearBuilt' && (
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                )}
              </div>
              {/* Lead safety warning for pre-1978 homes * /}
              {editedYearBuilt && parseInt(editedYearBuilt, 10) < 1978 && (
                <div className="mt-3 ml-16 p-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-800">
                    <strong>Note:</strong> Pre-1978 homes may contain lead paint. We'll check if this bid includes proper EPA RRP compliance.
                  </p>
                </div>
              )}
            </div>
            END COMMENTED OUT - Year Built field */}
          </div>

          {/* Anonymized data contribution consent */}
          <label className="flex items-start gap-3 mb-4 p-3 rounded-xl bg-navy-50 border border-navy-100 cursor-pointer">
            <input
              type="checkbox"
              checked={contributeData}
              onChange={(e) => setContributeData(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded border-navy-300 flex-shrink-0 accent-[#1F9C4C]"
            />
            <span className="text-sm text-navy-600">
              <span className="font-medium text-navy-700">Help make RemodelerIQ smarter.</span>{' '}
              We anonymize everything — no names, addresses, or documents are ever stored, and raw data is deleted
              after 24 hours. Only stripped-down numbers (project type, region, pricing, detected issues) are used
              to sharpen the model's analysis for every homeowner.{' '}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-[#1F9C4C] hover:underline">
                Learn more
              </a>
            </span>
          </label>

          {/* Primary action - Analyze Bid */}
          <button
            onClick={handleConfirmAnalysis}
            className="w-full px-6 py-4 rounded-xl text-white font-semibold transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mb-6"
            style={{ backgroundColor: '#1F9C4C' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1a8a42'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1F9C4C'}
          >
            Analyze Bid
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Detection summary */}
          <div className="bg-navy-50 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-navy-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-navy-600">
                <p className="font-medium text-navy-700 mb-1">Review and adjust as needed</p>
                <p>Click any field above to edit. Accurate location, project type, and square footage help improve our analysis with state-specific laws and local market rates.</p>
              </div>
            </div>
          </div>

          {/* Secondary actions */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <button
              onClick={handleReupload}
              className="text-navy-500 hover:text-navy-700 font-medium transition-colors"
            >
              Upload Different File
            </button>
            <span className="text-navy-300">•</span>
            <button
              onClick={onBack}
              className="text-navy-500 hover:text-navy-700 font-medium transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
        <div className="card-glass p-8 max-w-lg w-full text-center shadow-lg">
          {/* Processing animation */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-navy-200" />
            <div className="absolute inset-0 rounded-full border-4 border-transparent animate-spin" style={{ borderTopColor: '#1F9C4C' }} />
            <div className="absolute inset-4 rounded-full bg-navy-50 flex items-center justify-center">
              <FileText className="w-8 h-8" style={{ color: '#1F9C4C' }} />
            </div>
          </div>

          <h2 className="text-2xl font-bold text-navy-900 mb-2">Analyzing Your Bid</h2>
          <p className="text-navy-600 mb-6">{selectedFile?.name}</p>

          {/* Progress steps */}
          <div className="bg-navy-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <Loader2 className="w-5 h-5 animate-spin flex-shrink-0" style={{ color: '#1F9C4C' }} />
              <span className="text-navy-700">{processingStep}</span>
            </div>
          </div>

          {/* File size warning */}
          {fileSizeWarning && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-6 flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span className="text-sm text-amber-700">{fileSizeWarning}</span>
            </div>
          )}

          {/* Progress bar */}
          <div className="h-2 bg-navy-100 rounded-full overflow-hidden">
            <div 
              className="h-full rounded-full w-[70%] animate-pulse"
              style={{
                background: 'linear-gradient(to right, #1F9C4C, #17a34a)',
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 px-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          {typeof window !== 'undefined' &&
            new URLSearchParams(window.location.search).get('from') === 'chatgpt' && (
              <div className="mb-4 inline-flex items-start gap-2 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-left text-sm text-brand-800">
                <span className="text-base leading-none">👋</span>
                <span>
                  <strong>Picking up from ChatGPT.</strong> You already got the quick score — now upload the
                  actual bid document and we'll run the full line-by-line report (our AI vision reads PDFs &amp; photos
                  for hidden scope gaps and missing items ChatGPT can't see from text alone).
                </span>
              </div>
            )}
          <h2 className="text-3xl font-bold text-navy-900 mb-3">Upload Your Contractor Bid</h2>
          <p className="text-navy-600 text-lg">
            Upload a PDF or photo of your contractor's quote and we'll analyze it for risks and savings opportunities
          </p>
        </div>

        {/* Upload zone */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`
            relative cursor-pointer transition-all duration-300 rounded-2xl p-8 md:p-12
            border-2 border-dashed transition-all duration-300
            ${status === 'dragging' 
              ? 'scale-[1.02]' 
              : status === 'error'
              ? 'border-red-400 bg-red-50'
              : 'border-navy-300 bg-white'
            }
          `}
          style={{
            borderColor: status === 'dragging' ? '#1F9C4C' : status === 'error' ? undefined : undefined,
            backgroundColor: status === 'dragging' ? 'rgba(31, 156, 76, 0.05)' : undefined,
          }}
          onMouseEnter={(e) => {
            if (status !== 'dragging' && status !== 'error') {
              e.currentTarget.style.borderColor = '#1F9C4C';
              e.currentTarget.style.backgroundColor = 'rgba(31, 156, 76, 0.03)';
              e.currentTarget.style.boxShadow = '0 0 0 4px rgba(31, 156, 76, 0.1)';
            }
          }}
          onMouseLeave={(e) => {
            if (status !== 'dragging' && status !== 'error') {
              e.currentTarget.style.borderColor = '';
              e.currentTarget.style.backgroundColor = '';
              e.currentTarget.style.boxShadow = '';
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.tiff,.tif"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="text-center">
            {status === 'error' ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-red-600 font-medium mb-4">{errorMessage}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearError();
                  }}
                  className="inline-flex items-center gap-2 text-navy-600 hover:text-navy-900 transition-colors"
                >
                  <X className="w-4 h-4" />
                  Try again
                </button>
              </>
            ) : (
              <>
                <div className={`
                  w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center transition-all
                  ${status === 'dragging' 
                    ? 'bg-brand-100 scale-110' 
                    : 'bg-navy-100'
                  }
                `}>
                  <Upload className={`w-10 h-10 transition-colors ${status === 'dragging' ? 'text-brand-500' : 'text-navy-400'}`} />
                </div>

                <p className="text-xl font-semibold text-navy-900 mb-2">
                  {status === 'dragging' ? 'Drop your file here' : 'Drag & drop your bid here'}
                </p>
                <p className="text-navy-500 mb-6">or click to browse</p>

                {/* File type indicators */}
                <div className="flex items-center justify-center gap-6 text-sm text-navy-500">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span>PDF</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-purple-500" />
                    <span>JPG, PNG, TIFF</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Vision badge */}
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-brand-50 border border-purple-200 rounded-full">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span className="text-sm text-navy-700">
              <span className="font-medium">AI Vision</span> reads scanned docs & photos
            </span>
          </div>
        </div>
        
        {/* Privacy note */}
        <p className="mt-4 text-center text-xs text-navy-400">
          Anonymized data improves pricing benchmarks · All uploads deleted within 24 hours
        </p>

        {/* Tips section */}
        <div className="mt-8 grid sm:grid-cols-2 gap-4">
          <TipCard
            title="Works with any format"
            description="Digital PDFs, scanned documents, and photos are all supported with our AI vision."
          />
          <TipCard
            title="Include the full bid"
            description="Upload all pages including payment terms, scope of work, and any attachments."
          />
        </div>

        {/* Back button */}
        <div className="text-center mt-8">
          <button
            onClick={onBack}
            className="text-navy-500 hover:text-navy-900 font-medium transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}

function TipCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white border border-navy-200 rounded-xl p-4 shadow-sm">
      <h4 className="text-navy-900 font-medium mb-1">{title}</h4>
      <p className="text-navy-500 text-sm">{description}</p>
    </div>
  );
}

function ConfidenceBadge({ level }: { level: 'high' | 'medium' | 'low' | 'none' }) {
  const config = {
    high: { bg: 'bg-green-100', text: 'text-green-700', label: 'High confidence' },
    medium: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Medium confidence' },
    low: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Low confidence' },
    none: { bg: 'bg-gray-100', text: 'text-gray-500', label: 'Not found' }
  };
  
  const { bg, text, label } = config[level];
  
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${bg} ${text}`}>
      <Sparkles className="w-3 h-3" />
      {label}
    </span>
  );
}
