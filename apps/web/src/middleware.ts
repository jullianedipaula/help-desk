import { jwtVerify } from 'jose'
import { type NextRequest, NextResponse } from 'next/server'

const ACCESS_SECRET = new TextEncoder().encode(
  process.env.JWT_ACCESS_SECRET
)

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value
  const { pathname } = request.nextUrl

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET)

    if (pathname.startsWith('/admin') && payload.role !== 'admin') {
      return NextResponse.redirect(new URL('/chamados', request.url))
    }

    return NextResponse.next()
  } catch {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/chamados/:path*', '/perfil/:path*', '/admin/:path*'],
}
