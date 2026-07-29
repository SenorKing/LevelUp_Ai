const mongoose = require('mongoose');

async function connectDb() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected!');
  } catch (err) {
    console.error('Database connection failed');
    console.error(err);
  }
}

module.exports = connectDb;
