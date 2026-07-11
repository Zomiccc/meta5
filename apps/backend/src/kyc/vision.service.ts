import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

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
  private readonly geminiKey: string | null;
  private readonly geminiModel: string;
  private readonly openai: OpenAI | null;
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1/models';

  constructor(private readonly configService: ConfigService) {
    this.geminiKey = this.configService.get<string>('GEMINI_API_KEY') || null;
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY') || null;
    this.openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
    if (this.openai) {
      this.logger.log('OpenAI GPT-4o Vision KYC verifier ready');
    } else if (this.geminiKey) {
      this.logger.log(`Gemini KYC using model: ${this.geminiModel}`);
    } else {
      this.logger.warn('No KYC AI key configured (OPENAI_API_KEY or GEMINI_API_KEY)');
    }
  }

  async verifyKyc(frontBuf: Buffer, selfieBuf: Buffer): Promise<KycAiResult> {
    if (this.openai) {
      return this.verifyWithOpenAI(frontBuf, selfieBuf);
    }
    if (this.geminiKey) {
      return this.verifyWithGemini(frontBuf, selfieBuf);
    }
    return {
      approved: false,
      hardFail: false,
      name: null,
      idNumber: null,
      expiryDate: null,
      faceMatch: false,
      confidence: 0,
      flags: ['No KYC AI key configured'],
      rejectionReason: 'Server not configured for KYC verification',
    };
  }

  private async verifyWithOpenAI(frontBuf: Buffer, selfieBuf: Buffer): Promise<KycAiResult> {
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

    try {
      const res = await this.openai!.chat.completions.create({
        model: 'gpt-4o',
        max_tokens: 1024,
        temperature: 0.1,
        messages: [
          { role: 'user', content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: `data:${frontMime};base64,${frontB64}` } },
            { type: 'image_url', image_url: { url: `data:${selfieMime};base64,${selfieB64}` } },
          ]},
        ],
      });

      const text = res.choices[0]?.message?.content || '';
      this.logger.log(`OpenAI response: ${text.substring(0, 500)}`);
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
      this.logger.error(`OpenAI KYC failed: ${err.message}`);
      if (this.geminiKey) {
        this.logger.log('Falling back to Gemini after OpenAI failure');
        return this.verifyWithGemini(frontBuf, selfieBuf);
      }
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: [`OpenAI error: ${err.message}`],
        rejectionReason: 'Verification service temporarily unavailable',
      };
    }
  }

  private async verifyWithGemini(frontBuf: Buffer, selfieBuf: Buffer): Promise<KycAiResult> {
    if (!this.geminiKey) {
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
      const url = `${this.endpoint}/${this.geminiModel}:generateContent?key=${this.geminiKey}`;
      let res: Response | null = null;
      let lastErr = '';
      for (let attempt = 1; attempt <= 2; attempt++) {
        res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(45000),
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
