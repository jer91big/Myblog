import { config } from 'dotenv';
config({ path: '.env' });

import { connectDB } from '../api/config/database.js';
import { User } from '../api/models/User.js';

const makeAdmin = async (email: string) => {
  await connectDB();
  
  const user = await User.findOne({ email });
  if (!user) {
    console.log(`User with email ${email} not found`);
    process.exit(1);
  }
  
  user.role = 'admin';
  await user.save();
  
  console.log(`User ${email} is now an admin`);
  process.exit(0);
};

const email = process.argv[2] || 'admin@example.com';
makeAdmin(email);
