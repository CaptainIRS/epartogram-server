const { firestore, auth } = require("../utils/firebase");
const { PriorityQueue } = require("../utils/priorityQueue");
const { distance } = require("../utils/haversine");

const HOSPITAL_COLLECTION = "hospitals";
const USER_COLLECTION = "users";
const STAFFS_COLLECTION = "staffs";
const PATIENT_COLLECTION = "patients";

class Hospital {
	constructor({ name, tier, capacity, lat, lon, cesarean, specialist }) {
		this.name = name;
		this.tier = tier;
		this.capacity = capacity;
		this.lat = lat;
		this.lon = lon;
		this.cesarean = cesarean;
		this.specialist = specialist;
	}

	addHospital(id) {
		return new Promise(async (resolve, reject) => {
			try {
				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);
				if (document.get().exists) {
					reject("Hospital already exists");
				}
				await firestore.collection(HOSPITAL_COLLECTION).doc(id).set({
					name: this.name,
					tier: this.tier,
					capacity: this.capacity,
					lat: this.lat,
					lon: this.lon,
					nurses: [],
					doctors: [],
					cesarean: this.cesarean,
					specialist: this.specialist,
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static addStaff(id, staffId, status) {
		return new Promise(async (resolve, reject) => {
			try {
				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);
				if (!(await document.get())) {
					reject("Hospital not found");
				}
				console.log(staffId);
				const userSnapshot = await firestore
					.collection(USER_COLLECTION)
					.where("uid", "==", staffId)
					.get();
                console.log(userSnapshot.docs.length)
				if (userSnapshot.docs.length<1) {
					reject("User not found");
				}
				
				const user = userSnapshot.docs[0];
                const hospital = await document.get()
                console.log(hospital.data())
				if (user.data().role === "Nurse") {
					var nurses =  hospital.data().nurses;
					if (!nurses) {
						nurses = [];
					}
					if (!nurses.includes(user.data().uid)) {
						nurses.push(user.data().uid);
					}
					await document.update({ nurses: nurses });
				} else if (user.data().role === "Doctor") {
					var doctors = hospital.data().doctors;
					if (!doctors) {
						doctors = [];
					}
					if (!doctors.includes(user.data().uid)) {
						doctors.push(user.data().uid);
					}
					await document.update({ doctors: doctors });
				} else if (user.data().role === "Admin") {
					reject("Admins cannot be added as staff");
				}

				await firestore.collection(STAFFS_COLLECTION).doc(user.id).set({
					staff: user.data().uid,
					hospital: id,
					status: status,
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static modifyStaff(id, staffId, status) {
		return new Promise(async (resolve, reject) => {
			try {
				console.log(staffId);

				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);
				if (!(await document.get())) {
					reject("Hospital not found");
				}
				const userSnapshot = await firestore
					.collection(USER_COLLECTION)
					.where("uid", "==", staffId)
					.get();
				if (userSnapshot.docs.length<1) {
					reject("User not found");
				}
				console.log("STATUS",status)
				const user = userSnapshot.docs[0];
				if (!status) {
					id = "NONE";
				}
				await firestore
					.collection(STAFFS_COLLECTION)
					.doc(user.id)
					.update({
						staff: user.data().uid,
						hospital: id,
						status: status,
					});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static getStaffHospitalId(userId) {
		return new Promise(async (resolve, reject) => {
             try {
				const staff = await firestore.collection(STAFFS_COLLECTION).doc(userId).get()
				if(!staff.exists){
                  reject("No Staff Found")
				}
				resolve(staff.data().hospital)
			 }catch(error){
				reject(error);
			 }
		});
	}

	static modifyCapacity(id, capacity) {
		return new Promise(async (resolve, reject) => {
			try {
				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);
				if (!(await document.get())) {
					reject("Hospital not found");
				}
				await document.update({ capacity: capacity });
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static getOnDuty(id) {
		return new Promise(async function (resolve, reject) {
			try {
				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);
				const res = await document.get();
				if (!res) {
					reject("Hospital not found");
				}
				var query = firestore.collection(STAFFS_COLLECTION);
				const staffs = await query.get();
				var staffsList = [];

				for (const staff of staffs.docs) {
					const user = await firestore
						.collection(USER_COLLECTION)
						.doc(staff.id)
						.get();
					staffsList.push(user.data());
				}
				res(resolve(staffsList));
			} catch (error) {
				reject(error);
			}
		});
	}

	static setOnDuty(id, staffId) {
		return new Promise(async function (resolve, reject) {
			try {
				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);
				const res = await document.get();
				if (!res) {
					reject("Hospital not found");
				}
				var query = firestore.collection(STAFFS_COLLECTION);
				query = query.where("hospital", "==", id);
				query = query.where("staff", "==", staffId);
				const staffs = await query.get();
				if (staffs.empty) {
					reject("Staff not found");
				}
				// Set all staffs to off duty
				const allStaffs = await firestore
					.collection(STAFFS_COLLECTION)
					.where("hospital", "==", id)
					.where("status", "==", true)
					.get();
				for (const staff of allStaffs.docs) {
					await firestore
						.collection(STAFFS_COLLECTION)
						.doc(staff.id)
						.update({ status: false });
				}
				// Set the selected staff to on duty
				const staff = staffs.docs[0];
				await firestore
					.collection(STAFFS_COLLECTION)
					.doc(staff.id)
					.update({ status: true });
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}
	static getUnAssignedStaffs(id) {
		return new Promise(async (resolve, reject) => {
			try {
				const document = firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id);

				const res = await document.get();

				var nurses = res.data().nurses;
				if (!nurses) nurses = [];

				var doctors = res.data().doctors;
				if (!doctors) doctors = [];

				const snapshots = await firestore
					.collection(USER_COLLECTION)
					.get();

                var resNurses = []
                var resDoctors = []
				for (const user of snapshots.docs) {
					if (
						user.data().role === "Nurse" &&
						!nurses.includes(user.data().uid)
					) {
						resNurses.push(user.data());
					} else if (
						user.data().role === "Doctor" &&
						!doctors.includes(user.data().uid)
					) {
						resDoctors.push(user.data());
					}
                    console.log(resDoctors,resNurses)
				}
				resolve({ nurses: resNurses, doctors: resDoctors });
			} catch (error) {
				reject(error);
			}
		});
	}

	static getSuggestions(id) {
		return new Promise(async (resolve, reject) => {
			try {
				console.log(new Date());
				const currentHospitalDocument = await firestore
					.collection(HOSPITAL_COLLECTION)
					.doc(id)
					.get();
				if (!currentHospitalDocument) {
					reject("Hospital not found");
				}
				const currentHospital = currentHospitalDocument.data();
				const allHospitals = await firestore
					.collection(HOSPITAL_COLLECTION)
					.get();
				var selectedHospitals = new PriorityQueue();
				allHospitals.forEach((doc) => {
					const newHospital = doc.data();
					if (
						doc.id !== id &&
						newHospital.tier > currentHospital.tier
					) {
						const dist = distance(
							currentHospital.lat,
							currentHospital.lon,
							newHospital.lat,
							newHospital.lon
						);
						console.log(dist, newHospital);
						selectedHospitals.enqueue(
							{ id: doc.id, ...newHospital },
							dist
						);
					}
				});
				resolve({
					...currentHospital,
					nearby: selectedHospitals.listQueue(),
				});
			} catch (error) {
				reject(error);
			}
		});
	}

	static getPatients(id) {
		return new Promise(async (resolve, reject) => {
			try {
				var query = firestore.collection(PATIENT_COLLECTION);
				query = query.where("hospital", "==", id);
				query = query.where("active", "==", true);
				const patients = await query.get();
				var patientsList = [];
				for (const patient of patients.docs) {
					patientsList.push({ id: patient.id, ...patient.data() });
				}
				resolve(patientsList);
			} catch (error) {
				reject(error);
			}
		});
	}
}

module.exports = Hospital;
