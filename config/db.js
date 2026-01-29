const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/chat-app', {
      // Note: Mongoose 7+ doesn't need useNewUrlParser or useUnifiedTopology
      // These options are now enabled by default and cause errors if included
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      family: 4, // Use IPv4, skip trying IPv6
    });
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error(`Mongoose connection error: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('Mongoose disconnected from DB');
    });
    
    // Handle app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });
    
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    
    // If running locally and MongoDB isn't available, provide helpful message
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n MongoDB connection failed!');
      console.log('Possible solutions:');
      console.log('1. Make sure MongoDB is installed and running');
      console.log('2. For macOS: brew services start mongodb-community');
      console.log('3. For Linux: sudo systemctl start mongod');
      console.log('4. For Windows: net start MongoDB (as Administrator)');
      console.log('5. Or use MongoDB Atlas: https://www.mongodb.com/cloud/atlas');
    }
    
    process.exit(1);
  }
};

module.exports = connectDB;