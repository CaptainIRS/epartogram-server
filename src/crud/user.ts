import { Role, User } from "../types/types";
import { auth, db } from "../utils/firebase";

const getUserByEmail = async (email: string) => {
  const userSnapshot = await db.users.where("email", "==", email).get();
  if (userSnapshot.empty) {
    throw new Error("User not found");
  }
  const user = userSnapshot.docs[0];
  return user.data();
};

const getUsersOnDuty = async (hospitalId: string) => {
  const hospitalSnapshot = await db.hospitals.doc(hospitalId).get();
  if (!hospitalSnapshot.exists) {
    throw new Error("Hospital not found");
  }
  const staffSnapshot = await db.staffs
    .where("hospital", "==", hospitalId)
    .where("onDuty", "==", true)
    .get();
  const userIds = staffSnapshot.docs.map((doc) => doc.id);
  const userSnapshot = await db.users.where("uid", "in", userIds).get();
  const users = userSnapshot.docs.map((doc) => doc.data());
  return users;
};

const createUser = async (
  email: string,
  password: string,
  role: Role,
  name: string
) => {
  const user = await auth.createUser({
    email,
    password,
  });
  await auth.setCustomUserClaims(user.uid, { role });
  await db.users.doc(user.uid).set({
    uid: user.uid,
    email,
    role,
    name,
  });
  return user;
};

const updateUser = async (email: string, user: User) => {
  const userSnapshot = await db.users.where("email", "==", email).get();
  if (userSnapshot.empty) {
    throw new Error("User not found");
  }
  const userDoc = userSnapshot.docs[0];
  const uid = userDoc.id;
  await db.users.doc(uid).set(user, { merge: true });
};

export { getUserByEmail, getUsersOnDuty, createUser, updateUser };
