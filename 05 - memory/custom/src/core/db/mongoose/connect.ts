// external-imports
import mongoose from 'mongoose';

// function to connect to the MongoDB database
export function connectToDatabase() {
  return mongoose.connect(process.env.DATABASE_URL!);
}
