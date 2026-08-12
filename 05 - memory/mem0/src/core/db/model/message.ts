// internal-imports
import { Role } from '../../config/role.js';

// external-imports
import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatID: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
    role: { type: String, enum: Object.values(Role), required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);
