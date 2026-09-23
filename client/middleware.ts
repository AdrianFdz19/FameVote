import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 1. Obtener la cookie de sesión (ajusta el nombre según cómo la guardes)
  const token = request.cookies.get('auth_token')?.value;

  const isAuthPage = request.nextUrl.pathname.startsWith('/auth');

  // 2. Si intenta acceder a la raíz "/" (o cualquier ruta protegida) y no hay token:
  if (!token && !isAuthPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // 3. Si ya está autenticado e intenta ir a /login o /register, redirigir al dashboard/voto
  if (token && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
} 

// Configuración del Matcher para indicar qué rutas debe interceptar el Middleware
export const config = {
  matcher: [
    /*
     * Intercepta todas las rutas excepto:
     * - api (rutas de la API)
     * - _next/static (archivos estáticos)
     * - _next/image (optimización de imágenes)
     * - favicon.ico (icono del navegador)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};