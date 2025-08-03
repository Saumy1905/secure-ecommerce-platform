const mongoose = require('mongoose');
const Product = require('../models/Product');
const connectDB = require('../config/db');
require('dotenv').config();

// Sample product data
const products = [
  {
    name: 'Smartphone XYZ',
    description: 'High-end smartphone with advanced features and security.',
    price: 799.99,
    category: 'Electronics',
    imageUrl: 'images/products/smartphone.jpg',
    inStock: true
  },
  {
    name: 'Laptop Pro',
    description: 'Professional grade laptop with secure boot and encryption features.',
    price: 1299.99,
    category: 'Electronics',
    imageUrl: 'images/products/laptop.jpg',
    inStock: true
  },
  {
    name: 'Security Camera',
    description: 'HD security camera with motion detection and encrypted data transmission.',
    price: 129.99,
    category: 'Electronics',
    imageUrl: 'images/products/camera.jpg',
    inStock: true
  },
  {
    name: 'Secure External Hard Drive',
    description: 'Encrypted external hard drive with hardware authentication.',
    price: 89.99,
    category: 'Electronics',
    imageUrl: 'images/products/hard-drive.jpg',
    inStock: true
  },
  {
    name: 'T-Shirt',
    description: 'Cotton t-shirt with cybersecurity themes.',
    price: 24.99,
    category: 'Clothing',
    imageUrl: 'images/products/tshirt.jpg',
    inStock: true
  },
  {
    name: 'Cybersecurity Handbook',
    description: 'Comprehensive guide to modern cybersecurity practices.',
    price: 34.99,
    category: 'Books',
    imageUrl: 'images/products/book.jpg',
    inStock: true
  },
  {
    name: 'Smart Lock',
    description: 'Wi-Fi enabled smart lock with advanced encryption.',
    price: 149.99,
    category: 'Home & Kitchen',
    imageUrl: 'images/products/smart-lock.jpg',
    inStock: true
  },
  {
    name: 'Password Manager Subscription',
    description: 'One-year subscription to a secure password management service.',
    price: 39.99,
    category: 'Other',
    imageUrl: 'images/products/password-manager.jpg',
    inStock: true
  }
];

const importData = async () => {
  try {
    await connectDB();
    
    await Product.deleteMany();
    
    await Product.insertMany(products);
    
    console.log('Data Imported!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const deleteData = async () => {
  try {
    await connectDB();
    
    await Product.deleteMany();
    
    console.log('Data Destroyed!');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

if (process.argv[2] === '-i') {
  importData();
} else if (process.argv[2] === '-d') {
  deleteData();
} else {
  console.log('Please use the correct command: \n -i to import data \n -d to delete data');
  process.exit();
}