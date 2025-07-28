import React from 'react';

interface AlloraIconProps {
  className?: string;
  size?: number;
}

export const AlloraIcon: React.FC<AlloraIconProps> = ({
  className = "",
  size = 24
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Main Gateway Structure */}
      <defs>
        <linearGradient id="gatewayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4299E1" />
          <stop offset="100%" stopColor="#38B2AC" />
        </linearGradient>
        <linearGradient id="innerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38B2AC" />
          <stop offset="100%" stopColor="#4299E1" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="1" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Gateway Frame */}
      <rect
        x="2"
        y="2"
        width="20"
        height="20"
        rx="4"
        fill="url(#gatewayGradient)"
        opacity="0.9"
        filter="url(#glow)"
      />

      {/* Inner Gateway Portal */}
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="2"
        fill="url(#innerGradient)"
        opacity="0.8"
      />

      {/* Central AI/ML Core */}
      <circle
        cx="12"
        cy="12"
        r="4"
        fill="#F7FAFC"
        opacity="0.95"
      />

      {/* Neural Network Nodes */}
      <circle cx="8" cy="8" r="1" fill="#4299E1" opacity="0.8" />
      <circle cx="16" cy="8" r="1" fill="#38B2AC" opacity="0.8" />
      <circle cx="8" cy="16" r="1" fill="#38B2AC" opacity="0.8" />
      <circle cx="16" cy="16" r="1" fill="#4299E1" opacity="0.8" />

      {/* Connection Lines */}
      <line x1="8" y1="8" x2="12" y2="12" stroke="#4299E1" strokeWidth="0.5" opacity="0.6" />
      <line x1="16" y1="8" x2="12" y2="12" stroke="#38B2AC" strokeWidth="0.5" opacity="0.6" />
      <line x1="8" y1="16" x2="12" y2="12" stroke="#38B2AC" strokeWidth="0.5" opacity="0.6" />
      <line x1="16" y1="16" x2="12" y2="12" stroke="#4299E1" strokeWidth="0.5" opacity="0.6" />

      {/* Data Flow Indicators */}
      <path
        d="M 6 12 L 10 12"
        stroke="#F7FAFC"
        strokeWidth="1"
        opacity="0.7"
        strokeLinecap="round"
      />
      <path
        d="M 14 12 L 18 12"
        stroke="#F7FAFC"
        strokeWidth="1"
        opacity="0.7"
        strokeLinecap="round"
      />

      {/* Blockchain Blocks */}
      <rect x="6" y="6" width="2" height="2" fill="#4299E1" opacity="0.6" rx="0.5" />
      <rect x="16" y="6" width="2" height="2" fill="#38B2AC" opacity="0.6" rx="0.5" />
      <rect x="6" y="16" width="2" height="2" fill="#38B2AC" opacity="0.6" rx="0.5" />
      <rect x="16" y="16" width="2" height="2" fill="#4299E1" opacity="0.6" rx="0.5" />

      {/* Central Processing Unit */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="#1A202C"
        opacity="0.9"
      />

      {/* Pulse Animation Points */}
      <circle cx="12" cy="12" r="0.5" fill="#F7FAFC" opacity="0.8">
        <animate
          attributeName="opacity"
          values="0.8;0.2;0.8"
          dur="2s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
};

export default AlloraIcon; 