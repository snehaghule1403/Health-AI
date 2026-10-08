import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  User, HealthRecord, Medicine, Vaccine,
  WellnessEntry, ConsentRecord, ChatMessage, Symptom
} from '../types';
import {
  DEMO_USERS, DEMO_PASSWORDS, DEMO_RECORDS, DEMO_MEDICINES,
  DEMO_VACCINES, DEMO_WELLNESS, DEMO_CONSENT
} from '../data/demoData';

interface AppState {
  currentUser: User | null;
  users: User[];
  records: HealthRecord[];
  medicines: Medicine[];
  vaccines: Vaccine[];
  wellness: WellnessEntry[];
  consents: ConsentRecord[];
  chatMessages: ChatMessage[];
  symptoms: Symptom[];

  // Actions
  login: (email: string, password: string) => boolean;
  logout: () => void;
  register: (user: User, password: string) => boolean;
  addRecord: (record: HealthRecord) => void;
  updateRecord: (record: HealthRecord) => void;
  deleteRecord: (id: string) => void;
  addMedicine: (med: Medicine) => void;
  updateMedicine: (med: Medicine) => void;
  deleteMedicine: (id: string) => void;
  addVaccine: (vac: Vaccine) => void;
  addWellnessEntry: (entry: WellnessEntry) => void;
  updateTodayWellness: (updates: Partial<WellnessEntry>) => void;
  addConsent: (consent: ConsentRecord) => void;
  updateConsent: (consent: ConsentRecord) => void;
  addChatMessage: (msg: ChatMessage) => void;
  clearChat: () => void;
  addSymptom: (symptom: Symptom) => void;
}

const AppContext = createContext<AppState | null>(null);

const STORAGE_KEY = 'healthai_state';

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveState(state: Partial<AppState>) {
  try {
    const toSave = {
      users: state.users,
      records: state.records,
      medicines: state.medicines,
      vaccines: state.vaccines,
      wellness: state.wellness,
      consents: state.consents,
      chatMessages: state.chatMessages,
      symptoms: state.symptoms,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch {
    // ignore
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const saved = loadState();

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const raw = localStorage.getItem('healthai_current_user');
    if (raw) return JSON.parse(raw);
    return null;
  });

  const [users, setUsers] = useState<User[]>(saved?.users ?? DEMO_USERS);
  const [records, setRecords] = useState<HealthRecord[]>(saved?.records ?? DEMO_RECORDS);
  const [medicines, setMedicines] = useState<Medicine[]>(saved?.medicines ?? DEMO_MEDICINES);
  const [vaccines, setVaccines] = useState<Vaccine[]>(saved?.vaccines ?? DEMO_VACCINES);
  const [wellness, setWellness] = useState<WellnessEntry[]>(saved?.wellness ?? DEMO_WELLNESS);
  const [consents, setConsents] = useState<ConsentRecord[]>(saved?.consents ?? DEMO_CONSENT);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(saved?.chatMessages ?? []);
  const [symptoms, setSymptoms] = useState<Symptom[]>(saved?.symptoms ?? []);

  // Passwords map (demo + registered)
  const [passwords, setPasswords] = useState<Record<string, string>>(DEMO_PASSWORDS);

  useEffect(() => {
    saveState({ users, records, medicines, vaccines, wellness, consents, chatMessages, symptoms });
  }, [users, records, medicines, vaccines, wellness, consents, chatMessages, symptoms]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('healthai_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('healthai_current_user');
    }
  }, [currentUser]);

  const login = (email: string, password: string): boolean => {
    const user = users.find(u => u.email === email);
    if (!user) return false;
    const storedPw = passwords[email];
    if (storedPw !== password) return false;
    setCurrentUser(user);
    return true;
  };

  const logout = () => setCurrentUser(null);

  const register = (user: User, password: string): boolean => {
    if (users.find(u => u.email === user.email)) return false;
    setUsers(prev => [...prev, user]);
    setPasswords(prev => ({ ...prev, [user.email]: password }));
    return true;
  };

  const addRecord = (record: HealthRecord) => setRecords(prev => [record, ...prev]);
  const updateRecord = (record: HealthRecord) => setRecords(prev => prev.map(r => r.id === record.id ? record : r));
  const deleteRecord = (id: string) => setRecords(prev => prev.filter(r => r.id !== id));

  const addMedicine = (med: Medicine) => setMedicines(prev => [...prev, med]);
  const updateMedicine = (med: Medicine) => setMedicines(prev => prev.map(m => m.id === med.id ? med : m));
  const deleteMedicine = (id: string) => setMedicines(prev => prev.filter(m => m.id !== id));

  const addVaccine = (vac: Vaccine) => setVaccines(prev => [...prev, vac]);

  const addWellnessEntry = (entry: WellnessEntry) => setWellness(prev => [entry, ...prev]);
  const updateTodayWellness = (updates: Partial<WellnessEntry>) => {
    const today = new Date().toISOString().split('T')[0];
    setWellness(prev => {
      const existing = prev.find(w => w.date === today && w.patientId === currentUser?.id);
      if (existing) {
        return prev.map(w => w.id === existing.id ? { ...w, ...updates } : w);
      } else {
        const newEntry: WellnessEntry = {
          id: `w-${Date.now()}`,
          patientId: currentUser?.id ?? '',
          date: today,
          waterGlasses: 0,
          sleepHours: 0,
          exerciseMinutes: 0,
          ...updates,
        };
        return [newEntry, ...prev];
      }
    });
  };

  const addConsent = (consent: ConsentRecord) => setConsents(prev => [...prev, consent]);
  const updateConsent = (consent: ConsentRecord) => setConsents(prev => prev.map(c => c.id === consent.id ? consent : c));

  const addChatMessage = (msg: ChatMessage) => setChatMessages(prev => [...prev, msg]);
  const clearChat = () => setChatMessages([]);

  const addSymptom = (symptom: Symptom) => setSymptoms(prev => [symptom, ...prev]);

  return (
    <AppContext.Provider value={{
      currentUser, users, records, medicines, vaccines, wellness, consents, chatMessages, symptoms,
      login, logout, register,
      addRecord, updateRecord, deleteRecord,
      addMedicine, updateMedicine, deleteMedicine,
      addVaccine, addWellnessEntry, updateTodayWellness,
      addConsent, updateConsent,
      addChatMessage, clearChat,
      addSymptom,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
