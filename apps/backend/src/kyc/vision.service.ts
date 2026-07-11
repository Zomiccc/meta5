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
  private readonly openRouterKey: string | null;
  private readonly openRouterModel: string;
  private readonly autoApproveOnQuota: boolean;
  private readonly endpoint = 'https://generativelanguage.googleapis.com/v1/models';

  constructor(private readonly configService: ConfigService) {
    this.geminiKey = this.configService.get<string>('GEMINI_API_KEY') || null;
    this.geminiModel = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.0-flash';
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY') || null;
    this.openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
    this.openRouterKey = this.configService.get<string>('OPENROUTER_API_KEY') || null;
    this.openRouterModel = this.configService.get<string>('OPENROUTER_MODEL') || 'qwen/qwen2.5-vl-32b-instruct:free,meta-llama/llama-3.2-11b-vision-instruct:free,google/gemma-3-12b-it:free';
    this.autoApproveOnQuota = this.configService.get<string>('AUTO_APPROVE_KYC_ON_QUOTA') === 'true';
    if (this.openai) this.logger.log('OpenAI GPT-4o Vision KYC verifier ready');
    if (this.openRouterKey) this.logger.log(`OpenRouter KYC verifier ready (model: ${this.openRouterModel})`);
    if (this.geminiKey) this.logger.log(`Gemini KYC using model: ${this.geminiModel}`);
    if (!this.openai && !this.openRouterKey && !this.geminiKey) {
      this.logger.warn('No KYC AI key configured (OPENAI_API_KEY, OPENROUTER_API_KEY, or GEMINI_API_KEY)');
    }
    if (this.autoApproveOnQuota) {
      this.logger.warn('AUTO_APPROVE_KYC_ON_QUOTA=true — KYC will auto-approve if all AI providers fail');
    }
  }

  async verifyKyc(frontBuf: Buffer, selfieBuf: Buffer): Promise<KycAiResult> {
    if (this.openRouterKey) {
      const res = await this.verifyWithOpenRouter(frontBuf, selfieBuf);
      if (!this.isQuotaError(res)) return res;
    }
    if (this.openai) {
      const res = await this.verifyWithOpenAI(frontBuf, selfieBuf);
      if (!this.isQuotaError(res)) return res;
    }
    if (this.geminiKey) {
      const res = await this.verifyWithGemini(frontBuf, selfieBuf);
      if (!this.isQuotaError(res)) return res;
    }
    if (this.autoApproveOnQuota) {
      this.logger.warn('All AI KYC providers failed/quota exhausted. Auto-approving due to AUTO_APPROVE_KYC_ON_QUOTA=true');
      return {
        approved: true,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: true,
        confidence: 0.5,
        flags: ['auto-approved-after-ai-quota-failure'],
        rejectionReason: null,
      };
    }
    return {
      approved: false,
      hardFail: false,
      name: null,
      idNumber: null,
      expiryDate: null,
      faceMatch: false,
      confidence: 0,
      flags: ['All AI KYC providers failed or quota exhausted'],
      rejectionReason: 'AI verification quota exhausted. Please check your billing/plan or try again later.',
    };
  }

  private isQuotaError(res: KycAiResult): boolean {
    return res.flags.some((f) =>
      f.toLowerCase().includes('quota') ||
      f.toLowerCase().includes('429') ||
      f.toLowerCase().includes('rate limit') ||
      f.toLowerCase().includes('billing') ||
      f.toLowerCase().includes('exhausted'),
    );
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

  private async verifyWithOpenRouter(frontBuf: Buffer, selfieBuf: Buffer): Promise<KycAiResult> {
    if (!this.openRouterKey) {
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['OPENROUTER_API_KEY not configured'],
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

    const models = this.openRouterModel.split(',').map((m) => m.trim()).filter(Boolean);
    let lastErr = 'No models configured';

    for (const model of models) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': 'https://meta5.example.com',
            'X-Title': 'Meta5 KYC',
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            temperature: 0.1,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  { type: 'image_url', image_url: { url: `data:${frontMime};base64,${frontB64}` } },
                  { type: 'image_url', image_url: { url: `data:${selfieMime};base64,${selfieB64}` } },
                ],
              },
            ],
          }),
          signal: AbortSignal.timeout(45000),
        });

        if (!res.ok) {
          const errText = await res.text();
          lastErr = `OpenRouter ${model}: HTTP ${res.status} ${errText}`;
          this.logger.warn(lastErr);
          const isQuota = errText.toLowerCase().includes('quota') || errText.toLowerCase().includes('rate limit') || res.status === 429;
          if (isQuota) {
            return {
              approved: false,
              hardFail: false,
              name: null,
              idNumber: null,
              expiryDate: null,
              faceMatch: false,
              confidence: 0,
              flags: [`OpenRouter quota/rate limit: ${res.status}`],
              rejectionReason: 'AI verification quota exhausted. Please check your OpenRouter plan or try again later.',
            };
          }
          continue;
        }

        const data = await res.json() as any;
        const text = data?.choices?.[0]?.message?.content || '';
        if (!text) {
          lastErr = `OpenRouter ${model}: empty response`;
          this.logger.warn(lastErr);
          continue;
        }
        this.logger.log(`OpenRouter ${model} response: ${text.substring(0, 500)}`);
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
        lastErr = `OpenRouter ${model}: ${err.message}`;
        this.logger.warn(lastErr);
        continue;
      }
    }

    return {
      approved: false,
      hardFail: false,
      name: null,
      idNumber: null,
      expiryDate: null,
      faceMatch: false,
      confidence: 0,
      flags: [`OpenRouter error: ${lastErr}`],
      rejectionReason: 'Verification service temporarily unavailable',
    };
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
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(45000),
      });
      const lastErr = res.ok ? '' : await res.text();

      if (!res.ok) {
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
