"use client"

import React from 'react'
import Image from 'next/image'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ 
  className = '', 
  size = 'md'
}: LogoProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16', 
    lg: 'w-20 h-20'
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Logo Icon */}
      <div className={`${sizeClasses[size]} flex items-center justify-center relative`}>
        <Image
          src="/logo.png"
          alt="F.AI Interview Logo"
          width={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
          height={size === 'sm' ? 48 : size === 'md' ? 64 : 80}
          className="w-full h-full object-contain drop-shadow-sm"
          priority
        />
      </div>
    </div>
  )
}
