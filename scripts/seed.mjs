// Creates fictional demo data: 12 verified doctors, 12 patients, records,
// wellness entries, measurements, medicines, vaccines and consents.
//
// Usage (locally only — never deploy the service role key):
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SEED_PASSWORD=... npm run seed
// Re-running skips users that already exist. Delete them in Supabase → Auth to reset.
import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.SEED_PASSWORD;
const DOCTORS = Number(process.env.SEED_DOCTORS ?? 12);
const PATIENTS = Number(process.env.SEED_PATIENTS ?? 12);

if (!url || !key || !password || password.length < 8) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and SEED_PASSWORD (8+ chars).');
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });

const FIRST = ['Aarav', 'Diya', 'Kabir', 'Meera', 'Rohan', 'Ananya', 'Vihaan', 'Isha', 'Arjun', 'Kavya', 'Neel', 'Tara', 'Dev', 'Riya', 'Sam'];
const LAST = ['Test', 'Sample', 'Demo', 'Fictional', 'Example'];
const SPECS = ['General Physician', 'Cardiologist', 'Endocrinologist', 'Pediatrician', 'Dermatologist', 'Neurologist'];
const HOSPITALS = ['Sample City Hospital', 'Example Health Clinic', 'Fictional Care Centre'];
const pick = (arr, i) => arr[i % arr.length];
const day = (offset) => new Date(Date.now() - offset * 864e5).toISOString().split('T')[0];

async function ensureUser(email, meta) {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: meta });
  if (!error) return data.user.id;
  if (!/already|registered|exists/i.test(error.message)) throw error;
  // Existing user: find id via profiles.
  const { data: p } = await db.from('profiles').select('id').eq('email', email).single();
  return p?.id ?? null;
}

const reportText = (i) => `SAMPLE DIAGNOSTICS LAB (fictional)
Patient: Test Patient ${i + 1}
Complete Blood Count
Hemoglobin: ${(11.5 + (i % 5) * 0.4).toFixed(1)} g/dL   (Ref: 12.0 - 15.5)
WBC Count: ${6000 + i * 150} /cumm   (Ref: 4000 - 11000)
Platelets: ${2.1 + (i % 4) * 0.2} lakh/cumm   (Ref: 1.5 - 4.5)
Fasting Blood Glucose: ${88 + (i % 6) * 4} mg/dL   (Ref: 70 - 99)`;

async function main() {
  const doctorIds = [];
  for (let i = 0; i < DOCTORS; i++) {
    const id = await ensureUser(`doctor${i + 1}@healthai.test`, {
      role: 'doctor', name: `Dr. ${pick(FIRST, i + 3)} ${pick(LAST, i)}`, specialization: pick(SPECS, i),
      hospital: pick(HOSPITALS, i), medical_registration_id: `TEST-REG-${1000 + i}`,
    });
    if (id) { doctorIds.push(id); await db.from('profiles').update({ doctor_verified: true }).eq('id', id); }
  }
  console.log(`Doctors ready: ${doctorIds.length}`);

  let patients = 0;
  for (let i = 0; i < PATIENTS; i++) {
    const email = `patient${i + 1}@healthai.test`;
    const id = await ensureUser(email, {
      role: 'patient', name: `${pick(FIRST, i)} ${pick(LAST, i + 1)}`, gender: i % 2 ? 'Male' : 'Female',
      blood_group: pick(['O+', 'A+', 'B+', 'AB+', 'O-'], i), date_of_birth: `19${80 + (i % 20)}-0${1 + (i % 9)}-15`,
    });
    if (!id) continue;
    patients++;
    const { count } = await db.from('medical_records').select('id', { count: 'exact', head: true }).eq('patient_id', id);
    if (count) continue; // already seeded

    await db.from('profiles').update({ height_cm: 155 + (i % 25) }).eq('id', id);
    await db.from('medical_records').insert(Array.from({ length: 3 + (i % 10) }, (_, r) => ({
      patient_id: id, name: `Blood Test #${r + 1}`, type: r % 4 === 3 ? 'Prescription' : 'Blood Report',
      record_date: day(30 * r + i), hospital: pick(HOSPITALS, r), doctor: 'Dr. Example',
      notes: 'Fictional seeded record', extracted_text: r % 4 === 3 ? null : reportText(i + r), ocr_status: r % 4 === 3 ? 'none' : 'done',
    })));
    await db.from('wellness_entries').insert(Array.from({ length: 21 }, (_, d) => ({
      patient_id: id, entry_date: day(d), water_glasses: 4 + ((d + i) % 6), sleep_hours: 6 + ((d + i) % 3),
      exercise_minutes: 15 * ((d + i) % 4), exercise_type: d % 2 ? 'Walking' : 'Yoga', weight_kg: d % 7 === 0 ? 55 + i - d / 14 : null,
    })));
    await db.from('health_measurements').insert(Array.from({ length: 6 }, (_, m) => [
      { patient_id: id, measured_on: day(30 * m), kind: 'hemoglobin', value: 11.6 + m * 0.15, unit: 'g/dL' },
      { patient_id: id, measured_on: day(30 * m), kind: 'glucose', value: 90 + ((m + i) % 5) * 3, unit: 'mg/dL' },
      { patient_id: id, measured_on: day(30 * m), kind: 'systolic', value: 112 + ((m + i) % 4) * 3, unit: 'mmHg' },
      { patient_id: id, measured_on: day(30 * m), kind: 'diastolic', value: 72 + ((m + i) % 4) * 2, unit: 'mmHg' },
    ]).flat());
    await db.from('medicines').insert([
      { patient_id: id, name: 'Vitamin D3 (sample)', dosage: '1 capsule', frequency: 'Weekly', times: ['09:00'], start_date: day(60) },
      { patient_id: id, name: 'Iron supplement (sample)', dosage: '1 tablet', frequency: 'Once daily', times: ['08:00'], start_date: day(90), end_date: day(10) },
    ]);
    await db.from('vaccinations').insert([
      { patient_id: id, name: 'Tetanus (sample)', dose: 'Booster', date_administered: day(400) },
      { patient_id: id, name: 'Influenza (sample)', dose: 'Annual', date_administered: day(300), next_due: day(-65) },
    ]);
    // Each patient grants access to two doctors; the first doctor gets everyone.
    const grantees = [...new Set([doctorIds[0], doctorIds[(i + 1) % doctorIds.length]])].filter(Boolean);
    await db.from('consents').insert(grantees.map(d => ({ patient_id: id, doctor_id: d, status: 'granted', granted_at: new Date().toISOString() })));
  }
  console.log(`Patients ready: ${patients}`);
  console.log(`Sign in with patientN@healthai.test / doctorN@healthai.test and your SEED_PASSWORD.`);
}

main().catch((e) => { console.error(e.message ?? e); process.exit(1); });
