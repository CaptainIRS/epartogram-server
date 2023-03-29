const express = require('express');
const router = express.Router();

const { auth } = require('../utils/firebase');

// Useless route, just to test if auth is working
router.get('/', async (req, res) => {
    const { token } = req.body;
    try {
        const claims = await auth.verifyIdToken(token);
        const user = await auth.getUser(claims.uid);
        return res.status(200).json(user);
    } catch (error) {
        return res.status(400).json(error);
    }
});

module.exports = router;
