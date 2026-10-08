import { useEffect, useRef, useState } from 'react';
import { AlertCircle, Phone, Heart, Shield, Pill, QrCode } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DEMO_EMERGENCY } from '../../data/demoData';

export default function EmergencyProfile() {
  const { currentUser } = useApp();
  const qrRef = useRef<HTMLDivElement>(null);
  const [qrGenerated, setQrGenerated] = useState(false);

  const emergency = DEMO_EMERGENCY;

  useEffect(() => {
    // Generate QR code using a canvas-based approach (no external API)
    generateQR();
  }, []);

  const generateQR = () => {
    try {
      // Simple QR code representation as text in a styled box
      setQrGenerated(true);
    } catch {
      setQrGenerated(false);
    }
  };

  const qrData = `HEALTH EMERGENCY INFO
Name: ${currentUser?.name ?? 'Sneha Ghule'}
Blood Group: ${emergency.bloodGroup}
Allergies: ${emergency.allergies.join(', ')}
Conditions: ${emergency.conditions.join(', ')}
Emergency Contact: ${emergency.emergencyContact.name} (${emergency.emergencyContact.relation})
Phone: ${emergency.emergencyContact.phone}
Medicines: ${emergency.activeMedicines.join(', ')}`;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Emergency Profile</h1>
          <p>Critical health information accessible in emergencies</p>
        </div>
        <span className="badge badge-red" style={{ fontSize: '0.8rem', padding: '0.4rem 0.85rem' }}>
          🚨 Emergency Access
        </span>
      </div>

      <div style={{ background: '#fee2e2', border: '1px solid #fca5a5', borderRadius: 12, padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <p style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.15rem' }}>Emergency Information</p>
          <p style={{ fontSize: '0.85rem', color: '#dc2626' }}>
            This page contains essential health details that should be shown to medical personnel in emergencies. Keep this information updated.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem' }}>
        {/* Left: Emergency info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Blood Group */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Heart size={24} color="#dc2626" fill="#dc2626" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af', fontWeight: 600 }}>BLOOD GROUP</div>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>
                  {emergency.bloodGroup}
                </div>
              </div>
            </div>
          </div>

          {/* Allergies */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, color: '#dc2626', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <AlertCircle size={16} /> Known Allergies
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {emergency.allergies.map((a, i) => (
                <span key={i} className="badge badge-red">{a}</span>
              ))}
            </div>
          </div>

          {/* Active Medicines */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, color: '#7c3aed', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Pill size={16} /> Current Medications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {emergency.activeMedicines.map((m, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7c3aed', flexShrink: 0 }} />
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Medical Conditions */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h3 style={{ fontWeight: 600, color: '#ea580c', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Shield size={16} /> Medical Conditions
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {emergency.conditions.map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', color: '#374151' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c', flexShrink: 0 }} />
                  {c}
                </div>
              ))}
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="card" style={{ padding: '1.25rem', borderLeft: '4px solid #dc2626' }}>
            <h3 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
              <Phone size={16} color="#dc2626" /> Emergency Contact
            </h3>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1f2937' }}>
              {emergency.emergencyContact.name}
            </div>
            <div style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '0.15rem' }}>
              {emergency.emergencyContact.relation}
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: '#dc2626', marginTop: '0.5rem' }}>
              📞 {emergency.emergencyContact.phone}
            </div>
          </div>
        </div>

        {/* Right: QR Code */}
        <div>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', position: 'sticky', top: '1rem' }}>
            <h3 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <QrCode size={20} /> Emergency QR Code
            </h3>
            <p style={{ fontSize: '0.8rem', color: '#6b7280', marginBottom: '1.5rem' }}>
              Scan this QR code to access emergency health information instantly
            </p>

            {/* QR Code Visual */}
            <div ref={qrRef} style={{
              width: 200, height: 200, margin: '0 auto 1.5rem',
              background: 'white', border: '2px solid #1f2937',
              borderRadius: 12, padding: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', overflow: 'hidden'
            }}>
              {/* Simulated QR pattern */}
              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                {/* Corner squares */}
                {[
                  { top: 0, left: 0 },
                  { top: 0, right: 0 },
                  { bottom: 0, left: 0 },
                ].map((pos, i) => (
                  <div key={i} style={{
                    position: 'absolute', ...pos,
                    width: 40, height: 40,
                    border: '5px solid #1f2937', borderRadius: 4
                  }}>
                    <div style={{
                      position: 'absolute', top: '50%', left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 16, height: 16, background: '#1f2937', borderRadius: 2
                    }} />
                  </div>
                ))}
                {/* Data cells */}
                <div style={{
                  position: 'absolute', inset: '48px 48px 48px 48px',
                  display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 2
                }}>
                  {Array.from({ length: 64 }, (_, i) => {
                    const seed = (i * 7 + 13) % 17;
                    return <div key={i} style={{ background: seed > 8 ? '#1f2937' : 'transparent', borderRadius: 1 }} />;
                  })}
                </div>
                {/* Center blood group */}
                <div style={{
                  position: 'absolute', bottom: 0, right: 0,
                  width: 40, height: 40,
                  background: '#fee2e2', border: '2px solid #dc2626', borderRadius: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, color: '#dc2626', fontSize: '0.75rem'
                }}>
                  {emergency.bloodGroup}
                </div>
              </div>
            </div>

            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '1rem', textAlign: 'left', marginBottom: '1rem' }}>
              <h4 style={{ fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: '0.5rem' }}>QR Contains:</h4>
              <div style={{ fontSize: '0.75rem', color: '#6b7280', lineHeight: 1.8 }}>
                <div>🩸 Blood Group: <strong style={{ color: '#dc2626' }}>{emergency.bloodGroup}</strong></div>
                <div>⚠️ Allergies: {emergency.allergies.join(', ')}</div>
                <div>💊 Medicines: {emergency.activeMedicines.length} active</div>
                <div>📞 Emergency: {emergency.emergencyContact.name}</div>
              </div>
            </div>

            <div style={{
              background: '#fef9c3', border: '1px solid #fde68a',
              borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem', color: '#713f12'
            }}>
              Demo prototype — QR is simulated. In production, this would link to a secure, encrypted emergency page.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
