import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  refreshToken: { type: String },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', userSchema);