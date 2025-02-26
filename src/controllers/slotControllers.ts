import { Request, Response } from "express";
import Appointment, { IAppointment } from "../models/Appointment";
import User from "../models/User";
import mongoose from "mongoose";

// Get all appointments
export const getAppointments = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { date } = req.query;
    let query = {};

    // If date is provided, filter by date
    if (date) {
      const startDate = new Date(date as string);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date as string);
      endDate.setHours(23, 59, 59, 999);

      query = {
        date: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      query = {
        date: {
          $gte: today,
          $lt: tomorrow,
        },
      };
    }

    const appointments = await Appointment.find(query).populate(
      "user",
      "firstName lastName phone"
    );
    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

//Get single appointment by ID
export const getAppointmentById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate(
      "user",
      "firstName lastName phone"
    );
    if (!appointment) {
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }
    res.status(200).json(appointment);
  } catch (error) {
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

//Create/book an appointment
export const createAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { timeSlot, date, firstName, lastName, phone } = req.body;

    if (!timeSlot || !firstName || !lastName || !phone) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: timeSlot, firstName, lastName, phone",
      });
      return;
    }

    const appointmentDate = date ? new Date(date) : new Date();

    // Find the appointment slot
    const appointmentSlot = await Appointment.findOne({
      timeSlot,
      date: {
        $gte: new Date(appointmentDate.setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(appointmentDate).setHours(23, 59, 59, 999)),
      },
    }).session(session);

    if (!appointmentSlot) {
      await session.abortTransaction();
      session.endSession();
      res.status(404).json({
        success: false,
        message: "Appointment slot not found",
      });
      return;
    }

    // Check if slot is already booked
    if (appointmentSlot.isBooked) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message: "This time slot is already booked",
      });
      return;
    }

    // Create a new user
    const user = await User.create(
      [
        {
          firstName,
          lastName,
          phone,
        },
      ],
      { session }
    );

    // Update the appointment
    appointmentSlot.isBooked = true;
    appointmentSlot.user = user[0]._id;

    await appointmentSlot.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate the user data for response
    const populatedAppointment = await Appointment.findById(
      appointmentSlot._id
    ).populate("user");

    res.status(201).json({
      success: true,
      data: populatedAppointment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

//Update an appointment
export const updateAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { firstName, lastName, phone } = req.body;

    if (!firstName || !lastName || !phone) {
      await session.abortTransaction();
      session.endSession();
      res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: firstName, lastName, phone",
      });
      return;
    }

    const appointment = await Appointment.findById(req.params.id).session(
      session
    );
    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }

    // Update user information or create new user
    if (appointment.user) {
      // Find and update existing user
      const existingUser = await User.findByIdAndUpdate(
        appointment.user,
        {
          firstName,
          lastName,
          phone,
        },
        { new: true, session }
      );

      if (!existingUser) {
        // If user reference exists but user doesn't, create a new one

        const newUser = await User.create(
          [
            {
              firstName,
              lastName,
              phone,
            },
          ],
          { session }
        );

        appointment.user = newUser[0]._id;
        await appointment.save({ session });
      }
    } else {
      // Create a new user
      const newUser = await User.create(
        [
          {
            firstName,
            lastName,
            phone,
          },
        ],
        { session }
      );

      appointment.user = newUser[0]._id;
      appointment.isBooked = true;
      await appointment.save({ session });
    }

    await session.commitTransaction();
    session.endSession();

    const updatedAppointment = await Appointment.findById(
      req.params.id
    ).populate("user");

    res.status(200).json({
      success: true,
      data: updatedAppointment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};

//Clear/Cancel an appointment
export const clearAppointment = async (
  req: Request,
  res: Response
): Promise<void> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const appointment = await Appointment.findById(req.params.id).session(
      session
    );
    if (!appointment) {
      await session.abortTransaction();
      session.endSession();
      res
        .status(404)
        .json({ success: false, message: "Appointment not found" });
      return;
    }

    // If there's a user associated with this appointment, delete it
    if (appointment.user) {
      await User.findByIdAndDelete(appointment.user).session(session);
    }

    // Clear the appointment keep the time slot as it is
    appointment.isBooked = false;
    appointment.user = null;
    await appointment.save({ session });

    await session.commitTransaction();
    session.endSession();

    res.status(200).json({
      success: true,
      message: "Appointment cleared successfully",
      data: appointment,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "Unknown error occurred",
    });
  }
};
