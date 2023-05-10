import express, { Request } from "express";
import { getOnDuty } from "../crud/hospital";
import { User } from "../types/types";
import getTabs from "../utils/getTabs";
const router = express.Router();

router.get("/", (req, res) => {
  if (req.user) {
    const role = req.user.role;
    req.user.tabs = getTabs(role);
    return res.status(200).json(req.user);
  } else {
    return res.status(401).json({
      error: "Unauthorized",
    });
  }
});

router.get(
  "/onduty",
  async (
    req: Request<object, { message: string; response?: User[] }, object>,
    res
  ) => {
    try {
      const body = await getOnDuty(req.hospitalId);
      return res.status(200).send({ message: "Success", response: body });
    } catch (error) {
      console.log(error);
      return res.status(400).send({ message: "Error getting staffs" });
    }
  }
);

export default router;
