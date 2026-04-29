import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  username?: string;
  email: string;
  password?: string;
  role: "student" | "admin";
  image?: string;
  phone?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  category?: string; // SC/ST/OBC/General
  income?: number;
  aadharNumber?: string;
  bankAccount?: string;
  ifscCode?: string;
  documents?: string[];
  appliedScholarships?: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    username: { type: String, sparse: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    role: { type: String, enum: ["student", "admin"], default: "student" },
    image: { type: String },
    phone: { type: String },
    address: { type: String },
    dateOfBirth: { type: String },
    gender: { type: String },
    category: { type: String, enum: ["SC", "ST", "OBC", "General", "EWS"] },
    income: { type: Number },
    aadharNumber: { type: String },
    bankAccount: { type: String },
    ifscCode: { type: String },
    documents: [{ type: String }],
    appliedScholarships: [{ type: Schema.Types.ObjectId, ref: "Scholarship" }],
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model<IUser>("User", UserSchema);