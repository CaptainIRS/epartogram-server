const { auth, firestore } = require("../firebase");

const USER_COLLECTION = "users";

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

	static getOnDuty(role) {
		// get all users with role and onDuty = true
		return new Promise(async (resolve, reject) => {
			try {
				const userRef = await firestore
					.collection(USER_COLLECTION)
					.where("role", "==", role)
					.where("onDuty", "==", true)
					.get();
				const users = userRef.docs.map((doc) => doc.data());
				resolve(users);
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
				await firestore.collection(USER_COLLECTION).add({
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
}

module.exports = User;
