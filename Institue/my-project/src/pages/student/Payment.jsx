import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { paymentAPI } from "../../services/api";
import { useNavigate } from "react-router-dom";

const StudentPayment = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // State
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [amount, setAmount] = useState(0);
  const [studentName, setStudentName] = useState("");
  const [paymentData, setPaymentData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(1);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // ✅ RAZORPAY TEST KEY (Use this directly)
  const RAZORPAY_KEY_ID = "rzp_test_Ryi7BVfi7WxpnU";

  // ✅ INDIVIDUAL CLASSES WITH FIXED FEES
  const individualClasses = [
    { id: "class1", name: "Class 1", fee: 400 },
    { id: "class2", name: "Class 2", fee: 400 },
    { id: "class3", name: "Class 3", fee: 400 },
    { id: "class4", name: "Class 4", fee: 600 },
    { id: "class5", name: "Class 5", fee: 600 },
    { id: "class6", name: "Class 6", fee: 600 },
    { id: "class7", name: "Class 7", fee: 800 },
    { id: "class8", name: "Class 8", fee: 800 },
    { id: "class9", name: "Class 9", fee: 1000 },
    { id: "class10", name: "Class 10", fee: 1000 },
    { id: "class11_science", name: "Class 11 (Science)", fee: 1500 },
    { id: "class12_science", name: "Class 12 (Science)", fee: 1500 },
    { id: "class11_commerce", name: "Class 11 (Commerce)", fee: 1200 },
    { id: "class12_commerce", name: "Class 12 (Commerce)", fee: 1200 },
    { id: "jee_prep", name: "JEE Preparation", fee: 2000 },
    { id: "neet_prep", name: "NEET Preparation", fee: 2000 },
    { id: "upsc_foundation", name: "UPSC Foundation", fee: 1800 },
  ];

  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Load Razorpay script
  useEffect(() => {
    loadRazorpayScript();
  }, []);

  // Auto-fill student name
  useEffect(() => {
    if (currentUser?.name) {
      setStudentName(currentUser.name);
    }
  }, [currentUser]);

  // Update amount when class changes
  useEffect(() => {
    if (selectedClass) {
      const selectedClassObj = individualClasses.find(cls => cls.id === selectedClass);
      if (selectedClassObj) {
        setAmount(selectedClassObj.fee);
      }
    } else {
      setAmount(0);
    }
  }, [selectedClass]);

  // Load Razorpay script dynamically
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        setIsRazorpayLoaded(true);
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        setIsRazorpayLoaded(true);
        console.log('✅ Razorpay script loaded successfully');
        resolve(true);
      };
      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        setError('Failed to load payment gateway. Please refresh the page.');
        resolve(false);
      };
      document.body.appendChild(script);
    });
  };

  // Step 1: Create Order
  const handleCreateOrder = async () => {
    try {
      setError("");

      // Validation
      if (!selectedClass) {
        setError("Please select your class");
        return;
      }

      if (!selectedMonth) {
        setError("Please select month");
        return;
      }

      if (!studentName || studentName.trim().length < 2) {
        setError("Please enter your full name for confirmation");
        return;
      }

      const selectedClassObj = individualClasses.find(cls => cls.id === selectedClass);
      const finalDescription = `${selectedClassObj.name} - ${selectedMonth} ${new Date().getFullYear()} Monthly Fees`;

      setIsLoading(true);
      
      const res = await paymentAPI.createOrder({
        amount: amount,
        description: finalDescription,
        month: selectedMonth,
        class: selectedClassObj.name,
        studentName: studentName.trim(),
        studentId: currentUser?.id,
        enrollmentId: currentUser?.enrollmentId
      });

      console.log('✅ Order created:', res.data);
      
      if (res.data.success) {
        setPaymentData(res.data);
        setStep(2);
      } else {
        throw new Error(res.data.message || 'Failed to create order');
      }
      
    } catch (err) {
      console.error('❌ Create order error:', err);
      setError(err.response?.data?.message || "Failed to create order. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Razorpay Payment - FIXED VERSION
  const handleRazorpayPayment = async () => {
    if (!paymentData) {
      setError("Payment data missing");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Ensure Razorpay is loaded
      if (!isRazorpayLoaded) {
        const loaded = await loadRazorpayScript();
        if (!loaded) {
          throw new Error("Payment gateway not available");
        }
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay not loaded. Please refresh the page.");
      }

      const selectedClassObj = individualClasses.find(cls => cls.id === selectedClass);
      const description = `${selectedClassObj.name} - ${selectedMonth} Monthly Fee`;

      // ✅ FIXED: Use RAZORPAY_KEY_ID directly instead of process.env
      const options = {
        key: RAZORPAY_KEY_ID, // ✅ Direct key
        amount: amount * 100, // Amount in paise
        currency: "INR",
        name: "EduCoach Pro",
        description: description,
        order_id: paymentData.order?.id || paymentData.orderId,
        handler: async function (response) {
          console.log('✅ Payment successful:', response);
          
          try {
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              amount: amount,
              description: description,
              month: selectedMonth,
              class: selectedClassObj.name,
              studentName: studentName,
              studentId: currentUser?.id
            };

            const verification = await paymentAPI.verifyPayment(verificationData);

            if (verification.data.success) {
              setStep(3);
              
              setTimeout(() => {
                navigate("/student/payment-history", {
                  state: {
                    paymentSuccess: true,
                    paymentId: response.razorpay_payment_id,
                    amount: amount,
                    month: selectedMonth,
                    className: selectedClassObj.name,
                    studentName: studentName
                  },
                });
              }, 1500);
            } else {
              throw new Error(verification.data.message || "Payment verification failed");
            }
          } catch (error) {
            console.error('❌ Verification error:', error);
            setError("Payment verification failed. Please contact support.");
            setStep(1);
          }
        },
        prefill: {
          name: studentName,
          email: currentUser?.email || "",
          contact: currentUser?.phone || ""
        },
        notes: {
          studentId: currentUser?.id,
          enrollmentId: currentUser?.enrollmentId,
          class: selectedClassObj.name,
          month: selectedMonth
        },
        theme: {
          color: "#3B82F6"
        },
        modal: {
          ondismiss: function() {
            console.log('Payment modal closed');
            setIsLoading(false);
          },
          escape: true,
          animation: true
        }
      };

      console.log('🚀 Opening Razorpay with options:', options);

      // Create and open Razorpay instance
      const razorpayInstance = new window.Razorpay(options);
      
      razorpayInstance.on('payment.failed', function(response) {
        console.error('❌ Payment failed:', response.error);
        setError(`Payment failed: ${response.error.description || 'Unknown error'}`);
        setStep(1);
        setIsLoading(false);
        
        // Optionally save failed payment to backend
        paymentAPI.handleFailedPayment({
          orderId: paymentData.order?.id,
          errorReason: response.error.description
        }).catch(console.error);
      });

      razorpayInstance.open();
      
    } catch (err) {
      console.error('❌ Razorpay payment error:', err);
      setError(err.message || "Payment failed to initiate. Please try again.");
      setStep(1);
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-lg mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Pay Monthly Fees</h1>
          <p className="text-gray-600">Select your class, month and confirm details</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-lg">
          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${step >= stepNum ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'}`}>
                  <span className="font-bold">{stepNum}</span>
                </div>
                <span className="text-xs mt-2">
                  {stepNum === 1 ? 'Details' : stepNum === 2 ? 'Payment' : 'Complete'}
                </span>
              </div>
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              <span className="mr-2">❌</span>
              {error}
            </div>
          )}

          {/* STEP 1: Details */}
          {step === 1 && (
            <div className="space-y-6">
              {/* Student Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Full Name *
                </label>
                <input
                  type="text"
                  value={studentName}
                  onChange={(e) => setStudentName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Name should match student records
                </p>
              </div>

              {/* Class Selection - DROPDOWN */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Class *
                </label>
                <div className="relative">
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg p-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select Class --</option>
                    
                    {/* Primary Classes (1-5) */}
                    <optgroup label="Primary School">
                      <option value="class1">Class 1 - ₹400/month</option>
                      <option value="class2">Class 2 - ₹400/month</option>
                      <option value="class3">Class 3 - ₹400/month</option>
                      <option value="class4">Class 4 - ₹600/month</option>
                      <option value="class5">Class 5 - ₹600/month</option>
                    </optgroup>
                    
                    {/* Middle School (6-8) */}
                    <optgroup label="Middle School">
                      <option value="class6">Class 6 - ₹600/month</option>
                      <option value="class7">Class 7 - ₹800/month</option>
                      <option value="class8">Class 8 - ₹800/month</option>
                    </optgroup>
                    
                    {/* High School (9-10) */}
                    <optgroup label="High School">
                      <option value="class9">Class 9 - ₹1,000/month</option>
                      <option value="class10">Class 10 - ₹1,000/month</option>
                    </optgroup>
                    
                    {/* Senior Secondary - Science */}
                    {/* <optgroup label="Senior Secondary (Science)">
                      <option value="class11_science">Class 11 (Science) - ₹1,500/month</option>
                      <option value="class12_science">Class 12 (Science) - ₹1,500/month</option>
                    </optgroup> */}
                    
                    {/* Senior Secondary - Commerce */}
                    <optgroup label="Senior Secondary (Commerce)">
                      <option value="class11_commerce">Class 11 (Commerce) - ₹1,200/month</option>
                      <option value="class12_commerce">Class 12 (Commerce) - ₹1,200/month</option>
                    </optgroup>
                    
                    {/* Competitive Exams */}
                    <optgroup label="Competitive Exams">
                      <option value="competition">Competition - ₹1,000/month</option>
                      {/* <option value="neet_prep">NEET Preparation - ₹2,000/month</option>
                      <option value="upsc_foundation">UPSC Foundation - ₹1,800/month</option> */}
                    </optgroup>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                  </div>
                </div>
              </div>

              {/* Month Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Month *
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {months.map((month) => (
                    <button
                      key={month}
                      onClick={() => setSelectedMonth(month)}
                      className={`p-3 rounded-lg border ${selectedMonth === month ? 'bg-blue-50 border-blue-500 text-blue-700' : 'border-gray-200 hover:border-blue-300'}`}
                    >
                      {month.substring(0, 3)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Summary Card */}
              {selectedClass && selectedMonth && (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                  <h3 className="font-bold text-blue-800 mb-3 flex items-center">
                    <span className="mr-2">📋</span>
                    Payment Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600">Student Name:</span>
                      <span className="font-medium">{studentName}</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600">Class:</span>
                      <span className="font-medium">
                        {individualClasses.find(cls => cls.id === selectedClass)?.name}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-white rounded">
                      <span className="text-gray-600">Month:</span>
                      <span className="font-medium">{selectedMonth} {new Date().getFullYear()}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-100 rounded border border-blue-300">
                      <span className="text-lg font-bold text-blue-800">Total Amount:</span>
                      <span className="text-2xl font-bold text-blue-600">₹{amount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Payment Review */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                  <span className="text-3xl">💳</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Payment Confirmation</h3>
                <p className="text-gray-600 mt-2">Review your payment details</p>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-5 rounded-xl border border-gray-200">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">👤</span>
                      <div>
                        <p className="text-sm text-gray-600">Student Name</p>
                        <p className="font-medium text-gray-900">{studentName}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">🎓</span>
                      <div>
                        <p className="text-sm text-gray-600">Class</p>
                        <p className="font-medium text-gray-900">
                          {individualClasses.find(cls => cls.id === selectedClass)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div className="flex items-center">
                      <span className="text-gray-500 mr-3">📅</span>
                      <div>
                        <p className="text-sm text-gray-600">Month</p>
                        <p className="font-medium text-gray-900">{selectedMonth}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Payable Amount</p>
                        <p className="text-3xl font-bold text-green-600">₹{amount}</p>
                      </div>
                      <div className="text-green-500">
                        <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex">
                  <span className="text-yellow-600 mr-3 text-xl">⚠️</span>
                  <div>
                    <p className="font-medium text-yellow-800">Important Note</p>
                    <p className="text-sm text-yellow-700 mt-1">
                      You will be redirected to Razorpay's secure payment gateway. 
                      Please do not refresh or close the page during payment.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Success */}
          {step === 3 && (
            <div className="text-center py-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
                <span className="text-4xl">✅</span>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">Payment Successful!</h3>
              <p className="text-gray-600 mb-6">
                Your payment has been processed successfully.
              </p>
              
              <div className="bg-green-50 p-5 rounded-xl border border-green-200 mb-6">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-bold">₹{amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">For:</span>
                    <span>{individualClasses.find(cls => cls.id === selectedClass)?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Month:</span>
                    <span>{selectedMonth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Student:</span>
                    <span className="font-medium">{studentName}</span>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-gray-500 mb-6">
                You will be redirected to payment history in a moment...
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 space-y-4">
            {step === 1 && (
              <button
                onClick={handleCreateOrder}
                disabled={!selectedClass || !selectedMonth || !studentName || isLoading}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${(!selectedClass || !selectedMonth || !studentName || isLoading) ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl'}`}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay ₹${amount}`
                )}
              </button>
            )}

            {step === 2 && (
              <>
                <button
                  onClick={handleRazorpayPayment}
                  disabled={isLoading}
                  className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                      Opening Payment...
                    </div>
                  ) : (
                    `Pay Now - ₹${amount}`
                  )}
                </button>
                <button
                  onClick={() => setStep(1)}
                  disabled={isLoading}
                  className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium"
                >
                  ← Edit Details
                </button>
              </>
            )}

            {step === 3 && (
              <button
                onClick={() => navigate("/student/payment-history")}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold text-lg"
              >
                View Payment History →
              </button>
            )}
          </div>

          {/* Help/Info Section */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-start">
                <span className="text-blue-500 mr-2 text-lg">🔒</span>
                <div>
                  <p className="font-medium text-gray-900">Secure Payment</p>
                  <p className="text-gray-600">Encrypted via Razorpay</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2 text-lg">💳</span>
                <div>
                  <p className="font-medium text-gray-900">Multiple Options</p>
                  <p className="text-gray-600">UPI, Cards, Net Banking</p>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2 text-lg">📞</span>
                <div>
                  <p className="font-medium text-gray-900">Need Help?</p>
                  <p className="text-gray-600">Call: 98765 43210</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentPayment;