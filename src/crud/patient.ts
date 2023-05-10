import { Measurements, Patient } from "../types/types";
import { db } from "../utils/firebase";

const getRiskFactors = () => {
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
};

const getPatientById = async (patientId: string) => {
  const patientSnapshot = await db.patients.doc(patientId).get();
  if (!patientSnapshot.exists) {
    throw new Error("Patient not found");
  }
  return patientSnapshot.data();
};

const getAllPatients = async () => {
  const patientsSnapshot = await db.patients.get();
  return patientsSnapshot.docs.map((doc) => doc.data());
};

const savePatient = async (patient: Patient) => {
  await db.patients.add(patient);
};

const updatePatientActiveStatus = async (
  patientId: string,
  active: boolean
) => {
  const patientSnapshot = await db.patients.doc(patientId).get();
  if (!patientSnapshot.exists) {
    throw new Error("Patient not found");
  }
  await db.patients.doc(patientId).update({ active });
};

const updatePatientMeasurements = async (
  patientId: string,
  measurements: Measurements
) => {
  const patientSnapshot = await db.patients.doc(patientId).get();
  if (!patientSnapshot.exists) {
    throw new Error("Patient not found");
  }
  await db.patients.doc(patientId).update({ measurements });
  return await getPatientById(patientId);
};

const getPendingMeasurements = async () => {
  const patientsSnapshot = await db.patients.where("active", "==", true).get();
  const pendingMeasurements = [];
  for (const patientSnapshot of patientsSnapshot.docs) {
    const patient = patientSnapshot.data();
    const measurements = patient.measurements;
    if (!measurements) continue;
    let measurement: keyof Measurements;
    for (measurement in measurements) {
      const measurementData = measurements[measurement];
      const measurementDataLength = measurementData.length;
      if (measurementDataLength == 0) continue;
      const lastMeasurement = measurementData[measurementDataLength - 1];
      const curTimeStamp = Date.now();
      if (
        Math.ceil((curTimeStamp - lastMeasurement.recordedAt) / 60 / 1000) > 31
      ) {
        pendingMeasurements.push({
          patientId: patientSnapshot.id,
          patientName: patient.name,
          nurse: patient.nurse,
          measurementName: measurement,
        });
        break;
      }
    }
  }
  return pendingMeasurements;
};

const dischargePatient = async (patientId: string, comments: string) => {
  const patientSnapshot = await db.patients.doc(patientId).get();
  if (!patientSnapshot.exists) {
    throw new Error("Patient not found");
  }
  await db.patients.doc(patientId).update({ comments, active: false });
};

const updatePatientCriticality = async (
  patientId: string,
  criticality: number
) => {
  const patientSnapshot = await db.patients.doc(patientId).get();
  if (!patientSnapshot.exists) {
    throw new Error("Patient not found");
  }
  await db.patients.doc(patientId).update({ criticality });
};

const transferPatient = async (patientId: string, hospitalId: string) => {
  const patientSnapshot = await db.patients.doc(patientId).get();
  if (!patientSnapshot.exists) {
    throw new Error("Patient not found");
  }
  const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
  if (!hospitalSnapshot.exists) {
    throw new Error("Hospital not found");
  }
  await db.patients.doc(patientId).update({ hospital: hospitalId });
};

export {
  getRiskFactors,
  getPatientById,
  getAllPatients,
  savePatient,
  updatePatientActiveStatus,
  updatePatientMeasurements,
  getPendingMeasurements,
  dischargePatient,
  updatePatientCriticality,
  transferPatient,
};
