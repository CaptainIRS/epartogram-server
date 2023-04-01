const { auth, firestore } = require("../utils/firebase");

const USER_COLLECTION = "users";
const HOSPITAL_COLLECTION = "hospitals";
const STAFFS_COLLECTION = "staffs";

class User {
	keysAllowed = ["email", "password", "role", "name", "hospital"];

	constructor({ email, password, role, name }) {
		this.email = email;
		this.password = password;
		this.role = role;
		this.name = name;
	}

	static getRoles() {
		return ["Admin", "Nurse", "Doctor"];
	}
	get({ email }) {
		// get User with email
		return new Promise(async (resolve, reject) => {
			try {
				const userRef = await firestore
					.collection(USER_COLLECTION)
					.where("email", "==", email)
					.get();
				const user = userRef.docs[0];
				resolve(user.data());
			} catch (error) {
				reject(error);
			}
		});
	}
	
	static getOnDuty(id) {		// get all users with role and onDuty = true
		return new Promise(async (resolve, reject) => {
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
				const staffs = await query.get();
				var staffsList = [];
				const users = await firestore
				.collection(USER_COLLECTION)
				.get();
                var userMap = {};
				for(const user of users.docs){
                   userMap[user.id] = user.data()
				}
				for (const staff of staffs.docs) {
					staffsList.push(userMap[staff.id]);
				}
			res(resolve(staffsList));
			} catch (error) {
				reject(error);
			}
		});
	}

	save() {
		return new Promise(async (resolve, reject) => {
			try {
				const user = await auth.createUser({
					email: this.email,
					password: this.password,
				});
				await auth.setCustomUserClaims(user.uid, { role: this.role });
				await firestore.collection(USER_COLLECTION).doc(user.uid).set({
					uid: user.uid,
					email: this.email,
					role: this.role,
					name: this.name,
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	update(document) {
		// get all keys from document
		const keys = Object.keys(document);
		keys.forEach((key) => {
			// check if key is allowed
			if (!this.keysAllowed.includes(key)) {
				throw new Error(`Key ${key} is not allowed`);
			}
		});

		return new Promise(async (resolve, reject) => {
			try {
				const userRef = await firestore
					.collection(USER_COLLECTION)
					.where("email", "==", this.email)
					.get();
				const user = userRef.docs[0];
				const uid = user.data().uid;
				const updatedRecord = await userRef.set(document, {
					merge: true,
				});
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}

	static transferPatient(patientId, hospitalId) {
		return new Promise(async (resolve, reject) => {
			try {
				await firestore
					.collection(PATIENT_COLLECTION)
					.doc(patientId)
					.update({ hospital: hospitalId });
				resolve();
			} catch (error) {
				reject(error);
			}
		});
	}
}

module.exports = User;
