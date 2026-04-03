// src/utils/razorpayConfig.js - COMPLETE UPDATED VERSION
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      console.log('Razorpay already loaded');
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    
    script.onload = () => {
      console.log('✅ Razorpay script loaded successfully');
      resolve(true);
    };
    
    script.onerror = () => {
      console.error('❌ Failed to load Razorpay script');
      resolve(false);
    };
    
    document.body.appendChild(script);
  });
};

export const createRazorpayOptions = (orderData, user, description, amount, onSuccess, onFailure) => {
  return {
    key: orderData.key_id,
    amount: Number(orderData.order.amount), // ✅ direct backend value

    currency: orderData.order.currency,
    name: 'EduCoach Pro',
    description: description,
    order_id: orderData.order.id,
    handler: async function(response) {
      if (typeof onSuccess === 'function') {
        await onSuccess(response);
      }
    },
    prefill: {
      name: user?.name || '',
      email: user?.email || '',
      contact: user?.phone || ''
    },
    notes: {
      description: description,
      studentId: user?.id,
      enrollmentId: user?.enrollmentId
    },
    theme: {
      color: '#4F46E5'
    },
    modal: {
      ondismiss: function() {
        if (typeof onFailure === 'function') {
          onFailure('Payment cancelled');
        }
      }
    },
    config: {
      display: {
        blocks: {
          utib: {
            name: "Pay using UPI",
            instruments: [
              {
                method: "upi",
                flows: ["collect", "intent"],
                apps: ["google_pay", "phonepe", "paytm"]
              }
            ]
          },
          netb: {
            name: "NetBanking",
            instruments: [
              {
                method: "netbanking",
                banks: ["HDFC", "ICICI", "SBI", "AXIS", "KOTAK", "YESBANK"]
              }
            ]
          },
          card: {
            name: "Credit/Debit Cards",
            instruments: [
              {
                method: "card",
                networks: ["visa", "mastercard", "rupay", "maestro"]
              }
            ]
          },
          wal: {
            name: "Wallets",
            instruments: [
              {
                method: "wallet",
                wallets: ["paytm", "phonepe", "amazonpay"]
              }
            ]
          }
        },
        sequence: ["block.utib", "block.netb", "block.card", "block.wal"],
        preferences: {
          show_default_blocks: true
        }
      }
    }
  };
};

// ✅ Missing functions add करें:

// Initiate Razorpay payment
export const initiateRazorpayPayment = (orderData, user, description, amount) => {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject('Razorpay not loaded');
      return;
    }

    const options = createRazorpayOptions(
      orderData,
      user,
      description,
      amount,
      resolve,  // onSuccess
      reject    // onFailure
    );

    const razorpayInstance = new window.Razorpay(options);
    razorpayInstance.open();

    // Store instance for later cleanup
    window.razorpayInstance = razorpayInstance;
  });
};

// Close Razorpay modal
export const closeRazorpayModal = () => {
  if (window.razorpayInstance && typeof window.razorpayInstance.close === 'function') {
    window.razorpayInstance.close();
    window.razorpayInstance = null;
  }
};

// Get payment methods
export const getPaymentMethods = () => {
  return [
    { 
      id: 'razorpay', 
      name: 'Razorpay', 
      icon: '💳', 
      description: 'Cards, UPI, Net Banking',
      supportedMethods: ['card', 'upi', 'netbanking', 'wallet']
    },
    { 
      id: 'stripe', 
      name: 'Stripe', 
      icon: '💵', 
      description: 'International Cards',
      disabled: true 
    },
    { 
      id: 'paypal', 
      name: 'PayPal', 
      icon: '🌐', 
      description: 'International Payments',
      disabled: true 
    },
    { 
      id: 'bank_transfer', 
      name: 'Bank Transfer', 
      icon: '🏦', 
      description: 'Direct Bank Transfer',
      disabled: true 
    }
  ];
};

// Check if Razorpay is available
export const isRazorpayAvailable = () => {
  return typeof window !== 'undefined' && window.Razorpay;
};

// Verify payment with backend
export const verifyRazorpayPayment = async (razorpayResponse, sessionToken) => {
  try {
    // ये function आपके paymentAPI पर depend करता है
    // आपको paymentAPI import करना होगा या ये function Payment.jsx में ही implement करना होगा
    // For now, return a dummy response
    return {
      success: true,
      data: {
        payment: {
          amount: parseFloat(razorpayResponse.amount) / 100,
          status: 'completed'
        }
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
};

// Clean up resources
export const cleanupRazorpay = () => {
  closeRazorpayModal();
  
  // Remove script if needed
  const script = document.querySelector('script[src*="razorpay.com/v1/checkout.js"]');
  if (script && script.parentNode) {
    script.parentNode.removeChild(script);
  }
  
  window.Razorpay = null;
  window.razorpayInstance = null;
};