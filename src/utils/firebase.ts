import admin from "firebase-admin";

import serviceAccount from "../../serviceAccountKey.json";
import { Hospital, User, Staff, Patient } from "../types/types";

admin.initializeApp({
  credential: admin.credential.cert({
    privateKey: serviceAccount.private_key,
    clientEmail: serviceAccount.client_email,
    projectId: serviceAccount.project_id,
  }),
});

const auth = admin.auth();
const firestore = admin.firestore();
const fcm = admin.messaging();
const appCheck = admin.appCheck();

const converter = <T>() => ({
  toFirestore: (data: T) => data,
  fromFirestore: (snap: FirebaseFirestore.QueryDocumentSnapshot) =>
    snap.data() as T,
});

const typedCollection = <T>(name: string) =>
  firestore.collection(name).withConverter(converter<T>());

const db = {
  hospitals: typedCollection<Hospital>("hospitals"),
  users: typedCollection<User>("users"),
  staffs: typedCollection<Staff>("staffs"),
  patients: typedCollection<Patient>("patients"),
};

export { db, auth, firestore, fcm, appCheck };
