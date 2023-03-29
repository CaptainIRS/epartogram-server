const express = require("express");
const router = express.Router();

const { validateNewPatient } = require("../utils/patient");

const Patient = require("../models/Patient");

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
		hospital,
	} = req.body;

	if (!name || !age || !parity || !alive || !edd || !sb || !nnd || !height) {
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
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating patient" });
	}
});

router.get("/list", async (req, res) => {
	try {
		const patients = await Patient.findAll();
		res.json(patients);
	} catch (err) {
		res.status(500).json({ message: "Error getting patients" });
	}
});

router.post("/addmeasurement", async (req, res) => {
	const { body } = req;
	console.log(body);
	const keys = Object.keys(body);
	// remove patientId
	const { patientId } = body;
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
	];

	for (let i = 0; i < keys.length; i++) {
		const measurementName = keys[i];
		const value = body[measurementName];
		if (!value) {
			continue;
		}
		if (!allowedMeasurements.includes(measurementName)) {
			res.status(400).json({ message: "Invalid measurement name" });
			return;
		}
		try {
			const patient = await Patient.findById(patientId);
			if (measurementName === "urine") {
				const { volume, albumin, glucose, acetone, voimitus } =
					req.body;
				// patient.urine.push({
				// 	volume,
				// 	albumin,
				// 	glucose,
				// 	acetone,
				// 	voimitus,
				// 	recordedBy: req.user._id,
				// });
				patient.addMeasurement({
					measurementName: {
						volume,
						albumin,
						glucose,
						acetone,
						voimitus,
					},
				});
			} else {
				console.log(measurementName, value, req.user._id);
				// const measurement = new Measurement({
				// 	measurementName,
				// 	value,
				// 	recordedBy: req.user._id,
				// });
				// await measurement.save();
				// patient[measurementName].push(measurement._id);
				patient.addMeasurement({
					measurementName: value,
				});
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

router.get("/:id", async (req, res) => {
	// try {
	// 	// const patient = await Patient.findById(req.params.id).populate('personResponsible liquor');
	// 	const { risks, suggestions, patient } = await validatePatient(
	// 		req.params.id
	// 	);
	// 	// res.json(patient);
	// 	console.log(risks, suggestions);
	// 	res.json({ risks, suggestions, patient });
	// } catch (err) {
	// 	console.log(err);
	// 	res.status(500).json({ message: "Error getting patient" });
	// }
});

module.exports = router;
