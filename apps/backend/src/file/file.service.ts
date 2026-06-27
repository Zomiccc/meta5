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
      this.bucket = this.configService.get('R2_BUCKET') || 'broker-kyc';
    } else {
      this.logger.warn('R2 not configured (or placeholder values); files will be stored locally');
      this.bucket = 'local';
    }
  }

  async uploadKycImage(file: Express.Multer.File, userId: string, type: string) {
    if (!file.mimetype.match(/image\/(jpeg|png)/)) {
      throw new BadRequestException('Only JPG and PNG images are allowed');
    }
    if (file.size > 5 * 1024 * 1024) {
      throw new BadRequestException('Max file size is 5MB');
    }

    const key = `kyc/${userId}/${type}-${Date.now()}.${file.mimetype.split('/')[1]}`;

    if (this.s3) {
      try {
        await this.s3
          .putObject({
            Bucket: this.bucket,
            Key: key,
            Body: file.buffer,
            ContentType: file.mimetype,
          })
          .promise();
        return { key, url: this.getSignedUrl(key) };
      } catch (error) {
        this.logger.warn(`R2 upload failed (${(error as Error).message}); storing locally`);
      }
    }

    const localPath = path.join(this.uploadDir, key);
    fs.mkdirSync(path.dirname(localPath), { recursive: true });
    fs.writeFileSync(localPath, file.buffer);
    return { key, url: `/uploads/${key}` };
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
}
