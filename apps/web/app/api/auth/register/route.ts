import { NextRequest } from 'next/server';
import bcrypt from 'bcryptjs';
import { connectDB } from '@/lib/db';
import { User } from '@psc/shared/models';
import { ok, err, created, serverError } from '@/lib/apiResponse';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { name, email, password } = await req.json();

    if (!name?.trim() || !email?.trim() || !password) {
      return err('Name, email, and password are required');
    }
    if (password.length < 8) {
      return err('Password must be at least 8 characters');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return err('Email already registered', 409);

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash,
      auth_provider: 'email',
      role: 'user',
    });

    return created({ id: user._id.toString(), name: user.name, email: user.email });
  } catch (e) {
    return serverError(e);
  }
}
