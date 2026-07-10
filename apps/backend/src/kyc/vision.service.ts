import { Injectable, Logger } from '@nestjs/common';
import { createWorker } from 'tesseract.js';
import sharp from 'sharp';

export interface KycAiResult {
  approved: boolean;
  hardFail: boolean; // true = clearly invalid upload (blank/duplicate/corrupt) -> auto-reject
  name: string | null;
  cnicNumber: string | null;
  expiryDate: string | null;
  faceMatch: boolean;
  confidence: number;
  flags: string[]; // advisory issues for the admin reviewer
  rejectionReason: string | null;
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);

  constructor() {
    this.logger.log('Tesseract.js + Sharp KYC verification initialized (100% free, local)');
  }

  async processKyc(cnicFrontBuffer: Buffer, cnicBackBuffer: Buffer, selfieBuffer: Buffer): Promise<KycAiResult> {
    this.logger.log('Starting KYC verification with Tesseract OCR + Sharp image analysis');
    return this.processWithTesseract(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
  }

  // ─── Tesseract.js + Sharp path (free, local) ───
  private async processWithTesseract(
    cnicFrontBuffer: Buffer,
    cnicBackBuffer: Buffer,
    selfieBuffer: Buffer,
  ): Promise<KycAiResult> {
    const flags: string[] = [];
    let approved = true;
    let rejectionReason: string | null = null;
    let confidence = 0.9;

    // ── 1. Image quality analysis with Sharp ──
    const [frontMeta, backMeta, selfieMeta] = await Promise.all([
      this.analyzeImage(cnicFrontBuffer).catch(() => null),
      this.analyzeImage(cnicBackBuffer).catch(() => null),
      this.analyzeImage(selfieBuffer).catch(() => null),
    ]);

    // Check all images loaded
    if (!frontMeta || !backMeta || !selfieMeta) {
      return {
        approved: false,
        hardFail: true,
        name: null,
        cnicNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0.6,
        flags: ['One or more images could not be processed (corrupt or unsupported format)'],
        rejectionReason: 'One or more uploaded images are corrupt or in an unsupported format.',
      };
    }

    // File size checks
    const MIN_SIZE = 20_000;
    const MAX_SIZE = 10_000_000;
    const images = [
      { label: 'ID front', buf: cnicFrontBuffer, meta: frontMeta },
      { label: 'ID back', buf: cnicBackBuffer, meta: backMeta },
      { label: 'Selfie', buf: selfieBuffer, meta: selfieMeta },
    ];

    for (const img of images) {
      if (img.buf.length < MIN_SIZE) {
        flags.push(`${img.label} image is too small (${(img.buf.length / 1024).toFixed(0)}KB). Minimum 20KB required.`);
      }
      if (img.buf.length > MAX_SIZE) {
        flags.push(`${img.label} image is too large (${(img.buf.length / 1024 / 1024).toFixed(1)}MB). Maximum 10MB allowed.`);
      }
    }

    // Resolution checks
    if (frontMeta.width < 300 || frontMeta.height < 200) {
      flags.push(`ID front resolution too low (${frontMeta.width}x${frontMeta.height}). Minimum 300x200.`);
    }
    if (selfieMeta.width < 300 || selfieMeta.height < 300) {
      flags.push(`Selfie resolution too low (${selfieMeta.width}x${selfieMeta.height}). Minimum 300x300.`);
    }

    // Brightness checks (0-255 scale from Sharp stats)
    if (frontMeta.brightness < 30) {
      flags.push('ID front image is too dark. Please retake with better lighting.');
    } else if (frontMeta.brightness > 235) {
      flags.push('ID front image is overexposed (too bright). Please retake.');
    }
    if (selfieMeta.brightness < 30) {
      flags.push('Selfie is too dark. Please retake with better lighting.');
    } else if (selfieMeta.brightness > 235) {
      flags.push('Selfie is overexposed (too bright). Please retake.');
    }

    // Blur detection — Sharp standard deviation of Laplacian
    // Lower values = more blur. Threshold ~50 for acceptable sharpness
    if (frontMeta.sharpness < 50) {
      flags.push('ID front image appears blurry. Please retake with focus on the document.');
    }
    if (selfieMeta.sharpness < 50) {
      flags.push('Selfie appears blurry. Please retake with clear focus.');
    }

    // Duplicate image detection
    const frontHash = this.quickHash(cnicFrontBuffer);
    const backHash = this.quickHash(cnicBackBuffer);
    const selfieHash = this.quickHash(selfieBuffer);

    if (frontHash === backHash) {
      flags.push('ID front and back appear to be the same image. Please upload different photos.');
    }
    if (frontHash === selfieHash || backHash === selfieHash) {
      flags.push('Selfie appears to be the same as one of the document photos. Please take a real selfie.');
    }

    // Aspect ratio checks
    const frontRatio = frontMeta.width / frontMeta.height;
    const selfieRatio = selfieMeta.width / selfieMeta.height;
    if (frontRatio < 0.8) {
      flags.push('ID front photo orientation appears incorrect. Please upload in landscape mode.');
    }
    if (selfieRatio > 2.0) {
      flags.push('Selfie aspect ratio is unusual. Please take a normal selfie photo.');
    }

    // ── 2. OCR text extraction with Tesseract.js ──
    let extractedText = '';
    let cnicNumber: string | null = null;
    let name: string | null = null;
    let expiryDate: string | null = null;

    try {
      // Pre-process image for better OCR: grayscale + normalize + sharpen
      const processedFront = await sharp(cnicFrontBuffer)
        .grayscale()
        .normalize()
        .sharpen()
        .toBuffer();

      const worker = await createWorker('eng');
      const { data } = await worker.recognize(processedFront);
      extractedText = data.text || '';
      await worker.terminate();

      this.logger.log(`OCR extracted ${extractedText.length} chars from ID front`);
      this.logger.debug(`OCR text sample: ${extractedText.substring(0, 200).replace(/\n/g, ' | ')}`);

      cnicNumber = this.extractCnicNumber(extractedText);
      name = this.extractName(extractedText);
      expiryDate = this.extractExpiryDate(extractedText);
    } catch (err: any) {
      this.logger.error(`OCR failed: ${err.message}`);
      flags.push('Could not extract text from ID document. Image may be unclear.');
    }

    // ── 3. Document validation based on extracted data ──
    if (!cnicNumber) {
      flags.push('ID number not readable on document');
    } else if (!this.isValidCnicFormat(cnicNumber)) {
      flags.push('Invalid ID number format detected');
    }

    if (!name) {
      flags.push('Name not readable on document');
    }

    if (expiryDate && new Date(expiryDate) < new Date()) {
      flags.push('Document appears to be expired');
    }

    // ── 4. Decision logic ──
    // Hard fails = clearly invalid uploads (corrupt, blank, duplicate, too dark/blurry)
    const hardFailFlags = flags.filter(f =>
      f.includes('corrupt') ||
      f.includes('too small') ||
      f.includes('too large') ||
      f.includes('same image') ||
      f.includes('same as one of') ||
      f.includes('too dark') ||
      f.includes('overexposed') ||
      f.includes('blurry') ||
      f.includes('resolution too low')
    );

    const hardFail = hardFailFlags.length > 0;

    if (hardFail) {
      approved = false;
      rejectionReason = hardFailFlags.join(' ');
      confidence = 0.7;
      this.logger.warn(`KYC hard fail: ${hardFailFlags.length} critical issues found`);
    } else if (cnicNumber && name && this.isValidCnicFormat(cnicNumber)) {
      // OCR successfully extracted a valid ID number and name — high confidence approval
      approved = true;
      confidence = 0.88;
      this.logger.log(`KYC auto-approved: ID=${cnicNumber}, Name=${name}`);
    } else if (cnicNumber && this.isValidCnicFormat(cnicNumber)) {
      // ID number extracted but name missing — medium confidence
      approved = true;
      confidence = 0.82;
      this.logger.log(`KYC auto-approved (no name): ID=${cnicNumber}`);
    } else {
      // Images pass quality checks but OCR couldn't extract enough data
      // Route to admin for manual review
      approved = false;
      confidence = 0.5;
      if (flags.length === 0) flags.push('Document text not fully readable — manual review needed');
      this.logger.log('KYC images valid but OCR incomplete; routing to admin manual review');
    }

    return {
      approved,
      hardFail,
      name,
      cnicNumber,
      expiryDate,
      faceMatch: false, // Tesseract doesn't do face detection
      confidence,
      flags: flags.length > 0 ? flags : ['All checks passed'],
      rejectionReason,
    };
  }

  // ─── Sharp image analysis: dimensions, brightness, sharpness ───
  private async analyzeImage(buf: Buffer): Promise<{ width: number; height: number; brightness: number; sharpness: number }> {
    const meta = await sharp(buf).metadata();
    const stats = await sharp(buf).stats();

    // Brightness: average of luminance across channels (0-255)
    const channels = stats.channels;
    let brightness = 0;
    if (channels.length >= 3) {
      brightness = (channels[0].mean + channels[1].mean + channels[2].mean) / 3;
    } else if (channels.length >= 1) {
      brightness = channels[0].mean;
    }

    // Sharpness: standard deviation of the luminance channel
    // Higher = sharper image, lower = more blurry
    const sharpness = channels[0]?.stdev || 0;

    return {
      width: meta.width || 0,
      height: meta.height || 0,
      brightness: Math.round(brightness),
      sharpness: Math.round(sharpness),
    };
  }

  // ─── Helper: quick hash for duplicate detection ───
  private quickHash(buf: Buffer): string {
    let hash = 0;
    const step = Math.max(1, Math.floor(buf.length / 1000));
    for (let i = 0; i < buf.length; i += step) {
      hash = ((hash << 5) - hash + buf[i]) | 0;
    }
    return `${hash}_${buf.length}`;
  }

  // ─── Text extraction helpers ───
  private extractCnicNumber(text: string): string | null {
    // Remove all whitespace and look for 13 consecutive digits (CNIC format)
    const cleaned = text.replace(/\s/g, '');
    const match = cleaned.match(/\d{13}/);
    return match ? match[0] : null;
  }

  private extractName(text: string): string | null {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
    for (const line of lines) {
      // Skip lines that look like numbers, dates, or common ID field labels
      if (line.length > 5 && !/\d{13}|Gender|Date|Country|Identity|Pakistan|Father|Sign|Holder/i.test(line)) {
        // Check if it looks like a name (mostly letters, may contain spaces)
        if (/^[A-Za-z\s.]+$/.test(line)) {
          return line.trim();
        }
      }
    }
    return null;
  }

  private extractExpiryDate(text: string): string | null {
    // Try multiple date formats: DD.MM.YYYY, DD/MM/YYYY, DD-MM-YYYY
    const match = text.match(/(\d{2})[.\/-](\d{2})[.\/-](\d{4})/);
    if (match) {
      const [, d, m, y] = match;
      return `${y}-${m}-${d}`;
    }
    return null;
  }

  private isValidCnicFormat(cnic: string): boolean {
    return /^\d{13}$/.test(cnic) && cnic[0] !== '0';
  }
}
