import express, { Request } from "express";
const router = express.Router();

import {
  dischargePatient,
  getAllPatients,
  getPatientById,
  savePatient,
  updatePatientCriticality,
  updatePatientMeasurements,
} from "../crud/patient";
import {
  Measurement,
  Measurements,
  Patient,
  UrineMeasurement,
} from "../types/types";
import { validateNewPatient, validatePatient } from "../utils/patient";

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
  next();
});

router.post(
  "/add",
  async (
    req: Request<
      object,
      { message: string },
      {
        name: string;
        age: number;
        parity: number;
        alive: number;
        edd: number;
        sb: number;
        nnd: number;
        riskFactors: string[];
        contractionStartTime: number;
        membraneRuptureTime: number;
        height: number;
        doctor: string;
        nurse: string;
      }
    >,
    res
  ) => {
    const {
      name,
      age,
      parity,
      alive,
      edd,
      sb,
      nnd,
      riskFactors,
      contractionStartTime,
      membraneRuptureTime,
      height,
      doctor,
      nurse,
    } = req.body;

    const hospital = req.hospitalId;

    if (
      typeof name === "undefined" ||
      typeof age === "undefined" ||
      typeof parity === "undefined" ||
      typeof alive === "undefined" ||
      typeof edd === "undefined" ||
      typeof sb === "undefined" ||
      typeof nnd === "undefined" ||
      typeof height === "undefined" ||
      typeof doctor === "undefined" ||
      typeof hospital === "undefined"
    ) {
      return res.status(400).json({ message: "Please enter all fields" });
    }

    try {
      const newPatient = {
        name,
        age,
        parity,
        alive,
        edd,
        sb,
        nnd,
        riskFactors,
        contractionStartTime,
        membraneRuptureTime,
        height,
        doctor: doctor || null,
        nurse: nurse || null,
        hospital: hospital || null,
      };
      const errors = validateNewPatient(newPatient);
      if (errors.length > 0) {
        return res.status(400).json({ message: errors.join(", ") });
      }
      await savePatient(newPatient);
      return res.status(201).json({ message: "Patient created" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error creating patient" });
    }
  }
);

router.get(
  "/list",
  async (
    req: Request<object, Patient[] | { message: string }, object>,
    res
  ) => {
    try {
      const patients = await getAllPatients();
      return res.json(patients);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error getting patients" });
    }
  }
);

router.post(
  "/addmeasurement",
  async (
    req: Request<
      object,
      { message: string },
      {
        patientId: string;
        measurements: {
          [key in keyof Measurements]?: Measurement | UrineMeasurement;
        };
      }
    >,
    res
  ) => {
    const { patientId, measurements } = req.body;
    if (
      typeof patientId === "undefined" ||
      typeof measurements === "undefined"
    ) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    const allowedMeasurements: (keyof Measurements)[] = [
      "foetalHeartRate",
      "liquor",
      "moulding",
      "cervix",
      "descent",
      "contraction",
      "pulse",
      "systolic",
      "diastolic",
      "urine",
      "drugs",
      "temperature",
      "oxytocin",
    ];

    let measurementName: keyof Measurements;
    for (measurementName in measurements) {
      const value = measurements[measurementName];
      if (!value) {
        continue;
      }
      if (!allowedMeasurements.includes(measurementName)) {
        console.log("Invalid measurement name: ", measurementName);
        return res.status(400).json({ message: "Invalid measurement name" });
      }
      try {
        const patient = await getPatientById(patientId);
        if (!patient.measurements) {
          patient.measurements = {
            foetalHeartRate: [],
            liquor: [],
            moulding: [],
            cervix: [],
            descent: [],
            contraction: [],
            pulse: [],
            systolic: [],
            diastolic: [],
            urine: [],
            drugs: [],
            temperature: [],
            oxytocin: [],
          };
        }

        const timeStamp = Date.now();

        if (measurementName === "urine") {
          const urineMeasurement = value as UrineMeasurement;
          const { volume, albumin, glucose, acetone, vomitus } =
            urineMeasurement;

          if (!patient.measurements[measurementName]) {
            patient.measurements[measurementName] = [];
          }

          patient.measurements[measurementName].push({
            volume,
            albumin,
            glucose,
            acetone,
            vomitus,
            recordedBy: req.user.uid,
            recordedAt: timeStamp,
          });

          await updatePatientMeasurements(patientId, patient.measurements);
        } else {
          const measurement = value as Measurement;
          patient.measurements[measurementName].push({
            value: measurement.value,
            recordedBy: req.user.uid,
            recordedAt: timeStamp,
          });
          const newPatient = await updatePatientMeasurements(
            patientId,
            patient.measurements
          );
          const { risks } = validatePatient(newPatient);
          const criticality = risks.length;
          await updatePatientCriticality(patientId, criticality);
        }
      } catch (error) {
        console.log(error);
        return res.status(500).send({ message: "Error adding measurement" });
      }
    }

    return res.status(201).json({
      message: "Measurement added",
    });
  }
);

router.post(
  "/:id/discharge",
  async (
    req: Request<{ id: string }, { message: string }, { comments: string }>,
    res
  ) => {
    const { id } = req.params;
    const { comments } = req.body;
    try {
      await dischargePatient(id, comments);
      return res.status(200).json({ message: "Patient discharged" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error discharging patient" });
    }
  }
);

router.get("/:id", async (req, res) => {
  try {
    const patient = await getPatientById(req.params.id);
    const { risks, suggestions } = validatePatient(patient);
    return res.json({ risks, suggestions, patient });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error getting patient" });
  }
});

export default router;
