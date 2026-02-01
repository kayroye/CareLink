import { NextRequest, NextResponse } from 'next/server';

// Valid nurse email domains for demo
const NURSE_EMAIL_DOMAINS = [
  '@carelink.com',
  '@carelink.demo',
  '@hospital.com',
  '@clinic.com',
  '@health.gov',
  '@clearwaterridge.ca',
];

// Demo patient domain
const PATIENT_DEMO_DOMAIN = '@patient.demo';

// Demo password for all preset accounts
const DEMO_PASSWORD = 'demo123';

// Hardcoded demo patients (matches seed-data.ts)
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

// Hardcoded demo nurses (matches seed-data.ts)
const DEMO_NURSES: Record<string, { id: string; name: string; email: string }> = {
  'nurse@carelink.demo': {
    id: 'demo-nurse-main',
    name: 'Demo Nurse',
    email: 'nurse@carelink.demo',
  },
  'admin@carelink.demo': {
    id: 'demo-nurse-admin',
    name: 'Admin Nurse',
    email: 'admin@carelink.demo',
  },
};

function isNurseEmail(email: string): boolean {
  const normalizedEmail = email.toLowerCase();
  return NURSE_EMAIL_DOMAINS.some((domain) => normalizedEmail.endsWith(domain));
}

function isPatientDemoEmail(email: string): boolean {
  return email.toLowerCase().endsWith(PATIENT_DEMO_DOMAIN);
}

function formatName(email: string): string {
  const localPart = email.split('@')[0];
  return localPart.replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function generateId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    console.log('=== LOGIN ATTEMPT ===');
    console.log('Raw email:', email);

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    console.log('Normalized email:', normalizedEmail);
    console.log('Is patient demo?', isPatientDemoEmail(normalizedEmail));
    console.log('DEMO_PATIENTS keys:', Object.keys(DEMO_PATIENTS));

    // Check for demo patient account
    if (isPatientDemoEmail(normalizedEmail)) {
      console.log('-> Entering patient demo path');
      const patient = DEMO_PATIENTS[normalizedEmail];
      console.log('Patient lookup result:', patient);

      if (!patient) {
        return NextResponse.json(
          { error: 'Patient account not found. Use a demo account like margaret@patient.demo' },
          { status: 401 }
        );
      }

      // Verify demo password
      if (password !== DEMO_PASSWORD) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
      }

      const user = {
        id: patient.id,
        email: patient.email,
        name: patient.name,
        role: 'patient' as const,
        createdAt: new Date().toISOString(),
      };

      console.log('=================================');
      console.log('PATIENT LOGIN SUCCESS');
      console.log(`Email: ${normalizedEmail}`);
      console.log(`Name: ${user.name}`);
      console.log('=================================');

      return NextResponse.json({ success: true, user });
    }

    // Check for demo nurse account
    if (normalizedEmail.endsWith('@carelink.demo')) {
      const nurse = DEMO_NURSES[normalizedEmail];

      if (nurse) {
        // Verify demo password
        if (password !== DEMO_PASSWORD) {
          return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
        }

        const user = {
          id: nurse.id,
          email: nurse.email,
          name: nurse.name,
          role: 'nurse' as const,
          createdAt: new Date().toISOString(),
        };

        console.log('=================================');
        console.log('NURSE LOGIN SUCCESS (Demo Account)');
        console.log(`Email: ${normalizedEmail}`);
        console.log(`Name: ${user.name}`);
        console.log('=================================');

        return NextResponse.json({ success: true, user });
      }
    }

    // Regular nurse login (non-demo organizational emails)
    if (!isNurseEmail(normalizedEmail)) {
      return NextResponse.json(
        {
          error: 'Invalid credentials. Healthcare providers must use an organizational email.',
          hint: 'Demo: Use nurse@carelink.demo or an email ending in @hospital.com',
        },
        { status: 401 }
      );
    }

    // For non-demo nurse domains, accept any password (demo mode)
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
