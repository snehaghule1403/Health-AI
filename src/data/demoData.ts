import type {
  User, HealthRecord, Medicine, Vaccine,
  WellnessEntry, HealthTrendEntry, EmergencyProfile, ConsentRecord
} from '../types';

// ─── DEMO USERS ──────────────────────────────────────────────────────────────

export const DEMO_USERS: User[] = [
  {
    id: 'patient-001',
    role: 'patient',
    name: 'Sneha Ghule',
    email: 'patient@healthai.demo',
    phone: '+91 98765 43210',
    dateOfBirth: '2006-03-15',
    gender: 'Female',
    bloodGroup: 'O+',
    height: 162,
    weight: 55,
  },
  {
    id: 'doctor-001',
    role: 'doctor',
    name: 'Dr. Arvind Demo',
    email: 'doctor@healthai.demo',
    phone: '+91 91234 56789',
    medicalRegistrationId: 'MH-2019-04521',
    specialization: 'General Physician',
    hospital: 'Demo Medical Center',
  },
];

export const DEMO_PASSWORDS: Record<string, string> = {
  'patient@healthai.demo': 'patient123',
  'doctor@healthai.demo': 'doctor123',
};

// ─── DEMO HEALTH RECORDS ─────────────────────────────────────────────────────

export const DEMO_RECORDS: HealthRecord[] = [
  {
    id: 'rec-001',
    patientId: 'patient-001',
    name: 'CBC Blood Report',
    type: 'Blood Report',
    date: '2026-09-10',
    hospital: 'City Diagnostic Lab',
    doctor: 'Dr. Arvind Demo',
    notes: 'Routine blood count test. Slightly low hemoglobin noted.',
    extractedText: `COMPLETE BLOOD COUNT (CBC) REPORT
Patient: Sneha Ghule   Age: 20   Gender: Female
Date: 10-Sep-2026   Lab: City Diagnostic Lab

TEST               RESULT      UNIT        REF RANGE      FLAG
─────────────────────────────────────────────────────────────
Hemoglobin         12.4        g/dL        12.0–16.0      NORMAL
WBC Count          7200        cells/mcL   4000–11000     NORMAL
RBC Count          4.2         million/mcL 3.8–5.2        NORMAL
Platelets          2.4 lakh    /mcL        1.5–4.0 lakh   NORMAL
Hematocrit         38%         %           36–46          NORMAL
MCV                80          fL          80–100         NORMAL
MCH                26          pg          27–33          LOW
MCHC               32          g/dL        32–36          NORMAL

IMPRESSION: Mild MCH reduction. Suggest dietary assessment.
Pathologist: Dr. Priya Sharma`,
    aiAnalysis: {
      summary: 'Your CBC blood report from September 2026 shows mostly normal values. There is a slight reduction in MCH (Mean Corpuscular Hemoglobin) which may indicate mild iron-related changes.',
      keyFindings: [
        'Hemoglobin is within normal range at 12.4 g/dL',
        'MCH is slightly low at 26 pg (normal: 27–33 pg)',
        'WBC count is normal indicating no active infection signs',
        'Platelet count is healthy at 2.4 lakh/mcL',
      ],
      importantValues: [
        { name: 'Hemoglobin', value: '12.4 g/dL', status: 'normal' },
        { name: 'WBC Count', value: '7200 cells/mcL', status: 'normal' },
        { name: 'MCH', value: '26 pg', status: 'low' },
        { name: 'Platelets', value: '2.4 lakh/mcL', status: 'normal' },
      ],
      simpleExplanation: 'Think of MCH as the amount of hemoglobin packed into each red blood cell. When it\'s slightly low, it can sometimes be related to iron or B12 levels. Your other values look healthy.',
      questionsForDoctor: [
        'Should I take an iron supplement?',
        'Is my hemoglobin level adequate for my age?',
        'Should I repeat this test in 3 months?',
        'Are there any dietary changes you recommend?',
      ],
      disclaimer: 'This AI analysis is for informational purposes only and does not replace professional medical advice. Always consult your doctor.',
      generatedAt: '2026-09-10T10:30:00Z',
    },
  },
  {
    id: 'rec-002',
    patientId: 'patient-001',
    name: 'MRI Brain Scan',
    type: 'MRI',
    date: '2026-08-22',
    hospital: 'Apollo Imaging Center',
    doctor: 'Dr. Neha Patil (Radiologist)',
    notes: 'Headache complaint. MRI ordered for evaluation.',
    extractedText: `MRI BRAIN — RADIOLOGY REPORT
Patient: Sneha Ghule   DOB: 15-Mar-2006
Date: 22-Aug-2026   Study: MRI Brain Without Contrast
Center: Apollo Imaging Center

CLINICAL INDICATION: Recurrent headaches, no trauma history.

FINDINGS:
- Brain parenchyma appears normal in signal intensity
- No space-occupying lesion identified
- Ventricles and sulci are normal in size and configuration
- No midline shift
- Cerebellum and brainstem appear normal
- No restricted diffusion
- Calvarium and visualized orbits appear unremarkable

IMPRESSION:
Normal MRI study of the brain.
No acute intracranial pathology identified.

Reporting Radiologist: Dr. Neha Patil, MD Radiology`,
  },
  {
    id: 'rec-003',
    patientId: 'patient-001',
    name: 'Lipid Profile',
    type: 'Blood Report',
    date: '2026-07-15',
    hospital: 'City Diagnostic Lab',
    doctor: 'Dr. Arvind Demo',
    notes: 'Annual lipid screening.',
    extractedText: `LIPID PROFILE REPORT
Patient: Sneha Ghule   Age: 20   Date: 15-Jul-2026

TEST                    RESULT    UNIT     REF RANGE       STATUS
──────────────────────────────────────────────────────────────────
Total Cholesterol       168       mg/dL    < 200           NORMAL
LDL Cholesterol         95        mg/dL    < 130           NORMAL
HDL Cholesterol         58        mg/dL    > 40 (Female)   NORMAL
Triglycerides           112       mg/dL    < 150           NORMAL
VLDL                    22        mg/dL    < 30            NORMAL
TC/HDL Ratio            2.9                < 5.0           NORMAL

IMPRESSION: Lipid profile within acceptable range for age.`,
  },
  {
    id: 'rec-004',
    patientId: 'patient-001',
    name: 'General Prescription',
    type: 'Prescription',
    date: '2026-09-12',
    hospital: 'Demo Medical Center',
    doctor: 'Dr. Arvind Demo',
    notes: 'Vitamins prescribed for mild deficiency support.',
    extractedText: `PRESCRIPTION
Demo Medical Center | Dr. Arvind Demo | MH-2019-04521
Date: 12-Sep-2026

Patient: Sneha Ghule   Age: 20   Weight: 55 kg

Rx:
1. Tab. Vitamin D3 (60,000 IU)   — Once weekly x 8 weeks
2. Tab. Calcium Carbonate 500mg  — Twice daily x 3 months
3. Tab. Iron + Folic Acid        — Once daily x 2 months (with meals)

Advice:
- Adequate sunlight exposure
- Increase green leafy vegetables in diet
- Follow-up after 3 months with repeat CBC

[Digital Signature: Dr. Arvind Demo]`,
  },
];

// ─── DEMO MEDICINES ──────────────────────────────────────────────────────────

export const DEMO_MEDICINES: Medicine[] = [
  {
    id: 'med-001',
    patientId: 'patient-001',
    name: 'Vitamin D3 (60,000 IU)',
    dosage: '1 capsule',
    frequency: 'Weekly',
    time: ['Sunday Morning'],
    startDate: '2026-09-12',
    endDate: '2026-11-12',
    instructions: 'Take with breakfast.',
    taken: false,
  },
  {
    id: 'med-002',
    patientId: 'patient-001',
    name: 'Calcium Carbonate 500mg',
    dosage: '1 tablet',
    frequency: 'Twice daily',
    time: ['8:00 AM', '8:00 PM'],
    startDate: '2026-09-12',
    endDate: '2026-12-12',
    instructions: 'Take with meals.',
    taken: false,
  },
  {
    id: 'med-003',
    patientId: 'patient-001',
    name: 'Iron + Folic Acid',
    dosage: '1 tablet',
    frequency: 'Once daily',
    time: ['1:00 PM'],
    startDate: '2026-09-12',
    endDate: '2026-11-12',
    instructions: 'Take with meals. May cause dark stools (normal).',
    taken: true,
  },
];

// ─── DEMO VACCINES ───────────────────────────────────────────────────────────

export const DEMO_VACCINES: Vaccine[] = [
  {
    id: 'vac-001',
    patientId: 'patient-001',
    name: 'COVID-19 (Covishield)',
    dose: '2nd Dose',
    date: '2022-08-10',
    hospital: 'Government Health Center',
    notes: 'Both doses completed.',
    status: 'completed',
  },
  {
    id: 'vac-002',
    patientId: 'patient-001',
    name: 'Hepatitis B',
    dose: '3rd Dose',
    date: '2021-04-20',
    hospital: 'City Hospital',
    notes: 'Series completed.',
    status: 'completed',
  },
  {
    id: 'vac-003',
    patientId: 'patient-001',
    name: 'Influenza (Flu)',
    dose: 'Annual',
    date: '2026-10-15',
    hospital: 'Demo Medical Center',
    notes: 'Annual flu shot scheduled.',
    nextDose: '2027-10-15',
    status: 'upcoming',
  },
  {
    id: 'vac-004',
    patientId: 'patient-001',
    name: 'Tdap Booster',
    dose: 'Booster',
    date: '2026-03-01',
    hospital: 'Demo Medical Center',
    notes: 'Due — not yet administered.',
    status: 'overdue',
  },
];

// ─── DEMO WELLNESS ───────────────────────────────────────────────────────────

export const DEMO_WELLNESS: WellnessEntry[] = [
  { id: 'w-001', patientId: 'patient-001', date: '2026-10-08', waterGlasses: 5, sleepHours: 7, exerciseMinutes: 30, weight: 55 },
  { id: 'w-002', patientId: 'patient-001', date: '2026-10-07', waterGlasses: 7, sleepHours: 6.5, exerciseMinutes: 20, weight: 55 },
  { id: 'w-003', patientId: 'patient-001', date: '2026-10-06', waterGlasses: 8, sleepHours: 8, exerciseMinutes: 45, weight: 55.2 },
  { id: 'w-004', patientId: 'patient-001', date: '2026-10-05', waterGlasses: 6, sleepHours: 7, exerciseMinutes: 0, weight: 55.1 },
  { id: 'w-005', patientId: 'patient-001', date: '2026-10-04', waterGlasses: 8, sleepHours: 7.5, exerciseMinutes: 60, weight: 55 },
  { id: 'w-006', patientId: 'patient-001', date: '2026-10-03', waterGlasses: 4, sleepHours: 5.5, exerciseMinutes: 0, weight: 55.3 },
  { id: 'w-007', patientId: 'patient-001', date: '2026-10-02', waterGlasses: 6, sleepHours: 7, exerciseMinutes: 30, weight: 55 },
];

// ─── DEMO HEALTH TRENDS ──────────────────────────────────────────────────────

export const DEMO_TRENDS: HealthTrendEntry[] = [
  { date: 'May 2026',  weight: 56.5, bmi: 21.5, hemoglobin: 11.8, systolic: 116, diastolic: 76, glucose: 88 },
  { date: 'Jun 2026',  weight: 56.0, bmi: 21.3, hemoglobin: 12.0, systolic: 114, diastolic: 74, glucose: 90 },
  { date: 'Jul 2026',  weight: 55.8, bmi: 21.2, hemoglobin: 12.2, systolic: 112, diastolic: 74, glucose: 87 },
  { date: 'Aug 2026',  weight: 55.5, bmi: 21.1, hemoglobin: 12.3, systolic: 115, diastolic: 75, glucose: 89 },
  { date: 'Sep 2026',  weight: 55.2, bmi: 21.0, hemoglobin: 12.4, systolic: 113, diastolic: 73, glucose: 86 },
  { date: 'Oct 2026',  weight: 55.0, bmi: 20.9, hemoglobin: 12.4, systolic: 112, diastolic: 72, glucose: 85 },
];

// ─── DEMO EMERGENCY PROFILE ──────────────────────────────────────────────────

export const DEMO_EMERGENCY: EmergencyProfile = {
  patientId: 'patient-001',
  bloodGroup: 'O+',
  allergies: ['Penicillin', 'Dust mites'],
  activeMedicines: ['Vitamin D3', 'Calcium Carbonate', 'Iron + Folic Acid'],
  emergencyContact: { name: 'Sushila Ghule', phone: '+91 98000 11122', relation: 'Mother' },
  conditions: ['Mild Iron Deficiency', 'Vitamin D Insufficiency'],
};

// ─── DEMO CONSENT ────────────────────────────────────────────────────────────

export const DEMO_CONSENT: ConsentRecord[] = [
  {
    id: 'con-001',
    patientId: 'patient-001',
    doctorId: 'doctor-001',
    doctorName: 'Dr. Arvind Demo',
    hospital: 'Demo Medical Center',
    accessType: 'Full Medical Records',
    status: 'granted',
    grantedAt: '2026-09-12T09:00:00Z',
    history: [
      { action: 'Access Requested', timestamp: '2026-09-12T08:50:00Z' },
      { action: 'Access Granted', timestamp: '2026-09-12T09:00:00Z' },
      { action: 'Records Viewed', timestamp: '2026-09-12T09:05:00Z' },
    ],
  },
];
