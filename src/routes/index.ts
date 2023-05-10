import express from "express";
const router = express.Router();

router.get("/", function (_, res) {
  res.json({ message: "Welcome to the Express!" });
});

export default router;
