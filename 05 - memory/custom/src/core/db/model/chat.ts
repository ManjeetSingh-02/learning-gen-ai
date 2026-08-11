// external-imports
import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  { userID: { type: String, required: true } },
  { timestamps: true }
);

export const Chat = mongoose.model('Chat', chatSchema);
