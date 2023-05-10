import express, { Request } from "express";
import { Hospital } from "../types/types";
import { getNearbyHospitals } from "../crud/hospital";
import { transferPatient } from "../crud/patient";
const router = express.Router();

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized Accessing Doctor Routes",
    });
  }
  if (req.user.role !== "Doctor") {
    return res.status(401).json({ message: "unauthorized" });
  }
  next();
});

router.get(
  "/nearbyhospitals",
  async (
    req: Request<
      object,
      { message: string; response?: { id: string; data: Hospital }[] },
      object
    >,
    res
  ) => {
    try {
      const body = await getNearbyHospitals(req.hospitalId);
      res.status(200).send({ message: "Success", response: body });
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: "Error fetching hospitals" });
    }
  }
);

router.get(
  "/transferpatient",
  async (
    req: Request<
      object,
      { message: string },
      { patientId: string; hospitalId: string }
    >,
    res
  ) => {
    const { patientId, hospitalId } = req.body;
    try {
      await transferPatient(patientId, hospitalId);
      res.status(200).send({ message: "Success" });
    } catch (err) {
      console.log(err);
      res.status(400).send({ message: "Error changing patients" });
    }
  }
);

export default router;
