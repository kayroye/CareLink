import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '@/lib/auth/magic-link';

// Demo patients with hardcoded IDs (must match seed-data.ts and login/route.ts)
const DEMO_PATIENTS: Record<string, { id: string; name: string; email: string }> = {
  'margaret@patient.demo': {
    id: 'demo-patient-margaret',
    name: 'Margaret Thompson',
    email: 'margaret@patient.demo',
  },
  'james@patient.demo': {
    id: 'demo-patient-james',
    name: 'James Whitehorse',
    email: 'james@patient.demo',
  },
  'sarah@patient.demo': {
    id: 'demo-patient-sarah',
    name: 'Sarah Running Bear',
    email: 'sarah@patient.demo',
  },
  'robert@patient.demo': {
    id: 'demo-patient-robert',
    name: 'Robert Chen',
    email: 'robert@patient.demo',
  },
  'emily@patient.demo': {
    id: 'demo-patient-emily',
    name: 'Emily Blackwood',
    email: 'emily@patient.demo',
  },
  'william@patient.demo': {
    id: 'demo-patient-william',
    name: 'William Frost',
    email: 'william@patient.demo',
  },
  'dorothy@patient.demo': {
    id: 'demo-patient-dorothy',
    name: 'Dorothy Clearsky',
    email: 'dorothy@patient.demo',
  },
};

// Simple ID generator for non-demo patients
function generateId(): string {
  return `patient_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const result = verifyMagicLink(token);

    if (!result) {
      return NextResponse.json({
        error: 'Invalid or expired token',
        code: 'INVALID_TOKEN'
      }, { status: 401 });
    }

    const normalizedEmail = result.email.toLowerCase().trim();

    // Check if this is a demo patient
    const demoPatient = DEMO_PATIENTS[normalizedEmail];

    const user = demoPatient
      ? {
          id: demoPatient.id,
          email: demoPatient.email,
          name: demoPatient.name,
          role: 'patient' as const,
          createdAt: new Date().toISOString(),
        }
      : {
          id: generateId(),
          email: result.email,
          name: result.name,
          role: 'patient' as const,
          createdAt: new Date().toISOString(),
        };

    console.log('=================================');
    console.log('MAGIC LINK VERIFIED');
    console.log(`Email: ${normalizedEmail}`);
    console.log(`Is demo patient: ${!!demoPatient}`);
    console.log(`User ID: ${user.id}`);
    console.log(`User Name: ${user.name}`);
    console.log('=================================');

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
