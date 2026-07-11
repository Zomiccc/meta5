import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

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
  private genAI: GoogleGenerativeAI;

  constructor(private config: ConfigService) {
    const apiKey = this.config.get<string>('GEMINI_API_KEY');
    if (apiKey) {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.logger.log('Gemini Vision API configured');
    } else {
      this.logger.warn('GEMINI_API_KEY not set — falling back to local checks');
    }
  }

  async analyzeKycDocuments(
    cnicFrontBuffer: Buffer,
    cnicBackBuffer: Buffer,
    selfieBuffer: Buffer,
  ): Promise<KycAiResult> {
    if (!this.genAI) {
      return this.localFallback(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
    }

    try {
      const model = this.genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });

      const result = await model.generateContent([
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cnicFrontBuffer.toString('base64'),
          },
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: cnicBackBuffer.toString('base64'),
          },
        },
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: selfieBuffer.toString('base64'),
          },
        },
        {
          text: `You are a KYC verification system for a Pakistani forex broker platform.
          
          You have been given 3 images:
          - Image 1: CNIC front side
          - Image 2: CNIC back side  
          - Image 3: Selfie of person
          
          Please analyze and verify:
          1. Is Image 1 a valid Pakistani CNIC front? (check for NADRA logo, format, Pakistan flag)
          2. Is Image 2 a valid Pakistani CNIC back?
          3. Is Image 3 a real clear selfie of a person?
          4. Does the face in the selfie match the face photo on the CNIC front?
          5. Extract the full name from CNIC
          6. Extract the 13-digit CNIC number
          7. Extract the expiry date - is the CNIC expired?
          8. Is the image quality good enough to verify?
          
          Reject if:
          - Not a real Pakistani CNIC
          - Face does not match between selfie and CNIC
          - CNIC is expired
          - Images are too blurry or dark
          - Same image uploaded multiple times
          - Blank or invalid images
          
          Respond ONLY with valid JSON, no extra text, no markdown:
          {
            "approved": true,
            "name": "Muhammad Ahmed",
            "cnicNumber": "3520212345678",
            "expiryDate": "2028-12-31",
            "faceMatch": true,
            "confidence": 0.95,
            "rejectionReason": null
          }
          
          If rejecting:
          {
            "approved": false,
            "name": null,
            "cnicNumber": null,
            "expiryDate": null,
            "faceMatch": false,
            "confidence": 0.3,
            "rejectionReason": "Face in selfie does not match CNIC photo"
          }`
        },
      ]);

      const text = result.response.text();
      const clean = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(clean);
      this.logger.log(`Gemini KYC result: ${JSON.stringify(parsed)}`);

      return {
        approved: !!parsed.approved,
        hardFail: false,
        name: parsed.name || null,
        idNumber: parsed.cnicNumber || null,
        expiryDate: parsed.expiryDate || null,
        faceMatch: !!parsed.faceMatch,
        confidence: Number(parsed.confidence) || 0.5,
        flags: parsed.rejectionReason ? [parsed.rejectionReason] : [],
        rejectionReason: parsed.rejectionReason || null,
      };

    } catch (error: any) {
      this.logger.error(`Gemini Vision error: ${error.message}`);
      return this.localFallback(cnicFrontBuffer, cnicBackBuffer, selfieBuffer);
    }
  }

  private localFallback(front: Buffer, back: Buffer, selfie: Buffer): KycAiResult {
    this.logger.warn('Using local fallback checks');
    
    const minSize = 20000;
    if (front.length < minSize) {
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['CNIC front image quality too low'],
        rejectionReason: 'CNIC front image quality too low. Please upload a clear photo.',
      };
    }
    if (back.length < minSize) {
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['CNIC back image quality too low'],
        rejectionReason: 'CNIC back image quality too low. Please upload a clear photo.',
      };
    }
    if (selfie.length < minSize) {
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['Selfie image quality too low'],
        rejectionReason: 'Selfie image quality too low. Please take a clear selfie.',
      };
    }

    const frontHash = front.slice(0, 100).toString('hex');
    const backHash = back.slice(0, 100).toString('hex');
    const selfieHash = selfie.slice(0, 100).toString('hex');

    if (frontHash === backHash || frontHash === selfieHash || backHash === selfieHash) {
      return {
        approved: false,
        hardFail: false,
        name: null,
        idNumber: null,
        expiryDate: null,
        faceMatch: false,
        confidence: 0,
        flags: ['Duplicate images detected'],
        rejectionReason: 'Duplicate images detected. Please upload different photos for each field.',
      };
    }

    return {
      approved: true,
      hardFail: false,
      name: null,
      idNumber: null,
      expiryDate: null,
      faceMatch: true,
      confidence: 0.7,
      flags: ['local-fallback-auto-approved'],
      rejectionReason: null,
    };
  }
}
