const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const DEFAULT_PASSWORD = 'Password123!';

/**
 * @param {import('knex').Knex} knex
 */
exports.seed = async function (knex) {
  const hash = await bcrypt.hash(DEFAULT_PASSWORD, 12);
  const now = new Date().toISOString();

  // ─── Helper ──────────────────────────────────────────────────────
  const id = () => uuidv4();

  // ─── IDs (pre-generated so we can reference them) ────────────────
  const superAdminId = id();

  const doctor1UserId = id();
  const doctor2UserId = id();
  const doctor3UserId = id();
  const doctor4UserId = id();
  const doctor5UserId = id();

  const patient1UserId = id();
  const patient2UserId = id();
  const patient3UserId = id();

  const family1UserId = id();
  const family2UserId = id();

  const doctor1Id = id();
  const doctor2Id = id();
  const doctor3Id = id();
  const doctor4Id = id();
  const doctor5Id = id();

  const patient1Id = id();
  const patient2Id = id();
  const patient3Id = id();

  const hospital1Id = id();
  const hospital2Id = id();
  const hospital3Id = id();

  // Specialization IDs
  const specIds = {
    cardiology: id(),
    neurology: id(),
    orthopedics: id(),
    pediatrics: id(),
    dermatology: id(),
    ophthalmology: id(),
    gynecology: id(),
    psychiatry: id(),
    gastroenterology: id(),
    endocrinology: id(),
  };

  // ─── Clear tables (reverse dependency order) ────────────────────
  await knex('audit_logs').del();
  await knex('refresh_tokens').del();
  await knex('notifications').del();
  await knex('health_readings').del();
  await knex('consents').del();
  await knex('family_links').del();
  await knex('medication_doses').del();
  await knex('medications').del();
  await knex('prescription_items').del();
  await knex('prescriptions').del();
  await knex('appointments').del();
  await knex('hospital_doctors').del();
  await knex('doctors').del();
  await knex('specializations').del();
  await knex('hospitals').del();
  await knex('patients').del();
  await knex('users').del();

  // ═══════════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════════
  await knex('users').insert([
    // Super Admin
    {
      id: superAdminId,
      email: 'admin@elderguardian.in',
      phone: '+919000000001',
      password_hash: hash,
      first_name: 'System',
      last_name: 'Administrator',
      role: 'SUPER_ADMIN',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    // Doctors
    {
      id: doctor1UserId,
      email: 'dr.arun.sharma@elderguardian.in',
      phone: '+919100000001',
      password_hash: hash,
      first_name: 'Arun',
      last_name: 'Sharma',
      role: 'DOCTOR',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor2UserId,
      email: 'dr.priya.nair@elderguardian.in',
      phone: '+919100000002',
      password_hash: hash,
      first_name: 'Priya',
      last_name: 'Nair',
      role: 'DOCTOR',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor3UserId,
      email: 'dr.rajesh.kumar@elderguardian.in',
      phone: '+919100000003',
      password_hash: hash,
      first_name: 'Rajesh',
      last_name: 'Kumar',
      role: 'DOCTOR',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor4UserId,
      email: 'dr.sunita.reddy@elderguardian.in',
      phone: '+919100000004',
      password_hash: hash,
      first_name: 'Sunita',
      last_name: 'Reddy',
      role: 'DOCTOR',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor5UserId,
      email: 'dr.vikram.patel@elderguardian.in',
      phone: '+919100000005',
      password_hash: hash,
      first_name: 'Vikram',
      last_name: 'Patel',
      role: 'DOCTOR',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    // Patients
    {
      id: patient1UserId,
      email: 'ramesh.iyer@gmail.com',
      phone: '+919200000001',
      password_hash: hash,
      first_name: 'Ramesh',
      last_name: 'Iyer',
      role: 'PATIENT',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: patient2UserId,
      email: 'lakshmi.devi@gmail.com',
      phone: '+919200000002',
      password_hash: hash,
      first_name: 'Lakshmi',
      last_name: 'Devi',
      role: 'PATIENT',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: patient3UserId,
      email: 'suresh.menon@gmail.com',
      phone: '+919200000003',
      password_hash: hash,
      first_name: 'Suresh',
      last_name: 'Menon',
      role: 'PATIENT',
      is_active: true,
      is_verified: false,
      created_at: now,
      updated_at: now,
    },
    // Family Members
    {
      id: family1UserId,
      email: 'anita.iyer@gmail.com',
      phone: '+919300000001',
      password_hash: hash,
      first_name: 'Anita',
      last_name: 'Iyer',
      role: 'FAMILY_MEMBER',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
    {
      id: family2UserId,
      email: 'karthik.devi@gmail.com',
      phone: '+919300000002',
      password_hash: hash,
      first_name: 'Karthik',
      last_name: 'Subramaniam',
      role: 'FAMILY_MEMBER',
      is_active: true,
      is_verified: true,
      created_at: now,
      updated_at: now,
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 2. PATIENTS
  // ═══════════════════════════════════════════════════════════════════
  await knex('patients').insert([
    {
      id: patient1Id,
      user_id: patient1UserId,
      date_of_birth: '1952-03-15',
      gender: 'MALE',
      blood_group: 'B+',
      height_cm: 170,
      weight_kg: 72,
      emergency_contact_name: 'Anita Iyer',
      emergency_contact_phone: '+919300000001',
      medical_conditions: JSON.stringify(['Type 2 Diabetes', 'Hypertension']),
      allergies: JSON.stringify(['Penicillin']),
      address: '42, Anna Nagar East, 3rd Street',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600040',
      abha_id: 'ABHA-9100-0001-0001',
      created_at: now,
      updated_at: now,
    },
    {
      id: patient2Id,
      user_id: patient2UserId,
      date_of_birth: '1948-07-22',
      gender: 'FEMALE',
      blood_group: 'O+',
      height_cm: 155,
      weight_kg: 60,
      emergency_contact_name: 'Karthik Subramaniam',
      emergency_contact_phone: '+919300000002',
      medical_conditions: JSON.stringify(['Arthritis', 'Osteoporosis']),
      allergies: JSON.stringify(['Sulfa drugs', 'Aspirin']),
      address: '15, Vasant Kunj, Sector B',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110070',
      abha_id: 'ABHA-9100-0002-0002',
      created_at: now,
      updated_at: now,
    },
    {
      id: patient3Id,
      user_id: patient3UserId,
      date_of_birth: '1955-11-08',
      gender: 'MALE',
      blood_group: 'A+',
      height_cm: 165,
      weight_kg: 78,
      emergency_contact_name: 'Meera Menon',
      emergency_contact_phone: '+919200000099',
      medical_conditions: JSON.stringify(['COPD', 'Hyperlipidemia']),
      allergies: JSON.stringify([]),
      address: '88, Indiranagar, 12th Main',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560038',
      created_at: now,
      updated_at: now,
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 3. HOSPITALS
  // ═══════════════════════════════════════════════════════════════════
  await knex('hospitals').insert([
    {
      id: hospital1Id,
      name: 'Apollo Hospitals',
      registration_number: 'TN-HOSP-APL-001',
      type: 'PRIVATE',
      address: '21, Greams Lane, Off Greams Road',
      city: 'Chennai',
      state: 'Tamil Nadu',
      pincode: '600006',
      phone: '+914428293333',
      email: 'info@apollohospitals.com',
      website: 'https://www.apollohospitals.com',
      description: 'Apollo Hospitals Chennai is a multi-specialty tertiary care hospital and one of the flagship hospitals of the Apollo Hospitals Group.',
      facilities: JSON.stringify(['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Radiology', 'Blood Bank', 'Ambulance', 'Canteen']),
      rating: 4.5,
      is_active: true,
      subscription_status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    },
    {
      id: hospital2Id,
      name: 'All India Institute of Medical Sciences (AIIMS)',
      registration_number: 'DL-HOSP-AIIMS-001',
      type: 'GOVERNMENT',
      address: 'Sri Aurobindo Marg, Ansari Nagar',
      city: 'New Delhi',
      state: 'Delhi',
      pincode: '110029',
      phone: '+911126588500',
      email: 'director@aiims.edu',
      website: 'https://www.aiims.edu',
      description: 'AIIMS New Delhi is a premier medical institute and hospital established by an Act of Parliament.',
      facilities: JSON.stringify(['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Radiology', 'Blood Bank', 'Trauma Centre', 'Research Wing']),
      rating: 4.7,
      is_active: true,
      subscription_status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    },
    {
      id: hospital3Id,
      name: 'Fortis Hospital',
      registration_number: 'KA-HOSP-FRT-001',
      type: 'PRIVATE',
      address: '154/9, Bannerghatta Road, Opposite IIM-B',
      city: 'Bangalore',
      state: 'Karnataka',
      pincode: '560076',
      phone: '+918066214444',
      email: 'info.blr@fortishealthcare.com',
      website: 'https://www.fortishealthcare.com',
      description: 'Fortis Hospital Bannerghatta Road is a multi-specialty hospital offering advanced medical care in Bangalore.',
      facilities: JSON.stringify(['Emergency', 'ICU', 'Pharmacy', 'Lab', 'Radiology', 'Ambulance', 'Dialysis']),
      rating: 4.3,
      is_active: true,
      subscription_status: 'ACTIVE',
      created_at: now,
      updated_at: now,
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 4. SPECIALIZATIONS
  // ═══════════════════════════════════════════════════════════════════
  await knex('specializations').insert([
    { id: specIds.cardiology, name: 'Cardiology', description: 'Heart and cardiovascular system', icon_name: 'heart' },
    { id: specIds.neurology, name: 'Neurology', description: 'Brain, spinal cord and nervous system', icon_name: 'brain' },
    { id: specIds.orthopedics, name: 'Orthopedics', description: 'Musculoskeletal system — bones, joints, ligaments', icon_name: 'bone' },
    { id: specIds.pediatrics, name: 'Pediatrics', description: 'Medical care for infants, children and adolescents', icon_name: 'child' },
    { id: specIds.dermatology, name: 'Dermatology', description: 'Skin, hair and nail disorders', icon_name: 'hand' },
    { id: specIds.ophthalmology, name: 'Ophthalmology', description: 'Eye and vision care', icon_name: 'eye' },
    { id: specIds.gynecology, name: 'Gynecology', description: "Women's reproductive health", icon_name: 'female' },
    { id: specIds.psychiatry, name: 'Psychiatry', description: 'Mental health and behavioral disorders', icon_name: 'mind' },
    { id: specIds.gastroenterology, name: 'Gastroenterology', description: 'Digestive system and related disorders', icon_name: 'stomach' },
    { id: specIds.endocrinology, name: 'Endocrinology', description: 'Hormonal and metabolic disorders including diabetes', icon_name: 'gland' },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 5. DOCTORS
  // ═══════════════════════════════════════════════════════════════════
  await knex('doctors').insert([
    {
      id: doctor1Id,
      user_id: doctor1UserId,
      specialization_id: specIds.cardiology,
      license_number: 'MCI-TN-48201',
      qualification: 'MBBS, MD (Cardiology), DM',
      experience_years: 18,
      consultation_fee: 1500,
      bio: 'Dr. Arun Sharma is a senior interventional cardiologist with over 18 years of experience in managing complex cardiac conditions.',
      languages: JSON.stringify(['English', 'Hindi', 'Tamil']),
      is_available: true,
      rating: 4.8,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor2Id,
      user_id: doctor2UserId,
      specialization_id: specIds.neurology,
      license_number: 'MCI-KL-33105',
      qualification: 'MBBS, MD (Neurology), DM',
      experience_years: 15,
      consultation_fee: 1200,
      bio: 'Dr. Priya Nair specialises in neurological disorders with expertise in stroke management and epilepsy.',
      languages: JSON.stringify(['English', 'Hindi', 'Malayalam']),
      is_available: true,
      rating: 4.6,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor3Id,
      user_id: doctor3UserId,
      specialization_id: specIds.orthopedics,
      license_number: 'MCI-DL-27450',
      qualification: 'MBBS, MS (Orthopedics)',
      experience_years: 22,
      consultation_fee: 1000,
      bio: 'Dr. Rajesh Kumar is an orthopaedic surgeon specialising in joint replacement and sports injuries.',
      languages: JSON.stringify(['English', 'Hindi']),
      is_available: true,
      rating: 4.5,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor4Id,
      user_id: doctor4UserId,
      specialization_id: specIds.endocrinology,
      license_number: 'MCI-AP-41789',
      qualification: 'MBBS, MD (Internal Medicine), DM (Endocrinology)',
      experience_years: 12,
      consultation_fee: 1100,
      bio: 'Dr. Sunita Reddy focuses on diabetes management, thyroid disorders and metabolic syndrome in elderly patients.',
      languages: JSON.stringify(['English', 'Hindi', 'Telugu']),
      is_available: true,
      rating: 4.7,
      created_at: now,
      updated_at: now,
    },
    {
      id: doctor5Id,
      user_id: doctor5UserId,
      specialization_id: specIds.gastroenterology,
      license_number: 'MCI-GJ-55032',
      qualification: 'MBBS, MD, DM (Gastroenterology)',
      experience_years: 10,
      consultation_fee: 1300,
      bio: 'Dr. Vikram Patel specialises in gastrointestinal and liver diseases with expertise in advanced endoscopic procedures.',
      languages: JSON.stringify(['English', 'Hindi', 'Gujarati']),
      is_available: true,
      rating: 4.4,
      created_at: now,
      updated_at: now,
    },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 6. HOSPITAL ↔ DOCTOR ASSOCIATIONS
  // ═══════════════════════════════════════════════════════════════════
  await knex('hospital_doctors').insert([
    { id: id(), hospital_id: hospital1Id, doctor_id: doctor1Id, department: 'Cardiology', is_primary: true, created_at: now, updated_at: now },
    { id: id(), hospital_id: hospital1Id, doctor_id: doctor4Id, department: 'Endocrinology', is_primary: false, created_at: now, updated_at: now },
    { id: id(), hospital_id: hospital2Id, doctor_id: doctor2Id, department: 'Neurology', is_primary: true, created_at: now, updated_at: now },
    { id: id(), hospital_id: hospital2Id, doctor_id: doctor3Id, department: 'Orthopedics', is_primary: true, created_at: now, updated_at: now },
    { id: id(), hospital_id: hospital3Id, doctor_id: doctor5Id, department: 'Gastroenterology', is_primary: true, created_at: now, updated_at: now },
    { id: id(), hospital_id: hospital3Id, doctor_id: doctor1Id, department: 'Cardiology', is_primary: false, created_at: now, updated_at: now },
  ]);

  // ═══════════════════════════════════════════════════════════════════
  // 7. FAMILY LINKS
  // ═══════════════════════════════════════════════════════════════════
  await knex('family_links').insert([
    {
      id: id(),
      patient_id: patient1Id,
      family_member_id: family1UserId,
      relationship: 'DAUGHTER',
      is_primary_caregiver: true,
      can_view_health: true,
      can_manage_appointments: true,
      can_approve_refills: true,
      consent_status: 'APPROVED',
      consent_given_at: now,
      created_at: now,
      updated_at: now,
    },
    {
      id: id(),
      patient_id: patient2Id,
      family_member_id: family2UserId,
      relationship: 'SON',
      is_primary_caregiver: true,
      can_view_health: true,
      can_manage_appointments: true,
      can_approve_refills: false,
      consent_status: 'APPROVED',
      consent_given_at: now,
      created_at: now,
      updated_at: now,
    },
  ]);
};
