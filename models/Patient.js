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
		this.critical = 0;
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

	static #getUserFromId(uid) {
		return new Promise(async (resolve, reject) => {
			try {
				const snapshot = await firestore
					.collection("users")
					.where("uid", "==", uid)
					.get();
				// if (!snapshot.exists) {
				// 	reject(`User not found with uid ${uid}`);
				// }
				const user = snapshot.docs[0];
				resolve({ id: user.id, ...user.data() });

				// resolve({ id: snapshot.id, ...snapshot.data() });
			} catch (error) {
				reject(error);
			}
		});
	}

	static findById(patientId) {
		return new Promise(async (resolve, reject) => {
			try {
				console.log(patientId);
				const snapshot = await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.get();
				if (!snapshot.exists) {
					reject("Patient not found");
				}
				const patient = { id: snapshot.id, ...snapshot.data() };
				console.log(patient);
				patient.doctor = await this.#getUserFromId(patient.doctor);
				patient.nurse = await this.#getUserFromId(patient.nurse);
				for (const key in patient["measurements"]) {
					// console.log(patient["measurements"][key]);
					if (patient["measurements"][key].length === 0) {
						continue;
					}

					const firstTimeStamp =
						patient["measurements"][key][0]["timeStamp"];
					patient["measurements"][key] = await Promise.all(
						patient["measurements"][key].map(
							async (measurement) => {
								console.log(measurement);
								return {
									...measurement,
									timeStamp:
										(measurement.timeStamp -
											firstTimeStamp) /
											(1000 * 60 * 60) +
										8,
									recordedBy: await this.#getUserFromId(
										measurement.recordedBy
									),
								};
							}
						)
					);
				}
				resolve(patient);
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
					active: true,
					critical: 0,
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static updateActiveStatus(patientId, active) {
		return new Promise(async (resolve, reject) => {
			try {
				await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.update({ active });
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
				const snapshot = await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.get();
				resolve({ id: snapshot.id, ...snapshot.data() });
			} catch (error) {
				reject(error);
			}
		});
	}

	static checkAllPatients() {
		return new Promise(async (resolve, reject) => {
			try {
				const patientsRecords = await firestore
					.collection(PATIENT_MODEL)
					.where("active", "==", true)
					.get();
				const notifcationDatas = [];
				for (const patientRecord of patientsRecords.docs) {
					const patient = patientRecord.data();
					const measurements = patient.measurements;
					if (!measurements) continue;
					for (const measurement in measurements) {
						const measurementData = measurements[measurement];
						const measurementDataLength = measurementData.length;
						if (measurementDataLength == 0) continue;
						const lastMeasurement =
							measurementData[measurementDataLength - 1];
						const curTimeStamp = Date.now();
						if (
							Math.ceil(
								(curTimeStamp - lastMeasurement.timeStamp) /
									60 /
									1000
							) > 31
						) {
							notifcationDatas.push({
								patientId: patientRecord.id,
								patientName: patient.name,
								nurse: patient.nurse,
								measurementName: measurementData.name,
							});
							break;
						}
					}
				}
				resolve(notifcationDatas);
			} catch (error) {
				reject(error);
			}
		});
	}

	static discharge(patientId, comments) {
		return new Promise(async (resolve, reject) => {
			try {
				await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.update({ comments, active: false });
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}
	static updateParameter(patientId, parameter, value) {
		return new Promise(async (resolve, reject) => {
			try {
				await firestore
					.collection(PATIENT_MODEL)
					.doc(patientId)
					.update({ [parameter]: value });
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}
}

module.exports = Patient;
