import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<boolean> => {
  if (isConnected) return true;

  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/blog';
    await mongoose.connect(uri);
    isConnected = true;
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    isConnected = false;
    return false;
  }
};

export const getConnectionStatus = (): boolean => isConnected;

export const disconnectDB = async (): Promise<void> => {
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('MongoDB disconnect error:', error);
  }
};
