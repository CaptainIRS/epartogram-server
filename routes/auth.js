const express = require('express');
const router = express.Router();

const { auth } = require('../firebase');

router.post('/register', async (req, res) => {
    const { email, password, role } = req.body;
    if (!email || !password || !role) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    try {
        const user = await auth.createUser({
            email,
            password
        });
        await auth.setCustomUserClaims(user.uid, { role });
    } catch (error) {
        return res.status(400).json(error);
    }
    res.status(200).json({ message: 'User created' });
});

module.exports = router;
