const { firestore, auth } = require("../utils/firebase");
const { PriorityQueue } = require("../utils/priorityQueue");
const { distance } = require("../utils/haversine");

const HOSPITAL_COLLECTION  = "hospitals";
const USER_COLLECTION = "users";
const STAFFS_COLLECTION  = "staffs";
const PATIENT_COLLECTION = "patients";

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
                const document = firestore.collection(HOSPITAL_COLLECTION ).doc(id)
                if (document.get().exists) {
                    reject("Hospital already exists")    
                }     
				await firestore.collection(HOSPITAL_COLLECTION ).doc(id).set({
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

    static addStaff(id, staffId, status) {
        return new Promise(async (resolve, reject) => {
			try {
                console.log(staffId)

                const document = firestore.collection(HOSPITAL_COLLECTION).doc(id)
                if (!await document.get()) {
                    reject("Hospital not found")    
                }
                const userSnapshot = await firestore.collection(USER_COLLECTION).where("uid","==",staffId).get()
                if(userSnapshot.empty) {
                    reject("User not found")
                }
                const user = userSnapshot.docs[0]
                console.log(user.data())
                await firestore.collection(STAFFS_COLLECTION).doc(user.id).set({staff: user.data().uid, hospital: id, status: status})  
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

                const document = firestore.collection(HOSPITAL_COLLECTION).doc(id)
                if (!await document.get()) {
                    reject("Hospital not found")    
                }
                const userSnapshot = await firestore.collection(USER_COLLECTION).where("uid","==",staffId).get()
                if( userSnapshot.empty) {
                    reject("User not found")
                }
                const user = userSnapshot.docs[0]
                await firestore.collection(STAFFS_COLLECTION).doc(user.id).update({staff: user.data().uid, status: status})  
				resolve();
			} catch (error) {
				reject(error);
			}
		});
    }

    static modifyCapacity(id, capacity) {
        return new Promise(async (resolve, reject) => {
			try {
                const document = firestore.collection(HOSPITAL_COLLECTION).doc(id)
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

    static getOnDuty(id) {
        return new Promise(async function (resolve, reject)  {
			try {
                const document = firestore.collection(HOSPITAL_COLLECTION).doc(id)
                const res = await document.get()
                if (!res) {
                    reject("Hospital not found")    
                }
                var query = firestore.collection(STAFFS_COLLECTION)
                query = query.where("hospital","==",id)
                query = query.where("status","==",true)
                const staffs = await query.get()
                var staffsList = []
               
                for (const staff of staffs.docs) {
                    const user = await firestore.collection(USER_COLLECTION).doc(staff.id).get()
                    staffsList.push(user.data()) 
                }
                res(resolve(staffsList));    
			} catch (error) {
				reject(error);
			}
		});
    }

    static getSuggestions(id) {
        return new Promise(async (resolve, reject) => {
			try {
                console.log(new Date())
                const currentHospitalDocument = await firestore.collection(HOSPITAL_COLLECTION ).doc(id).get()
                if (!currentHospitalDocument) {
                    reject("Hospital not found")    
                }
                const currentHospital = currentHospitalDocument.data()
                const allHospitals = await firestore.collection(HOSPITAL_COLLECTION).get()
                var selectedHospitals = new PriorityQueue();
                allHospitals.forEach(doc => {
                    const newHospital = doc.data()
                    if (doc.id !== id && newHospital.tier < currentHospital.tier)
                    {
                        const dist = distance(currentHospital.lat, currentHospital.lon, newHospital.lat, newHospital.lon)
                        console.log(dist,newHospital)
                        selectedHospitals.enqueue({id:doc.id, ...newHospital}, dist);
                    }
                });
                resolve({...currentHospital, nearby: selectedHospitals.listQueue()});
			} catch (error) {
				reject(error);
			}
		});
    }

    static getPatients(id) {
        return new Promise(async (resolve, reject) => {
			try {
                var query = firestore.collection(PATIENT_COLLECTION)
                query = query.where("hospital","==",id)
                query = query.where("active","==",true)
                const patients = await query.get()
                var patientsList = []
                for (const patient of patients.docs) {
                    patientsList.push({id: patient.id, ...patient.data()})
                }
                resolve(patientsList);
			} catch (error) {
				reject(error);
			}
		});
    }

    static transferPatient(patientId, hospitalId) {
        return new Promise(async (resolve, reject) => {
			try {
                await firestore.collection(PATIENT_COLLECTION).doc(patientId).update({hospital: hospitalId})
                resolve();
			} catch (error) {
				reject(error);
			}
		});
    }

}

module.exports = Hospital;