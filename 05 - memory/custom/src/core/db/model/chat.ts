// internal-imports
import { Role } from '../../config/role.js';

// external-imports
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: Object.values(Role), required: true, trim: true, lowercase: true },
    content: { type: String, required: true, trim: true },
  },
  { _id: false, timestamps: false }
);

const chatSchema = new mongoose.Schema(
  {
    createdBy: { type: String, required: true, trim: true, lowercase: true },
    messages: { type: [messageSchema], required: true },
  },
  { timestamps: true }
);

export const Chat = mongoose.model('Chat', chatSchema);
