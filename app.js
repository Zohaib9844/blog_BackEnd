const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors'); // Install with `npm install cors`
const app = express();
const port = 3000;

const serviceAccount = require('./firebase_credentials.json');

// Initialize Firebase
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Middleware
app.use(cors()); // Enable CORS
app.use(express.json());
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Routes
const usersRouter = require('./routes/users');
const blogsRouter = require('./routes/blogs');
app.use('/users', usersRouter);
app.use('/blogs', blogsRouter);

// Start server
app.listen(port, () => {
  console.log(`🚀 Server is running on http://localhost:${port}`);
});