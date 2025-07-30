const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

// Middleware to check authentication (for protected routes)
const isAuthenticated = (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken) {
    return res.status(401).send('Unauthorized: No token provided');
  }
  next();
};

// GET all blogs (public)
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all blogs...');
    const snapshot = await db.collection('blogs').get();
    const blogs = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Truncate content for the home page
      content: doc.data().content.substring(0, 100) + '...',
    }));
    console.log(`Retrieved ${blogs.length} blogs.`);
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error retrieving blogs:', error.message);
    res.status(500).send('Error retrieving blogs');
  }
});

// GET a single blog by ID (public)
router.get('/:id', async (req, res) => {
  try {
    const blogId = req.params.id;
    console.log(`Fetching blog with ID: ${blogId}`);
    const doc = await db.collection('blogs').doc(blogId).get();
    if (!doc.exists) {
      return res.status(404).send('Blog not found');
    }
    const blog = { id: doc.id, ...doc.data() };
    res.status(200).json(blog);
  } catch (error) {
    console.error('Error retrieving blog:', error.message);
    res.status(500).send('Error retrieving blog');
  }
});

// POST a new blog (protected)
router.post('/', isAuthenticated, async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const date = new Date().toLocaleDateString();
    console.log('Attempting to add blog:', { title, author, date });
    const docRef = await db.collection('blogs').add({
      title,
      content,
      author,
      date,
    });
    console.log(`Blog added with ID: ${docRef.id}`);
    res.status(201).send(`Blog added with ID: ${docRef.id}`);
  } catch (error) {
    console.error('Error adding blog:', error.message);
    res.status(500).send('Error adding blog');
  }
});

// PUT update a blog (protected)
router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const blogId = req.params.id;
    const { title, content } = req.body;
    console.log(`Updating blog with ID: ${blogId}`);
    await db.collection('blogs').doc(blogId).update({ title, content });
    res.status(200).send('Blog updated successfully');
  } catch (error) {
    console.error('Error updating blog:', error.message);
    res.status(500).send('Error updating blog');
  }
});

// DELETE a blog (protected)
router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const blogId = req.params.id;
    console.log(`Deleting blog with ID: ${blogId}`);
    await db.collection('blogs').doc(blogId).delete();
    res.status(200).send('Blog deleted successfully');
  } catch (error) {
    console.error('Error deleting blog:', error.message);
    res.status(500).send('Error deleting blog');
  }
});

// GET blogs by author (for admin panel)
router.get('/author/:authorId', isAuthenticated, async (req, res) => {
  try {
    const authorId = req.params.authorId;
    console.log(`Fetching blogs by author: ${authorId}`);
    const snapshot = await db
      .collection('blogs')
      .where('author', '==', authorId)
      .get();
    const blogs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching blogs by author:', error.message);
    res.status(500).send('Error fetching blogs by author');
  }
});

module.exports = router;
