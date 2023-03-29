const express = require("express");
const router = express.Router();

const { auth } = require("../utils/firebase");

const Hospital = require("../models/Hospital");

router.use((req, res, next)  => {
    const token = req.header("X-Token-Firebase");
    if(!token) return res.status(400).json({message: "invalid token"})
    // else if(req.user.role === "Admin") {
    //     return res.status(401).json({message: "unauthorized"})
    // }
    req.token = token;
    next()
})

router.post("/addHospital", async (req, res) => {
    const admin = req.token;
    const {
		name,
		tier,
        lat,
        lon,
        capacity
	} = req.body;
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
            capacity
		});
		await newHospital.addHospital(admin);
        res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating hospital" });
	}
});

router.post("/addStaff", async (req, res) => {
    const {
		staffId,
        isActive,
	} = req.body;
    if (!staffId || !isActive) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	}
	try {
        const admin = req.token;
		await Hospital.modifyStaff(admin, staffId, isActive);
        res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating patient" });
	}
});

router.put("/updateStaffStatus", async (req, res) => {
    const {
		staffId,
        isActive,
	} = req.body;
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
		res.status(500).send({ message: "Error creating patient" });
	}
});

router.put("/updateCapacity", async (req, res) => {
    const {
		capacity
	} = req.body;
    if (!capacity) {
		res.status(400).json({ message: "Please enter all fields" });
		return;
	}else if (isNaN(capacity)) {
        res.status(400).json({ message: "Invalid capacity Input" });
        return;
    }

	try {
        const admin = req.token;
		await Hospital.modifyCapacity(admin, capacity);
        res.status(200).send({ message: "Success" });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating patient" });
	}
});

router.get("/getAll", async (req, res) => {
	try {
        const admin = req.token;
		const body = await Hospital.getAll(admin);
        res.status(200).send({ message: "Success", response: body });
	} catch (err) {
		console.log(err);
		res.status(500).send({ message: "Error creating patient" });
	}
});

module.exports = router;