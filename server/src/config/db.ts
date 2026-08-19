import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(uri = env.MONGODB_URI): Promise<typeof mongoose> {
  mongoose.set('strictQuery', true);
  if (env.NODE_ENV === 'development') {
    dns.setServers(['1.1.1.1', '8.8.8.8']);
  }
  await mongoose.connect(uri);
  return mongoose;
}

export async function disconnectDb(): Promise<void> {
  await mongoose.disconnect();
}
