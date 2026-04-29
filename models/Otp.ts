import mongoose, { Schema, Document } from "mongoose";

export interface IOtp extends Document {
  email: string;
  otp: string;
  expiresAt: Date;
}

const OtpSchema = new Schema<IOtp>({
  email:     { type: String, required: true },
  otp:       { type: String, required: true },
  expiresAt: { type: Date,   required: true, index: { expires: 0 } }, // auto-delete after expiry
});

export default mongoose.models.Otp || mongoose.model<IOtp>("Otp", OtpSchema);
