import { AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import TrendsPanel from '../../components/TrendsPanel';

export default function HealthTrends() {
  const { currentUser } = useApp();
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Health Trends</h1>
          <p>Track how your recorded health metrics change over time</p>
        </div>
      </div>
      <div className="disclaimer" style={{ marginBottom: '1.5rem' }}>
        <AlertCircle size={16} style={{ flexShrink: 0 }} aria-hidden />
        Charts show only values you have recorded. Values from different labs may use different methods or reference ranges.
      </div>
      {currentUser && <TrendsPanel patientId={currentUser.id} editable />}
    </div>
  );
}
