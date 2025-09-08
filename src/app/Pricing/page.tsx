"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CreditCard, 
  ArrowRight, 
  Star, 
  CheckCircle, 
  Heart, 
  Users, 
  MessageCircle, 
  Trophy, 
  Sparkles,
  Zap,
  Crown,
  Check,
  ArrowLeft,
  Shield,
  Clock,
  Target
} from "lucide-react";

interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  avatarInterviewLimit: number;
  testQuizEQLimit: number;
  jdUploadLimit: number;
}

interface UserPackage {
  servicePackageId: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  servicePackage: ServicePackage;
}

const PricingContent: React.FC = () => {
  const searchParams = useSearchParams();
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState('');
  const [success, setSuccess] = useState('');
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);

  useEffect(() => {
    fetch('/api/service-package')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.packages)) {
          setPackages(data.packages);
          setUserPackages(data.userPackages || []);
          // Kiểm tra xem có tham số package trong URL không
          const packageParam = searchParams.get('package');
          if (packageParam) {
            // Tìm gói có id trùng khớp
            const foundPackage = data.packages.find((pkg: ServicePackage) => pkg.id === packageParam);
            if (foundPackage) {
              setSelectedId(packageParam);
            }
          }
        } else {
          setPackages([]);
          setUserPackages([]);
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Unable to load service packages.');
        setLoading(false);
      });
  }, [searchParams]);

  const handleBuy = async () => {
    if (!selectedId) return;
    setBuying(true);
    setBuyError('');
    setSuccess('');
    
    try {
      const res = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ servicePackageId: selectedId })
      });
      const result = await res.json();
      
      if (result && result.error === 0 && result.data) {
        window.location.href = result.data.checkoutUrl;
      } else {
        setBuyError(result.message || 'An error occurred while creating the payment.');
      }
    } catch {
      setBuyError('Unable to connect to the server.');
    }
    setBuying(false);
  };

  const handleSelect = (id: string) => {
    // Kiểm tra xem gói có phải là gói đã mua (active) hoặc là gói free
    const isCurrentPackage = userPackages.some(pkg =>
      pkg.servicePackageId === id &&
      pkg.isActive &&
      new Date(pkg.endDate) >= new Date()
    );
    // Tìm gói được chọn
    const selectedPackage = packages.find(pkg => pkg.id === id);
    // Nếu là gói đã mua hoặc gói free thì không cho phép chọn
    if (isCurrentPackage || (selectedPackage && selectedPackage.price === 0)) {
      return;
    }
    setSelectedId(id);
  };

  const getSelectedPackage = () => {
    return packages.find(pkg => pkg.id === selectedId);
  };

  const getPlanIcon = (pkg: ServicePackage) => {
    if (pkg.price === 0) return <Star className="h-7 w-7" />;
    if (pkg.price <= 100000) return <Zap className="h-7 w-7" />;
    if (pkg.price <= 300000) return <Crown className="h-7 w-7" />;
    return <Trophy className="h-7 w-7" />;
  };

  const getPlanStyle = (pkg: ServicePackage, index: number) => {
    const isPopular = index === 1;
    const isCurrent = userPackages.some(userPkg =>
      userPkg.servicePackageId === pkg.id &&
      userPkg.isActive &&
      new Date(userPkg.endDate) >= new Date()
    );
    // Gói free luôn được kích hoạt sẵn
    if (pkg.price === 0) {
      return {
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        cardBg: "bg-gradient-to-br from-emerald-50/50 to-teal-50/50",
        borderColor: "border-emerald-200",
        priceColor: "text-emerald-700",
        popular: false,
        disabled: true // Disabled vì đã được kích hoạt sẵn
      };
    }
    if (isCurrent) {
      return {
        iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
        cardBg: "bg-gradient-to-br from-emerald-50/50 to-teal-50/50",
        borderColor: "border-emerald-200",
        priceColor: "text-emerald-700",
        popular: false,
        disabled: true
      };
    }
    if (pkg.price <= 100000) {
      return {
        iconBg: "bg-gradient-to-br from-slate-600 to-gray-700",
        cardBg: "bg-white/80",
        borderColor: "border-slate-200",
        priceColor: "text-slate-700",
        popular: false,
        disabled: false
      };
    }
    if (pkg.price <= 300000) {
      return {
        iconBg: "bg-gradient-to-br from-violet-600 to-purple-700",
        cardBg: isPopular ? "bg-gradient-to-br from-violet-50/50 to-purple-50/50" : "bg-white/80",
        borderColor: isPopular ? "border-violet-300" : "border-violet-200",
        priceColor: "text-violet-700",
        popular: isPopular,
        disabled: false
      };
    }
    return {
      iconBg: "bg-gradient-to-br from-rose-600 to-pink-700",
      cardBg: "bg-gradient-to-br from-rose-50/50 to-pink-50/50",
      borderColor: "border-rose-300",
      priceColor: "text-rose-700",
      popular: false,
      disabled: false
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-violet-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-violet-400 animate-ping mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 font-medium text-lg">Loading service packages...</p>
            <p className="text-slate-500 text-sm">Please wait a moment</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-br from-red-100 to-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center">
              <span className="text-white text-xl font-bold">!</span>
            </div>
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-3">An error occurred</h3>
          <p className="text-red-600 mb-6">{error}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-violet-600 hover:bg-violet-700 text-white px-6 py-2"
          >
            Try again
          </Button>
        </div>
      </div>
    );
  }

  const selectedPackage = getSelectedPackage();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="relative">
        {/* Navigation Bar */}
        <nav className="fixed top-0 left-0 w-full z-50 bg-white/95 border-b border-slate-200/50 shadow-sm backdrop-blur-xl">
          <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-full text-slate-700 hover:bg-slate-100 transition-colors px-3 py-2" 
                onClick={() => window.history.back()}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <a href="/dashboard">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-700 hover:bg-slate-100 px-4 py-2">
                  Dashboard
                </Button>
              </a>
              <a href="/usage">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-700 hover:bg-slate-100 px-4 py-2">
                  Usage
                </Button>
              </a>
              <a href="/profile">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-700 hover:bg-slate-100 px-4 py-2">
                  Profile
                </Button>
              </a>
              <a href="/jd">
                <Button variant="ghost" size="sm" className="rounded-full text-slate-700 hover:bg-slate-100 px-4 py-2">
                  JD Analysis
                </Button>
              </a>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <div className="pt-20 pb-16 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 mb-6 shadow-xl ring-2 ring-violet-200/40">
              <CreditCard className="h-10 w-10 text-white" />
            </div>
            <div className="mb-6">
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent mb-4">
                Service Plans
              </h1>
              <div className="w-16 h-1 bg-gradient-to-r from-violet-600 to-purple-600 mx-auto rounded-full"></div>
            </div>
            <p className="text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed font-light">
              Elevate your interview skills with advanced AI. 
              <span className="text-violet-600 font-medium">Choose the right plan</span> to start your growth journey.
            </p>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="max-w-2xl mx-auto px-6 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
              <Shield className="h-5 w-5 text-emerald-600" />
              <span className="text-slate-700 text-sm font-medium">Top-tier security</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
              <Clock className="h-5 w-5 text-blue-600" />
              <span className="text-slate-700 text-sm font-medium">24/7 support</span>
            </div>
            <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-white/60 backdrop-blur border border-slate-200/50">
              <Target className="h-5 w-5 text-violet-600" />
              <span className="text-slate-700 text-sm font-medium">Proven effectiveness</span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-6 pb-16">
          {/* Pricing Cards Section */}
          <div className="mb-16">
            <div className="grid md:grid-cols-3 gap-8">
              {packages.map((pkg, index) => {
                const planStyle = getPlanStyle(pkg, index);
                const isCurrent = userPackages.some(userPkg =>
                  userPkg.servicePackageId === pkg.id &&
                  userPkg.isActive &&
                  new Date(userPkg.endDate) >= new Date()
                );
                const isSelected = selectedId === pkg.id;

                return (
                  <Card
                    key={pkg.id}
                    className={`relative transition-all duration-300 h-full rounded-2xl border-2 ${
                      planStyle.disabled 
                        ? 'cursor-not-allowed' 
                        : 'cursor-pointer hover:scale-[1.02] hover:shadow-xl'
                    } ${
                      isSelected && !planStyle.disabled
                        ? 'ring-4 ring-violet-400/30 shadow-xl scale-[1.02]'
                        : planStyle.popular
                        ? "md:scale-105 shadow-xl border-violet-400/50"
                        : `shadow-lg ${planStyle.borderColor}/60`
                    }`}
                    style={{
                      background: planStyle.cardBg,
                    }}
                    onClick={() => handleSelect(pkg.id)}
                  >
                    {/* Popular Badge */}
                    {planStyle.popular && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 text-sm font-bold shadow-lg border-0 rounded-full">
                          <Sparkles className="h-4 w-4 mr-2" />
                          Most popular
                        </Badge>
                      </div>
                    )}

                    {/* Current Package Badge */}
                    {isCurrent && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 text-sm font-bold shadow-lg border-0 rounded-full">
                          <Check className="h-4 w-4 mr-2" />
                          Current plan
                        </Badge>
                      </div>
                    )}

                    {/* Free Package Badge */}
                    {pkg.price === 0 && (
                      <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 z-10">
                        <Badge className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-3 text-sm font-bold shadow-lg border-0 rounded-full">
                          <Check className="h-4 w-4 mr-2" />
                          Free forever
                        </Badge>
                      </div>
                    )}

                    <CardHeader className="text-center pb-4 pt-6">
                      {/* Icon */}
                      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${planStyle.iconBg} text-white shadow-lg`}> 
                        {getPlanIcon(pkg)}
                      </div>
                      {/* Title and Description */}
                      <CardTitle className="text-xl font-bold text-slate-900 mb-3">{pkg.name}</CardTitle>
                      <CardContent className="text-slate-600 text-sm leading-relaxed mb-4 p-0 font-light">
                        {pkg.description}
                      </CardContent>
                      {/* Price */}
                      <div className="mb-6">
                        <div className="flex items-baseline justify-center gap-2 mb-2">
                          <span className={`text-2xl font-bold ${planStyle.priceColor}`}>
                            {pkg.price === 0 ? 'Free' : `${pkg.price.toLocaleString()}đ`}
                          </span>
                          {pkg.price > 0 && <span className="text-slate-500 text-sm font-medium">/{pkg.duration} days</span>}
                        </div>
                        <p className="text-slate-500 text-sm">
                          {pkg.price === 0 ? 'Unlimited time' : 'One-time payment'}
                        </p>
                      </div>
                      {/* Features Grid */}
                      <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="text-center p-3 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                          <Heart className="h-5 w-5 text-rose-500 mx-auto mb-2" />
                          <div className="text-sm font-bold text-rose-500 mb-1">
                            {pkg.avatarInterviewLimit}
                          </div>
                          <div className="text-xs text-slate-600 font-medium leading-tight">Avatar Interview</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                          <Users className="h-5 w-5 text-amber-500 mx-auto mb-2" />
                          <div className="text-sm font-bold text-amber-500 mb-1">
                            {pkg.testQuizEQLimit}
                          </div>
                          <div className="text-xs text-slate-600 font-medium leading-tight">EQ/Quiz Tests</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-white/80 border border-slate-200 shadow-sm">
                          <MessageCircle className="h-5 w-5 text-emerald-500 mx-auto mb-2" />
                          <div className="text-sm font-bold text-emerald-500 mb-1">
                            {pkg.jdUploadLimit}
                          </div>
                          <div className="text-xs text-slate-600 font-medium leading-tight">JD Upload</div>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="text-center pb-8">
                      {/* Features List */}
                      <div className="space-y-4 text-left mb-8">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-slate-700 font-medium">In-depth analysis & detailed feedback</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-slate-700 font-medium">Priority customer support</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <Check className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-slate-700 font-medium">Real-time progress tracking</span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      {!planStyle.disabled && (
                        <Button
                          className="w-full py-4 text-lg font-semibold transition-all duration-300 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl rounded-xl border-0"
                          disabled={buying}
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            handleSelect(pkg.id); 
                            handleBuy();
                          }}
                        >
                          <span className="flex items-center justify-center gap-3">
                            {buying ? 'Processing...' : 'Choose this plan'}
                            {!buying && <ArrowRight className="h-5 w-5" />}
                          </span>
                        </Button>
                      )}

                      {/* Free package - already activated */}
                      {pkg.price === 0 && (
                        <div className="w-full py-4 text-lg font-semibold bg-gradient-to-r from-emerald-50 to-teal-50 text-emerald-700 rounded-xl flex items-center justify-center gap-3 border border-emerald-200">
                          <Check className="h-5 w-5 text-emerald-600" />
                          Activated
                        </div>
                      )}

                      {/* Disabled (current plan) helper */}
                      {planStyle.disabled && pkg.price > 0 && (
                        <div className="mt-3">
                          <a href="/usage" className="inline-block w-full text-center text-sm px-4 py-3 border rounded-xl hover:bg-gray-50" title="You are currently on this plan. View your usage.">See your usage</a>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Selected Package Summary */}
          {selectedPackage && (
            <div className="mb-20">
              <Card className="bg-white/80 backdrop-blur-sm border-2 border-violet-200/50 shadow-2xl rounded-3xl overflow-hidden">
                <CardHeader className="pb-8 bg-gradient-to-r from-violet-50/80 to-purple-50/80 border-b border-violet-100">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-600 to-purple-700 flex items-center justify-center shadow-xl">
                        <Trophy className="h-10 w-10 text-white" />
                      </div>
                      <div className="text-center md:text-left">
                        <CardTitle className="text-4xl font-bold text-slate-900 mb-2">
                          {selectedPackage.name}
                        </CardTitle>
                        <p className="text-slate-600 text-lg font-light">
                          {selectedPackage.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-6xl font-bold bg-gradient-to-r from-violet-600 to-purple-700 bg-clip-text text-transparent">
                        {selectedPackage.price === 0 ? 'Free' : `${selectedPackage.price.toLocaleString()}đ`}
                      </div>
                      {selectedPackage.price > 0 && (
                        <div className="text-slate-500 text-xl font-light">
                          /{selectedPackage.duration} days
                        </div>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="p-10">
                  <div className="grid md:grid-cols-3 gap-8 mb-12">
                    <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-200/50">
                      <Heart className="h-12 w-12 text-rose-600 mx-auto mb-6" />
                      <div className="text-4xl font-bold text-rose-600 mb-3">
                        {selectedPackage.avatarInterviewLimit}
                      </div>
                      <div className="text-lg text-slate-600 font-medium">Avatar Interview</div>
                      <div className="text-sm text-slate-500 mt-2">Professional AI interview</div>
                    </div>
                    <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
                      <Users className="h-12 w-12 text-amber-600 mx-auto mb-6" />
                      <div className="text-4xl font-bold text-amber-600 mb-3">
                        {selectedPackage.testQuizEQLimit}
                      </div>
                      <div className="text-lg text-slate-600 font-medium">EQ/Quiz Tests</div>
                      <div className="text-sm text-slate-500 mt-2">Comprehensive skill assessment</div>
                    </div>
                    <div className="text-center p-8 rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50">
                      <MessageCircle className="h-12 w-12 text-emerald-600 mx-auto mb-6" />
                      <div className="text-4xl font-bold text-emerald-600 mb-3">
                        {selectedPackage.jdUploadLimit}
                      </div>
                      <div className="text-lg text-slate-600 font-medium">JD Upload</div>
                      <div className="text-sm text-slate-500 mt-2">Job description analysis</div>
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <Button
                      size="lg"
                      className="px-20 py-6 bg-gradient-to-r from-violet-600 to-purple-700 hover:from-violet-700 hover:to-purple-800 text-white font-semibold text-2xl rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-500 border-0"
                      disabled={
                        buying ||
                        userPackages.some(userPkg =>
                          userPkg.servicePackageId === selectedId &&
                          userPkg.isActive &&
                          new Date(userPkg.endDate) >= new Date()
                        )
                      }
                      onClick={selectedPackage.price === 0 ? () => {} : handleBuy}
                    >
                      <span className="flex items-center gap-4">
                        {buying && (
                          <div className="animate-spin rounded-full h-6 w-6 border-2 border-white/30 border-t-white"></div>
                        )}
                        {selectedPackage.price === 0 
                          ? 'Already activated' 
                          : buying 
                          ? 'Processing payment...' 
                          : 'Proceed to payment'}
                        {selectedPackage.price > 0 && !buying && <ArrowRight className="h-7 w-7" />}
                      </span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error and Success Messages */}
          {(buyError || success) && (
            <div className="mb-16">
              <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-2xl rounded-3xl overflow-hidden">
                <CardContent className="p-0">
                  {buyError && (
                    <div className="bg-gradient-to-r from-red-50 to-rose-50 border-2 border-red-200/50 rounded-3xl p-10 text-center">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-full flex items-center justify-center shadow-xl">
                          <span className="text-white text-2xl font-bold">!</span>
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-red-700 mb-1">Payment error</h3>
                          <p className="text-red-600">Please try again later</p>
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-2xl p-6 border border-red-100">
                        <p className="text-red-700 text-lg font-medium">{buyError}</p>
                      </div>
                      <Button 
                        onClick={() => setBuyError('')}
                        className="mt-6 bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-2xl"
                      >
                        Dismiss
                      </Button>
                    </div>
                  )}
                  {success && (
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border-2 border-emerald-200/50 rounded-3xl p-10 text-center">
                      <div className="flex items-center justify-center gap-4 mb-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-xl">
                          <CheckCircle className="h-10 w-10 text-white" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold text-emerald-700 mb-1">Success!</h3>
                          <p className="text-emerald-600">Transaction processed</p>
                        </div>
                      </div>
                      <div className="bg-white/70 rounded-2xl p-6 border border-emerald-100">
                        <p className="text-emerald-700 text-lg font-medium">{success}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          

          {/* Contact Support */}
          <div className="text-center">
            <Card className="bg-gradient-to-r from-violet-600 to-purple-700 text-white rounded-3xl p-12 border-0">
              <div className="max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-3xl font-bold mb-4">Need more help?</h3>
                <p className="text-xl text-violet-100 mb-8 leading-relaxed">
                  Our professional support team is available 24/7. 
                  Dont hesitate to reach out!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button className="bg-white text-violet-600 hover:bg-gray-50 px-8 py-3 rounded-2xl font-semibold">
                    📧 Support Email
                  </Button>
                  <Button variant="outline" className="border-white/30 text-white hover:bg-white/10 px-8 py-3 rounded-2xl font-semibold">
                    💬 Live Chat
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Floating Action Button for Mobile */}
        {selectedPackage && (
          <div className="fixed bottom-6 left-6 right-6 z-40 lg:hidden">
            <Button
              className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-700 text-white font-semibold text-lg rounded-2xl shadow-2xl border-0"
              disabled={
                buying ||
                userPackages.some(userPkg =>
                  userPkg.servicePackageId === selectedId &&
                  userPkg.isActive &&
                  new Date(userPkg.endDate) >= new Date()
                )
              }
              onClick={selectedPackage.price === 0 ? () => {} : handleBuy}
            >
              {selectedPackage.price === 0 
                ? 'Activated' 
                : buying 
                ? 'Processing...' 
                : `Buy ${selectedPackage.name} - ${selectedPackage.price.toLocaleString()}đ`}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const PricingPage: React.FC = () => {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-4 border-slate-200 border-t-violet-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-4 border-transparent border-t-violet-400 animate-ping mx-auto"></div>
          </div>
          <div className="space-y-2">
            <p className="text-slate-700 font-medium text-lg">Loading service packages...</p>
            <p className="text-slate-500 text-sm">Please wait a moment</p>
          </div>
        </div>
      </div>
    }>
      <PricingContent />
    </Suspense>
  );
};

export default PricingPage;