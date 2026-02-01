import { getDatabase } from './db';
import { v4 as uuidv4 } from 'uuid';
import { Patient, FacilityId } from './db/schema';
import { hashPassword } from './auth';

// Demo password for all preset accounts
const DEMO_PASSWORD = 'demo123';

// Patient seed data with hardcoded IDs matching login API
const samplePatients: Array<Omit<Patient, 'createdAt' | 'updatedAt' | 'passwordHash'>> = [
  {
    id: 'demo-patient-margaret',
    name: 'Margaret Thompson',
    email: 'margaret@patient.demo',
    phone: '+1-555-0101',
    dateOfBirth: '1952-03-15',
    healthCardNumber: 'ON-9876543210',
    preferredLanguage: 'en',
    preferredFacilityId: 'regional-hospital',
    communicationPreference: 'both',
    address: '45 Lakeside Dr, Clearwater Bay, ON',
    emergencyContactName: 'John Thompson',
    emergencyContactPhone: '+1-555-0111',
  },
  {
    id: 'demo-patient-james',
    name: 'James Whitehorse',
    email: 'james@patient.demo',
    phone: '+1-555-0102',
    dateOfBirth: '1978-08-22',
    healthCardNumber: 'ON-8765432109',
    preferredLanguage: 'en',
    preferredFacilityId: 'specialist-clinic',
    communicationPreference: 'sms',
    address: '12 Pine Ridge Rd, Kenora, ON',
    emergencyContactName: 'Mary Whitehorse',
    emergencyContactPhone: '+1-555-0112',
  },
  {
    id: 'demo-patient-sarah',
    name: 'Sarah Running Bear',
    email: 'sarah@patient.demo',
    phone: '+1-555-0103',
    dateOfBirth: '1990-11-08',
    preferredLanguage: 'cree',
    preferredFacilityId: 'mental-health-center',
    communicationPreference: 'email',
    address: '88 Northern Lights Ave, Dryden, ON',
  },
  {
    id: 'demo-patient-robert',
    name: 'Robert Chen',
    email: 'robert@patient.demo',
    phone: '+1-555-0104',
    dateOfBirth: '1985-05-30',
    healthCardNumber: 'ON-7654321098',
    preferredLanguage: 'en',
    preferredFacilityId: 'community-health',
    communicationPreference: 'both',
    address: '23 Birch St, Clearwater Bay, ON',
  },
  {
    id: 'demo-patient-emily',
    name: 'Emily Blackwood',
    email: 'emily@patient.demo',
    phone: '+1-555-0105',
    dateOfBirth: '1968-02-14',
    healthCardNumber: 'ON-6543210987',
    preferredLanguage: 'en',
    preferredFacilityId: 'specialist-clinic',
    communicationPreference: 'sms',
    address: '56 Forest Trail, Thunder Bay, ON',
    emergencyContactName: 'David Blackwood',
    emergencyContactPhone: '+1-555-0115',
    accessibilityNeeds: 'Requires wheelchair access',
  },
  {
    id: 'demo-patient-william',
    name: 'William Frost',
    email: 'william@patient.demo',
    phone: '+1-555-0106',
    dateOfBirth: '1975-09-03',
    preferredLanguage: 'en',
    preferredFacilityId: 'specialist-clinic',
    communicationPreference: 'both',
    address: '34 Logger Lane, Red Lake, ON',
  },
  {
    id: 'demo-patient-dorothy',
    name: 'Dorothy Clearsky',
    email: 'dorothy@patient.demo',
    phone: '+1-555-0107',
    dateOfBirth: '1945-12-25',
    healthCardNumber: 'ON-5432109876',
    preferredLanguage: 'ojibwe',
    preferredFacilityId: 'regional-hospital',
    communicationPreference: 'both',
    address: '67 Elder Circle, Sioux Lookout, ON',
    emergencyContactName: 'Michael Clearsky',
    emergencyContactPhone: '+1-555-0117',
    accessibilityNeeds: 'Hard of hearing - prefers written communication',
  },
];

// Nurse seed data with hardcoded IDs for referral linking
const sampleNurses = [
  {
    id: 'demo-nurse-sarah',
    name: 'Sarah Mitchell, RN',
    email: 'nurse@carelink.demo',
    phone: '(867) 555-3847',
  },
  {
    id: 'demo-nurse-james',
    name: 'James Makwa, RN',
    email: 'james@carelink.demo',
    phone: '(867) 555-6192',
  },
  {
    id: 'demo-nurse-linda',
    name: 'Linda Chen, RN',
    email: 'linda@carelink.demo',
    phone: '(867) 555-2784',
  },
];

export async function seedDatabase() {
  const db = await getDatabase();

  // Check if already seeded
  const existingPatients = await db.patients.find().exec();
  if (existingPatients.length > 0) {
    console.log('Database already has patient data, skipping seed');
    return false;
  }

  const now = new Date().toISOString();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  // Create patient records using their hardcoded IDs
  const patientIds: Map<string, string> = new Map();

  for (const patient of samplePatients) {
    patientIds.set(patient.name, patient.id);

    await db.patients.insert({
      ...patient,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Create nurse records in users collection with hardcoded IDs
  for (const nurse of sampleNurses) {
    await db.users.insert({
      id: nurse.id,
      email: nurse.email,
      name: nurse.name,
      role: 'nurse',
      passwordHash,
      phone: nurse.phone,
      createdAt: now,
    });
  }

  // Create referrals linked to patients and nurses
  const sampleReferrals = [
    {
      patientName: 'Margaret Thompson',
      patientPhone: '+1-555-0101',
      diagnosis: 'Atrial fibrillation with rapid ventricular response. Requires cardiology follow-up and anticoagulation management.',
      patientSummary: 'Your heart rhythm was irregular during your last visit. We\'re referring you to a heart specialist to check everything is okay and discuss treatment options.',
      createdByNurseId: 'demo-nurse-sarah',
      priority: 'critical' as const,
      status: 'pending' as const,
      facilityId: 'regional-hospital' as FacilityId,
      referralType: 'Cardiology',
      notes: 'Patient experienced palpitations during community dinner. ECG showed AFib. Started on rate control.',
      createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'James Whitehorse',
      patientPhone: '+1-555-0102',
      diagnosis: 'Type 2 diabetes with poor glycemic control. HbA1c 9.2%. Needs endocrinology consultation for insulin adjustment.',
      patientSummary: 'Your blood sugar levels need better management. You\'ll be seeing a specialist to adjust your treatment plan.',
      createdByNurseId: 'demo-nurse-james',
      priority: 'high' as const,
      status: 'scheduled' as const,
      facilityId: 'specialist-clinic' as FacilityId,
      referralType: 'Cardiology',
      appointmentDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Sarah Running Bear',
      diagnosis: 'Generalized anxiety disorder with recent increase in symptoms following community layoffs. Requesting counseling services.',
      patientSummary: 'We\'re connecting you with a counselor to help with the stress you\'ve been experiencing. Virtual appointments are available.',
      createdByNurseId: 'demo-nurse-linda',
      priority: 'medium' as const,
      status: 'pending' as const,
      facilityId: 'mental-health-center' as FacilityId,
      referralType: 'Mental Health',
      notes: 'Patient prefers virtual appointments due to stigma concerns. Has reliable internet access.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Robert Chen',
      patientPhone: '+1-555-0104',
      diagnosis: 'Post-surgical follow-up for appendectomy performed during last medical evacuation. Healing well, no complications.',
      patientSummary: 'This was a follow-up after your surgery. Everything healed well.',
      createdByNurseId: 'demo-nurse-sarah',
      priority: 'low' as const,
      status: 'completed' as const,
      facilityId: 'community-health' as FacilityId,
      referralType: 'Follow-up',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Emily Blackwood',
      patientPhone: '+1-555-0105',
      diagnosis: 'Suspected breast mass on self-exam. Urgent imaging and oncology referral needed for evaluation.',
      patientSummary: 'We found something during your exam that needs a closer look. You\'re scheduled for imaging to get more information.',
      createdByNurseId: 'demo-nurse-james',
      priority: 'critical' as const,
      status: 'scheduled' as const,
      facilityId: 'specialist-clinic' as FacilityId,
      referralType: 'Oncology',
      appointmentDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'William Frost',
      patientPhone: '+1-555-0106',
      diagnosis: 'Chronic lower back pain with radiculopathy. MRI shows L4-L5 disc herniation. Requires neurology consultation.',
      patientSummary: 'Your back pain needs specialist attention. We\'re referring you to a nerve specialist to discuss treatment options.',
      createdByNurseId: 'demo-nurse-linda',
      priority: 'medium' as const,
      status: 'pending' as const,
      facilityId: 'specialist-clinic' as FacilityId,
      referralType: 'Neurology',
      notes: 'Patient is a forestry worker. Pain affecting ability to work.',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      patientName: 'Dorothy Clearsky',
      diagnosis: 'Missed cardiology follow-up due to highway closure. Patient stable but needs rescheduling.',
      patientSummary: 'Your heart check-up was rescheduled due to the storm. Please contact us to book a new appointment.',
      createdByNurseId: 'demo-nurse-sarah',
      priority: 'high' as const,
      status: 'missed' as const,
      facilityId: 'regional-hospital' as FacilityId,
      referralType: 'Cardiology',
      notes: 'Original appointment was during January storm. Family concerned about transportation.',
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];

  for (const referral of sampleReferrals) {
    const patientId = patientIds.get(referral.patientName);
    if (!patientId) {
      console.error(`No patient ID found for ${referral.patientName}`);
      continue;
    }

    await db.referrals.insert({
      ...referral,
      id: uuidv4(),
      patientId,
      updatedAt: now,
      isSynced: Math.random() > 0.3,
    });
  }

  console.log('Database seeded with patients, nurses, and referrals');
  return true;
}

export async function clearDatabase() {
  const db = await getDatabase();

  const referrals = await db.referrals.find().exec();
  for (const doc of referrals) {
    await doc.remove();
  }

  const patients = await db.patients.find().exec();
  for (const doc of patients) {
    await doc.remove();
  }

  const users = await db.users.find().exec();
  for (const doc of users) {
    await doc.remove();
  }

  console.log('Database cleared');
}

export { DEMO_PASSWORD };
