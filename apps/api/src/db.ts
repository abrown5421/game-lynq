import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

function getProjectName(): string {
  const packageJsonPath = path.resolve(process.cwd(), 'package.json');
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    return packageJson.name || 'mern-fsa-starter';
  }
  return 'mern-fsa-starter';
}

const projectName = getProjectName();
const mongoURI = process.env.MONGO_URI || `mongodb://127.0.0.1:27017/${projectName}`;

export const connectDB = async () => {
  try {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(mongoURI);
    }
    console.log(`MongoDB connected to database: ${projectName}`);
  } catch (err) {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  }
};
