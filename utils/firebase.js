const admin = require("firebase-admin");

const serviceAccount = require("../serviceAccountKey.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const auth = admin.auth();
const firestore = admin.firestore();
const fcm = admin.messaging();

module.exports = {
    db,
    auth,
    firestore,
    fcm
}