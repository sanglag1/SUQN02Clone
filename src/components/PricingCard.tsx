"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, Trophy, Clock } from "lucide-react";

interface PricingCardProps {
  name: string;
  price: number;
  description: string;
  features: string[];
  buttonText: string;
  isPopular: boolean;
  period: string;
  disabled?: boolean;
  isCurrent?: boolean | null;
  isSelected?: boolean;
  onPurchase?: () => void;
}

export default function PricingCard({
  name,
  price,
  description,
  features,
  buttonText,
  isPopular,
  period,
  disabled = false,
  isCurrent = false,
  isSelected = false,
  onPurchase
}: PricingCardProps) {
  const getPlanIcon = () => {
    if (price <= 100000) return <Star className="h-6 w-6" />;
    if (price <= 300000) return <Crown className="h-6 w-6" />;
    return <Trophy className="h-6 w-6" />;
  };

  const getPlanStyle = () => {
    if (isCurrent) {
      return {
        iconBg: "bg-gradient-to-br from-green-500 to-emerald-600",
        cardBg: "bg-gradient-to-br from-green-50 to-emerald-50",
        borderColor: "border-green-300",
        priceColor: "text-green-700",
        popular: false
      };
    }
    
    if (price <= 100000) {
      return {
        iconBg: "bg-gradient-to-br from-gray-500 to-slate-600",
        cardBg: "bg-white",
        borderColor: "border-gray-200",
        priceColor: "text-gray-700",
        popular: false
      };
    }
    if (price <= 300000) {
      return {
        iconBg: "bg-gradient-to-br from-purple-500 to-pink-500",
        cardBg: isPopular ? "bg-gradient-to-br from-purple-50 to-pink-50" : "bg-white",
        borderColor: isPopular ? "border-purple-300" : "border-purple-200",
        priceColor: "text-purple-600",
        popular: isPopular
      };
    }
    return {
      iconBg: "bg-gradient-to-br from-purple-600 to-pink-600",
      cardBg: "bg-gradient-to-br from-purple-100 to-pink-100",
      borderColor: "border-purple-300",
      priceColor: "text-purple-700",
      popular: false
    };
  };

  const planStyle = getPlanStyle();

  return (
    <Card
      className={`relative transition-all duration-300 h-full ${
        disabled 
          ? 'cursor-not-allowed' 
          : 'cursor-pointer hover:scale-105'
      } ${
        isSelected && !disabled
          ? 'ring-4 ring-purple-500 ring-opacity-50 shadow-2xl'
          : planStyle.popular
          ? "lg:scale-105 shadow-2xl shadow-purple-500/30 border-2 border-purple-300"
          : `shadow-xl hover:shadow-2xl hover:shadow-purple-500/20 ${planStyle.borderColor}`
      }`}
      style={{
        background: planStyle.cardBg,
      }}
    >
      {/* Popular Badge */}
      {planStyle.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-4 py-2 text-sm font-bold shadow-xl border border-purple-400/50">
            Phổ biến nhất
          </Badge>
        </div>
      )}

      {/* Current Package Badge */}
      {isCurrent && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-bold shadow-xl border border-green-400/50">
            <Check className="h-4 w-4 mr-2" />
            Gói hiện tại
          </Badge>
        </div>
      )}

      <CardHeader className="text-center pb-4 pt-6">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${planStyle.iconBg} text-white shadow-lg transition-transform duration-300`}>
          {getPlanIcon()}
        </div>
        
        {/* Title and Description */}
        <CardTitle className="text-xl font-bold text-gray-900 mb-2">{name}</CardTitle>
        <CardContent className="text-gray-600 text-sm leading-relaxed mb-4 p-0">
          {description}
        </CardContent>
        
        {/* Price */}
        <div className="mb-4">
          <div className="flex items-baseline justify-center gap-1 mb-1">
            <span className={`text-2xl font-bold ${planStyle.priceColor}`}>
              {price.toLocaleString()}đ
            </span>
            <span className="text-gray-500 text-base">{period}</span>
          </div>
          <p className="text-gray-500 text-xs">Thanh toán một lần</p>
        </div>
      </CardHeader>

      <CardContent className="text-center pb-4">
        {/* Features List */}
        <div className="space-y-2 text-left mb-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                <Check className="h-2.5 w-2.5 text-white" />
              </div>
              <span className="text-xs text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        {!disabled ? (
          <Button
            className={`w-full py-2 text-sm font-semibold transition-all duration-300 ${
              planStyle.popular
                ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                : "bg-gray-600 hover:bg-gray-700"
            } text-white shadow-lg hover:shadow-xl rounded-lg`}
            onClick={onPurchase || (() => window.location.href = '/Pricing')}
          >
            {buttonText}
          </Button>
        ) : (
          <div className="w-full py-2 text-sm font-semibold bg-green-100 text-green-700 rounded-lg flex items-center justify-center gap-1">
            <Clock className="h-4 w-4" />
            Gói hiện tại
          </div>
        )}
      </CardContent>
    </Card>
  );
}
