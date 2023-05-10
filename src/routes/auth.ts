import express, { Request } from "express";
const router = express.Router();

import { appCheck, db } from "../utils/firebase";
import { Role } from "../types/types";
import { createUser } from "../crud/user";

router.post(
  "/register",
  async (
    req: Request<
      object,
      { error?: string; message?: string },
      { email: string; password: string; role: Role; name: string }
    >,
    res
  ) => {
    const appCheckToken = req.header("X-Firebase-AppCheck");
    if (!appCheckToken) {
      return res.status(400).json({ error: "Missing app check token" });
    }
    try {
      await appCheck.verifyToken(appCheckToken);
    } catch (error) {
      console.log(error);
      return res.status(400).json({ error: "Invalid app check token" });
    }
    const { email, password, role, name } = req.body;
    if (
      typeof email === "undefined" ||
      typeof password === "undefined" ||
      typeof role === "undefined" ||
      typeof name === "undefined"
    ) {
      return res.status(400).json({ error: "Missing fields" });
    }
    if (role !== "Admin" && role !== "Doctor" && role !== "Nurse") {
      return res.status(400).json({ error: "Invalid role" });
    }
    await createUser(email, password, role, name);
    return res.status(201).json({ message: "User created" });
  }
);

router.get("/roles", function (req, res) {
  return res.json(["Admin", "Nurse", "Doctor"]);
});

router.post(
  "/fcm-token",
  async (
    req: Request<
      object,
      { error?: string; message?: string },
      { fcmToken: string }
    >,
    res
  ) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    const { fcmToken } = req.body;
    if (!fcmToken) {
      return res.status(400).json({ error: "Missing fields" });
    }
    try {
      await db.users.doc(req.user.uid).update({
        fcmToken,
      });
      return res.status(200).json({ message: "Token updated" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "Error when updating FCM token" });
    }
  }
);

export default router;
