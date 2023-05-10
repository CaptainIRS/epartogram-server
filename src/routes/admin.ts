import express, { Request } from "express";
import { Hospital, Patient, User } from "../types/types";
import {
  addHospital,
  addStaff,
  getNearbyHospitals,
  getOnDuty,
  getPatients,
  getUnassignedStaffs,
  setOnDuty,
  updateCapacity,
  updateStaff,
} from "../crud/hospital";
const router = express.Router();

router.use((req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized accessing admin routes",
    });
  }
  if (req.user.role !== "Admin") {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
});

router.post(
  "/hospital",
  async (req: Request<object, { message: string }, Hospital>, res) => {
    const id = req.user.uid;
    const { name, tier, latitude, longitude, capacity } = req.body;
    if (
      typeof name === "undefined" ||
      typeof tier === "undefined" ||
      typeof latitude === "undefined" ||
      typeof longitude === "undefined" ||
      typeof capacity === "undefined"
    ) {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    try {
      await addHospital(id, {
        name,
        tier,
        latitude,
        longitude,
        capacity,
        doctors: [],
        nurses: [],
      });
      return res.status(200).send({ message: "Success" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error creating hospital" });
    }
  }
);

router.post(
  "/staff",
  async (
    req: Request<
      object,
      { message: string },
      {
        staffId: string;
        onDuty: boolean;
      }
    >,
    res
  ) => {
    const { staffId, onDuty } = req.body;
    if (typeof staffId === "undefined" || typeof onDuty === "undefined") {
      return res.status(400).json({ message: "Please enter all fields" });
    }
    try {
      const admin = req.user.uid;
      await addStaff(admin, staffId, onDuty);
      return res.status(200).send({ message: "Success" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error creating staff" });
    }
  }
);

router.put(
  "/staff",
  async (
    req: Request<
      object,
      { message: string },
      {
        staffId: string;
        onDuty: boolean;
      }
    >,
    res
  ) => {
    const { staffId, onDuty } = req.body;
    if (typeof staffId === "undefined" || typeof onDuty === "undefined") {
      res.status(400).json({ message: "Please enter all fields" });
      return;
    }
    try {
      const admin = req.user.uid;
      await updateStaff(admin, staffId, onDuty);
      return res.status(200).send({ message: "Success" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error updating staff" });
    }
  }
);

router.put(
  "/capacity",
  async (
    req: Request<
      object,
      { message: string },
      {
        capacity: number;
      }
    >,
    res
  ) => {
    const { capacity } = req.body;
    if (!capacity) {
      return res.status(400).json({ message: "Please enter all fields" });
    } else if (isNaN(capacity)) {
      return res.status(400).json({ message: "Invalid capacity input" });
    }

    try {
      const admin = req.user.uid;
      await updateCapacity(admin, capacity);
      return res.status(200).send({ message: "Success" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error occurred" });
    }
  }
);

router.get(
  "/onduty",
  async (
    req: Request<object, { message: string; response?: User[] }, object>,
    res
  ) => {
    try {
      const admin = req.user.uid;
      const body = await getOnDuty(admin);
      return res.status(200).send({ message: "Success", response: body });
    } catch (error) {
      console.log(error);
      return res.status(500).send({ message: "Error fetching staffs" });
    }
  }
);

router.post(
  "/onduty",
  async (
    req: Request<
      object,
      { message: string },
      {
        staffId: string;
      }
    >,
    res
  ) => {
    try {
      const admin = req.user.uid;
      const { staffId } = req.body;
      if (!staffId) {
        res.status(400).json({ message: "Please enter all fields" });
        return;
      }
      await setOnDuty(admin, staffId);
      return res.status(200).send({ message: "Success" });
    } catch (error) {
      console.log(error);
      return res.status(500).send({
        message: "Error occurred while setting staff on duty",
      });
    }
  }
);

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
      const admin = req.user.uid;
      const body = await getNearbyHospitals(admin);
      return res.status(200).send({ message: "Success", response: body });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Error fetching hospitals" });
    }
  }
);

router.get(
  "/patients",
  async (
    req: Request<
      object,
      { message: string; response?: { id: string; data: Patient }[] },
      object
    >,
    res
  ) => {
    try {
      const admin = req.user.uid;
      const body = await getPatients(admin);
      return res.status(200).send({ message: "Success", response: body });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Error fetching patients" });
    }
  }
);

router.get(
  "/liststaffs",
  async (
    req: Request<
      object,
      { message: string; response?: { nurses: User[]; doctors: User[] } },
      object
    >,
    res
  ) => {
    const admin = req.user.uid;
    try {
      const body = await getUnassignedStaffs(admin);
      return res.status(200).send({ message: "Success", response: body });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Error getting staffs" });
    }
  }
);

export default router;
