const mongoose = require('mongoose');
require('dotenv').config();

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true }
}, { collection: 'product' });

const Product = mongoose.model('Product', productSchema);

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    price: 2999,
    description: "High-quality sound with active noise cancellation and long battery life.",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500"
  },
  {
    name: "Smart Fitness Watch",
    price: 1999,
    description: "Track your daily steps, heart rate, and workouts with ease.",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500"
  },
  {
    name: "Minimalist Casual Backpack",
    price: 1499,
    description: "Durable and stylish backpack suitable for college and daily travel.",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=500"
  }
];

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Database connected for seeding...");

    await Product.deleteMany({});
    await Product.insertMany(sampleProducts);
    
    console.log("Sample products added successfully!");
    mongoose.connection.close();
  } catch (err) {
    console.error("Error seeding database:", err);
    mongoose.connection.close();
  }
};

seedDB();