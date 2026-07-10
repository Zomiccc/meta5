import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface KycAiResult {
  approved: boolean;
  hardFail: boolean;
  name: string | null;
  cnicNumber: string | null;
  expiryDate: string | null;
  faceMatch: boolean;
  confidence: number;
  flags: string[];
  rejectionReason: string | null;
}

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly apiKey: string | null;
  private readonly model = 'gemini-2.0-flash';
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || null;
    if (this.apiKey) {
      this.logger.log('Gemini 1.5 Flash KYC verification initialized (free tier: 15 req/min, 1500/day)');
    } else {
      this.logger.warn('GEMINI_API_KEY not set — KYC will fall back to basic image checks');
    }
  }

  async processKyc(cnicFrontBuffer: Buffer, cnicBackBuffer: Buffer, selfieBuffer: Buffer): Promise<KycAiResult> {
    if (!this.apiKey) {
      return this.basicChecks(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
    }

    this.logger.log('Starting KYC verification with Gemini 1.5 Flash');
    return this.processWithGemini(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
  }

  // ─── Gemini 1.5 Flash path ───
  private async processWithGemini(
    cnicFrontBuffer: Buffer,
    cnicBackBuffer: Buffer,
    selfieBuffer: Buffer,
  ): Promise<KycAiResult> {
    const frontB64 = cnicFrontBuffer.toString('base64');
    const backB64 = cnicBackBuffer.toString('base64');
    const selfieB64 = selfieBuffer.toString('base64');

    const frontMime = this.detectMime(cnicFrontBuffer);
    const selfieMime = this.detectMime(selfieBuffer);

    const prompt = `You are a KYC verification AI. You are given 3 images:
1. ID document front (first image)
2. Selfie photo (second image)

Analyze them carefully and respond with ONLY a JSON object (no markdown, no backticks) with these exact fields:

{
  "approved": boolean,          // true if document is valid and face matches
  "hardFail": boolean,          // true if images are clearly invalid (blank, corrupt, not an ID, no face)
  "name": string | null,        // full name extracted from the ID document
  "idNumber": string | null,    // ID/CNIC/passport number from the document
  "expiryDate": string | null,  // expiry date in YYYY-MM-DD format if visible
  "faceMatch": boolean,         // true if the selfie face matches the photo on the ID
  "confidence": number,         // 0.0 to 1.0 — how confident you are
  "flags": string[],            // list of any issues or observations
  "rejectionReason": string | null  // reason if rejected, null if approved
}

Rules:
- If the ID document is not a real identity document (random photo, screenshot, blank), set hardFail=true and approved=false
- If the selfie does not contain a real human face, set hardFail=true and approved=false
- If the face in the selfie does NOT match the face on the ID document, set approved=false and faceMatch=false
- If the document is expired, set approved=false
- If the document is valid, face matches, and everything looks genuine, set approved=true
- confidence should be 0.85+ for clear approvals, 0.6-0.84 for uncertain cases, below 0.6 for hard fails
- Respond with ONLY the JSON, no other text`;

    const body = {
      contents: [{
        parts: [
          { text: prompt },
          { inline_data: { mime_type: frontMime, data: frontB64 } },
          { inline_data: { mime_type: selfieMime, data: selfieB64 } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1024,
      },
    };

    try {
      const url = `${this.endpoint}/${this.model}:generateContent?key=${this.apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errText = await res.text();
        this.logger.error(`Gemini API error ${res.status}: ${errText}`);
        return this.basicChecks(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
      }

      const data = await res.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      this.logger.log(`Gemini response: ${text.substring(0, 300)}`);

      // Parse JSON from response (strip any markdown fences if present)
      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        approved: !!parsed.approved,
        hardFail: !!parsed.hardFail,
        name: parsed.name || null,
        cnicNumber: parsed.idNumber || null,
        expiryDate: parsed.expiryDate || null,
        faceMatch: !!parsed.faceMatch,
        confidence: Number(parsed.confidence) || 0.5,
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        rejectionReason: parsed.rejectionReason || null,
      };
    } catch (err: any) {
      this.logger.error(`Gemini KYC verification failed: ${err.message}`);
      return this.basicChecks(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
    }
  }

  // ─── Fallback: basic image checks without AI ───
  private async basicChecks(
    cnicFrontBuffer: Buffer,
    cnicBackBuffer: Buffer,
    selfieBuffer: Buffer,
  ): Promise<KycAiResult> {
    const flags: string[] = [];

    // File size checks
    const MIN_SIZE = 20_000;
    const MAX_SIZE = 10_000_000;
    for (const [label, buf] of [['ID front', cnicFrontBuffer], ['ID back', cnicBackBuffer], ['Selfie', selfieBuffer]] as [string, Buffer][]) {
      if (buf.length < MIN_SIZE) flags.push(`${label} image is too small (${(buf.length / 1024).toFixed(0)}KB). Minimum 20KB required.`);
      if (buf.length > MAX_SIZE) flags.push(`${label} image is too large (${(buf.length / 1024 / 1024).toFixed(1)}MB). Maximum 10MB allowed.`);
    }

    // Duplicate image detection
    const frontHash = this.quickHash(cnicFrontBuffer);
    const backHash = this.quickHash(cnicBackBuffer);
    const selfieHash = this.quickHash(selfieBuffer);
    if (frontHash === backHash) flags.push('ID front and back appear to be the same image.');
    if (frontHash === selfieHash || backHash === selfieHash) flags.push('Selfie appears to be the same as one of the document photos.');

    // Image header validation
    if (!this.isValidImageHeader(cnicFrontBuffer)) flags.push('ID front is not a valid image file.');
    if (!this.isValidImageHeader(cnicBackBuffer)) flags.push('ID back is not a valid image file.');
    if (!this.isValidImageHeader(selfieBuffer)) flags.push('Selfie is not a valid image file.');

    const hardFail = flags.length > 0;

    return {
      approved: false,
      hardFail,
      name: null,
      cnicNumber: null,
      expiryDate: null,
      faceMatch: false,
      confidence: hardFail ? 0.6 : 0.4,
      flags: flags.length > 0 ? flags : ['GEMINI_API_KEY not configured — manual review required'],
      rejectionReason: hardFail ? flags.join(' ') : null,
    };
  }

  // ─── Helpers ───
  private detectMime(buf: Buffer): string {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    if (buf.length >= 4 && buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46) return 'image/webp';
    return 'image/jpeg';
  }

  private isValidImageHeader(buf: Buffer): boolean {
    if (buf.length < 4) return false;
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return true;
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return true;
    return false;
  }

  private quickHash(buf: Buffer): string {
    let hash = 0;
    const step = Math.max(1, Math.floor(buf.length / 1000));
    for (let i = 0; i < buf.length; i += step) {
      hash = ((hash << 5) - hash + buf[i]) | 0;
    }
    return `${hash}_${buf.length}`;
  }
}
