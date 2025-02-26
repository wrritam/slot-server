import cron from "node-cron";
import Appointment from "../models/Appointment";

// Function to get today's date in IST with time set to 00:00:00
const getISTDate = (): Date => {
  const now = new Date();
  now.setUTCHours(now.getUTCHours() + 5, now.getUTCMinutes() + 30, 0, 0);
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

// Function to initialize slots for a specific date
export const initializeSlotsForDate = async (date: Date): Promise<void> => {
  try {
    const timeSlots = [
      "9AM-10AM",
      "10AM-11AM",
      "11AM-12AM",
      "12PM-1PM",
      "1PM-2PM",
      "2PM-3PM",
      "3PM-4PM",
      "4PM-5PM",
    ];

    // Set targetDate to midnight IST
    const targetDate = new Date(date);
    targetDate.setUTCHours(0, 0, 0, 0);

    // Check if slots already exist
    const existingSlots = await Appointment.find({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000),
      },
    });

    if (existingSlots.length > 0) {
      console.log(
        `Time slots for ${targetDate.toISOString().split("T")[0]} already exist`
      );
      return;
    }

    // Create slots
    const slots = timeSlots.map((slot) => ({
      timeSlot: slot,
      date: targetDate,
      isBooked: false,
      user: null,
    }));

    await Appointment.insertMany(slots);
    console.log(
      `Successfully initialized slots for ${
        targetDate.toISOString().split("T")[0]
      }`
    );
  } catch (error) {
    console.error("Error initializing slots:", error);
  }
};

// cron job logic to run at midnight IST every day
export const setupDailySlotInitialization = (): void => {
  cron.schedule("0 18 * * *", async () => {
    const today = getISTDate();
    await initializeSlotsForDate(today);
  });

  // Initialize slots for the day when the server starts
  const today = getISTDate();
  initializeSlotsForDate(today);

  console.log("Daily slot initialization scheduled");
};
