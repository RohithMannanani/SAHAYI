import React from 'react';

function SecretaryFooter({ onShowToast }) {
  return (
    <footer className="sec-footer">
      <div className="sec-footer__brand">
        <strong>Ayalkoottam</strong> © 2024 Management System
      </div>
      <div className="sec-footer__links">
        <a href="#privacy" onClick={e => { e.preventDefault(); onShowToast('Privacy Policy'); }}>
          Privacy Policy
        </a>
        <span>·</span>
        <a href="#terms" onClick={e => { e.preventDefault(); onShowToast('Terms of Service'); }}>
          Terms of Service
        </a>
        <span>·</span>
        <a href="#support" onClick={e => { e.preventDefault(); onShowToast('Support contact: support@sahayi.org'); }}>
          Contact Support
        </a>
      </div>
    </footer>
  );
}

export default SecretaryFooter;
