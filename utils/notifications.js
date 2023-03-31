const { auth, firestore, fcm } = require("./firebase");

const sendNotificationToUser = async (email, message) => {
    const user = await auth.getUserByEmail(email);
    const userDoc = await firestore.collection("users").doc(user.uid).get();
    const fcmToken = userDoc.data().fcmToken;

    const payload = {
        message,
        token: fcmToken
    };

    try {
        await fcm.send(payload);
    } catch (error) {
        console.log(error);
    }
};

const sendNotificationToUserByUID = async (uid, message) => {
    const userSnapshot = await firestore.collection("users").where("uid","==",uid).get();
    const user = userSnapshot.docs[0]
    const fcmToken = user.data().fcmToken;

    const payload = {
        message,
        token: fcmToken
    };

    try {
        await fcm.send(payload);
    } catch (error) {
        console.log(error);
    }
};

const sendNotificationToRole = async (role, message) => {
    const users = await firestore.collection("users").where("role", "==", role).get();
    const fcmTokens = users.docs.map(user => user.data().fcmToken);

    const payload = {
        message,
        tokens: fcmTokens
    };

    try {
        await fcm.sendMulticast(payload);
    } catch (error) {
        console.log(error);
    }
}

const sendNotificationToAll = async (message) => {
    const users = await firestore.collection("users").get();
    const fcmTokens = users.docs.map(user => user.data().fcmToken);

    const payload = {
        message,
        tokens: fcmTokens
    };

    try {
        await fcm.sendMulticast(payload);
    } catch (error) {
        console.log(error);
    }
}

module.exports = {
    sendNotificationToUser,
    sendNotificationToRole,
    sendNotificationToAll,
    sendNotificationToUserByUID
};
