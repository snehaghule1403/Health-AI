import { useState } from 'react';
import { User, Bell, Shield, Lock, CheckCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function Settings() {
  const { currentUser } = useApp();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Settings</h1>
          <p>Manage your account and preferences</p>
        </div>
      </div>

      {saved && <div className="alert alert-success"><CheckCircle size={16} /> Settings saved (demo mode)</div>}

      <div style={{ maxWidth: 640 }}>
        {/* Profile */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3><User size={16} style={{ marginRight: 8 }} />Profile Information</h3>
          </div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input defaultValue={currentUser?.name} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input defaultValue={currentUser?.email} type="email" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input defaultValue={currentUser?.phone ?? ''} />
              </div>
              {currentUser?.role === 'patient' && (
                <div className="form-group">
                  <label className="form-label">Blood Group</label>
                  <select defaultValue={currentUser?.bloodGroup ?? ''}>
                    {['A+','A-','B+','B-','O+','O-','AB+','AB-'].map(g => <option key={g}>{g}</option>)}
                  </select>
                </div>
              )}
            </div>
            <button className="btn btn-primary btn-sm" onClick={handleSave}>Save Profile</button>
          </div>
        </div>

        {/* Notifications */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3><Bell size={16} style={{ marginRight: 8 }} />Notifications</h3>
          </div>
          <div className="card-body">
            {[
              'Medicine reminders',
              'Upcoming vaccine doses',
              'Doctor access requests',
              'AI analysis completed',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>{item}</span>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ marginRight: '0.5rem' }} />
                  <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>Enabled</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Security */}
        <div className="card" style={{ marginBottom: '1.25rem' }}>
          <div className="card-header">
            <h3><Shield size={16} style={{ marginRight: 8 }} />Security</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <Lock size={14} /> Your health data is stored locally in this prototype. No data is transmitted to external servers.
            </div>
            <div className="form-group">
              <label className="form-label">Change Password</label>
              <input type="password" placeholder="New password" />
            </div>
            <button className="btn btn-outline btn-sm" onClick={handleSave}>Update Password</button>
          </div>
        </div>

        <div className="card" style={{ padding: '1.25rem', background: '#f9fafb' }}>
          <p style={{ fontSize: '0.8rem', color: '#9ca3af', textAlign: 'center' }}>
            HealthAI Prototype — Academic Project · Not a real medical application
          </p>
        </div>
      </div>
    </div>
  );
}
