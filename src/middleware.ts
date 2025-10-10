import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Логирование API запросов
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const start = Date.now();
    
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}`);
    
    // Продолжаем обработку запроса
    const response = NextResponse.next();
    
    // Добавляем заголовки CORS для API
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Логируем время выполнения
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname} - ${duration}ms`);
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};