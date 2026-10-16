import { useNavigate } from 'react-router-dom';
import {
  FileText, Pill, Droplets, Moon, Dumbbell, Scale,
  UserCheck, Plus, Brain, Activity, Share2, AlertCircle,
  TrendingUp, ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function PatientDashboard() {
  const navigate = useNavigate();
  const { currentUser, records, medicines, wellness, consents, vaccines, trendsFor } = useApp();
  const trendData = currentUser ? trendsFor(currentUser.id).filter(t => t.hemoglobin != null) : [];

  const today = new Date().toISOString().split('T')[0];
  const todayWellness = wellness.find(w =>
    w.patientId === currentUser?.id && w.date === today
  );

  const patientRecords = records.filter(r => r.patientId === currentUser?.id);
  const patientMedicines = medicines.filter(m => m.patientId === currentUser?.id && (!m.endDate || m.endDate >= today));
  const upcomingVaccines = vaccines.filter(v => v.patientId === currentUser?.id && v.status !== 'completed').length;
  const waterGoal = currentUser?.waterGoal ?? 8;
  const latestWeight = wellness.find(w => w.patientId === currentUser?.id && w.weight)?.weight ?? currentUser?.weight;
  const activeConsents = consents.filter(c =>
    c.patientId === currentUser?.id && c.status === 'granted'
  );

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = currentUser?.name.split(' ')[0] ?? 'there';

  const bmi = currentUser?.height && latestWeight
    ? (latestWeight / ((currentUser.height / 100) ** 2)).toFixed(1)
    : '—';

  const statCards = [
    {
      icon: <FileText size={20} />, iconBg: '#dbeafe', iconColor: '#2563eb',
      label: 'Medical Records', value: patientRecords.length, sub: 'Total uploaded',
      onClick: () => navigate('/patient/records')
    },
    {
      icon: <Pill size={20} />, iconBg: '#ede9fe', iconColor: '#7c3aed',
      label: 'Active Medicines', value: patientMedicines.length, sub: 'Current prescriptions',
      onClick: () => navigate('/patient/wellness')
    },
    {
      icon: <Droplets size={20} />, iconBg: '#cffafe', iconColor: '#0891b2',
      label: 'Water Intake', value: `${todayWellness?.waterGlasses ?? 0}/${waterGoal}`, sub: 'glasses today',
      onClick: () => navigate('/patient/wellness')
    },
    {
      icon: <Moon size={20} />, iconBg: '#fdf4ff', iconColor: '#a855f7',
      label: 'Sleep', value: `${todayWellness?.sleepHours ?? 0}h`, sub: 'last night',
      onClick: () => navigate('/patient/wellness')
    },
    {
      icon: <Dumbbell size={20} />, iconBg: '#dcfce7', iconColor: '#16a34a',
      label: 'Exercise', value: `${todayWellness?.exerciseMinutes ?? 0} min`, sub: 'today',
      onClick: () => navigate('/patient/wellness')
    },
    {
      icon: <Scale size={20} />, iconBg: '#fef3c7', iconColor: '#d97706',
      label: 'BMI', value: bmi, sub: bmi === '—' ? 'Add height & weight' : 'From latest weight',
      onClick: () => navigate('/patient/trends')
    },
    {
      icon: <UserCheck size={20} />, iconBg: '#dcfce7', iconColor: '#16a34a',
      label: 'Doctor Access', value: activeConsents.length, sub: 'doctors authorized',
      onClick: () => navigate('/patient/sharing')
    },
    {
      icon: <TrendingUp size={20} />, iconBg: '#ffedd5', iconColor: '#ea580c',
      label: 'Vaccines Due', value: upcomingVaccines, sub: 'upcoming or overdue',
      onClick: () => navigate('/patient/trends')
    },
  ];

  const quickActions = [
    { icon: <Plus size={16} />, label: '+ Upload Report', color: '#2563eb', bg: '#dbeafe', path: '/patient/records' },
    { icon: <Brain size={16} />, label: '✦ Ask AI', color: '#7c3aed', bg: '#ede9fe', path: '/patient/ai-assistant' },
    { icon: <AlertCircle size={16} />, label: '+ Add Symptom', color: '#ea580c', bg: '#ffedd5', path: '/patient/ai-assistant' },
    { icon: <Droplets size={16} />, label: '+ Add Water', color: '#0891b2', bg: '#cffafe', path: '/patient/wellness' },
    { icon: <Pill size={16} />, label: '+ Add Medicine', color: '#16a34a', bg: '#dcfce7', path: '/patient/wellness' },
    { icon: <Share2 size={16} />, label: '⇄ Share with Doctor', color: '#1e3a5f', bg: '#e0e7ef', path: '/patient/sharing' },
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#1f2937' }}>
          {greeting}, {firstName} 👋
        </h1>
        <p style={{ color: '#6b7280', marginTop: '0.25rem' }}>
          Here's your health overview for today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        {statCards.map((card, i) => (
          <div
            key={i}
            className="stat-card"
            style={{ cursor: 'pointer' }}
            onClick={card.onClick}
          >
            <div
              className="stat-card-icon"
              style={{ background: card.iconBg, color: card.iconColor }}
            >
              {card.icon}
            </div>
            <div className="stat-card-label">{card.label}</div>
            <div className="stat-card-value">{card.value}</div>
            <div className="stat-card-sub">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Content Row */}
      <div className="grid-2" style={{ marginBottom: '2rem', alignItems: 'start' }}>
        {/* Recent Reports */}
        <div className="card">
          <div className="card-header">
            <h3>Recent Reports</h3>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => navigate('/patient/records')}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div style={{ padding: '0.5rem 0' }}>
            {patientRecords.slice(0, 4).map(record => (
              <div
                key={record.id}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6',
                  cursor: 'pointer'
                }}
                onClick={() => navigate('/patient/records')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 8, background: '#dbeafe',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <FileText size={16} color="#2563eb" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>
                      {record.name}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                      {record.date} · {record.hospital}
                    </div>
                  </div>
                </div>
                <span className={`badge ${record.type === 'Blood Report' ? 'badge-blue' : record.type === 'MRI' ? 'badge-orange' : 'badge-gray'}`}>
                  {record.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card">
          <div className="card-header">
            <h3>Quick Actions</h3>
          </div>
          <div style={{ padding: '1rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem', borderRadius: 10,
                  background: action.bg, color: action.color,
                  border: 'none', cursor: 'pointer', fontWeight: 600,
                  fontSize: '0.8rem', transition: 'opacity 0.15s'
                }}
              >
                {action.icon} {action.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Health Trend Chart */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3>Hemoglobin Trend</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/patient/trends')}
          >
            Full Trends <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="date" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <YAxis
                domain={['auto', 'auto']}
                tick={{ fontSize: 12, fill: '#9ca3af' }}
                unit=" g/dL"
              />
              <Tooltip
                formatter={(v: number) => [`${v} g/dL`, 'Hemoglobin']}
                contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: '0.85rem' }}
              />
              <Line
                type="monotone" dataKey="hemoglobin"
                stroke="#2563eb" strokeWidth={2.5}
                dot={{ fill: '#2563eb', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div style={{
            marginTop: '0.75rem', padding: '0.75rem', background: '#f0fdf4',
            borderRadius: 8, fontSize: '0.8rem', color: '#166534',
            border: '1px solid #86efac'
          }}>
            💡 <strong>AI Insight:</strong> Your hemoglobin has improved from 11.8 g/dL in May 2026 to 12.4 g/dL in September 2026. This is a positive trend. Continue your current supplements as prescribed.
          </div>
        </div>
      </div>

      {/* Medicine Reminders */}
      <div className="card">
        <div className="card-header">
          <h3>Today's Medicine Reminders</h3>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => navigate('/patient/wellness')}
          >
            View All <ChevronRight size={14} />
          </button>
        </div>
        <div style={{ padding: '0.5rem 0' }}>
          {patientMedicines.slice(0, 3).map(med => (
            <div
              key={med.id}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.75rem 1.5rem', borderBottom: '1px solid #f3f4f6'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 8, background: '#ede9fe',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Pill size={16} color="#7c3aed" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1f2937' }}>
                    {med.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                    {med.dosage} · {med.frequency} · {med.time.join(', ')}
                  </div>
                </div>
              </div>
              <span className={`badge ${med.taken ? 'badge-green' : 'badge-orange'}`}>
                {med.taken ? '✓ Taken' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
