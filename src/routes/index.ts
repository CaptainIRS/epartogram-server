import express from "express";
const router = express.Router();

router.get("/", function (_, res) {
  return res.json({ message: "Welcome to the Express!" });
});

export default router;
