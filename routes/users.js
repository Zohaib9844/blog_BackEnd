const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = admin.auth();

router.post('/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // 1. Create user in Firebase Auth
    const userRecord = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    // 2. Save additional user data in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      name,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 3. Generate a token for immediate login
    const token = await auth.createCustomToken(userRecord.uid);

    res.status(201).json({ 
      uid: userRecord.uid, 
      email,
      token  // Include the token in the response
    });
  } catch (error) {
    console.error('❌ Signup error:', error.message);
    res.status(400).json({ 
      error: error.message || 'Signup failed' 
    });
  }
});

// Login: Authenticate user (returns Firebase ID token)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Get Firebase ID token
    const userRecord = await auth.getUserByEmail(email);
    const token = await auth.createCustomToken(userRecord.uid);

    console.log(`✅ User logged in: ${userRecord.uid}`);
    res.status(200).json({ token, uid: userRecord.uid });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Get user profile (protected)
router.get('/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const doc = await db.collection('users').doc(uid).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json(doc.data());
  } catch (error) {
    console.error('Error fetching user:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
