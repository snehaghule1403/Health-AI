export type UserRole = 'patient' | 'doctor';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  // Patient-specific
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  height?: number; // cm
  weight?: number; // kg
  // Doctor-specific
  medicalRegistrationId?: string;
  specialization?: string;
  hospital?: string;
}

export interface HealthRecord {
  id: string;
  patientId: string;
  name: string;
  type: 'Blood Report' | 'MRI' | 'CT Scan' | 'X-Ray' | 'Prescription' | 'Vaccination' | 'Other';
  date: string;
  hospital: string;
  doctor: string;
  notes: string;
  fileUrl?: string;
  extractedText?: string;
  aiAnalysis?: AIAnalysis;
}

export interface AIAnalysis {
  summary: string;
  keyFindings: string[];
  importantValues: { name: string; value: string; status: 'normal' | 'low' | 'high' | 'info' }[];
  simpleExplanation: string;
  questionsForDoctor: string[];
  disclaimer: string;
  generatedAt: string;
}

export interface Medicine {
  id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  time: string[];
  startDate: string;
  endDate?: string;
  instructions: string;
  taken?: boolean;
}

export interface Vaccine {
  id: string;
  patientId: string;
  name: string;
  dose: string;
  date: string;
  nextDose?: string;
  hospital: string;
  notes: string;
  status: 'completed' | 'upcoming' | 'overdue';
}

export interface WellnessEntry {
  id: string;
  patientId: string;
  date: string;
  waterGlasses: number;
  sleepHours: number;
  exerciseMinutes: number;
  weight?: number;
}

export interface Symptom {
  id: string;
  patientId: string;
  symptom: string;
  duration: string;
  severity: 'Mild' | 'Moderate' | 'Severe';
  frequency: string;
  notes: string;
  date: string;
  aiResponse?: string;
}

export interface HealthTrendEntry {
  date: string;
  weight?: number;
  bmi?: number;
  hemoglobin?: number;
  systolic?: number;
  diastolic?: number;
  glucose?: number;
}

export interface EmergencyProfile {
  patientId: string;
  bloodGroup: string;
  allergies: string[];
  activeMedicines: string[];
  emergencyContact: { name: string; phone: string; relation: string };
  conditions: string[];
}

export interface ConsentRecord {
  id: string;
  patientId: string;
  doctorId: string;
  doctorName: string;
  hospital: string;
  accessType: string;
  status: 'granted' | 'revoked' | 'pending';
  grantedAt?: string;
  revokedAt?: string;
  history: { action: string; timestamp: string }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
