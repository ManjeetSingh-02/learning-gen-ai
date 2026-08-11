// external-imports
import mongoose from 'mongoose';

const ltmSchema = new mongoose.Schema(
  {
    userID: { type: String, required: true },
    facts: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const LTM = mongoose.model('LTM', ltmSchema);
