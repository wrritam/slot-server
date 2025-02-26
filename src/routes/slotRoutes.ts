import express from "express";
import {
  getAppointments,
  getAppointmentById,
  createAppointment,
  updateAppointment,
  clearAppointment,
} from "../controllers/slotControllers";
import { setupDailySlotInitialization } from "../utils/slotInitializer";

const router = express.Router();

// Initialize the daily slots
setupDailySlotInitialization();

// get all the appointments
router.get("/", getAppointments);
//get one by id
router.get("/:id", getAppointmentById);
// make an appointment
router.post("/", createAppointment);
// update an appointment
router.put("/:id", updateAppointment);
// clear an appointment
router.delete("/:id", clearAppointment);

export default router;
