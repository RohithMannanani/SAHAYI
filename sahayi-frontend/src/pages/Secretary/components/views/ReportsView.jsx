import React from 'react';
import { FileText } from 'lucide-react';

function ReportsView({ onShowToast }) {
  return (
    <div className="sec-subview">
      <div className="sec-subview-header">
        <h2>Monthly Administrative Reports</h2>
      </div>
      <div className="sec-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <FileText size={48} color="#0C382E" style={{ marginBottom: '1rem' }} />
        <h3>Generate Secretary Monthly Statement</h3>
        <p style={{ color: '#666', margin: '0.5rem 0 1.5rem' }}>
          Download official attendance, loan endorsement, and savings reconciliation PDF report.
        </p>
        <button
          className="sec-action-btn sec-action-btn--primary"
          style={{ display: 'inline-flex' }}
          onClick={() => onShowToast('Generating Monthly PDF Report...')}
        >
          Download Report (PDF)
        </button>
      </div>
    </div>
  );
}

export default ReportsView;
