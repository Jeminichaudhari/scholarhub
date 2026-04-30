import mongoose, { Schema, Document } from "mongoose";

export interface IAdminAlert extends Document {
  scholarshipId:   string;
  scholarshipTitle: string;
  sourceUrl:       string;
  field:           string;       // e.g. "deadline", "amount", "status"
  oldValue:        string;
  newValue:        string;
  suggestedAction: string;
  priority:        "urgent" | "high" | "medium" | "low";
  status:          "pending" | "dismissed" | "applied";
  isWarning:       boolean;      // true = source unreachable
  warningMessage?: string;
  createdAt:       Date;
  updatedAt:       Date;
}

const AdminAlertSchema = new Schema<IAdminAlert>(
  {
    scholarshipId:    { type: String, required: true },
    scholarshipTitle: { type: String, required: true },
    sourceUrl:        { type: String, required: true },
    field:            { type: String, required: true },
    oldValue:         { type: String, default: "" },
    newValue:         { type: String, default: "" },
    suggestedAction:  { type: String, default: "" },
    priority:         { type: String, enum: ["urgent", "high", "medium", "low"], default: "medium" },
    status:           { type: String, enum: ["pending", "dismissed", "applied"], default: "pending" },
    isWarning:        { type: Boolean, default: false },
    warningMessage:   { type: String },
  },
  { timestamps: true }
);

// Prevent duplicate alerts for same scholarship + field + newValue
AdminAlertSchema.index(
  { scholarshipId: 1, field: 1, newValue: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

export default mongoose.models.AdminAlert ||
  mongoose.model<IAdminAlert>("AdminAlert", AdminAlertSchema);
