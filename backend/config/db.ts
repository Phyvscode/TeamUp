import mongoose from 'mongoose';

const connectDB = async (): Promise<void> => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI is not defined in environment variables.');

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 10000,
    });

    console.log(`MongoDB connected → ${conn.connection.host}`);

    mongoose.connection.on('disconnected', () =>
      console.warn(' MongoDB disconnected — retrying...')
    );
    mongoose.connection.on('reconnected', () =>
      console.log('MongoDB reconnected')
    );
  } catch (err) {
    console.error('MongoDB connection failed:', (err as Error).message);
    process.exit(1);
  }
};

export default connectDB;