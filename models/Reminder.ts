import mongoose, { Schema, Document } from "mongoose";

export interface IReminderDate {
  date:       string; // ISO date string "2026-04-16"
  hour:       number;
  minute:     number;
  sent:       boolean;
}

export interface IReminder extends Document {
  studentEmail:     string;
  studentName:      string;
  scholarshipId:    string;
  scholarshipTitle: string;
  applyLink:        string;
  deadline:         Date;
  // Each selected reminder date with its own time + sent flag
  reminderDates:    IReminderDate[];
  // Legacy fields kept for backward compat
  reminderDays:     number[];
  sentDays:         number[];
  reminderHour:     number;
  reminderMinute:   number;
  createdAt:        Date;
}

const ReminderDateSchema = new Schema<IReminderDate>({
  date:   { type: String, required: true },
  hour:   { type: Number, default: 9 },
  minute: { type: Number, default: 0 },
  sent:   { type: Boolean, default: false },
}, { _id: false });

const ReminderSchema = new Schema<IReminder>(
  {
    studentEmail:     { type: String, required: true },
    studentName:      { type: String, required: true },
    scholarshipId:    { type: String, required: true },
    scholarshipTitle: { type: String, required: true },
    applyLink:        { type: String, default: "" },
    deadline:         { type: Date, required: true },
    reminderDates:    { type: [ReminderDateSchema], default: [] },
    // Legacy
    reminderDays:     { type: [Number], default: [] },
    sentDays:         { type: [Number], default: [] },
    reminderHour:     { type: Number, default: 9 },
    reminderMinute:   { type: Number, default: 0 },
  },
  { timestamps: true }
);

ReminderSchema.index({ studentEmail: 1, scholarshipId: 1 }, { unique: true });

export default mongoose.models.Reminder || mongoose.model<IReminder>("Reminder", ReminderSchema);
