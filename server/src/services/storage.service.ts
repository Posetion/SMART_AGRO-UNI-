import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.js';

type GridFSBucket = InstanceType<typeof mongoose.mongo.GridFSBucket>;

let bucket: GridFSBucket | null = null;

function getBucket(): GridFSBucket {
  if (!bucket) {
    if (!mongoose.connection.db) {
      throw new AppError('Database not connected', 500);
    }
    bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads',
    });
  }
  return bucket;
}

export async function uploadBuffer(
  buffer: Buffer,
  filename: string,
  contentType: string
): Promise<string> {
  const b = getBucket();
  return new Promise((resolve, reject) => {
    const uploadStream = b.openUploadStream(filename, {
      contentType,
      metadata: { uploadedAt: new Date() },
    });
    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      resolve(`/api/v1/files/${uploadStream.id.toString()}`);
    });
    uploadStream.end(buffer);
  });
}

export async function openDownloadStream(id: string) {
  const b = getBucket();
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new AppError('Invalid file id', 400);
  }
  return b.openDownloadStream(new mongoose.Types.ObjectId(id));
}
