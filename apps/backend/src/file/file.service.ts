import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as AWS from 'aws-sdk';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private s3: AWS.S3 | null = null;
  private bucket: string;
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor(private readonly configService: ConfigService) {
    const endpoint = this.configService.get('R2_ENDPOINT');
    const accessKeyId = this.configService.get('R2_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get('R2_SECRET_ACCESS_KEY');

    const isPlaceholder = (v?: string) =>
      !v || v.startsWith('your-') || v.includes('accountid') || v.includes('example');

    if (endpoint && accessKeyId && secretAccessKey && !isPlaceholder(endpoint) && !isPlaceholder(accessKeyId) && !isPlaceholder(secretAccessKey)) {
      this.s3 = new AWS.S3({
        endpoint,
        accessKeyId,
        secretAccessKey,
        region: 'auto',
        signatureVersion: 'v4',
      });
      this.bucket = this.configService.get('R2_BUCKET') || 'broker-uploads';
    } else {
      this.logger.warn('R2 not configured (or placeholder values); files will be stored locally');
      this.bucket = 'local';
    }
  }

  getSignedUrl(key: string, expires = 3600) {
    if (!this.s3) {
      return `/uploads/${key}`;
    }
    return this.s3.getSignedUrl('getObject', {
      Bucket: this.bucket,
      Key: key,
      Expires: expires,
    });
  }

  async getFileBuffer(key: string): Promise<Buffer | null> {
    if (this.s3) {
      try {
        const res = await this.s3.getObject({ Bucket: this.bucket, Key: key }).promise();
        return res.Body as Buffer;
      } catch (error) {
        this.logger.error(`Failed to fetch ${key} from R2`, error);
        return null;
      }
    }

    const localPath = path.join(this.uploadDir, key);
    if (!fs.existsSync(localPath)) return null;
    return fs.readFileSync(localPath);
  }
}
