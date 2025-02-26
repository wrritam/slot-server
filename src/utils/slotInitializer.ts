import cron from "node-cron";
import Appointment from "../models/Appointment";

// Function to initialize slots for a specific date
export const initializeSlotsForDate = async (date: Date): Promise<void> => {
  try {
    const timeSlots = [
      "9AM",
      "10AM",
      "11AM",
      "12PM",
      "1PM",
      "2PM",
      "3PM",
      "4PM",
    ];
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

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

// Setup cron job to run at midnight every day
export const setupDailySlotInitialization = (): void => {
  // '0 0 * * *' = Run at midnight every day
  cron.schedule("0 0 * * *", async () => {
    const today = new Date();
    await initializeSlotsForDate(today);
  });

  // Also initialize slots for today when server starts
  const today = new Date();
  initializeSlotsForDate(today);

  console.log("Daily slot initialization scheduled");
};
