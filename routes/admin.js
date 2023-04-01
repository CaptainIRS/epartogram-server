const express = require("express");
const router = express.Router();

const Hospital = require("../models/Hospital");

router.use((req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			message: "Unauthorized Accessing Admin Routes",
		});
	}
	if (req.user.role !== "Admin") {
		return res.status(401).json({ message: "unauthorized" });
	}
	req.token = req.user.uid;
	next();
});

router.post("/hospital", async (req, res) => {
	const admin = req.token;
	const { name, tier, lat, lon, capacity } = req.body;
	if (!name || !tier || !lat || !lon || !capacity) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	}
	try {
		const newHospital = new Hospital({
			name,
			tier,
			lat,
			lon,
			capacity,
		});
		await newHospital.addHospital(admin);
		res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating hospital" });
	}
});

router.post("/staff", async (req, res) => {
	let { staffId, isActive } = req.body;
	if (isActive == undefined) {
		isActive = false;
	}
	if (!staffId) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	}
	try {
		const admin = req.token;
		await Hospital.addStaff(admin, staffId, isActive);
		res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating staff" });
	}
});

router.put("/staff", async (req, res) => {
	const { staffId, isActive } = req.body;
	if (!staffId || isActive == undefined) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	}
	try {
		const admin = req.token;
		await Hospital.modifyStaff(admin, staffId, isActive);
		res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error updating staff" });
	}
});

router.put("/capacity", async (req, res) => {
	const { capacity } = req.body;
	if (!capacity) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	} else if (isNaN(capacity)) {
		res.status(400).json({ message: "Invalid capacity Input" });
		return;
	}

	try {
		const admin = req.token;
		await Hospital.modifyCapacity(admin, capacity);
		res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error occurred" });
	}
});

router.get("/onduty", async (req, res) => {
	try {
		const admin = req.token;
		const body = await Hospital.getOnDuty(admin);
		res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error fetching staffs" });
	}
});

router.post("/onduty", async (req, res) => {
	try {
		const admin = req.token;
		const { staffId } = req.body;
		if (!staffId) {
			res.status(400).json({ message: "Please enter all fields" });
			return;
		}
		await Hospital.setOnDuty(admin, staffId);
		res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({
			message: "Error occurred while setting staff on duty",
		});
	}
});

router.get("/nearbyhospitals", async (req, res) => {
	try {
		const admin = req.token;
		const body = await Hospital.getSuggestions(admin);
		res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(400).send({ message: "Error fetching hospitals" });
	}
});

router.get("/patients", async (req, res) => {
	try {
		const admin = req.token;
		const body = await Hospital.getPatients(admin);
		res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(400).send({ message: "Error fetching patients" });
	}
});

router.get("/liststaffs", async (req, res) => {
	const admin = req.token;
	try {
		const body = await Hospital.getUnAssignedStaffs(admin);
		res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(400).send({ message: "Error getting staffs" });
	}
});

module.exports = router;
