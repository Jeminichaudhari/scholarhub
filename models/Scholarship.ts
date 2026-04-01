import mongoose, { Schema, Document } from "mongoose";

export interface IScholarship extends Document {
  title: string;
  description: string;
  amount: number;
  eligibility: string;
  category: string[];
  minIncome?: number;
  maxIncome?: number;
  deadline: Date;
  applyLink?: string;
  isActive: boolean;
  applicants: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
}

const ScholarshipSchema = new Schema<IScholarship>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    eligibility: { type: String, required: true },
    category: [{ type: String }],
    minIncome: { type: Number },
    maxIncome: { type: Number },
    deadline: { type: Date, required: true },
    applyLink: { type: String },
    isActive: { type: Boolean, default: true },
    applicants: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.models.Scholarship ||
  mongoose.model<IScholarship>("Scholarship", ScholarshipSchema);