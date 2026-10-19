import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Subscriber from '../../../models/subscriber'; // Adjust path based on your project structure

// Helper to handle connection pooling in Next.js serverless environment
async function connectDB() {
  if (mongoose.connection.readyState >= 1) {
    return;
  }
  
  if (!process.env.MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
  }

  await mongoose.connect(process.env.MONGODB_URI);
}

export async function POST(request) {
  try {
    // 1. Ensure database connection
    await connectDB();

    // 2. Parse request body
    const body = await request.json();
    const { email } = body;

    // 3. Basic validation
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    // 4. Save to MongoDB (schema handles lowercase and trimming)
    const newSubscriber = await Subscriber.create({ email });

    return NextResponse.json(
      { message: 'Successfully subscribed!', subscriber: newSubscriber },
      { status: 201 }
    );
  } catch (error) {
    // 5. Handle MongoDB duplicate key error code (11000)
    if (error.code === 11000) {
      return NextResponse.json(
        { error: 'This email is already on the notification list.' },
        { status: 409 }
      );
    }

    console.error('Subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again later.' },
      { status: 500 }
    );
  }
}