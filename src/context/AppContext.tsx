import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  User, HealthRecord, Medicine, Vaccine, WellnessEntry, ConsentRecord,
  ChatMessage, Symptom, HealthMeasurement, HealthTrendEntry, EmergencyProfile,
} from '../types';
import { supabase, supabaseConfigured, fetchAll, FILE_BUCKET, MAX_FILE_BYTES, ALLOWED_MIME, fileMime } from '../lib/supabase';
import { authRedirectOrigin } from '../lib/siteUrl';

// All data lives in Supabase. This context loads what the signed-in user is
// allowed to see (RLS decides) and exposes the same shape the pages already use.

/* eslint-disable @typescript-eslint/no-explicit-any */
type Row = Record<string, any>;

const today = () => new Date().toISOString().split('T')[0];
const isUuid = (s?: string) => !!s && /^[0-9a-f-]{36}$/i.test(s);

const toUser = (r: Row): User => ({
  id: r.id, role: r.role, name: r.name, email: r.email, phone: r.phone ?? undefined,
  dateOfBirth: r.date_of_birth ?? undefined, gender: r.gender ?? undefined, bloodGroup: r.blood_group ?? undefined,
  height: r.height_cm != null ? Number(r.height_cm) : undefined, weight: r.weight_kg != null ? Number(r.weight_kg) : undefined,
  medicalRegistrationId: r.medical_registration_id ?? undefined, specialization: r.specialization ?? undefined,
  hospital: r.hospital ?? undefined, doctorVerified: r.doctor_verified, waterGoal: r.water_goal_glasses,
});
const fromUser = (u: Partial<User>): Row => ({
  name: u.name, phone: u.phone ?? null, date_of_birth: u.dateOfBirth || null, gender: u.gender ?? null,
  blood_group: u.bloodGroup ?? null, height_cm: u.height ?? null, weight_kg: u.weight ?? null,
  medical_registration_id: u.medicalRegistrationId ?? null, specialization: u.specialization ?? null,
  hospital: u.hospital ?? null, water_goal_glasses: u.waterGoal ?? 8,
});

const toRecord = (r: Row): HealthRecord => ({
  id: r.id, patientId: r.patient_id, name: r.name, type: r.type, date: r.record_date,
  hospital: r.hospital, doctor: r.doctor, notes: r.notes, filePath: r.file_path ?? undefined,
  fileName: r.file_name ?? undefined, fileMime: r.file_mime ?? undefined, fileSize: r.file_size ?? undefined,
  extractedText: r.extracted_text ?? undefined, ocrStatus: r.ocr_status, aiAnalysis: r.ai_analysis ?? undefined,
  createdAt: r.created_at,
});
const fromRecord = (r: HealthRecord): Row => ({
  name: r.name, type: r.type, record_date: r.date, hospital: r.hospital ?? '', doctor: r.doctor ?? '',
  notes: r.notes ?? '', file_path: r.filePath ?? null, file_name: r.fileName ?? null, file_mime: r.fileMime ?? null,
  file_size: r.fileSize ?? null, extracted_text: r.extractedText ?? null, ocr_status: r.ocrStatus ?? 'none',
  ai_analysis: r.aiAnalysis ?? null, updated_at: new Date().toISOString(),
});

const toMedicine = (r: Row): Medicine => ({
  id: r.id, patientId: r.patient_id, name: r.name, dosage: r.dosage, frequency: r.frequency, time: r.times ?? [],
  startDate: r.start_date, endDate: r.end_date ?? undefined, instructions: r.instructions, taken: r.taken_on === today(),
});
const fromMedicine = (m: Medicine): Row => ({
  name: m.name, dosage: m.dosage ?? '', frequency: m.frequency ?? '', times: m.time ?? [], start_date: m.startDate,
  end_date: m.endDate || null, instructions: m.instructions ?? '', taken_on: m.taken ? today() : null,
});

const vaccineStatus = (date?: string, next?: string): Vaccine['status'] => {
  if (next) return next < today() ? 'overdue' : 'upcoming';
  return date && date <= today() ? 'completed' : 'upcoming';
};
const toVaccine = (r: Row): Vaccine => ({
  id: r.id, patientId: r.patient_id, name: r.name, dose: r.dose, date: r.date_administered ?? '',
  nextDose: r.next_due ?? undefined, hospital: r.hospital, notes: r.notes,
  status: vaccineStatus(r.date_administered, r.next_due),
});
const fromVaccine = (v: Vaccine): Row => ({
  name: v.name, dose: v.dose ?? '', date_administered: v.date || null, next_due: v.nextDose || null,
  hospital: v.hospital ?? '', notes: v.notes ?? '',
});

const toWellness = (r: Row): WellnessEntry => ({
  id: r.id, patientId: r.patient_id, date: r.entry_date, waterGlasses: r.water_glasses,
  sleepHours: Number(r.sleep_hours), exerciseMinutes: r.exercise_minutes, exerciseType: r.exercise_type ?? undefined,
  meals: r.meals ?? undefined, weight: r.weight_kg != null ? Number(r.weight_kg) : undefined,
});
const fromWellness = (w: Partial<WellnessEntry>): Row => {
  const o: Row = {};
  if (w.waterGlasses !== undefined) o.water_glasses = w.waterGlasses;
  if (w.sleepHours !== undefined) o.sleep_hours = w.sleepHours;
  if (w.exerciseMinutes !== undefined) o.exercise_minutes = w.exerciseMinutes;
  if (w.exerciseType !== undefined) o.exercise_type = w.exerciseType;
  if (w.meals !== undefined) o.meals = w.meals;
  if (w.weight !== undefined) o.weight_kg = w.weight || null;
  return o;
};

const toMeasurement = (r: Row): HealthMeasurement => ({
  id: r.id, patientId: r.patient_id, date: r.measured_on, kind: r.kind, value: Number(r.value), unit: r.unit, label: r.label ?? undefined,
});
const toSymptom = (r: Row): Symptom => ({
  id: r.id, patientId: r.patient_id, symptom: r.symptom, duration: r.duration, severity: r.severity,
  frequency: r.frequency, notes: r.notes, date: r.created_at, aiResponse: r.ai_response ?? undefined,
});
const toEmergency = (r: Row): EmergencyProfile & { accessToken?: string | null } => ({
  patientId: r.patient_id, bloodGroup: r.blood_group, allergies: r.allergies ?? [], conditions: r.conditions ?? [],
  activeMedicines: r.active_medicines ?? [], accessToken: r.access_token,
  emergencyContact: { name: r.contact_name, phone: r.contact_phone, relation: r.contact_relation },
});

type ConsentUpsertRow = {
  patient_id: string;
  doctor_id: string;
  access_type: string;
  status: 'granted' | 'revoked';
  granted_at?: string;
  revoked_at: string | null;
};

export type RegisterInput =User & { password: string };

interface AppState {
  ready: boolean;
  configured: boolean;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  currentUser: User | null;
  users: User[];
  records: HealthRecord[];
  medicines: Medicine[];
  vaccines: Vaccine[];
  wellness: WellnessEntry[];
  measurements: HealthMeasurement[];
  consents: ConsentRecord[];
  chatMessages: ChatMessage[];
  symptoms: Symptom[];
  emergencyProfiles: (EmergencyProfile & { accessToken?: string | null })[];

  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string; role?: string }>;
  logout: () => Promise<void>;
  register: (input: RegisterInput) => Promise<{ ok: boolean; error?: string; needsConfirmation?: boolean }>;
  resetPassword: (email: string) => Promise<{ ok: boolean; error?: string }>;
  resendVerification: (email: string, role: 'patient' | 'doctor') => Promise<{ ok: boolean; error?: string }>;
  updateProfile: (u: Partial<User>) => Promise<boolean>;
  refresh: () => Promise<void>;

  addRecord: (record: HealthRecord, file?: File | null) => Promise<HealthRecord | null>;
  updateRecord: (record: HealthRecord) => Promise<HealthRecord | null>;
  deleteRecord: (id: string) => Promise<boolean>;
  getFileUrl: (record: HealthRecord, download?: boolean) => Promise<string | null>;
  downloadFile: (record: HealthRecord) => Promise<Blob | null>;

  addMedicine: (med: Medicine) => Promise<void>;
  updateMedicine: (med: Medicine) => Promise<void>;
  deleteMedicine: (id: string) => Promise<void>;
  addVaccine: (vac: Vaccine) => Promise<void>;
  updateVaccine: (vac: Vaccine) => Promise<void>;
  deleteVaccine: (id: string) => Promise<void>;
  addWellnessEntry: (entry: WellnessEntry) => Promise<void>;
  updateTodayWellness: (updates: Partial<WellnessEntry>, date?: string) => Promise<void>;
  deleteWellnessEntry: (id: string) => Promise<void>;
  addMeasurement: (m: Omit<HealthMeasurement, 'id' | 'patientId'>) => Promise<void>;
  deleteMeasurement: (id: string) => Promise<void>;
  addConsent: (consent: ConsentRecord) => Promise<void>;
  updateConsent: (consent: ConsentRecord) => Promise<void>;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => Promise<void>;
  addSymptom: (symptom: Symptom) => void;
  saveEmergency: (e: EmergencyProfile) => Promise<boolean>;
  setEmergencyAccess: (enable: boolean) => Promise<string | null>;
  trendsFor: (patientId: string) => HealthTrendEntry[];
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const loadedUserId = useRef<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [wellness, setWellness] = useState<WellnessEntry[]>([]);
  const [measurements, setMeasurements] = useState<HealthMeasurement[]>([]);
  const [consents, setConsents] = useState<ConsentRecord[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [emergencyProfiles, setEmergencyProfiles] = useState<AppState['emergencyProfiles']>([]);

  const fail = (msg: string) => { setError(msg); return null; };

  const clearData = () => {
    setUsers([]); setRecords([]); setMedicines([]); setVaccines([]); setWellness([]); setMeasurements([]);
    setConsents([]); setChatMessages([]); setSymptoms([]); setEmergencyProfiles([]);
  };

  /** Loads everything visible to this user. RLS restricts rows to own data or consented patients. */
  const loadAll = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const { data: me, error: meErr } = await supabase.from('profiles').select('*').eq('id', userId).single();
      if (meErr || !me) throw new Error('Your profile could not be loaded.');
      const self = toUser(me);
      setCurrentUser(self);
      loadedUserId.current = self.id;

      const q = (table: string, order: string, asc = false) =>
        fetchAll<Row>((a, b) => supabase.from(table).select('*').order(order, { ascending: asc }).range(a, b));

      const [profiles, recs, meds, vacs, well, meas, cons, audit, syms, emerg] = await Promise.all([
        q('profiles', 'name', true),
        q('medical_records', 'record_date'),
        q('medicines', 'start_date'),
        q('vaccinations', 'date_administered'),
        q('wellness_entries', 'entry_date'),
        q('health_measurements', 'measured_on', true),
        q('consents', 'created_at'),
        q('consent_audit_logs', 'created_at', true),
        q('symptoms', 'created_at'),
        q('emergency_profiles', 'updated_at'),
      ]);
      const allUsers = profiles.map(toUser);
      setUsers(allUsers);
      setRecords(recs.map(toRecord));
      setMedicines(meds.map(toMedicine));
      setVaccines(vacs.map(toVaccine));
      setWellness(well.map(toWellness));
      setMeasurements(meas.map(toMeasurement));
      setSymptoms(syms.map(toSymptom));
      setEmergencyProfiles(emerg.map(toEmergency));
      setConsents(cons.map(c => {
        const doc = allUsers.find(u => u.id === c.doctor_id);
        return {
          id: c.id, patientId: c.patient_id, doctorId: c.doctor_id, doctorName: doc?.name ?? 'Doctor',
          hospital: doc?.hospital ?? '', accessType: c.access_type, status: c.status,
          grantedAt: c.granted_at ?? undefined, revokedAt: c.revoked_at ?? undefined,
          history: audit.filter(a => a.consent_id === c.id).map(a => ({ action: a.action, timestamp: a.created_at })),
        } as ConsentRecord;
      }));
      if (self.role === 'patient') {
        const chat = await q('chat_messages', 'created_at', true);
        setChatMessages(chat.map(m => ({ id: m.id, role: m.role, content: m.content, timestamp: m.created_at })));
      }
    } catch (e) {
      setError((e as Error).message || 'Could not load your data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabaseConfigured) { setReady(true); return; }
    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session) await loadAll(data.session.user.id);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) { loadedUserId.current = null; setCurrentUser(null); clearData(); return; }
      // Email-verification links sign the user in on arrival; load their data.
      // Deferred so we never await Supabase calls inside the auth callback.
      if (event === 'SIGNED_IN') {
        const uid = session.user.id;
        setTimeout(() => { if (loadedUserId.current !== uid) void loadAll(uid); }, 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadAll]);

  const refresh = async () => { if (currentUser) await loadAll(currentUser.id); };

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const login: AppState['login'] = async (email, password) => {
    if (!supabaseConfigured) return { ok: false, error: 'Supabase is not configured for this deployment.' };
    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err || !data.user) return { ok: false, error: err?.message === 'Invalid login credentials' ? 'Invalid email or password.' : err?.message ?? 'Login failed.' };
    await loadAll(data.user.id);
    const { data: p } = await supabase.from('profiles').select('role').eq('id', data.user.id).single();
    return { ok: true, role: p?.role };
  };

  const logout = async () => { await supabase.auth.signOut(); setCurrentUser(null); clearData(); };

  const register: AppState['register'] = async (input) => {
    if (!supabaseConfigured) return { ok: false, error: 'Supabase is not configured for this deployment.' };
    const { data, error: err } = await supabase.auth.signUp({
      email: input.email,
      password: input.password,
      options: {
        emailRedirectTo: `${authRedirectOrigin()}/login/${input.role}`,
        // Read by the handle_new_user trigger. Doctors still need admin verification.
        data: {
          role: input.role, name: input.name, phone: input.phone, date_of_birth: input.dateOfBirth,
          gender: input.gender, blood_group: input.bloodGroup, medical_registration_id: input.medicalRegistrationId,
          specialization: input.specialization, hospital: input.hospital,
        },
      },
    });
    if (err) return { ok: false, error: err.message };
    if (data.user && data.user.identities?.length === 0) return { ok: false, error: 'Email already registered. Please login.' };
    if (!data.session) return { ok: true, needsConfirmation: true };
    await loadAll(data.user!.id);
    return { ok: true };
  };

  const resetPassword: AppState['resetPassword'] = async (email) => {
    const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${authRedirectOrigin()}/reset-password` });
    return err ? { ok: false, error: err.message } : { ok: true };
  };

  const resendVerification: AppState['resendVerification'] = async (email, role) => {
    const { error: err } = await supabase.auth.resend({
      type: 'signup', email, options: { emailRedirectTo: `${authRedirectOrigin()}/login/${role}` },
    });
    return err ? { ok: false, error: err.message } : { ok: true };
  };

  const updateProfile = async (u: Partial<User>) => {
    if (!currentUser) return false;
    const { data, error: err } = await supabase.from('profiles').update(fromUser({ ...currentUser, ...u }))
      .eq('id', currentUser.id).select().single();
    if (err) { fail(`Could not save profile: ${err.message}`); return false; }
    const updated = toUser(data);
    setCurrentUser(updated);
    setUsers(prev => prev.map(x => x.id === updated.id ? updated : x));
    return true;
  };

  // ─── Records & files ───────────────────────────────────────────────────────
  const addRecord: AppState['addRecord'] = async (record, file) => {
    if (!currentUser) return null;
    let filePath: string | undefined;
    let mime: string | undefined;
    if (file) {
      mime = fileMime(file);
      if (!ALLOWED_MIME.includes(mime)) return fail('Only PDF, PNG and JPEG files are supported.');
      if (file.size > MAX_FILE_BYTES) return fail('File is larger than 10 MB.');
      const safe = file.name.replace(/[^\w.-]+/g, '_').slice(-80);
      filePath = `${currentUser.id}/${crypto.randomUUID()}-${safe}`;
      const { error: upErr } = await supabase.storage.from(FILE_BUCKET).upload(filePath, file, { contentType: mime });
      if (upErr) return fail(`Upload failed: ${upErr.message}`);
    }
    const row = {
      ...fromRecord({ ...record, filePath, fileName: file?.name, fileMime: mime, fileSize: file?.size }),
      patient_id: currentUser.id,
    };
    const { data, error: err } = await supabase.from('medical_records').insert(row).select().single();
    if (err) {
      if (filePath) await supabase.storage.from(FILE_BUCKET).remove([filePath]);
      return fail(`Could not save record: ${err.message}`);
    }
    const saved = toRecord(data);
    setRecords(prev => [saved, ...prev]);
    return saved;
  };

  const updateRecord: AppState['updateRecord'] = async (record) => {
    const { data, error: err } = await supabase.from('medical_records').update(fromRecord(record)).eq('id', record.id).select().single();
    if (err) return fail(`Could not update record: ${err.message}`);
    const saved = toRecord(data);
    setRecords(prev => prev.map(r => r.id === saved.id ? saved : r));
    return saved;
  };

  const deleteRecord = async (id: string) => {
    const rec = records.find(r => r.id === id);
    const { error: err } = await supabase.from('medical_records').delete().eq('id', id);
    if (err) { fail(`Could not delete record: ${err.message}`); return false; }
    if (rec?.filePath) await supabase.storage.from(FILE_BUCKET).remove([rec.filePath]);
    setRecords(prev => prev.filter(r => r.id !== id));
    return true;
  };

  /** Short-lived (5 min) signed URL; storage RLS checks ownership or consent. */
  const getFileUrl = async (record: HealthRecord, download = false) => {
    if (!record.filePath) return null;
    const { data, error: err } = await supabase.storage.from(FILE_BUCKET)
      .createSignedUrl(record.filePath, 300, download ? { download: record.fileName ?? true } : undefined);
    if (err || !data) return fail('You do not have access to this file, or it no longer exists.');
    return data.signedUrl;
  };

  const downloadFile = async (record: HealthRecord) => {
    if (!record.filePath) return null;
    const { data, error: err } = await supabase.storage.from(FILE_BUCKET).download(record.filePath);
    if (err || !data) return fail('Could not download the file.');
    return data;
  };

  // ─── Simple CRUD tables ────────────────────────────────────────────────────
  const insert = async <T,>(table: string, row: Row, map: (r: Row) => T, set: React.Dispatch<React.SetStateAction<T[]>>, prepend = true) => {
    if (!currentUser) return;
    const { data, error: err } = await supabase.from(table).insert({ ...row, patient_id: currentUser.id }).select().single();
    if (err) { fail(`Could not save: ${err.message}`); return; }
    const item = map(data);
    set(prev => prepend ? [item, ...prev] : [...prev, item]);
  };
  const update = async <T extends { id: string },>(table: string, id: string, row: Row, map: (r: Row) => T, set: React.Dispatch<React.SetStateAction<T[]>>) => {
    const { data, error: err } = await supabase.from(table).update(row).eq('id', id).select().single();
    if (err) { fail(`Could not save: ${err.message}`); return; }
    const item = map(data);
    set(prev => prev.map(x => x.id === id ? item : x));
  };
  const remove = async <T extends { id: string },>(table: string, id: string, set: React.Dispatch<React.SetStateAction<T[]>>) => {
    const { error: err } = await supabase.from(table).delete().eq('id', id);
    if (err) { fail(`Could not delete: ${err.message}`); return; }
    set(prev => prev.filter(x => x.id !== id));
  };

  const addMedicine = (m: Medicine) => insert('medicines', fromMedicine(m), toMedicine, setMedicines, false);
  const updateMedicine = (m: Medicine) => update('medicines', m.id, fromMedicine(m), toMedicine, setMedicines);
  const deleteMedicine = (id: string) => remove('medicines', id, setMedicines);

  const addVaccine = (v: Vaccine) => insert('vaccinations', fromVaccine(v), toVaccine, setVaccines);
  const updateVaccine = (v: Vaccine) => update('vaccinations', v.id, fromVaccine(v), toVaccine, setVaccines);
  const deleteVaccine = (id: string) => remove('vaccinations', id, setVaccines);

  const updateTodayWellness = async (updates: Partial<WellnessEntry>, date = today()) => {
    if (!currentUser) return;
    const existing = wellness.find(w => w.date === date && w.patientId === currentUser.id);
    const row = { ...fromWellness({ ...existing, ...updates }), patient_id: currentUser.id, entry_date: date };
    const { data, error: err } = await supabase.from('wellness_entries')
      .upsert(row, { onConflict: 'patient_id,entry_date' }).select().single();
    if (err) { fail(`Could not save wellness entry: ${err.message}`); return; }
    const saved = toWellness(data);
    setWellness(prev => [saved, ...prev.filter(w => w.id !== saved.id)].sort((a, b) => b.date.localeCompare(a.date)));
  };
  const addWellnessEntry = (e: WellnessEntry) => updateTodayWellness(e, e.date);
  const deleteWellnessEntry = (id: string) => remove('wellness_entries', id, setWellness);

  const addMeasurement: AppState['addMeasurement'] = (m) =>
    insert('health_measurements', { measured_on: m.date, kind: m.kind, value: m.value, unit: m.unit, label: m.label ?? null },
      toMeasurement, setMeasurements, false);
  const deleteMeasurement = (id: string) => remove('health_measurements', id, setMeasurements);

  // ─── Consent ───────────────────────────────────────────────────────────────
  const upsertConsent = async (c: ConsentRecord) => {
    if (!currentUser) return;
    const now = new Date().toISOString();
    // One explicit shape: a conditional spread would produce a union of two
    // object types, which supabase-js's upsert typing rejects. granted_at is
    // omitted on revoke so the original grant time is kept.
    const row: ConsentUpsertRow = {
      patient_id: currentUser.id, doctor_id: c.doctorId, access_type: c.accessType || 'Full Records',
      status: c.status === 'granted' ? 'granted' : 'revoked',
      revoked_at: c.status === 'granted' ? null : now,
    };
    if (c.status === 'granted') row.granted_at = now;
    const { error: err } = await supabase.from('consents').upsert(row, { onConflict: 'patient_id,doctor_id' });
    if (err) { fail(`Could not update consent: ${err.message}`); return; }
    await loadAll(currentUser.id);
  };

  // ─── AI chat / symptoms (written by the API; mirrored locally) ─────────────
  const addChatMessage = (msg: ChatMessage) => setChatMessages(prev => [...prev, msg]);
  const clearChat = async () => {
    if (!currentUser) return;
    const { error: err } = await supabase.from('chat_messages').delete().eq('patient_id', currentUser.id);
    if (err) { fail(`Could not clear chat: ${err.message}`); return; }
    setChatMessages([]);
  };
  const addSymptom = (s: Symptom) => setSymptoms(prev => [s, ...prev.filter(x => x.id !== s.id)]);

  // ─── Emergency ─────────────────────────────────────────────────────────────
  const saveEmergency = async (e: EmergencyProfile) => {
    if (!currentUser) return false;
    const { data, error: err } = await supabase.from('emergency_profiles').upsert({
      patient_id: currentUser.id, blood_group: e.bloodGroup, allergies: e.allergies, conditions: e.conditions,
      active_medicines: e.activeMedicines, contact_name: e.emergencyContact.name, contact_phone: e.emergencyContact.phone,
      contact_relation: e.emergencyContact.relation, updated_at: new Date().toISOString(),
    }, { onConflict: 'patient_id' }).select().single();
    if (err) { fail(`Could not save emergency profile: ${err.message}`); return false; }
    const saved = toEmergency(data);
    setEmergencyProfiles(prev => [saved, ...prev.filter(p => p.patientId !== saved.patientId)]);
    return true;
  };
  const setEmergencyAccess = async (enable: boolean) => {
    const { data, error: err } = await supabase.rpc('regenerate_emergency_token', { p_enable: enable });
    if (err) return fail(`Could not update emergency access: ${err.message}`);
    setEmergencyProfiles(prev => prev.map(p => p.patientId === currentUser?.id ? { ...p, accessToken: data } : p));
    if (!emergencyProfiles.some(p => p.patientId === currentUser?.id) && currentUser) await loadAll(currentUser.id);
    return data as string | null;
  };

  // Trend rows per date from explicit measurements and wellness weight. BMI uses profile height.
  const trendsFor = useCallback((patientId: string): HealthTrendEntry[] => {
    const height = users.find(u => u.id === patientId)?.height;
    const byDate = new Map<string, HealthTrendEntry>();
    const at = (d: string) => byDate.get(d) ?? byDate.set(d, { date: d }).get(d)!;
    for (const m of measurements) {
      if (m.patientId !== patientId) continue;
      if (m.kind === 'glucose' || m.kind === 'hemoglobin' || m.kind === 'systolic' || m.kind === 'diastolic' || m.kind === 'weight') {
        at(m.date)[m.kind] = m.value;
      }
    }
    for (const w of wellness) if (w.patientId === patientId && w.weight) at(w.date).weight = w.weight;
    for (const e of byDate.values()) {
      if (e.weight && height) e.bmi = Math.round((e.weight / (height / 100) ** 2) * 10) / 10;
    }
    return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
  }, [measurements, wellness, users]);

  const value = useMemo<AppState>(() => ({
    ready, configured: supabaseConfigured, loading, error, clearError: () => setError(null),
    currentUser, users, records, medicines, vaccines, wellness, measurements, consents, chatMessages, symptoms, emergencyProfiles,
    login, logout, register, resetPassword, resendVerification, updateProfile, refresh,
    addRecord, updateRecord, deleteRecord, getFileUrl, downloadFile,
    addMedicine, updateMedicine, deleteMedicine, addVaccine, updateVaccine, deleteVaccine,
    addWellnessEntry, updateTodayWellness, deleteWellnessEntry, addMeasurement, deleteMeasurement,
    addConsent: upsertConsent, updateConsent: upsertConsent,
    addChatMessage, clearChat, addSymptom, saveEmergency, setEmergencyAccess, trendsFor,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [ready, loading, error, currentUser, users, records, medicines, vaccines, wellness, measurements, consents, chatMessages, symptoms, emergencyProfiles, trendsFor]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { isUuid };
