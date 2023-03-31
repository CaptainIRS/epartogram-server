const express = require("express");
const router = express.Router();

const { auth } = require("../utils/firebase");

const User = require("../models/User");
const getTabs = require("../utils/getTabs");

// Useless route, just to test if auth is working
router.get("/", async (req, res) => {
	if (req.user) {
		role = req.user.customClaims.role;
		req.user.tabs = getTabs(role);
		res.status(200).json(req.user);
	} else {
		res.status(401).json({
			error: "Unauthorized",
		});
	}
});

router.get("/onduty", async (req, res) => {
	const doctorsOnDuty = await User.getOnDuty("Doctor");
	const nursesOnDuty = await User.getOnDuty("Nurse");
	return res.status(200).json({ doctorsOnDuty, nursesOnDuty });
});

module.exports = router;
