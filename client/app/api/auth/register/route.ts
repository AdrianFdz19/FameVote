// app/api/auth/register/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // 1. Verify if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'El usuario ya se encuentra registrado' },
        { status: 409 }
      );
    }

    // 2. Hash password (salt factor = 10)
    const passwordHash = await bcrypt.hash(password, 10);

    // 3. Insert new user into PostgreSQL
    const result = await pool.query(
      'INSERT INTO users (email, password_hash, updated_at) VALUES ($1, $2, NOW()) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    const newUser = result.rows[0];

    return NextResponse.json(
      { message: 'Usuario registrado exitosamente', user: newUser },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Error en /api/auth/register:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}