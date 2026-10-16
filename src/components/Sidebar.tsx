import { useNavigate, useLocation } from 'react-router-dom';
import {
  Heart, LayoutDashboard, FileText, Brain, Activity,
  TrendingUp, AlertCircle, Share2, Settings, LogOut,
  Users, ClipboardList, History, ShieldCheck, Stethoscope
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useApp } from '../context/AppContext';

const PATIENT_NAV = [
  { label: 'Dashboard', path: '/patient/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Health Records', path: '/patient/records', icon: <FileText size={18} /> },
  { label: 'AI Assistant', path: '/patient/ai-assistant', icon: <Brain size={18} /> },
  { label: 'Wellness Tracker', path: '/patient/wellness', icon: <Activity size={18} /> },
  { label: 'Health Trends', path: '/patient/trends', icon: <TrendingUp size={18} /> },
  { label: 'Emergency Profile', path: '/patient/emergency', icon: <AlertCircle size={18} /> },
  { label: 'Doctor Sharing', path: '/patient/sharing', icon: <Share2 size={18} /> },
  { label: 'Settings', path: '/patient/settings', icon: <Settings size={18} /> },
];

const DOCTOR_NAV = [
  { label: 'Dashboard', path: '/doctor/dashboard', icon: <LayoutDashboard size={18} /> },
  { label: 'Patients', path: '/doctor/patients', icon: <Users size={18} /> },
  { label: 'Reports', path: '/doctor/reports', icon: <ClipboardList size={18} /> },
  { label: 'Medical History', path: '/doctor/history', icon: <History size={18} /> },
  { label: 'Health Trends', path: '/doctor/trends', icon: <TrendingUp size={18} /> },
  { label: 'Consent', path: '/doctor/consent', icon: <ShieldCheck size={18} /> },
  { label: 'Settings', path: '/doctor/settings', icon: <Settings size={18} /> },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentUser, logout } = useApp();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [location.pathname]);

  if (!currentUser) return null;

  const isPatient = currentUser.role === 'patient';
  const navItems = isPatient ? PATIENT_NAV : DOCTOR_NAV;

  const handleLogout = () => {
    void logout();
    navigate('/');
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <>
    <header className="mobile-topbar">
      <button className="mobile-menu-btn" aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(o => !o)}>
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>
      <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}><Heart size={18} fill="white" /> HealthAI</span>
    </header>
    {open && <div className="sidebar-backdrop" onClick={() => setOpen(false)} aria-hidden />}
    <aside id="app-sidebar" className={`sidebar ${open ? 'open' : ''}`}>
      {/* Logo */}
      <div className="sidebar-logo">
        <h2>
          <Heart size={20} fill="white" />
          HealthAI
        </h2>
        <span>{isPatient ? 'Patient Portal' : 'Doctor Portal'}</span>
      </div>

      {/* User */}
      <div className="sidebar-user">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: 36, height: 36, borderRadius: '50%',
            background: isPatient ? '#2563eb' : '#16a34a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
          }}>
            {getInitials(currentUser.name)}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div className="sidebar-user-name" style={{
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
            }}>
              {currentUser.name}
            </div>
            <div className="sidebar-user-role">
              {isPatient ? currentUser.bloodGroup ?? 'Patient' : currentUser.specialization ?? 'Doctor'}
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <button
            key={item.path}
            className={`sidebar-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            aria-current={location.pathname === item.path ? 'page' : undefined}
            onClick={() => navigate(item.path)}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        {!isPatient && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 0', marginBottom: '0.5rem'
          }}>
            <Stethoscope size={14} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)' }}>
              {currentUser.hospital || 'Hospital not set'}
            </span>
          </div>
        )}
        <button
          className="sidebar-nav-item"
          onClick={handleLogout}
          style={{ color: '#fca5a5', borderRadius: 6 }}
        >
          <LogOut size={18} />
          Logout
        </button>
        <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.25)', marginTop: '0.75rem', lineHeight: 1.4 }}>
          HealthAI v2.0<br />Not a substitute for professional care
        </div>
      </div>
    </aside>
    </>
  );
}
