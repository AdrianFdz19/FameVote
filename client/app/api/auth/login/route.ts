// app/api/auth/login/route.ts
import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import pool from '@/lib/db'; // Asegúrate de que la ruta sea correcta según tu estructura de proyecto


if (!process.env.JWT_SECRET) {
  throw new Error('CRITICAL: JWT_SECRET environment variable is not defined.');
}

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    // 1. Buscar el usuario en PostgreSQL
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // 2. Comparar la contraseña ingresada con el hash guardado
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      );
    }

    // 3. Generar el JWT firmado con la librería 'jose'
    const token = await new SignJWT({ userId: user.id, email: user.email })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('24h') // El token expira en 24 horas
      .sign(JWT_SECRET);

    // 4. Crear la respuesta y setear la cookie HttpOnly
    const response = NextResponse.json(
      {
        message: 'Sesión iniciada con éxito',
        user: { id: user.id, email: user.email },
      },
      { status: 200 }
    );

    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true, // Inaccesible mediante JavaScript en el cliente (Previene XSS)
      secure: process.env.NODE_ENV === 'production', // Solo HTTPS en producción
      sameSite: 'strict', // Mitiga ataques CSRF
      maxAge: 60 * 60 * 24, // 1 día de duración en segundos
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error en /api/auth/login:', error);
    return NextResponse.json(
      { error },
      { status: 500 }
    );
  }
}