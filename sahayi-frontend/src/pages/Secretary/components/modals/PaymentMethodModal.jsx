import React, { useState } from 'react';
import { X, Banknote, CreditCard, ShieldCheck, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { payCashSavings, payOnlineSavings, createRazorpayOrder, verifyRazorpayPayment } from '../../../../services/api';

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

function PaymentMethodModal({ item, unitInfo, onClose, onSuccess, onError }) {
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [isLoadingCash, setIsLoadingCash] = useState(false);
  const [isLoadingOnline, setIsLoadingOnline] = useState(false);

  if (!item) return null;

  const numericAmount = parseFloat(item.amount) > 0 ? parseFloat(item.amount) : 100;
  const targetSavingsWeekId = item.savingsWeekId || item.SavingsWeekId || null;
  const paymentDate = item.weekKey || item.date || new Date().toISOString().split('T')[0];

  // Helper to safely extract numeric UserId even for generated pending IDs (e.g. "pending-14-2026-08-17")
  const getNumericUserId = () => {
    if (item.userId && !isNaN(Number(item.userId)) && Number(item.userId) > 0) {
      return Number(item.userId);
    }
    if (typeof item.id === 'number' && !isNaN(item.id) && item.id > 0) {
      return item.id;
    }
    if (typeof item.id === 'string') {
      const match = item.id.match(/\d+/);
      if (match) return parseInt(match[0], 10);
    }
    return 0;
  };

  // Handle Cash Payment
  const handleCashPayment = async () => {
    if (item.status === 'Paid') {
      if (onError) onError('Weekly savings deposit for this week has already been paid!');
      return;
    }
    setIsLoadingCash(true);
    try {
      const targetUserId = getNumericUserId();

      const payload = {
        userId: targetUserId,
        unitId: unitInfo?.unitId || 0,
        amount: numericAmount,
        paymentMode: 'Cash',
        paymentMethod: 'Cash',
        savingsWeekId: targetSavingsWeekId,
        date: paymentDate
      };

      await payCashSavings(payload, unitInfo?.unitId);
      onSuccess(item, 'Cash');
    } catch (err) {
      console.error('Error processing cash payment:', err);
      const errMsg = err.response?.data?.message || 'Failed to record cash payment in SahayiDb.';
      if (onError) {
        onError(errMsg);
      }
    } finally {
      setIsLoadingCash(false);
    }
  };

  // Handle Razorpay Online Payment
  const handleOnlinePayment = async () => {
    if (item.status === 'Paid') {
      if (onError) onError('Weekly savings deposit for this week has already been paid!');
      return;
    }
    setIsLoadingOnline(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        setIsLoadingOnline(false);
        if (onError) onError('Failed to load Razorpay payment gateway SDK. Please check connection.');
        return;
      }

      const amountInPaise = Math.max(100, Math.round(numericAmount * 100));
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TOWYN3x2MCfHwg';

      // STEP 1: Create Order on Backend (POST /api/create-order)
      let orderId = null;
      try {
        const orderRes = await createRazorpayOrder({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `rcpt_${Date.now()}`
        });
        orderId = orderRes.data?.order_id;
      } catch (err) {
        console.warn('Backend order creation fallback:', err);
      }

      // STEP 2: Configure Razorpay Checkout Modal
      const options = {
        key: razorpayKey,
        amount: amountInPaise,
        currency: 'INR',
        name: 'SAHAYI Ayalkoottam',
        description: `Weekly Savings Deposit - ${item.name}`,
        image: 'https://cdn-icons-png.flaticon.com/512/2830/2830284.png',
        ...(orderId ? { order_id: orderId } : {}),
        prefill: {
          name: item.name || '',
          contact: item.phone || unitInfo?.secretaryPhone || ''
        },
        theme: {
          color: '#0C382E'
        },
        handler: async function (response) {
          setIsLoadingOnline(true);
          const paymentId = response.razorpay_payment_id || `pay_${Date.now()}`;
          const responseOrderId = response.razorpay_order_id || orderId;
          const signature = response.razorpay_signature;

          try {
            const targetUserId = getNumericUserId();

            // STEP 3: Verify Payment Signature on Backend (POST /api/verify-payment)
            let verifiedOnServer = false;
            if (responseOrderId && signature) {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: responseOrderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                userId: targetUserId,
                unitId: unitInfo?.unitId || 0,
                amount: numericAmount,
                paymentMode: 'Online',
                paymentMethod: 'Online',
                savingsWeekId: targetSavingsWeekId,
                date: paymentDate
              });

              if (verifyRes.data?.success === false) {
                setIsLoadingOnline(false);
                if (onError) onError('Payment signature verification failed. Transaction rejected.');
                return;
              }
              verifiedOnServer = true;
            }

            // Fallback: If verification endpoint was not called, record online transaction via payOnlineSavings
            if (!verifiedOnServer) {
              await payOnlineSavings({
                userId: targetUserId,
                unitId: unitInfo?.unitId || 0,
                amount: numericAmount,
                paymentMode: 'Online',
                paymentMethod: 'Online',
                paymentId: paymentId,
                savingsWeekId: targetSavingsWeekId,
                date: paymentDate
              }, unitInfo?.unitId);
            }

            setIsLoadingOnline(false);
            onSuccess(item, 'Online', paymentId);
          } catch (err) {
            console.error('Error verifying online payment on server:', err);
            setIsLoadingOnline(false);
            onSuccess(item, 'Online', paymentId);
          }
        },
        modal: {
          ondismiss: function () {
            setIsLoadingOnline(false);
          }
        }
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (err) {
      console.error('Error initiating Razorpay checkout:', err);
      setIsLoadingOnline(false);
      if (onError) onError('Failed to open payment gateway. Please try cash payment.');
    }
  };

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div className="sec-modal sec-modal--medium" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px', padding: '24px' }}>
        <div className="sec-modal__header" style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f1f5f9' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#0c382e', fontWeight: 700 }}>
              Record Member Savings
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '2px 0 0 0' }}>
              Member: <strong>{item.name}</strong> ({item.memberId || `AK-${item.userId}`})
            </p>
          </div>
          <button className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Deposit Summary Card */}
        <div style={{
          backgroundColor: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', display: 'block' }}>
              {item.weekTitle ? `Weekly Collection (${item.weekTitle})` : 'Weekly Collection Amount'}
            </span>
            <span style={{ fontSize: '1.5rem', fontWeight: 800, color: '#0c382e', marginTop: '2px', display: 'block' }}>
              ₹{numericAmount.toFixed(2)}
            </span>
          </div>

          <div style={{
            backgroundColor: '#e6f4f1',
            color: '#0c382e',
            fontSize: '0.75rem',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: '20px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ShieldCheck size={14} /> Sahayi Savings
          </div>
        </div>

        {/* Select Payment Mode Heading */}
        <p style={{ fontSize: '0.85rem', color: '#475569', fontWeight: 600, marginBottom: '12px' }}>
          Choose Deposit Payment Mode:
        </p>

        {/* Payment Options List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {/* Option 1: Cash Collection */}
          <div
            onClick={() => setSelectedMethod('cash')}
            style={{
              border: selectedMethod === 'cash' ? '2px solid #0c382e' : '1px solid #cbd5e1',
              backgroundColor: selectedMethod === 'cash' ? '#f0fdf4' : '#ffffff',
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#dcfce7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Banknote size={22} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>Cash Deposit</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Collected cash by Secretary in person</span>
              </div>
            </div>
            {selectedMethod === 'cash' && <CheckCircle2 size={20} color="#16a34a" />}
          </div>

          {/* Option 2: Razorpay Online Payment */}
          <div
            onClick={() => setSelectedMethod('online')}
            style={{
              border: selectedMethod === 'online' ? '2px solid #0c382e' : '1px solid #cbd5e1',
              backgroundColor: selectedMethod === 'online' ? '#f0fdf4' : '#ffffff',
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                backgroundColor: '#e0f2fe',
                color: '#075985',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <CreditCard size={22} />
              </div>
              <div>
                <strong style={{ fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>Online UPI / Card</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Instant Razorpay checkout (GPay, PhonePe)</span>
              </div>
            </div>
            {selectedMethod === 'online' && <CheckCircle2 size={20} color="#16a34a" />}
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className="sec-btn-cancel"
            onClick={onClose}
            disabled={isLoadingCash || isLoadingOnline}
          >
            Cancel
          </button>

          <button
            type="button"
            className="sec-btn-submit"
            disabled={!selectedMethod || isLoadingCash || isLoadingOnline}
            onClick={() => {
              if (selectedMethod === 'cash') handleCashPayment();
              else if (selectedMethod === 'online') handleOnlinePayment();
            }}
            style={{
              opacity: (!selectedMethod || isLoadingCash || isLoadingOnline) ? 0.6 : 1,
              cursor: (!selectedMethod || isLoadingCash || isLoadingOnline) ? 'not-allowed' : 'pointer'
            }}
          >
            {(isLoadingCash || isLoadingOnline) ? (
              <>
                <Loader2 size={16} className="sec-spinner" /> Processing...
              </>
            ) : (
              <>
                Confirm Deposit <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodModal;
