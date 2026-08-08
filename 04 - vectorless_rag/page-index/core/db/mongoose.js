// internal-imports
import { env } from '../config/env.js';

// external-imports
import mongoose from 'mongoose';

// function to connect to the MongoDB database
export async function connectToDatabase() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('Connected to MongoDB database');
}
