import cron from "node-cron";
import Appointment from "../models/Appointment";

const getISTDate = (): Date => {
  const now = new Date();

  const istDate = new Date(now.getTime() + (5 * 60 + 30) * 60 * 1000);

  istDate.setHours(0, 0, 0, 0);

  return istDate;
};

// Function to initialize slots for a specific date
export const initializeSlotsForDate = async (date: Date): Promise<void> => {
  try {
    const timeSlots = [
      "9AM-10AM",
      "10AM-11AM",
      "11AM-12PM",
      "12PM-1PM",
      "1PM-2PM",
      "2PM-3PM",
      "3PM-4PM",
      "4PM-5PM",
    ];

    // Create start of day for the target date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    // Create end of day for the target date
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Check if slots already exist for this date range
    const existingSlots = await Appointment.find({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    });

    if (existingSlots.length > 0) {
      console.log(
        `Time slots for ${startOfDay.toISOString().split("T")[0]} already exist`
      );
      return;
    }

    // Create slots with the correct date
    const slots = timeSlots.map((slot) => ({
      timeSlot: slot,
      date: new Date(startOfDay), // Create new date instance for each slot
      isBooked: false,
      user: null,
    }));

    await Appointment.insertMany(slots);
    console.log(
      `Successfully initialized slots for ${
        startOfDay.toISOString().split("T")[0]
      }`
    );
  } catch (error) {
    console.error("Error initializing slots:", error);
  }
};

// cron job to run at midnight IST (6:30 PM UTC)
export const setupDailySlotInitialization = (): void => {
  // Run at 6:30 PM UTC (midnight IST)
  cron.schedule("30 18 * * *", async () => {
    const tomorrow = getISTDate();
    tomorrow.setDate(tomorrow.getDate() + 1); // Create slots for tomorrow
    await initializeSlotsForDate(tomorrow);
    console.log("Scheduled slots created for tomorrow");
  });

  // Initialize slots for today when server starts
  const today = getISTDate();
  initializeSlotsForDate(today);

  console.log("Daily slot initialization scheduled");
};
