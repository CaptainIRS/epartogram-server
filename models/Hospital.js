const { firestore, auth } = require("../utils/firebase");

const HOSPITAL_MODEL = "hospitals";
const USER_COLLECTION = "users";

const STAFFS = "staffs";

class Hospital {
    constructor({
        name,
        tier,
        capacity,
        lat,
        lon,
    }) {
        this.name = name;
        this.tier = tier;
        this.capacity = capacity;
        this.lat = lat;
        this.lon = lon;
    }

    addHospital(id) {
        return new Promise(async (resolve, reject) => {
			try {
                const document = await firestore.collection(HOSPITAL_MODEL).doc(id)
                if (document.get().exists) {
                    reject("Hospital already exists")    
                }     
				await firestore.collection(HOSPITAL_MODEL).doc(id).set({
					name: this.name,
                    tier: this.tier,
                    capacity: this.capacity,
                    lat: this.lat,
                    lon: this.lon,
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
                console.log(staffId)
                // const user = await auth.getUser(staffId)
                // if(!user.exists) {
                //     reject("User not found")
                // }
                const document = await firestore.collection(HOSPITAL_MODEL).doc(id)
                if (!await document.get()) {
                    reject("Hospital not found")    
                }
                await document.collection(STAFFS).doc(staffId).set({status: status})  
				resolve();
			} catch (error) {
				reject(error);
			}
		});
    }

    static modifyCapacity(id, capacity) {
        return new Promise(async (resolve, reject) => {
			try {
                const document = await firestore.collection(HOSPITAL_MODEL).doc(id)
                if (!await document.get()) {
                    reject("Hospital not found")    
                }
               await document.update({capacity: capacity})
				resolve();
			} catch (error) {
				reject(error);
			}
		});
    }

    static getAll(id) {
        return new Promise(async (resolve, reject) => {
			try {
                const document = await firestore.collection(HOSPITAL_MODEL).doc(id)
                const res = await document.get()
                if (!res) {
                    reject("Hospital not found")    
                }
				resolve(res);
			} catch (error) {
				reject(error);
			}
		});
    }

}

module.exports = Hospital;