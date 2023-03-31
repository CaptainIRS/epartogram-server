const express = require('express');
const router = express.Router();

const { auth, firestore, appCheck } = require('../utils/firebase');

router.post('/register', async (req, res) => {
    // const appCheckToken = req.header('X-Firebase-AppCheck');
    // if (!appCheckToken) {
    //     return res.status(400).json({ error: 'Missing App Check token' });
    // }
    // try {
    //     await appCheck.verifyToken(appCheckToken);
    // } catch (error) {
    //     return res.status(400).json(error);
    // }
    const { email, password, role, name } = req.body;
    if (!email || !password || !role || !name) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    if (role !== 'Admin' && role !== 'Doctor' && role !== 'Nurse') {
        return res.status(400).json({ error: 'Invalid role' });
    }
    try {
        const user = await auth.createUser({
            email,
            password
        });
        await auth.setCustomUserClaims(user.uid, { role });
        await firestore.collection('users').add({
            uid: user.uid,
            email,
            role,
            name
        });
    } catch (error) {
        return res.status(400).json(error);
    }
    return res.status(201).json({ message: 'User created' });
});

router.get('/roles', function(req, res, next) {
    res.json(['Admin', 'Nurse', 'Doctor']);
});

router.post('/fcm-token', async (req, res) => {
    const { token, fcmToken } = req.body;
    if (!token || !fcmToken) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        const claims = await auth.verifyIdToken(token);
        await firestore.collection('users').doc(claims.uid).update({
            fcmToken
        });
    } catch (error) {
        return res.status(400).json(error);
    }
});


module.exports = router;
