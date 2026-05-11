const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('./models/User');

dotenv.config();

const users = [
  {
    fullName: 'System Admin',
    email: 'admin@example.com',
    password: '123456',
    phone: '0000000000',
    role: 'admin',
    is_active: true
  },
  {
    fullName: 'Thang Vu',
    email: 'vuthang@example.com',
    password: 'password123',
    phone: '0123456789',
    role: 'user',
    is_active: true
  }
];

const seedData = async () => {
  console.log('Starting seed data script...');
  const uri = process.env.MONGO_URI.replace('localhost', '127.0.0.1');
  console.log('URI:', uri);
  
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000
    });
    console.log('Connected to MongoDB successfully');

    for (const userData of users) {
      const existingUser = await User.findOne({ email: userData.email });

      if (existingUser) {
        console.log(`User ${userData.email} already exists. Updating password...`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        await User.findOneAndUpdate({ email: userData.email }, { password: hashedPassword, is_active: true, role: userData.role });
      } else {
        console.log(`Creating user: ${userData.email}`);
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        
        const newUser = new User({
          ...userData,
          password: hashedPassword
        });
        await newUser.save();
      }
    }

    console.log('Seed data completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error during seeding:', error.message);
    process.exit(1);
  }
};

seedData();
