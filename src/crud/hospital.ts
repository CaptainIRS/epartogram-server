import { db } from "../utils/firebase";
import { Hospital } from "../types/types";
import { PriorityQueue } from "../utils/priorityQueue";
import { distance } from "../utils/haversine";

const addHospital = async (hospitalId: string, hospital: Hospital) => {
  try {
    const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
    if (hospitalSnapshot.exists) {
      throw new Error("Hospital already exists");
    }
    await db.hospitals.doc(hospitalId).set({
      name: hospital.name,
      tier: hospital.tier,
      capacity: hospital.capacity,
      latitude: hospital.latitude,
      longitude: hospital.longitude,
      nurses: [],
      doctors: [],
    });
  } catch (error) {
    console.log(error);
  }
};

const addStaff = async (
  hospitalId: string,
  staffId: string,
  onDuty: boolean
) => {
  try {
    const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
    if (!hospitalSnapshot.exists) {
      throw new Error("Hospital does not exist");
    }
    const hospital = hospitalSnapshot.data();

    const userSnapshot = await db.users.where("uid", "==", staffId).get();
    if (userSnapshot.docs.length < 1) {
      throw new Error("User not found");
    }
    const user = userSnapshot.docs[0].data();

    switch (user.role) {
      case "Nurse":
        await db.hospitals.doc(hospitalId).update({
          nurses: [...hospital.nurses, user.uid],
        });
        break;
      case "Doctor":
        await db.hospitals.doc(hospitalId).update({
          doctors: [...hospital.doctors, user.uid],
        });
        break;
      case "Admin":
        throw new Error("Admins cannot be added as staff");
      default:
        throw new Error("Invalid role");
    }

    await db.staffs.doc(staffId).set({
      hospital: hospitalId,
      onDuty: onDuty,
    });
  } catch (error) {
    console.log(error);
  }
};

const updateStaff = async (
  hospitalId: string,
  staffId: string,
  onDuty: boolean
) => {
  try {
    const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
    if (!hospitalSnapshot.exists) {
      throw new Error("Hospital does not exist");
    }

    const staffSnapshot = await db.staffs.doc(staffId).get();
    if (!staffSnapshot.exists) {
      throw new Error("Staff not found");
    }
    await db.staffs.doc(staffId).update({
      hospital: hospitalId,
      onDuty: onDuty,
    });
  } catch (error) {
    console.log(error);
  }
};

const getStaffHospitalId = async (userId: string) => {
  try {
    const staffSnapshot = await db.staffs.doc(userId).get();
    if (!staffSnapshot.exists) {
      throw new Error("No Staff Found");
    }
    return staffSnapshot.data().hospital;
  } catch (error) {
    console.log(error);
  }
};

const updateCapacity = async (hospitalId: string, capacity: number) => {
  try {
    const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
    if (!hospitalSnapshot.exists) {
      throw new Error("Hospital does not exist");
    }
    await db.hospitals.doc(hospitalId).update({ capacity: capacity });
  } catch (error) {
    console.log(error);
  }
};

const getOnDuty = async (hospitalId: string) => {
  const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
  if (!hospitalSnapshot.exists) {
    throw new Error("Hospital does not exist");
  }
  const staffSnapshot = await db.staffs
    .where("hospital", "==", hospitalId)
    .get();
  const staffsList = [];
  for (const staff of staffSnapshot.docs) {
    const userSnapshot = await db.users.doc(staff.id).get();
    staffsList.push(userSnapshot.data());
  }
  return staffsList;
};

const setOnDuty = async (hospitalId: string, staffId: string) => {
  try {
    const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
    if (!hospitalSnapshot.exists) {
      throw new Error("Hospital does not exist");
    }
    const staffSnapshot = await db.staffs
      .where("hospital", "==", hospitalId)
      .where("staff", "==", staffId)
      .get();
    if (staffSnapshot.empty) {
      throw new Error("Staff does not exist");
    }
    const allActiveStaffsSnapshot = await db.staffs
      .where("hospital", "==", hospitalId)
      .where("status", "==", true)
      .get();
    for (const staff of allActiveStaffsSnapshot.docs) {
      await db.staffs.doc(staff.id).update({ onDuty: false });
    }
    const staff = staffSnapshot.docs[0];
    await db.staffs.doc(staff.id).update({ onDuty: true });
  } catch (error) {
    console.log(error);
  }
};

const getUnassignedStaffs = async (hospitalId: string) => {
  const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
  if (!hospitalSnapshot.exists) {
    throw new Error("Hospital does not exist");
  }
  const hospital = hospitalSnapshot.data();
  const nurses = hospital.nurses;
  const doctors = hospital.doctors;
  const userSnapshot = await db.users.get();
  const nursesList = [];
  const doctorsList = [];
  for (const doc of userSnapshot.docs) {
    const user = doc.data();
    if (user.role === "Nurse" && !nurses.includes(user.uid)) {
      nursesList.push(user);
    } else if (user.role === "Doctor" && !doctors.includes(user.uid)) {
      doctorsList.push(user);
    }
  }
  return { nurses: nursesList, doctors: doctorsList };
};

const getNearbyHospitals = async (hospitalId: string) => {
  const currentHospitalSnapshot = await db.hospitals.doc(hospitalId).get();
  if (!currentHospitalSnapshot.exists) {
    throw new Error("Hospital does not exist");
  }
  const currentHospital = currentHospitalSnapshot.data();
  const allHospitalsSnapshot = await db.hospitals.get();
  const selectedHospitals = new PriorityQueue<{ id: string; data: Hospital }>();
  for (const doc of allHospitalsSnapshot.docs) {
    const newHospital = doc.data();
    if (doc.id !== hospitalId && newHospital.tier > currentHospital.tier) {
      const dist = distance(
        currentHospital.latitude,
        currentHospital.longitude,
        newHospital.latitude,
        newHospital.longitude
      );
      selectedHospitals.enqueue({ id: doc.id, data: newHospital }, dist);
    }
  }
  return selectedHospitals.listQueue();
};

const getPatients = async (hospitalId: string) => {
  const patientsSnapshot = await db.patients
    .where("hospital", "==", hospitalId)
    .where("active", "==", true)
    .get();
  const patientsList = [];
  for (const doc of patientsSnapshot.docs) {
    patientsList.push({ id: doc.id, data: doc.data() });
  }
  return patientsList;
};

export {
  addHospital,
  addStaff,
  updateStaff,
  getStaffHospitalId,
  updateCapacity,
  getOnDuty,
  setOnDuty,
  getUnassignedStaffs,
  getNearbyHospitals,
  getPatients,
};
