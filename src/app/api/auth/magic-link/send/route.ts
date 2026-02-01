import { NextRequest, NextResponse } from 'next/server';
import { generateMagicLink } from '@/lib/auth/magic-link';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 });
    }

    // Get base URL from request headers (works on localhost and LAN)
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const host = request.headers.get('host') || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    const { token, url } = generateMagicLink(email, baseUrl);

    // For demo purposes, log the magic link to console
    console.log('=================================');
    console.log('MAGIC LINK GENERATED');
    console.log(`Email: ${email}`);
    console.log(`URL: ${url}`);
    console.log('=================================');

    // In production, this would send an email via Resend/Twilio/SendGrid
    // For demo, we always return the URL so users can test the flow
    return NextResponse.json({
      success: true,
      message: 'Magic link generated',
      demo: true,
      url,
    });
  } catch (error) {
    console.error('Magic link error:', error);
    return NextResponse.json({ error: 'Failed to generate magic link' }, { status: 500 });
  }
}
