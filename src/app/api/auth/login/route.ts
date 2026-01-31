import { NextRequest, NextResponse } from 'next/server';

/**
 * Stateless nurse login for demo purposes.
 * In production, you would validate against a real database.
 *
 * For demo:
 * - Any email ending in @CareLink.com, @hospital.com, or @clinic.com
 * - Any non-empty password
 * - Creates a user object on the fly
 */

// Simple ID generator
function generateId(): string {
  return `nurse_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

// Valid nurse email domains for demo
const NURSE_EMAIL_DOMAINS = [
  '@CareLink.com',
  '@hospital.com',
  '@clinic.com',
  '@health.gov',
  '@clearwaterridge.ca',
];

function isNurseEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  return NURSE_EMAIL_DOMAINS.some(domain => normalizedEmail.endsWith(domain));
}

function formatName(email: string): string {
  const localPart = email.split('@')[0];
  return localPart
    .replace(/[._-]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if this is a valid nurse email domain
    if (!isNurseEmail(normalizedEmail)) {
      return NextResponse.json({
        error: 'Invalid credentials. Healthcare providers must use an organizational email.',
        hint: 'Demo: Use an email ending in @CareLink.com, @hospital.com, or @clinic.com'
      }, { status: 401 });
    }

    // For demo, accept any non-empty password for valid nurse emails
    // In production, you would validate against a real password hash

    // Create user object
    const user = {
      id: generateId(),
      email: normalizedEmail,
      name: formatName(normalizedEmail),
      role: 'nurse' as const,
      createdAt: new Date().toISOString(),
    };

    console.log('=================================');
    console.log('NURSE LOGIN SUCCESS');
    console.log(`Email: ${normalizedEmail}`);
    console.log(`Name: ${user.name}`);
    console.log('=================================');

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
