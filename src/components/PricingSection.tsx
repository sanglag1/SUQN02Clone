"use client";

import { useState, useEffect } from 'react';
import PricingCard from '@/components/PricingCard';

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
  id: string;
  servicePackageId: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  avatarInterviewUsed: number;
  testQuizEQUsed: number;
  jdUploadUsed: number;
  servicePackage: ServicePackage;
}

export default function PricingSection() {
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState<string>('');
  const [userPackages, setUserPackages] = useState<UserPackage[]>([]);
  

  useEffect(() => {
    fetch('/api/service-package')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.packages)) {
          setPackages(data.packages);
          setUserPackages(data.userPackages || []);
          
        } else {
          setPackages([]);
          setUserPackages([]);
          
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Cannot load service package list.');
        setLoading(false);
      });
  }, []);

  const handleSelect = (id: string) => {
    // Kiểm tra xem gói có phải là gói hiện tại không
    const isCurrentPackage = userPackages.some(pkg => 
      pkg.servicePackageId === id && 
      pkg.isActive && 
      new Date(pkg.endDate) >= new Date()
    );
    
    // Nếu là gói hiện tại thì không cho phép chọn
    if (isCurrentPackage) {
      return;
    }
    
    setSelectedId(id);
  };

  const handlePurchase = () => {
    if (selectedId) {
      // Kiểm tra xem gói đã chọn có phải là gói free không
      const selectedPackage = packages.find(pkg => pkg.id === selectedId);
      if (selectedPackage && selectedPackage.price === 0) {
        // Gói free - kích hoạt ngay lập tức
        activateFreePackage(selectedId);
      } else {
        // Gói trả phí - chuyển đến trang thanh toán
        const params = new URLSearchParams();
        params.set('package', selectedId);
        window.location.href = `/Pricing?${params.toString()}`;
      }
    } else {
      // Nếu chưa chọn gói nào, chuyển đến trang Pricing
      window.location.href = '/Pricing';
    }
  };

  const activateFreePackage = async (packageId: string) => {
    try {
      const response = await fetch('/api/user-package', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          servicePackageId: packageId,
          isFree: true
        }),
      });

      if (response.ok) {
        // Reload data sau khi kích hoạt thành công
        window.location.reload();
      } else {
        console.error('Failed to activate free package');
      }
    } catch (error) {
      console.error('Error activating free package:', error);
    }
  };

  const getPlanStyle = (pkg: ServicePackage, index: number) => {
    const isPopular = index === 1;
    const isCurrent = userPackages.some(userPkg => 
      userPkg.servicePackageId === pkg.id && 
      userPkg.isActive && 
      new Date(userPkg.endDate) >= new Date()
    );
    
    if (isCurrent) {
      return {
        iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
        cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-300",
        priceColor: "text-green-700",
        popular: false,
        disabled: true
      };
    }
    
    if (pkg.price === 0) {
      return {
        iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
        cardBg: "bg-gradient-to-br from-blue-50 to-cyan-50",
        borderColor: "border-blue-300",
        priceColor: "text-blue-600",
        popular: false,
        disabled: false
      };
    }
    
    if (pkg.price <= 100000) {
      return {
        iconBg: "bg-gradient-to-br from-gray-500 to-slate-600",
        cardBg: "bg-white",
        borderColor: "border-gray-200",
        priceColor: "text-gray-700",
        popular: false,
        disabled: false
      };
    }
    if (pkg.price <= 300000) {
      return {
        iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
        cardBg: isPopular ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white",
        borderColor: isPopular ? "border-purple-300" : "border-purple-200",
        priceColor: "text-purple-600",
        popular: isPopular,
        disabled: false
      };
    }
    return {
      iconBg: "bg-gradient-to-br from-purple-600 to-pink-600",
      cardBg: "bg-gradient-to-br from-purple-100 to-pink-100",
      borderColor: "border-purple-300",
      priceColor: "text-purple-700",
      popular: false,
      disabled: false
    };
  };

  const isCurrentPackage = (pkg: ServicePackage) => {
    return userPackages.some(userPkg => 
      userPkg.servicePackageId === pkg.id && 
      userPkg.isActive && 
      new Date(userPkg.endDate) >= new Date()
    );
  };

  const getCurrentUsage = (pkg: ServicePackage) => {
    const userPkg = userPackages.find(userPkg => 
      userPkg.servicePackageId === pkg.id && 
      userPkg.isActive && 
      new Date(userPkg.endDate) >= new Date()
    );
    
    if (!userPkg) return null;
    
    return {
      avatarInterviewUsed: userPkg.avatarInterviewUsed,
      testQuizEQUsed: userPkg.testQuizEQUsed,
      jdUploadUsed: userPkg.jdUploadUsed,
      avatarInterviewLimit: pkg.avatarInterviewLimit,
      testQuizEQLimit: pkg.testQuizEQLimit,
      jdUploadLimit: pkg.jdUploadLimit
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 px-12 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 px-12 py-24 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">!</span>
          </div>
          <p className="text-red-600 text-lg">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 px-12 py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h3 className="text-5xl font-bold text-gray-900 mb-4 leading-tight">
            Choose the Perfect Plan for<br />Your Hiring Needs
          </h3>
          
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {packages.map((pkg, index) => {
            const planStyle = getPlanStyle(pkg, index);
            const isCurrent = isCurrentPackage(pkg);
            const isSelected = selectedId === pkg.id;
            const usage = getCurrentUsage(pkg);
            const isFree = pkg.price === 0;

            return (
              <div
                key={pkg.id}
                className={`relative transition-all duration-300 ${
                  planStyle.disabled 
                    ? 'cursor-not-allowed' 
                    : 'cursor-pointer hover:scale-105'
                } ${
                  isSelected && !planStyle.disabled
                    ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-2xl'
                    : planStyle.popular
                    ? "lg:scale-105 shadow-2xl shadow-purple-500/30 border-2 border-purple-300"
                    : `shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 ${planStyle.borderColor}`
                }`}
                onClick={() => handleSelect(pkg.id)}
              >
                <PricingCard 
                  name={pkg.name}
                  price={pkg.price}
                  description={pkg.description}
                  features={[
                    `${pkg.avatarInterviewLimit} Avatar Interviews${usage ? ` (${usage.avatarInterviewUsed}/${usage.avatarInterviewLimit})` : ''}`,
                    `${pkg.testQuizEQLimit} EQ/Quiz Tests${usage ? ` (${usage.testQuizEQUsed}/${usage.testQuizEQLimit})` : ''}`,
                    `${pkg.jdUploadLimit} JD Uploads${usage ? ` (${usage.jdUploadUsed}/${usage.jdUploadLimit})` : ''}`,
                    `${pkg.duration} days access`
                  ]}
                  buttonText={isCurrent ? "Current Plan" : isFree ? "Activate Free" : "Choose Plan"}
                  isPopular={planStyle.popular}
                  period={`/${pkg.duration} days`}
                  disabled={planStyle.disabled}
                  isCurrent={isCurrent}
                  isSelected={isSelected}
                  onPurchase={handlePurchase}
                />
              </div>
            );
          })}
        </div>

        {/* Purchase Button */}
        {selectedId && (
          <div className="text-center mt-12">
            <button
              onClick={handlePurchase}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-12 py-4 rounded-full font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300"
            >
              {packages.find(pkg => pkg.id === selectedId)?.price === 0 ? 'Activate Free' : 'Proceed to Payment'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
