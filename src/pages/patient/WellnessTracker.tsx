import { useEffect, useState } from 'react';
import {
  Droplets, Moon, Dumbbell, Scale, Plus, Target,
  CheckCircle, Pill, Syringe, Trash2, Pencil, Save, Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Medicine, Vaccine } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

const todayStr = () => new Date().toISOString().split('T')[0];
const HISTORY_PAGE = 14;

export default function WellnessTracker() {
  const {
    currentUser, wellness, updateTodayWellness, deleteWellnessEntry, updateProfile,
    medicines, addMedicine, deleteMedicine, updateMedicine,
    vaccines, addVaccine, updateVaccine, deleteVaccine,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'wellness' | 'medicine' | 'vaccine'>('wellness');
  const today = todayStr();
  const waterGoal = currentUser?.waterGoal ?? 8;

  const patientWellness = wellness.filter(w => w.patientId === currentUser?.id).sort((a, b) => b.date.localeCompare(a.date));
  const todayEntry = patientWellness.find(w => w.date === today);
  const last7 = patientWellness.slice(0, 7).reverse();
  const weekly = (k: 'sleepHours' | 'exerciseMinutes') => patientWellness
    .filter(w => w.date > new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0])
    .reduce((s, w) => s + (w[k] || 0), 0);

  const latestWeight = patientWellness.find(w => w.weight)?.weight ?? currentUser?.weight;
  const height = currentUser?.height;
  const bmiNum = height && latestWeight ? latestWeight / ((height / 100) ** 2) : null;
  const bmiInfo = bmiNum == null ? null
    : bmiNum < 18.5 ? { label: 'Below 18.5', color: 'var(--orange)' }
    : bmiNum < 25 ? { label: '18.5–24.9', color: 'var(--green)' }
    : bmiNum < 30 ? { label: '25–29.9', color: 'var(--orange)' }
    : { label: '30 or above', color: 'var(--red)' };

  // ─── Daily log form ────────────────────────────────────────────────────────
  const [logDate, setLogDate] = useState(today);
  const [log, setLog] = useState({ water: '', sleep: '', exercise: '', exerciseType: '', weight: '', meals: '' });
  const [logMsg, setLogMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [savingLog, setSavingLog] = useState(false);
  const [histPage, setHistPage] = useState(1);
  const [heightInput, setHeightInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  useEffect(() => {
    const e = patientWellness.find(w => w.date === logDate);
    setLog({
      water: e ? String(e.waterGlasses) : '', sleep: e ? String(e.sleepHours) : '', exercise: e ? String(e.exerciseMinutes) : '',
      exerciseType: e?.exerciseType ?? '', weight: e?.weight ? String(e.weight) : '', meals: e?.meals ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logDate, wellness]);

  const num = (s: string, min: number, max: number, label: string): { v?: number; err?: string } => {
    if (s === '') return {};
    const v = Number(s);
    if (!Number.isFinite(v) || v < min || v > max) return { err: `${label} must be between ${min} and ${max}.` };
    return { v };
  };

  const saveLog = async () => {
    setLogMsg(null);
    if (!logDate || logDate > today) return setLogMsg({ ok: false, text: 'Choose a date that is not in the future.' });
    const water = num(log.water, 0, 40, 'Water');
    const sleep = num(log.sleep, 0, 24, 'Sleep');
    const exercise = num(log.exercise, 0, 1440, 'Exercise');
    const weight = num(log.weight, 1, 500, 'Weight');
    const err = [water, sleep, exercise, weight].find(x => x.err)?.err;
    if (err) return setLogMsg({ ok: false, text: err });
    setSavingLog(true);
    await updateTodayWellness({
      waterGlasses: water.v ?? 0, sleepHours: sleep.v ?? 0, exerciseMinutes: exercise.v ?? 0,
      exerciseType: log.exerciseType.trim() || undefined, weight: weight.v, meals: log.meals.trim() || undefined,
    }, logDate);
    setSavingLog(false);
    setLogMsg({ ok: true, text: `Saved entry for ${logDate}.` });
  };

  const addGlass = () => updateTodayWellness({ waterGlasses: Math.min((todayEntry?.waterGlasses ?? 0) + 1, 40) });

  // ─── Medicines ─────────────────────────────────────────────────────────────
  const emptyMed = () => ({ id: '', name: '', dosage: '', frequency: 'Once daily', time: '', startDate: todayStr(), endDate: '', instructions: '' });
  const [medForm, setMedForm] = useState(emptyMed);
  const [showMedForm, setShowMedForm] = useState(false);
  const [medError, setMedError] = useState('');

  const patientMeds = medicines.filter(m => m.patientId === currentUser?.id);
  const activeMeds = patientMeds.filter(m => !m.endDate || m.endDate >= today);
  const completedMeds = patientMeds.filter(m => m.endDate && m.endDate < today);

  const editMed = (m: Medicine) => {
    setMedForm({ id: m.id, name: m.name, dosage: m.dosage, frequency: m.frequency, time: m.time.join(', '), startDate: m.startDate, endDate: m.endDate ?? '', instructions: m.instructions });
    setShowMedForm(true);
  };

  const saveMed = async () => {
    setMedError('');
    if (!medForm.name.trim()) return setMedError('Medicine name is required.');
    if (!medForm.startDate) return setMedError('Start date is required.');
    if (medForm.endDate && medForm.endDate < medForm.startDate) return setMedError('End date cannot be before start date.');
    const med: Medicine = {
      id: medForm.id, patientId: currentUser!.id, name: medForm.name.trim(), dosage: medForm.dosage.trim(),
      frequency: medForm.frequency, time: medForm.time ? medForm.time.split(',').map(t => t.trim()).filter(Boolean) : [],
      startDate: medForm.startDate, endDate: medForm.endDate || undefined, instructions: medForm.instructions.trim(),
      taken: patientMeds.find(m => m.id === medForm.id)?.taken ?? false,
    };
    if (medForm.id) await updateMedicine(med); else await addMedicine(med);
    setShowMedForm(false);
    setMedForm(emptyMed());
  };

  // ─── Vaccines ──────────────────────────────────────────────────────────────
  const emptyVax = () => ({ id: '', name: '', dose: '', date: todayStr(), nextDose: '', hospital: '', notes: '' });
  const [vaxForm, setVaxForm] = useState(emptyVax);
  const [showVaxForm, setShowVaxForm] = useState(false);
  const [vaxError, setVaxError] = useState('');
  const patientVaccines = vaccines.filter(v => v.patientId === currentUser?.id);

  const editVax = (v: Vaccine) => {
    setVaxForm({ id: v.id, name: v.name, dose: v.dose, date: v.date, nextDose: v.nextDose ?? '', hospital: v.hospital, notes: v.notes });
    setShowVaxForm(true);
  };

  const saveVax = async () => {
    setVaxError('');
    if (!vaxForm.name.trim()) return setVaxError('Vaccine name is required.');
    if (!vaxForm.date && !vaxForm.nextDose) return setVaxError('Enter the date given or the next due date.');
    if (vaxForm.date && vaxForm.date > today) return setVaxError('Date administered cannot be in the future. Use "Next dose date" for upcoming doses.');
    const vax: Vaccine = {
      id: vaxForm.id, patientId: currentUser!.id, name: vaxForm.name.trim(), dose: vaxForm.dose.trim(),
      date: vaxForm.date, nextDose: vaxForm.nextDose || undefined, hospital: vaxForm.hospital.trim(), notes: vaxForm.notes.trim(),
      status: 'completed', // recomputed from dates by the data layer
    };
    if (vaxForm.id) await updateVaccine(vax); else await addVaccine(vax);
    setShowVaxForm(false);
    setVaxForm(emptyVax());
  };

  const histItems = patientWellness.slice((histPage - 1) * HISTORY_PAGE, histPage * HISTORY_PAGE);
  const histPages = Math.max(1, Math.ceil(patientWellness.length / HISTORY_PAGE));

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Wellness Tracker</h1>
          <p>Monitor your daily health habits and medications</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }} role="tablist">
        {([['wellness', 'Daily Wellness'], ['medicine', 'Medicines'], ['vaccine', 'Vaccines']] as const).map(([tab, label]) => (
          <button key={tab} role="tab" aria-selected={activeTab === tab} onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}>
            {tab === 'wellness' ? <Target size={15} /> : tab === 'medicine' ? <Pill size={15} /> : <Syringe size={15} />}
            {label}
          </button>
        ))}
      </div>

      {/* ─── WELLNESS TAB ─── */}
      {activeTab === 'wellness' && (
        <>
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Droplets size={20} color="#0891b2" aria-hidden />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>Water Today</h3>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--cyan)', marginBottom: '0.25rem' }}>
                {todayEntry?.waterGlasses ?? 0}<span style={{ fontSize: '1rem', color: 'var(--gray-500)' }}>/{waterGoal}</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }} role="progressbar" aria-valuenow={todayEntry?.waterGlasses ?? 0} aria-valuemax={waterGoal}>
                <div className="progress-fill" style={{ width: `${Math.min(((todayEntry?.waterGlasses ?? 0) / waterGoal) * 100, 100)}%`, background: 'var(--cyan)' }} />
              </div>
              <button className="btn btn-sm" style={{ background: 'var(--cyan-light)', color: 'var(--cyan)', border: 'none', width: '100%', justifyContent: 'center' }} onClick={addGlass}>
                <Plus size={14} /> Add Glass
              </button>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Moon size={20} color="#7c3aed" aria-hidden />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>Sleep</h3>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--violet)' }}>
                {todayEntry?.sleepHours ?? 0}<span style={{ fontSize: '1rem', color: 'var(--gray-500)' }}> hrs</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Last 7 days: {weekly('sleepHours').toFixed(1)} h total</p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Dumbbell size={20} color="#16a34a" aria-hidden />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>Exercise</h3>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--green)' }}>
                {todayEntry?.exerciseMinutes ?? 0}<span style={{ fontSize: '1rem', color: 'var(--gray-500)' }}> min</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>Last 7 days: {weekly('exerciseMinutes')} min</p>
            </div>

            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Scale size={20} color="#d97706" aria-hidden />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>Weight & BMI</h3>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--orange)' }}>{latestWeight ? `${latestWeight} kg` : '—'}</div>
              <div style={{ fontSize: '0.85rem', color: 'var(--gray-500)' }}>
                BMI: {bmiNum != null && bmiInfo ? <><strong style={{ color: bmiInfo.color }}>{bmiNum.toFixed(1)}</strong> <span style={{ fontSize: '0.75rem' }}>({bmiInfo.label})</span></> : 'needs height & weight'}
              </div>
              {!height ? (
                <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem' }}>
                  <label htmlFor="h-in" className="sr-only">Height in cm</label>
                  <input id="h-in" type="number" placeholder="Height cm" value={heightInput} onChange={e => setHeightInput(e.target.value)} style={{ fontSize: '0.8rem', padding: '0.35rem 0.6rem' }} />
                  <button className="btn btn-outline btn-sm" onClick={() => { const h = Number(heightInput); if (h >= 30 && h <= 272) updateProfile({ height: h }); }}>Save</button>
                </div>
              ) : <p style={{ fontSize: '0.7rem', color: 'var(--gray-400)' }}>Height: {height} cm</p>}
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, marginBottom: '0.75rem', fontSize: '0.95rem' }}>Log a day</h3>
            {logMsg && <div className={`alert ${logMsg.ok ? 'alert-success' : 'alert-danger'}`} role="status" style={{ marginBottom: '0.75rem' }}>{logMsg.text}</div>}
            <div className="form-row">
              <div className="form-group"><label className="form-label" htmlFor="l-date">Date</label>
                <input id="l-date" type="date" max={today} value={logDate} onChange={e => setLogDate(e.target.value)} /></div>
              <div className="form-group"><label className="form-label" htmlFor="l-water">Water (glasses)</label>
                <input id="l-water" type="number" min={0} max={40} value={log.water} onChange={e => setLog({ ...log, water: e.target.value })} /></div>
              <div className="form-group"><label className="form-label" htmlFor="l-sleep">Sleep (hours)</label>
                <input id="l-sleep" type="number" min={0} max={24} step={0.5} value={log.sleep} onChange={e => setLog({ ...log, sleep: e.target.value })} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label className="form-label" htmlFor="l-ex">Exercise (minutes)</label>
                <input id="l-ex" type="number" min={0} max={1440} value={log.exercise} onChange={e => setLog({ ...log, exercise: e.target.value })} /></div>
              <div className="form-group"><label className="form-label" htmlFor="l-ext">Activity type</label>
                <input id="l-ext" value={log.exerciseType} placeholder="e.g. Walking" onChange={e => setLog({ ...log, exerciseType: e.target.value })} /></div>
              <div className="form-group"><label className="form-label" htmlFor="l-w">Weight (kg)</label>
                <input id="l-w" type="number" min={1} max={500} step={0.1} value={log.weight} onChange={e => setLog({ ...log, weight: e.target.value })} /></div>
            </div>
            <div className="form-group"><label className="form-label" htmlFor="l-meals">Meals / diet notes</label>
              <input id="l-meals" value={log.meals} maxLength={1000} placeholder="e.g. Breakfast: oats; Lunch: dal rice" onChange={e => setLog({ ...log, meals: e.target.value })} /></div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={saveLog} disabled={savingLog}><Save size={15} /> {savingLog ? 'Saving…' : 'Save entry'}</button>
              <span style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>
                Daily water goal:
                <input aria-label="Daily water goal" type="number" min={1} max={40} value={goalInput || waterGoal}
                  onChange={e => setGoalInput(e.target.value)} onBlur={() => { const g = Number(goalInput); if (g >= 1 && g <= 40 && g !== waterGoal) updateProfile({ waterGoal: g }); setGoalInput(''); }}
                  style={{ width: 64, marginLeft: 6, padding: '0.25rem 0.4rem' }} /> glasses
              </span>
            </div>
          </div>

          <div className="grid-2" style={{ gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="card">
              <div className="card-header"><h3>Water — Last 7 Entries</h3></div>
              <div style={{ padding: '1rem' }}>
                {last7.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No entries yet.</p> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={last7}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: number) => [`${v} glasses`, 'Water']} />
                      <Bar dataKey="waterGlasses" fill="#0891b2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Sleep — Last 7 Entries</h3></div>
              <div style={{ padding: '1rem' }}>
                {last7.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>No entries yet.</p> : (
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={last7}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                      <YAxis domain={[0, 12]} tick={{ fontSize: 10 }} unit="h" />
                      <Tooltip formatter={(v: number) => [`${v} hrs`, 'Sleep']} />
                      <Line type="monotone" dataKey="sleepHours" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>History</h3><span className="badge badge-gray">{patientWellness.length} days</span></div>
            <div style={{ padding: '1rem', overflowX: 'auto' }}>
              {patientWellness.length === 0 ? <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem' }}>Log your first day above.</p> : (
                <table style={{ width: '100%', fontSize: '0.85rem', borderCollapse: 'collapse', minWidth: 520 }}>
                  <thead><tr style={{ textAlign: 'left', color: 'var(--gray-500)' }}><th>Date</th><th>Water</th><th>Sleep</th><th>Exercise</th><th>Weight</th><th><span className="sr-only">Actions</span></th></tr></thead>
                  <tbody>
                    {histItems.map(w => (
                      <tr key={w.id} style={{ borderTop: '1px solid var(--gray-100)' }}>
                        <td style={{ padding: '0.45rem 0' }}>{w.date}</td>
                        <td>{w.waterGlasses}</td>
                        <td>{w.sleepHours} h</td>
                        <td>{w.exerciseMinutes} min{w.exerciseType ? ` (${w.exerciseType})` : ''}</td>
                        <td>{w.weight ? `${w.weight} kg` : '—'}</td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button className="btn btn-sm btn-outline" aria-label={`Edit ${w.date}`} onClick={() => { setLogDate(w.date); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><Pencil size={12} /></button>{' '}
                          <button className="btn btn-sm" style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none' }} aria-label={`Delete ${w.date}`}
                            onClick={() => { if (confirm(`Delete the entry for ${w.date}?`)) deleteWellnessEntry(w.id); }}><Trash2 size={12} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {histPages > 1 && (
                <nav className="pager" aria-label="History pages">
                  <button className="btn btn-outline btn-sm" disabled={histPage === 1} onClick={() => setHistPage(histPage - 1)}>Previous</button>
                  <span>Page {histPage} of {histPages}</span>
                  <button className="btn btn-outline btn-sm" disabled={histPage === histPages} onClick={() => setHistPage(histPage + 1)}>Next</button>
                </nav>
              )}
            </div>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', marginTop: '0.75rem' }}>
            <Info size={12} aria-hidden /> BMI is a rough screening measure based only on height and weight; it does not assess overall health.
          </p>
        </>
      )}

      {/* ─── MEDICINE TAB ─── */}
      {activeTab === 'medicine' && (
        <>
          <div className="disclaimer" style={{ marginBottom: '1rem' }}>
            <Info size={16} aria-hidden /> This list is for your own tracking. Always follow your doctor's instructions. HealthAI does not send background reminders; upcoming doses are shown here when you open the app.
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setMedForm(emptyMed()); setShowMedForm(!showMedForm); }}>
              <Plus size={16} /> Add Medicine
            </button>
          </div>

          {showMedForm && (
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>{medForm.id ? 'Edit Medicine' : 'Add New Medicine'}</h3>
              {medError && <div className="alert alert-danger" role="alert" style={{ marginBottom: '0.75rem' }}>{medError}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="m-name">Medicine Name *</label>
                  <input id="m-name" value={medForm.name} maxLength={200} onChange={e => setMedForm({ ...medForm, name: e.target.value })} placeholder="e.g., Paracetamol 500mg" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="m-dose">Dosage</label>
                  <input id="m-dose" value={medForm.dosage} onChange={e => setMedForm({ ...medForm, dosage: e.target.value })} placeholder="e.g., 1 tablet" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="m-freq">Frequency</label>
                  <select id="m-freq" value={medForm.frequency} onChange={e => setMedForm({ ...medForm, frequency: e.target.value })}>
                    {['Once daily', 'Twice daily', 'Thrice daily', 'Weekly', 'As needed'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="m-time">Reminder time(s)</label>
                  <input id="m-time" value={medForm.time} onChange={e => setMedForm({ ...medForm, time: e.target.value })} placeholder="e.g., 08:00, 20:00" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="m-start">Start Date *</label>
                  <input id="m-start" type="date" value={medForm.startDate} onChange={e => setMedForm({ ...medForm, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="m-end">End Date</label>
                  <input id="m-end" type="date" value={medForm.endDate} onChange={e => setMedForm({ ...medForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="m-instr">Instructions (as prescribed)</label>
                <input id="m-instr" value={medForm.instructions} onChange={e => setMedForm({ ...medForm, instructions: e.target.value })} placeholder="e.g., Take with meals" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={saveMed} disabled={!medForm.name}>{medForm.id ? 'Save Changes' : 'Add Medicine'}</button>
                <button className="btn btn-outline" onClick={() => setShowMedForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {patientMeds.length === 0 ? (
            <div className="empty-state">
              <Pill size={40} />
              <h3>No medicines added</h3>
              <p>Add your prescribed medications to track them</p>
            </div>
          ) : (
            [['Active', activeMeds], ['Completed', completedMeds]].map(([label, list]) => (list as Medicine[]).length > 0 && (
              <div key={label as string} style={{ marginBottom: '1rem' }}>
                <h3 style={{ fontWeight: 600, color: 'var(--gray-500)', marginBottom: '0.5rem', fontSize: '0.8rem', textTransform: 'uppercase' }}>{label as string} ({(list as Medicine[]).length})</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {(list as Medicine[]).map(med => (
                    <div key={med.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--violet-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Pill size={20} color="#7c3aed" />
                          </div>
                          <div>
                            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray-800)' }}>{med.name}</h3>
                            <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                              {[med.dosage, med.frequency, med.time.join(', ')].filter(Boolean).join(' · ')}
                            </p>
                            <p style={{ fontSize: '0.72rem', color: 'var(--gray-400)' }}>{med.startDate} → {med.endDate ?? 'ongoing'}{med.instructions ? ` · ${med.instructions}` : ''}</p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          {label === 'Active' && (
                            <button className={`btn btn-sm ${med.taken ? 'btn-success' : 'btn-outline'}`} onClick={() => updateMedicine({ ...med, taken: !med.taken })}>
                              <CheckCircle size={13} /> {med.taken ? 'Taken today' : 'Mark Taken'}
                            </button>
                          )}
                          <button className="btn btn-sm btn-outline" aria-label={`Edit ${med.name}`} onClick={() => editMed(med)}><Pencil size={13} /></button>
                          <button aria-label={`Delete ${med.name}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray-400)', padding: '0.25rem' }}
                            onClick={() => { if (confirm(`Delete ${med.name}?`)) deleteMedicine(med.id); }}>
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </>
      )}

      {/* ─── VACCINE TAB ─── */}
      {activeTab === 'vaccine' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => { setVaxForm(emptyVax()); setShowVaxForm(!showVaxForm); }}>
              <Plus size={16} /> Add Vaccine
            </button>
          </div>

          {showVaxForm && (
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>{vaxForm.id ? 'Edit Vaccination' : 'Add Vaccination Record'}</h3>
              {vaxError && <div className="alert alert-danger" role="alert" style={{ marginBottom: '0.75rem' }}>{vaxError}</div>}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="v-name">Vaccine Name *</label>
                  <input id="v-name" value={vaxForm.name} maxLength={200} onChange={e => setVaxForm({ ...vaxForm, name: e.target.value })} placeholder="e.g., Hepatitis B" />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-dose">Dose</label>
                  <input id="v-dose" value={vaxForm.dose} onChange={e => setVaxForm({ ...vaxForm, dose: e.target.value })} placeholder="e.g., 1st Dose" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="v-date">Date administered</label>
                  <input id="v-date" type="date" max={today} value={vaxForm.date} onChange={e => setVaxForm({ ...vaxForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-next">Next Dose Date</label>
                  <input id="v-next" type="date" value={vaxForm.nextDose} onChange={e => setVaxForm({ ...vaxForm, nextDose: e.target.value })} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label" htmlFor="v-hosp">Hospital / Center</label>
                  <input id="v-hosp" value={vaxForm.hospital} onChange={e => setVaxForm({ ...vaxForm, hospital: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="v-notes">Notes</label>
                  <input id="v-notes" value={vaxForm.notes} onChange={e => setVaxForm({ ...vaxForm, notes: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={saveVax} disabled={!vaxForm.name}>{vaxForm.id ? 'Save Changes' : 'Add Vaccine'}</button>
                <button className="btn btn-outline" onClick={() => setShowVaxForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          {patientVaccines.length === 0 && (
            <div className="empty-state"><Syringe size={40} /><h3>No vaccinations recorded</h3><p>Add your vaccination history</p></div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Overdue', status: 'overdue', color: 'var(--red)' },
              { label: 'Upcoming', status: 'upcoming', color: 'var(--primary)' },
              { label: 'Completed', status: 'completed', color: 'var(--green)' },
            ].map(group => {
              const groupVax = patientVaccines.filter(v => v.status === group.status);
              if (groupVax.length === 0) return null;
              return (
                <div key={group.status}>
                  <h3 style={{ fontWeight: 600, color: group.color, marginBottom: '0.5rem', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {group.label} ({groupVax.length})
                  </h3>
                  {groupVax.map(vax => (
                    <div key={vax.id} className="card" style={{ padding: '1rem 1.25rem', marginBottom: '0.5rem', borderLeft: `4px solid ${group.color}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Syringe size={20} color={group.color} aria-hidden />
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray-800)' }}>{vax.name}</h4>
                            <p style={{ fontSize: '0.78rem', color: 'var(--gray-500)' }}>
                              {[vax.dose, vax.date && `Given ${vax.date}`, vax.hospital, vax.nextDose && `Next: ${vax.nextDose}`].filter(Boolean).join(' · ')}
                            </p>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-sm btn-outline" aria-label={`Edit ${vax.name}`} onClick={() => editVax(vax)}><Pencil size={13} /></button>
                          <button className="btn btn-sm" style={{ background: 'var(--red-light)', color: 'var(--red)', border: 'none' }} aria-label={`Delete ${vax.name}`}
                            onClick={() => { if (confirm(`Delete ${vax.name}?`)) deleteVaccine(vax.id); }}><Trash2 size={13} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
