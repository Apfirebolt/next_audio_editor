import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../../models/user'; // Adjust path to your User model

async function connectDB() {
  if (mongoose.connection.readyState >= 1) return;
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }
  await mongoose.connect(process.env.MONGODB_URI);
}

export async function POST(request) {
  try {
    await connectDB();
    const body = await request.json();
    const { username, email, password, firstName, lastName } = body;

    // Basic validation
    if (!username || !email || !password) {
      return NextResponse.json(
        { message: 'Please provide username, email, and password.' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email: email.toLowerCase().trim() }, { username: username.trim() }] 
    });

    if (existingUser) {
      return NextResponse.json(
        { message: 'User with this email or username already exists.' },
        { status: 409 }
      );
    }

    // Create new user (Mongoose pre-save hook handles password hashing automatically)
    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      password,
      firstName: firstName || "",
      lastName: lastName || "",
    });

    // Omit password from response
    const userResponse = {
      id: newUser._id,
      username: newUser.username,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      isAdmin: newUser.isAdmin,
      createdAt: newUser.createdAt,
    };

    return NextResponse.json(
      { message: 'Account created successfully', user: userResponse },
      { status: 201 }
    );
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { message: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}