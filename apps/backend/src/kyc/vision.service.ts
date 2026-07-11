import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface KycAiResult {
  approved: boolean;
  hardFail: boolean;
  name: string | null;
  idNumber: string | null;
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
  private readonly model = 'gemini-1.5-flash-latest';
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1beta/models';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('GEMINI_API_KEY') || null;
    if (this.apiKey) {
      this.logger.log('Gemini 1.5 Flash KYC verification ready');
    } else {
      this.logger.warn('GEMINI_API_KEY not set — KYC verification will fail');
    }
  }

  async verifyKyc(frontBuf: Buffer, selfieBuf: Buffer): Promise<KycAiResult> {
    if (!this.apiKey) {
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['GEMINI_API_KEY not configured'],
        rejectionReason: 'Server not configured for KYC verification',
      };
    }

    const frontB64 = frontBuf.toString('base64');
    const selfieB64 = selfieBuf.toString('base64');
    const frontMime = this.detectMime(frontBuf);
    const selfieMime = this.detectMime(selfieBuf);

    const prompt = `You are a KYC verification officer. You are given 2 images:
1. ID document front (first image)
2. Selfie photo (second image)

Analyze them carefully and respond with ONLY a JSON object (no markdown, no backticks) with these exact fields:

{
  "approved": boolean,
  "hardFail": boolean,
  "name": string | null,
  "idNumber": string | null,
  "expiryDate": string | null,
  "faceMatch": boolean,
  "confidence": number,
  "flags": string[],
  "rejectionReason": string | null
}

Rules:
- If the ID document is not a real identity document (random photo, screenshot, blank image, drawing), set hardFail=true, approved=false
- If the selfie does not contain a real human face, set hardFail=true, approved=false
- If the face in the selfie does NOT match the face on the ID document, set approved=false, faceMatch=false
- If the document is expired, set approved=false
- If the document is valid, the face matches, and everything looks genuine, set approved=true, faceMatch=true
- confidence: 0.85+ for clear approvals, 0.6-0.84 for uncertain, below 0.6 for hard fails
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
      let res: Response | null = null;
      let lastErr = '';
      for (let attempt = 1; attempt <= 2; attempt++) {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(20000),
        });
        if (res.ok) break;
        lastErr = await res.text();
        if (res.status === 429) {
          this.logger.warn(`Gemini API rate limited (429), attempt ${attempt}/2. Retrying in 15s...`);
          await new Promise((resolve) => setTimeout(resolve, 15000));
          continue;
        }
        break;
      }

      if (!res || !res.ok) {
        this.logger.error(`Gemini API error ${res?.status || 'unknown'}: ${lastErr}`);
        const isQuota = lastErr.includes('RESOURCE_EXHAUSTED') || lastErr.includes('quota') || lastErr.includes('429');
        return {
          approved: false,
          hardFail: false,
          name: null,
          idNumber: null,
          expiryDate: null,
          faceMatch: false,
          confidence: 0,
          flags: [`Gemini API error: ${res?.status || 'unknown'}${isQuota ? ' (quota exhausted)' : ''}`],
          rejectionReason: isQuota
            ? 'AI verification quota exhausted. Please check your Gemini billing/plan or try again later.'
            : 'Verification service temporarily unavailable',
        };
      }

      const data = await res.json() as any;
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      this.logger.log(`Gemini response: ${text.substring(0, 500)}`);

      const jsonStr = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(jsonStr);

      return {
        approved: !!parsed.approved,
        hardFail: !!parsed.hardFail,
        name: parsed.name || null,
        idNumber: parsed.idNumber || null,
        expiryDate: parsed.expiryDate || null,
        faceMatch: !!parsed.faceMatch,
        confidence: Number(parsed.confidence) || 0.5,
        flags: Array.isArray(parsed.flags) ? parsed.flags : [],
        rejectionReason: parsed.rejectionReason || null,
      };
    } catch (err: any) {
      this.logger.error(`Gemini KYC failed: ${err.message}`);
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: [`Error: ${err.message}`],
        rejectionReason: 'Verification failed due to a server error',
      };
    }
  }

  private detectMime(buf: Buffer): string {
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'image/jpeg';
    if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) return 'image/png';
    return 'image/jpeg';
  }
}
