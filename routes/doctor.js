const express = require("express");
const router = express.Router();

const Hospital = require("../models/Hospital");
const Patient = require("../models/Patient");

router.use((req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			message: "Unauthorized Accessing Doctor Routes",
		});
	}
	if (req.user.role !== "Doctor") {
		return res.status(401).json({ message: "unauthorized" });
	}
	req.token = req.user.uid;
	next();
});

router.get("/nearbyhospitals", async (req, res) => {
	try {
		const body = await Hospital.getSuggestions(req.user.hospital);
		res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(400).send({ message: "Error fetching hospitals" });
	}
});

router.get("/transferpatient", async (req, res) => {
    const {
		patient,
        toHospital
	} = req.body;
	try {
		const body = await Hospital.transferPatient(patient, toHospital);
        res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(400).send({ message: "Error changing patients" });
	}
});

module.exports = router;

