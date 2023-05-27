const express = require("express");
const router = express.Router();
const functions = require("firebase-functions");

const { validateNewPatient, validatePatient } = require("../utils/patient");

const Patient = require("../models/Patient");

router.use((req, res, next) => {
	if (!req.user) {
		return res.status(401).json({
			error: "Unauthorized",
		});
	}
	next();
});

router.post("/add", async (req, res) => {
	const {
		name,
		age,
		parity,
		alive,
		edd,
		sb,
		nnd,
		riskFactors,
		contractionStartTime,
		membraneRuptureTime,
		height,
		doctor,
		nurse,
	} = req.body;

	const hospital = req.user.hospital;

	if (
		typeof name === "undefined" ||
		typeof age === "undefined" ||
		typeof parity === "undefined" ||
		typeof alive === "undefined" ||
		typeof edd === "undefined" ||
		typeof sb === "undefined" ||
		typeof nnd === "undefined" ||
		typeof height === "undefined" ||
		typeof doctor === "undefined" ||
		typeof hospital === "undefined"
	) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	}

	const errors = validateNewPatient(req);
	if (errors.length > 0) {
		res.status(400).json({ message: errors });
		return;
	}

	try {
		const newPatient = new Patient({
			name,
			age,
			parity,
			alive,
			edd,
			sb,
			nnd,
			riskFactors,
			contractionStartTime,
			membraneRuptureTime,
			height,
			doctor: doctor || null,
			nurse: nurse || null,
			hospital: hospital || null,
		});
		await newPatient.save();
		return res.status(201).json({ message: "Patient created" });
	} catch (err) {
		console.log(err);
		return res.status(500).send({ message: "Error creating patient" });
	}
});

router.get("/list", async (req, res) => {
	try {
		const patients = await Patient.findAll();
		res.json(patients);
	} catch (err) {
		console.log(err);
		res.status(500).json({ message: "Error getting patients" });
	}
});

router.post("/addmeasurement", async (req, res) => {
	const { body } = req;
	// console.log(body);
	const keys = Object.keys(body);
	// remove patientId
	const { patientId } = body;
	if (typeof patientId === "undefined") {
		return res.status(400).json({ message: "Please enter patientId" });
	}
	console.log(req.body.urine);
	keys.splice(keys.indexOf("patientId"), 1);
	const allowedMeasurements = [
		"foetalHeartRate",
		"liquor",
		"moulding",
		"cervix",
		"descent",
		"contraction",
		"pulse",
		"systolic",
		"diastolic",
		"urine",
		"drugs",
		"temperature",
		"oxytocin",
	];

	for (let i = 0; i < keys.length; i++) {
		const measurementName = keys[i];
		const value = body[measurementName];
		if (typeof value === "undefined" || value === '') {
			continue;
		}
		if (!allowedMeasurements.includes(measurementName)) {
			console.log("Invalid measurement name: ", measurementName);
			res.status(400).json({ message: "Invalid measurement name" });
			return;
		}
		try {
			const patient = await Patient.findById(patientId, false);
			// console.log(patient);
			if (!patient) {
				return res.status(400).json({ message: "Patient not found" });
			}
			if (!patient["measurements"]) {
				patient["measurements"] = {};
			}

			if (!patient["measurements"][measurementName]) {
				patient["measurements"][measurementName] = [];
			}

			const timeStamp = Date.now();

			if (measurementName === "urine") {
				const { volume, albumin, glucose, acetone, voimitus } =
					req.body.urine;
				
				if(!patient["measurements"][measurementName]) {
					patient["measurements"][measurementName] = [];
				}

				patient["measurements"][measurementName].push({
					volume,
					albumin,
					glucose,
					acetone,
					voimitus,
					recordedBy: req.user.id,
					timeStamp,
				});

				await Patient.addMeasurement(patientId, patient);
			} else {
				// console.log(measurementName, value, req.user.id);

				patient["measurements"][measurementName].push({
					value,
					recordedBy: req.user.id,
					timeStamp,
				});
				const newPatient = await Patient.addMeasurement(
					patientId,
					patient
				);
				const { risks, suggestions, patientData } =
					await validatePatient(newPatient);
				const critical = risks.length;
				await Patient.updateParameter(patientId, "critical", critical);
			}
		} catch (err) {
			console.log(err);
			res.status(500).send({ message: "Error adding measurement" });
			return;
		}
	}

	res.status(201).json({
		message: "Measurement added",
	});
});

router.post("/:id/discharge", async (req, res) => {
	const { id } = req.params;
	const { comments } = req.body;
	try {
		await Patient.discharge(id, comments);
		return res.status(200).json({ message: "Patient discharged" });
	} catch (err) {
		console.log(err);
		return res.status(500).send({ message: "Error discharging patient" });
	}
});
router.get("/:id", async (req, res) => {
	try {
		const patient = await Patient.findById(req.params.id, true);
		const { risks, suggestions, patientData } = await validatePatient(
			patient
		);
		// res.json(patient);
		console.log(risks, suggestions);
		return res.json({ risks, suggestions, patient });
	} catch (err) {
		console.log("patient.js", err);
		return res.status(500).json({ message: "Error getting patient" });
	}
});


router.get("/transferpatient", async (req, res) => {
	const { patient, toHospital } = req.body;
	try {
		const body = await Hospital.transferPatient(patient, toHospital);
		res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(400).send({ message: "Error changing patients" });
	}
});

module.exports = router;
