"use client";

import React, { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { XCircle, ArrowLeft, RefreshCw, Package, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Force dynamic rendering to prevent prerendering errors
export const dynamic = 'force-dynamic';

const PaymentCancelContent: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get('orderCode');

  // Update payment status to cancelled when returning with orderCode
  useEffect(() => {
    const updateCancelled = async () => {
      if (!orderCode) return;
      try {
        await fetch('/api/payment/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderCode, status: 'cancelled' })
        });
      } catch (err) {
        console.error('Failed to update cancelled payment status', err);
      }
    };
    updateCancelled();
  }, [orderCode]);

  const handleTryAgain = () => {
    router.push('/Usage');
  };

  const handleGoHome = () => {
    router.push('/');
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black py-16 px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-white/[0.02] -z-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full blur-3xl -z-10 animate-pulse" />
      
      <div className="max-w-4xl mx-auto relative">
        {/* Cancel Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-orange-500 to-red-500 rounded-full mb-6 shadow-2xl shadow-orange-500/50">
            <XCircle className="h-12 w-12 text-white" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent mb-6">
            Payment cancelled
          </h1>
          
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            No worries! You can try again anytime. Your transaction was not completed.
          </p>
          
          {orderCode && (
            <div className="mt-4 inline-flex items-center gap-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full px-6 py-3">
              <Package className="h-4 w-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Order code: {orderCode}</span>
            </div>
          )}
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Why Cancel */}
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                Why was the payment cancelled?
              </CardTitle>
              <p className="text-gray-400">Possible reasons include</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Shield className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Security</h4>
                  <p className="text-gray-400 text-sm">
                    You may have cancelled to recheck payment details or for security reasons.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Timing</h4>
                  <p className="text-gray-400 text-sm">
                    The checkout session may have expired or you needed more time to decide.
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Package className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-white mb-2">Plan selection</h4>
                  <p className="text-gray-400 text-sm">
                    You may want to review other plans or change your selection.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* What's Next */}
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-sm border border-white/10 rounded-3xl shadow-2xl">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-white mb-2">
                What’s next
              </CardTitle>
              <p className="text-gray-400">What you can do now</p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-blue-400" />
                  Try payment again
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Go back to the pricing page and try again. It only takes a minute.
                </p>
                <Button
                  onClick={handleTryAgain}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-300"
                >
                  Try again now
                </Button>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-400" />
                  Review plans
                </h4>
                <p className="text-gray-400 text-sm mb-4">
                  Compare different plans to find the best fit for your needs.
                </p>
                <Button
                  onClick={handleTryAgain}
                  variant="ghost"
                  className="w-full bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/30 rounded-xl font-semibold transition-all duration-300"
                >
                  View Usage
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center mb-12">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8 max-w-3xl mx-auto">
            <h3 className="text-2xl font-bold text-white mb-6">
              What would you like to do next?
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                onClick={handleTryAgain}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/50 text-lg"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Try payment again
                </span>
              </Button>
              
              <Button
                onClick={handleGoToDashboard}
                variant="ghost"
                className="px-8 py-4 bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/30 rounded-2xl font-semibold transition-all duration-300 text-lg"
              >
                <span className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Go to Dashboard
                </span>
              </Button>
              
              <Button
                onClick={handleGoHome}
                variant="ghost"
                className="px-8 py-4 bg-transparent border border-white/20 text-white hover:bg-white/10 hover:text-white focus-visible:ring-white/30 rounded-2xl font-semibold transition-all duration-300 text-lg"
              >
                <span className="flex items-center gap-2">
                  <ArrowLeft className="h-5 w-5" />
                  Go to Home
                </span>
              </Button>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-orange-600/20 to-red-600/20 backdrop-blur-sm border border-white/10 rounded-3xl p-8 max-w-2xl mx-auto">
            <h3 className="text-xl font-semibold text-white mb-4">
              Having issues with payment?
            </h3>
            <p className="text-gray-300 mb-6">
              Our support team is always ready to help you.
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>24/7 Support</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>100% Secure</span>
              </div>
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                <span>Refunds available if needed</span>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12">
          <Card className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-white">
                Frequently Asked Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">
                  Will I be charged?
                </h4>
                <p className="text-gray-400 text-sm">
                  No. The transaction was cancelled and no charges were made.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">
                  How many times can I retry?
                </h4>
                <p className="text-gray-400 text-sm">
                  You can retry as many times as you need. Each attempt is safe and free.
                </p>
              </div>
              
              <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                <h4 className="text-lg font-semibold text-white mb-2">
                  How to ensure a successful payment?
                </h4>
                <p className="text-gray-400 text-sm">
                  Ensure correct card details, stable internet, and complete the process within the time limit.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const PaymentCancelPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-300 text-lg">Đang tải...</p>
        </div>
      </div>
    }>
      <PaymentCancelContent />
    </Suspense>
  );
};

export default PaymentCancelPage; 