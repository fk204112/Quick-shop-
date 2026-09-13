require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/quickshop";
const JWT_SECRET = process.env.JWT_SECRET || "super_secret_jwt_key_here";

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public'));

// Database Connection
mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB successfully"))
    .catch(err => console.error("MongoDB connection error:", err));

// ==================== SCHEMAS & MODELS ====================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['customer', 'admin'], default: 'customer' }
});

const User = mongoose.model('User', userSchema);

// Product Schema (Explicitly mapped to 'product' collection to match MongoDB Atlas)
const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true }
}, { collection: 'product' }); // <--- Yeh line add kar di gayi hai

const Product = mongoose.model('Product', productSchema);

// ==================== AUTH MIDDLEWARE ====================

function verifyAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        if (user.role !== 'admin') return res.status(403).json({ error: "Access denied. Admins only." });
        req.user = user;
        next();
    });
}

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: "Access denied. No token provided." });
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Invalid token." });
        req.user = user;
        next();
    });
}

// ==================== AUTH ROUTES ====================

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: "Email already registered." });

        const hashedPassword = await bcrypt.hash(password, 10);
        const role = email === "admin@quickshop.com" ? "admin" : "customer";

        const newUser = new User({ name, email, password: hashedPassword, role });
        await newUser.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (err) {
        res.status(500).json({ error: "Server error during signup" });
    }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ error: "Invalid email or password." });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: "Invalid email or password." });

        const token = jwt.sign({ id: user._id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, name: user.name, role: user.role });
    } catch (err) {
        res.status(500).json({ error: "Server error during login" });
    }
});

// Get User Profile Route
app.get('/api/auth/profile', verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) return res.status(404).json({ error: "User not found" });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: "Server error" });
    }
});

// ==================== PRODUCT ROUTES ====================

// Get all products (Public)
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch products" });
    }
});

// Add a new product (Protected: Only Admin)
app.post('/api/products', verifyAdmin, async (req, res) => {
    try {
        const { name, price, image, description } = req.body;
        const newProduct = new Product({ name, price, image, description });
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(500).json({ error: "Failed to save product" });
    }
});

// Delete a product (Protected: Only Admin)
app.delete('/api/products/:id', verifyAdmin, async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        res.json({ message: "Product deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete product" });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});