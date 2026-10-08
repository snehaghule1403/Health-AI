import { useState } from 'react';
import {
  Droplets, Moon, Dumbbell, Scale, Plus, Target,
  CheckCircle, TrendingUp, Pill, Syringe, Trash2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { Medicine, Vaccine } from '../../types';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line
} from 'recharts';

export default function WellnessTracker() {
  const {
    currentUser, wellness, updateTodayWellness,
    medicines, addMedicine, deleteMedicine, updateMedicine,
    vaccines, addVaccine
  } = useApp();

  const [activeTab, setActiveTab] = useState<'wellness' | 'medicine' | 'vaccine'>('wellness');
  const [showMedForm, setShowMedForm] = useState(false);
  const [showVaxForm, setShowVaxForm] = useState(false);

  const today = new Date().toISOString().split('T')[0];
  const todayEntry = wellness.find(w => w.patientId === currentUser?.id && w.date === today)
    ?? wellness.find(w => w.patientId === currentUser?.id)
    ?? { waterGlasses: 0, sleepHours: 0, exerciseMinutes: 0, weight: 55 };

  const patientWellness = wellness
    .filter(w => w.patientId === currentUser?.id)
    .slice(0, 7)
    .reverse();

  const patientMeds = medicines.filter(m => m.patientId === currentUser?.id);
  const patientVaccines = vaccines.filter(v => v.patientId === currentUser?.id);

  const bmi = currentUser?.height && todayEntry.weight
    ? (todayEntry.weight / ((currentUser.height / 100) ** 2)).toFixed(1)
    : '20.9';

  const bmiStatus = (b: string) => {
    const v = parseFloat(b);
    if (v < 18.5) return { label: 'Underweight', color: '#ea580c' };
    if (v < 25) return { label: 'Normal', color: '#16a34a' };
    if (v < 30) return { label: 'Overweight', color: '#ea580c' };
    return { label: 'Obese', color: '#dc2626' };
  };

  const bmiInfo = bmiStatus(bmi);

  // Medicine form
  const [medForm, setMedForm] = useState({
    name: '', dosage: '', frequency: 'Once daily', time: '',
    startDate: today, endDate: '', instructions: ''
  });

  const handleAddMed = () => {
    if (!medForm.name) return;
    const med: Medicine = {
      id: `med-${Date.now()}`,
      patientId: currentUser!.id,
      name: medForm.name,
      dosage: medForm.dosage,
      frequency: medForm.frequency,
      time: medForm.time ? medForm.time.split(',').map(t => t.trim()) : ['8:00 AM'],
      startDate: medForm.startDate,
      endDate: medForm.endDate || undefined,
      instructions: medForm.instructions,
      taken: false,
    };
    addMedicine(med);
    setShowMedForm(false);
    setMedForm({ name: '', dosage: '', frequency: 'Once daily', time: '', startDate: today, endDate: '', instructions: '' });
  };

  // Vaccine form
  const [vaxForm, setVaxForm] = useState({
    name: '', dose: '', date: today, nextDose: '', hospital: '', notes: ''
  });

  const handleAddVax = () => {
    if (!vaxForm.name) return;
    const vax: Vaccine = {
      id: `vac-${Date.now()}`,
      patientId: currentUser!.id,
      name: vaxForm.name,
      dose: vaxForm.dose,
      date: vaxForm.date,
      nextDose: vaxForm.nextDose || undefined,
      hospital: vaxForm.hospital,
      notes: vaxForm.notes,
      status: new Date(vaxForm.date) > new Date() ? 'upcoming' : 'completed',
    };
    addVaccine(vax);
    setShowVaxForm(false);
    setVaxForm({ name: '', dose: '', date: today, nextDose: '', hospital: '', notes: '' });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Wellness Tracker</h1>
          <p>Monitor your daily health habits and medications</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {([['wellness', 'Daily Wellness'], ['medicine', 'Medicines'], ['vaccine', 'Vaccines']] as const).map(([tab, label]) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-outline'}`}
          >
            {tab === 'wellness' ? <Target size={15} /> : tab === 'medicine' ? <Pill size={15} /> : <Syringe size={15} />}
            {label}
          </button>
        ))}
      </div>

      {/* ─── WELLNESS TAB ─── */}
      {activeTab === 'wellness' && (
        <>
          {/* Today's trackers */}
          <div className="grid-4" style={{ marginBottom: '1.5rem' }}>
            {/* Water */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Droplets size={20} color="#0891b2" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>Water Intake</h3>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#0891b2', marginBottom: '0.25rem' }}>
                {todayEntry.waterGlasses}<span style={{ fontSize: '1rem', color: '#6b7280' }}>/8</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                <div className="progress-fill" style={{ width: `${Math.min((todayEntry.waterGlasses / 8) * 100, 100)}%`, background: '#0891b2' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>glasses today</p>
              <button
                className="btn btn-sm"
                style={{ background: '#cffafe', color: '#0891b2', border: 'none', width: '100%', justifyContent: 'center' }}
                onClick={() => updateTodayWellness({ waterGlasses: Math.min((todayEntry.waterGlasses ?? 0) + 1, 20) })}
              >
                <Plus size={14} /> Add Glass
              </button>
            </div>

            {/* Sleep */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Moon size={20} color="#7c3aed" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>Sleep</h3>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#7c3aed', marginBottom: '0.25rem' }}>
                {todayEntry.sleepHours}<span style={{ fontSize: '1rem', color: '#6b7280' }}> hrs</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                <div className="progress-fill" style={{ width: `${Math.min((todayEntry.sleepHours / 9) * 100, 100)}%`, background: '#7c3aed' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>goal: 7–9 hours</p>
              <input
                type="number"
                min="0" max="24" step="0.5"
                value={todayEntry.sleepHours ?? ''}
                onChange={e => updateTodayWellness({ sleepHours: parseFloat(e.target.value) || 0 })}
                placeholder="Hours slept"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
              />
            </div>

            {/* Exercise */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Dumbbell size={20} color="#16a34a" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>Exercise</h3>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: '#16a34a', marginBottom: '0.25rem' }}>
                {todayEntry.exerciseMinutes}<span style={{ fontSize: '1rem', color: '#6b7280' }}> min</span>
              </div>
              <div className="progress-bar" style={{ marginBottom: '0.75rem' }}>
                <div className="progress-fill" style={{ width: `${Math.min((todayEntry.exerciseMinutes / 60) * 100, 100)}%`, background: '#16a34a' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.75rem' }}>goal: 30–60 min/day</p>
              <input
                type="number"
                min="0" max="300"
                value={todayEntry.exerciseMinutes ?? ''}
                onChange={e => updateTodayWellness({ exerciseMinutes: parseInt(e.target.value) || 0 })}
                placeholder="Minutes"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
              />
            </div>

            {/* Weight / BMI */}
            <div className="card" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <Scale size={20} color="#d97706" />
                <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>Weight & BMI</h3>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#d97706', marginBottom: '0.1rem' }}>
                {todayEntry.weight ?? 55} kg
              </div>
              <div style={{ fontSize: '0.85rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                BMI: <strong style={{ color: bmiInfo.color }}>{bmi}</strong>
                <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', color: bmiInfo.color }}>({bmiInfo.label})</span>
              </div>
              <p style={{ fontSize: '0.7rem', color: '#9ca3af', marginBottom: '0.75rem' }}>
                Height: {currentUser?.height ?? 162} cm
              </p>
              <input
                type="number"
                min="20" max="300" step="0.1"
                value={todayEntry.weight ?? ''}
                onChange={e => updateTodayWellness({ weight: parseFloat(e.target.value) || 0 })}
                placeholder="Weight (kg)"
                style={{ fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
              />
            </div>
          </div>

          {/* Weekly charts */}
          <div className="grid-2" style={{ gap: '1.25rem' }}>
            <div className="card">
              <div className="card-header"><h3>Water — Last 7 Days</h3></div>
              <div style={{ padding: '1rem' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={patientWellness}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={[0, 8]} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => [`${v} glasses`, 'Water']} />
                    <Bar dataKey="waterGlasses" fill="#0891b2" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="card">
              <div className="card-header"><h3>Sleep — Last 7 Days</h3></div>
              <div style={{ padding: '1rem' }}>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={patientWellness}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={d => d.slice(5)} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10 }} unit="h" />
                    <Tooltip formatter={(v: number) => [`${v} hrs`, 'Sleep']} />
                    <Line type="monotone" dataKey="sleepHours" stroke="#7c3aed" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ─── MEDICINE TAB ─── */}
      {activeTab === 'medicine' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowMedForm(!showMedForm)}>
              <Plus size={16} /> Add Medicine
            </button>
          </div>

          {showMedForm && (
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>Add New Medicine</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Medicine Name *</label>
                  <input value={medForm.name} onChange={e => setMedForm({ ...medForm, name: e.target.value })} placeholder="e.g., Paracetamol 500mg" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input value={medForm.dosage} onChange={e => setMedForm({ ...medForm, dosage: e.target.value })} placeholder="e.g., 1 tablet" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select value={medForm.frequency} onChange={e => setMedForm({ ...medForm, frequency: e.target.value })}>
                    {['Once daily', 'Twice daily', 'Thrice daily', 'Weekly', 'As needed'].map(f => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Time(s)</label>
                  <input value={medForm.time} onChange={e => setMedForm({ ...medForm, time: e.target.value })} placeholder="e.g., 8:00 AM, 8:00 PM" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input type="date" value={medForm.startDate} onChange={e => setMedForm({ ...medForm, startDate: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date</label>
                  <input type="date" value={medForm.endDate} onChange={e => setMedForm({ ...medForm, endDate: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Instructions</label>
                <input value={medForm.instructions} onChange={e => setMedForm({ ...medForm, instructions: e.target.value })} placeholder="e.g., Take with meals" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleAddMed} disabled={!medForm.name}>Add Medicine</button>
                <button className="btn btn-outline" onClick={() => setShowMedForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {patientMeds.length === 0 ? (
              <div className="empty-state">
                <Pill size={40} />
                <h3>No medicines added</h3>
                <p>Add your prescribed medications to track them</p>
              </div>
            ) : patientMeds.map(med => (
              <div key={med.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Pill size={20} color="#7c3aed" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1f2937' }}>{med.name}</h3>
                      <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                        {med.dosage} · {med.frequency} · {med.time.join(', ')}
                      </p>
                      {med.instructions && <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.1rem' }}>{med.instructions}</p>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      className={`btn btn-sm ${med.taken ? 'btn-success' : 'btn-outline'}`}
                      onClick={() => updateMedicine({ ...med, taken: !med.taken })}
                    >
                      <CheckCircle size={13} /> {med.taken ? 'Taken' : 'Mark Taken'}
                    </button>
                    <button
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: '0.25rem' }}
                      onClick={() => deleteMedicine(med.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ─── VACCINE TAB ─── */}
      {activeTab === 'vaccine' && (
        <>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
            <button className="btn btn-primary" onClick={() => setShowVaxForm(!showVaxForm)}>
              <Plus size={16} /> Add Vaccine
            </button>
          </div>

          {showVaxForm && (
            <div className="card" style={{ marginBottom: '1.25rem', padding: '1.5rem' }}>
              <h3 style={{ fontWeight: 600, marginBottom: '1rem', fontSize: '0.95rem' }}>Add Vaccination Record</h3>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vaccine Name *</label>
                  <input value={vaxForm.name} onChange={e => setVaxForm({ ...vaxForm, name: e.target.value })} placeholder="e.g., COVID-19 Booster" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dose</label>
                  <input value={vaxForm.dose} onChange={e => setVaxForm({ ...vaxForm, dose: e.target.value })} placeholder="e.g., 1st Dose" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" value={vaxForm.date} onChange={e => setVaxForm({ ...vaxForm, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Next Dose Date</label>
                  <input type="date" value={vaxForm.nextDose} onChange={e => setVaxForm({ ...vaxForm, nextDose: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Hospital / Center</label>
                <input value={vaxForm.hospital} onChange={e => setVaxForm({ ...vaxForm, hospital: e.target.value })} placeholder="Hospital name" />
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={handleAddVax} disabled={!vaxForm.name}>Add Vaccine</button>
                <button className="btn btn-outline" onClick={() => setShowVaxForm(false)}>Cancel</button>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {[
              { label: 'Completed', status: 'completed', color: '#16a34a', bg: '#dcfce7' },
              { label: 'Upcoming', status: 'upcoming', color: '#2563eb', bg: '#dbeafe' },
              { label: 'Overdue', status: 'overdue', color: '#dc2626', bg: '#fee2e2' },
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
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <Syringe size={20} color={group.color} />
                          <div>
                            <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1f2937' }}>{vax.name}</h4>
                            <p style={{ fontSize: '0.78rem', color: '#6b7280' }}>
                              {vax.dose} · {vax.date}
                              {vax.hospital && ` · ${vax.hospital}`}
                              {vax.nextDose && ` · Next: ${vax.nextDose}`}
                            </p>
                          </div>
                        </div>
                        <span className={`badge ${group.status === 'completed' ? 'badge-green' : group.status === 'upcoming' ? 'badge-blue' : 'badge-red'}`}>
                          {group.label}
                        </span>
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
