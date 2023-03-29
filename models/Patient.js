const { auth, firestore } = require("../utils/firebase");

const PATIENT_MODEL = "patients";

class Patient {
	constructor({
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
	}) {
		this.name = name;
		this.age = age;
		this.parity = parity;
		this.alive = alive;
		this.edd = edd;
		this.sb = sb;
		this.nnd = nnd;
		this.riskFactors = riskFactors;
		this.contractionStartTime = contractionStartTime;
		this.membraneRuptureTime = membraneRuptureTime;
		this.height = height;
		this.doctor = doctor;
		this.nurse = nurse;
		this.hospital = hospital;
	}

	static getRiskFactors() {
		return [
			"Hypertension",
			"Diabetes",
			"Previous C-Section",
			"Previous Premature Birth",
			"Previous Stillbirth",
			"Previous Miscarriage",
			"Previous Preterm Birth",
			"Previous Multiple Birth",
		];
	}

	static findById(patientId) {
		return new Promise(async (resolve, reject) => {
			try {
				const snapshot = await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.get();
				if (!snapshot.exists) {
					reject("Patient not found");
				}
				resolve({ id: snapshot.id, ...snapshot.data() });
			} catch (error) {
				reject(error);
			}
		});
	}

	static findAll() {
		return new Promise(async (resolve, reject) => {
			try {
				const snapshot = await firestore
					.collection(PATIENT_MODEL)
					.get();
				const patients = [];
				snapshot.forEach((doc) => {
					patients.push({ id: doc.id, ...doc.data() });
				});
				resolve(patients);
			} catch (error) {
				reject(error);
			}
		});
	}

	save() {
		return new Promise(async (resolve, reject) => {
			try {
				await firestore.collection(PATIENT_MODEL).add({
					name: this.name,
					age: this.age,
					parity: this.parity,
					alive: this.alive,
					edd: this.edd,
					sb: this.sb,
					nnd: this.nnd,
					riskFactors: this.riskFactors,
					contractionStartTime: this.contractionStartTime,
					membraneRuptureTime: this.membraneRuptureTime,
					height: this.height,
					doctor: this.doctor,
					nurse: this.nurse,
					hospital: this.hospital,
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static getAll() {
		return new Promise(async (resolve, reject) => {
			try {
				const snapshot = await firestore
					.collection(PATIENT_MODEL)
					.get();
				const patients = [];
				snapshot.forEach((doc) => {
					patients.push({ id: doc.id, ...doc.data() });
				});
				resolve(patients);
			} catch (error) {
				reject(error);
			}
		});
	}

	static addMeasurement(patientId, patientData) {
		return new Promise(async (resolve, reject) => {
			try {
				await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.set(patientData);
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}
}

module.exports = Patient;
