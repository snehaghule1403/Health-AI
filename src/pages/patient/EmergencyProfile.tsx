import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AlertCircle, Phone, Heart, Shield, Pill, QrCode, RefreshCw, Save } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PUBLIC_SITE_URL, isOffPublicSite } from '../../lib/siteUrl';

const BLOOD_GROUPS = ['', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const splitList = (s: string) => s.split(',').map(x => x.trim()).filter(Boolean).slice(0, 30);

export default function EmergencyProfile() {
  const { currentUser, emergencyProfiles, medicines, saveEmergency, setEmergencyAccess } = useApp();
  const saved = emergencyProfiles.find(e => e.patientId === currentUser?.id);
  const activeMedNames = medicines
    .filter(m => m.patientId === currentUser?.id && (!m.endDate || m.endDate >= new Date().toISOString().split('T')[0]))
    .map(m => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}`);

  const [form, setForm] = useState({
    bloodGroup: '', allergies: '', conditions: '', activeMedicines: '', contactName: '', contactPhone: '', contactRelation: '',
  });
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [qrUrl, setQrUrl] = useState('');
  const [qrBusy, setQrBusy] = useState(false);

  useEffect(() => {
    setForm({
      bloodGroup: saved?.bloodGroup || currentUser?.bloodGroup || '',
      allergies: saved?.allergies.join(', ') ?? '',
      conditions: saved?.conditions.join(', ') ?? '',
      activeMedicines: saved ? saved.activeMedicines.join(', ') : activeMedNames.join(', '),
      contactName: saved?.emergencyContact.name ?? '',
      contactPhone: saved?.emergencyContact.phone ?? '',
      contactRelation: saved?.emergencyContact.relation ?? '',
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saved?.patientId]);

  // Always the public production domain: preview/localhost URLs need a Vercel login or don't resolve.
  const link = saved?.accessToken ? `${PUBLIC_SITE_URL}/emergency/${saved.accessToken}` : '';

  useEffect(() => {
    if (!link) { setQrUrl(''); return; }
    // The QR encodes only a link with a random token — no health data.
    QRCode.toDataURL(link, { width: 240, margin: 1, errorCorrectionLevel: 'M' }).then(setQrUrl).catch(() => setQrUrl(''));
  }, [link]);

  const save = async () => {
    setStatus(null);
    if (form.contactPhone && !/^[+\d][\d\s()-]{5,20}$/.test(form.contactPhone)) {
      return setStatus({ ok: false, msg: 'Enter a valid phone number for the emergency contact.' });
    }
    setSaving(true);
    const ok = await saveEmergency({
      patientId: currentUser!.id,
      bloodGroup: form.bloodGroup,
      allergies: splitList(form.allergies),
      conditions: splitList(form.conditions),
      activeMedicines: splitList(form.activeMedicines),
      emergencyContact: { name: form.contactName.trim(), phone: form.contactPhone.trim(), relation: form.contactRelation.trim() },
    });
    setSaving(false);
    setStatus(ok ? { ok: true, msg: 'Emergency profile saved.' } : { ok: false, msg: 'Could not save. See the error above.' });
  };

  const toggleAccess = async (enable: boolean) => {
    if (!enable && !confirm('Disable the emergency QR? Anyone holding the old QR will no longer be able to open it.')) return;
    if (enable && link && !confirm('Generate a new QR? The previous QR code will stop working.')) return;
    setQrBusy(true);
    if (!saved) await save();
    await setEmergencyAccess(enable);
    setQrBusy(false);
  };

  const field = (key: keyof typeof form, label: string, placeholder = '', type = 'text') => (
    <div className="form-group">
      <label className="form-label" htmlFor={`em-${key}`}>{label}</label>
      <input id={`em-${key}`} type={type} value={form[key]} placeholder={placeholder} maxLength={500}
        onChange={e => setForm({ ...form, [key]: e.target.value })} />
    </div>
  );

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
        <AlertCircle size={20} color="#dc2626" style={{ flexShrink: 0, marginTop: 2 }} aria-hidden />
        <div>
          <p style={{ fontWeight: 600, color: '#991b1b', marginBottom: '0.15rem' }}>Emergency Information</p>
          <p style={{ fontSize: '0.85rem', color: '#dc2626' }}>
            Only the fields on this page are visible through your QR code. Your medical records are never shown on the emergency page.
          </p>
        </div>
      </div>

      <div className="grid-2" style={{ gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.25rem' }}>
          {status && <div className={`alert ${status.ok ? 'alert-success' : 'alert-danger'}`} role="status" style={{ marginBottom: '1rem' }}>{status.msg}</div>}
          <div className="form-group">
            <label className="form-label" htmlFor="em-blood"><Heart size={14} color="#dc2626" aria-hidden /> Blood group</label>
            <select id="em-blood" value={form.bloodGroup} onChange={e => setForm({ ...form, bloodGroup: e.target.value })}>
              {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b || 'Unknown'}</option>)}
            </select>
          </div>
          {field('allergies', 'Known allergies (comma-separated)', 'e.g. Penicillin, Peanuts')}
          {field('conditions', 'Medical conditions (comma-separated)', 'e.g. Asthma')}
          <div className="form-group">
            <label className="form-label" htmlFor="em-activeMedicines"><Pill size={14} aria-hidden /> Current medicines (comma-separated)</label>
            <input id="em-activeMedicines" value={form.activeMedicines} onChange={e => setForm({ ...form, activeMedicines: e.target.value })} />
            {activeMedNames.length > 0 && (
              <button type="button" className="btn btn-outline btn-sm" style={{ marginTop: '0.4rem' }}
                onClick={() => setForm({ ...form, activeMedicines: activeMedNames.join(', ') })}>
                Fill from my medicine list
              </button>
            )}
          </div>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 600, margin: '1rem 0 0.5rem', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Phone size={15} color="#dc2626" aria-hidden /> Emergency contact
          </h3>
          {field('contactName', 'Name')}
          <div className="form-row">
            {field('contactRelation', 'Relation', 'e.g. Mother')}
            {field('contactPhone', 'Phone', '+91 …', 'tel')}
          </div>
          <button className="btn btn-primary" onClick={save} disabled={saving}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save emergency profile'}
          </button>
        </div>

        <div>
          <div className="card" style={{ padding: '1.5rem', textAlign: 'center', position: 'sticky', top: '1rem' }}>
            <h3 style={{ fontWeight: 600, color: '#1f2937', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <QrCode size={20} aria-hidden /> Emergency QR Code
            </h3>
            {link && qrUrl ? (
              <>
                <img src={qrUrl} alt="Emergency profile QR code" width={200} height={200} style={{ margin: '0.75rem auto', display: 'block' }} />
                <p style={{ fontSize: '0.75rem', color: '#6b7280', wordBreak: 'break-all', marginBottom: '1rem' }}>
                  <a href={link} target="_blank" rel="noopener noreferrer">Open emergency page</a>
                </p>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                  <a className="btn btn-outline btn-sm" href={qrUrl} download="healthai-emergency-qr.png">Download QR</a>
                  <button className="btn btn-outline btn-sm" disabled={qrBusy} onClick={() => toggleAccess(true)}><RefreshCw size={13} /> Regenerate</button>
                  <button className="btn btn-sm" style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }} disabled={qrBusy} onClick={() => toggleAccess(false)}>Disable</button>
                </div>
              </>
            ) : (
              <>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', margin: '1rem 0' }}>
                  Emergency QR sharing is off. Turn it on to create a QR code for your phone lock screen or wallet card.
                </p>
                <button className="btn btn-primary" disabled={qrBusy} onClick={() => toggleAccess(true)}>
                  <Shield size={15} /> {qrBusy ? 'Generating…' : 'Enable emergency QR'}
                </button>
              </>
            )}
            {isOffPublicSite() && (
              <div className="alert alert-info" style={{ marginTop: '1rem', textAlign: 'left', fontSize: '0.75rem' }}>
                You are on a test or preview site. The QR still points to {PUBLIC_SITE_URL}, which only works once this version is live there.
              </div>
            )}
            <div style={{ background: '#f9fafb', borderRadius: 8, padding: '0.75rem', fontSize: '0.75rem', color: '#4b5563', marginTop: '1.25rem', textAlign: 'left', lineHeight: 1.6 }}>
              The QR contains only a link with a long random code. Anyone who scans it can see the emergency fields above, without signing in — that is intentional for first responders. Regenerate or disable it at any time if the QR is lost.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
