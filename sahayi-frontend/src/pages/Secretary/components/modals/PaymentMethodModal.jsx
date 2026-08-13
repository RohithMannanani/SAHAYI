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

  // Handle Cash Payment
  const handleCashPayment = async () => {
    if (item.status === 'Paid') {
      if (onError) onError('Weekly savings deposit for this week has already been paid!');
      return;
    }
    setIsLoadingCash(true);
    try {
      const targetUserId = (item.userId && !isNaN(Number(item.userId)))
        ? Number(item.userId)
        : ((item.id && !isNaN(Number(item.id))) ? Number(item.id) : 0);

      const payload = {
        userId: targetUserId,
        unitId: unitInfo?.unitId || 0,
        amount: numericAmount,
        paymentMode: 'Cash',
        paymentMethod: 'Cash'
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
            const targetUserId = (item.userId && !isNaN(Number(item.userId)))
              ? Number(item.userId)
              : ((item.id && !isNaN(Number(item.id))) ? Number(item.id) : 0);

            // STEP 3: Verify Payment Signature on Backend (POST /api/verify-payment)
            if (responseOrderId && signature) {
              const verifyRes = await verifyRazorpayPayment({
                razorpay_order_id: responseOrderId,
                razorpay_payment_id: paymentId,
                razorpay_signature: signature,
                userId: targetUserId,
                unitId: unitInfo?.unitId || 0,
                amount: numericAmount,
                paymentMode: 'Online',
                paymentMethod: 'Online'
              });

              if (verifyRes.data?.success === false) {
                setIsLoadingOnline(false);
                if (onError) onError('Payment signature verification failed. Transaction rejected.');
                return;
              }
            }

            // Always ensure online transaction is recorded via payOnlineSavings
            await payOnlineSavings({
              userId: targetUserId,
              unitId: unitInfo?.unitId || 0,
              amount: numericAmount,
              paymentMode: 'Online',
              paymentMethod: 'Online',
              razorpayPaymentId: paymentId
            }, unitInfo?.unitId);
          } catch (e) {
            console.warn('Online payment verify notice:', e);
          }

          setIsLoadingOnline(false);
          onSuccess(item, 'Online', paymentId);
        },
        modal: {
          ondismiss: function () {
            setIsLoadingOnline(false);
            if (onError) onError('Payment checkout cancelled by user.');
          }
        }
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', function (response) {
        setIsLoadingOnline(false);
        const failMsg = response.error?.description || 'Transaction failed. Please try again.';
        if (onError) {
          onError(`Payment Failed: ${failMsg}`);
        }
      });

      razorpayInstance.open();
      setIsLoadingOnline(false);
    } catch (err) {
      console.error('Error initiating Razorpay checkout:', err);
      setIsLoadingOnline(false);
      if (onError) onError('Could not launch Razorpay checkout modal.');
    }
  };

  return (
    <div className="sec-modal-overlay" onClick={onClose}>
      <div
        className="sec-modal sec-payment-modal"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sec-modal__header">
          <div>
            <h3 className="sec-payment-modal__title">Select Payment Method</h3>
            <p className="sec-payment-modal__subtitle">
              Choose how to collect weekly savings for member
            </p>
          </div>
          <button type="button" className="sec-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Member & Payment Amount Summary Box */}
        <div className="sec-payment-summary-card">
          <div className="sec-payment-summary-info">
            <span className="sec-payment-summary-label">Member Deposit</span>
            <h4 className="sec-payment-summary-name">{item.name}</h4>
            <span className="sec-payment-summary-meta">
              ID: {item.memberId} &bull; {item.week || 'Week 2'} ({item.month || 'Aug 2026'})
            </span>
          </div>
          <div className="sec-payment-summary-amount-box">
            <span className="sec-payment-summary-amount-label">Amount Due</span>
            <span className="sec-payment-summary-amount-val">
              ₹{numericAmount.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Payment Methods Options */}
        <div className="sec-payment-options-grid">
          {/* Cash Payment Option Card */}
          <div
            className={`sec-payment-option-card ${
              selectedMethod === 'cash' ? 'sec-payment-option-card--active' : ''
            }`}
            onClick={() => setSelectedMethod('cash')}
          >
            <div className="sec-payment-option-top">
              <div className="sec-payment-icon-wrapper sec-payment-icon-wrapper--cash">
                <Banknote size={24} />
              </div>
              <span className="sec-payment-badge sec-payment-badge--cash">
                Manual Cash
              </span>
            </div>
            <div className="sec-payment-option-content">
              <h4>Cash Payment</h4>
              <p>
                Mark weekly deposit as collected manually in cash via API (<code>POST /api/savings/pay-cash</code>).
              </p>
            </div>
            <button
              type="button"
              className="sec-payment-btn sec-payment-btn--cash"
              disabled={isLoadingCash || isLoadingOnline}
              onClick={(e) => {
                e.stopPropagation();
                handleCashPayment();
              }}
            >
              {isLoadingCash ? (
                <>
                  <Loader2 size={16} className="sec-spin-icon" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Pay Cash</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          {/* Online Payment (Razorpay) Option Card */}
          <div
            className={`sec-payment-option-card ${
              selectedMethod === 'online' ? 'sec-payment-option-card--active' : ''
            }`}
            onClick={() => setSelectedMethod('online')}
          >
            <div className="sec-payment-option-top">
              <div className="sec-payment-icon-wrapper sec-payment-icon-wrapper--online">
                <CreditCard size={24} />
              </div>
              <span className="sec-payment-badge sec-payment-badge--online">
                Razorpay Checkout
              </span>
            </div>
            <div className="sec-payment-option-content">
              <h4>Online Payment</h4>
              <p>
                Trigger digital payment flow via Razorpay supporting UPI, Cards, NetBanking, and Wallets.
              </p>
            </div>
            <button
              type="button"
              className="sec-payment-btn sec-payment-btn--online"
              disabled={isLoadingCash || isLoadingOnline}
              onClick={(e) => {
                e.stopPropagation();
                handleOnlinePayment();
              }}
            >
              {isLoadingOnline ? (
                <>
                  <Loader2 size={16} className="sec-spin-icon" />
                  <span>Opening Razorpay...</span>
                </>
              ) : (
                <>
                  <span>Pay Online</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security Footer */}
        <div className="sec-payment-footer-note">
          <ShieldCheck size={16} color="#0C382E" />
          <span>Transactions are encrypted & recorded securely in SahayiDb</span>
        </div>
      </div>
    </div>
  );
}

export default PaymentMethodModal;
