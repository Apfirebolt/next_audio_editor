import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../models/user';


async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  await mongoose.connect(process.env.MONGODB_URI);
}

export async function GET() {
  try {
    await connectDB();

    const users = await User.find().select('-password').sort({ createdAt: -1 });

    return NextResponse.json(
      { success: true, count: users.length, users },
      { status: 200 }
    );
  } catch (error) {
    console.error('Fetch users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}