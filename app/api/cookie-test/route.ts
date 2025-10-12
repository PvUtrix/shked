import { NextRequest, NextResponse } from 'next/server'

// Принудительно делаем роут динамическим
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Получаем все cookies
    const cookies = request.cookies.getAll()
    
    // Создаем тестовую cookie
    const response = NextResponse.json({
      message: 'Cookie test',
      receivedCookies: cookies,
      cookieCount: cookies.length,
      headers: {
        host: request.headers.get('host'),
        origin: request.headers.get('origin'),
        referer: request.headers.get('referer'),
        'user-agent': request.headers.get('user-agent')
      }
    })
    
    // Устанавливаем тестовую cookie
    response.cookies.set('test-cookie', 'test-value', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 // 24 hours
    })
    
    return response

  } catch (error) {
    console.error('❌ Cookie test error:', error)
    return NextResponse.json({ 
      error: 'Cookie test error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
