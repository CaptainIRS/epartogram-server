import { auth, firestore, fcm, db } from "./firebase";

const sendNotificationToUser = async (email: string, message: string) => {
  const user = await auth.getUserByEmail(email);
  const userSnapshot = await db.users.doc(user.uid).get();
  const fcmToken = userSnapshot.data().fcmToken;

  const payload = {
    message,
    token: fcmToken,
  };

  try {
    await fcm.send(payload);
  } catch (error) {
    console.log(error);
  }
};

const sendNotificationToUserByUID = async (uid: string, message: string) => {
  const userSnapshot = await db.users.where("uid", "==", uid).get();
  const user = userSnapshot.docs[0];
  const fcmToken = user.data().fcmToken;

  const payload = {
    message,
    token: fcmToken,
  };

  try {
    await fcm.send(payload);
  } catch (error) {
    console.log(error);
  }
};

const sendNotificationToRole = async (role: string, message: string) => {
  const users = await db.users.where("role", "==", role).get();
  const fcmTokens = users.docs.map((user) => user.data().fcmToken);

  const payload = {
    message,
    tokens: fcmTokens,
  };

  try {
    await fcm.sendMulticast(payload);
  } catch (error) {
    console.log(error);
  }
};

const sendNotificationToAll = async (message: string) => {
  const users = await db.users.get();
  const fcmTokens = users.docs.map((user) => user.data().fcmToken);

  const payload = {
    message,
    tokens: fcmTokens,
  };

  try {
    await fcm.sendMulticast(payload);
  } catch (error) {
    console.log(error);
  }
};

export {
  sendNotificationToUser,
  sendNotificationToRole,
  sendNotificationToAll,
  sendNotificationToUserByUID,
};
