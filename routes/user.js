const express = require("express");
const router = express.Router();

const { auth } = require("../firebase");

const User = require("../models/User");

// Useless route, just to test if auth is working
router.get("/", async (req, res) => {
	const { token } = req.body;
	try {
		const claims = await auth.verifyIdToken(token);
		const user = await auth.getUser(claims.uid);
		return res.status(200).json(user);
	} catch (error) {
		return res.status(400).json(error);
	}
});

router.get("/onduty", async (req, res) => {
	const doctorsOnDuty = await User.getOnDuty("Doctor");
	const nursesOnDuty = await User.getOnDuty("Nurse");
	return res.status(200).json({ doctorsOnDuty, nursesOnDuty });
});

module.exports = router;
