import mongoose, { Document, Schema } from "mongoose";
import { IUser } from "./User";

export interface IAppointment extends Document {
  timeSlot: string;
  date: Date;
  user: IUser["_id"] | null;
  isBooked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
// test test

const appointmentSchema = new Schema(
  {
    timeSlot: {
      type: String,
      required: [true, "Time slot is required"],
      enum: ["9AM", "10AM", "11AM", "12PM", "1PM", "2PM", "3PM", "4PM"],
      trim: true,
    },
    date: {
      type: Date,
      required: [true, "Date is required"],
      default: Date.now,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isBooked: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound index on timeSlot and date to ensure uniqueness
appointmentSchema.index({ timeSlot: 1, date: 1 }, { unique: true });

export default mongoose.model<IAppointment>("Appointment", appointmentSchema);
