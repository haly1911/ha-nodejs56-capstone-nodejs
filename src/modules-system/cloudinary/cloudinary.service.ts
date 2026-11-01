import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({ secure: true });
  }

  uploadImage(fileBuffer: Buffer, folder: string) {
    return new Promise<UploadApiResponse>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error || !result) {
            return reject(new Error(error?.message ?? 'Upload failed'));
          }
          resolve(result);
        },
      );
      stream.end(fileBuffer);
    });
  }

  async deleteImage(publicId?: string | null) {
    if (!publicId) return;
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error('Failed to delete image on Cloudinary:', error);
    }
  }
}
