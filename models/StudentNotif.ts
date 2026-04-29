import mongoose, { Schema, Document } from "mongoose";

export interface IStudentNotif extends Document {
  studentEmail: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "urgent";
  read: boolean;
  createdAt: Date;
}

const StudentNotifSchema = new Schema<IStudentNotif>(
  {
    studentEmail: { type: String, required: true },
    title:        { type: String, required: true },
    message:      { type: String, required: true },
    type:         { type: String, enum: ["info","success","warning","urgent"], default: "info" },
    read:         { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.models.StudentNotif ||
  mongoose.model<IStudentNotif>("StudentNotif", StudentNotifSchema);
