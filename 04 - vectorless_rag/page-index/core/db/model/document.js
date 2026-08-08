// external-imports
import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true, trim: true },
    pageIndexDocId: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);
