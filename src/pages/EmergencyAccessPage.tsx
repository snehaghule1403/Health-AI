import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { AlertCircle, Phone, Heart, Pill } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Emergency = {
  name: string; blood_group: string; allergies: string[]; conditions: string[]; active_medicines: string[];
  contact_name: string; contact_phone: string; contact_relation: string; updated_at: string;
};

// Public page opened from the patient's QR code. Shows only emergency fields,
// looked up by a random revocable token (see get_emergency_profile in SQL).
export default function EmergencyAccessPage() {
  const { token } = useParams();
  const [data, setData] = useState<Emergency | null>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing' | 'error'>('loading');

  useEffect(() => {
    if (!token || !/^[0-9a-f]{64}$/.test(token)) { setState('missing'); return; }
    supabase.rpc('get_emergency_profile', { p_token: token }).then(({ data: rows, error }) => {
      if (error) return setState('error');
      const row = (rows as Emergency[] | null)?.[0];
      if (!row) return setState('missing');
      setData(row);
      setState('ok');
    });
  }, [token]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1rem', display: 'flex', justifyContent: 'center' }}>
      <main className="card" style={{ width: '100%', maxWidth: 520, padding: '1.5rem', alignSelf: 'flex-start' }}>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', color: 'var(--red)', marginBottom: '1rem' }}>
          <AlertCircle size={22} aria-hidden /> <h1 style={{ fontSize: '1.25rem' }}>Emergency Medical Information</h1>
        </div>
        {state === 'loading' && <p role="status">Loading…</p>}
        {state === 'missing' && <p role="alert">This emergency link is invalid or has been revoked by the patient.</p>}
        {state === 'error' && <p role="alert">Could not load emergency information. Please try again.</p>}
        {state === 'ok' && data && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '1.15rem', fontWeight: 700 }}>{data.name}</p>
            <section><h2 style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}><Heart size={14} aria-hidden /> Blood group</h2>
              <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--red)' }}>{data.blood_group || 'Not provided'}</p></section>
            <section><h2 style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>Allergies</h2>
              <p>{data.allergies.length ? data.allergies.join(', ') : 'None recorded'}</p></section>
            <section><h2 style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}>Conditions</h2>
              <p>{data.conditions.length ? data.conditions.join(', ') : 'None recorded'}</p></section>
            <section><h2 style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}><Pill size={14} aria-hidden /> Current medicines</h2>
              <p>{data.active_medicines.length ? data.active_medicines.join(', ') : 'None recorded'}</p></section>
            <section><h2 style={{ fontSize: '0.9rem', color: 'var(--gray-500)' }}><Phone size={14} aria-hidden /> Emergency contact</h2>
              <p>{data.contact_name || 'Not provided'}{data.contact_relation ? ` (${data.contact_relation})` : ''}</p>
              {data.contact_phone && <a className="btn btn-primary" href={`tel:${data.contact_phone.replace(/[^\d+]/g, '')}`}>Call {data.contact_phone}</a>}</section>
            <p style={{ fontSize: '0.75rem', color: 'var(--gray-500)' }}>
              Provided by the patient via HealthAI; last updated {new Date(data.updated_at).toLocaleDateString()}. Information may be incomplete — verify clinically.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
