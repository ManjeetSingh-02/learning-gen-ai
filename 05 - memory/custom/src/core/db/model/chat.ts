// external-imports
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  { ltm: { type: [String], default: [] } },
  { timestamps: true }
);

export const Chat = mongoose.model('Chat', chatSchema);
