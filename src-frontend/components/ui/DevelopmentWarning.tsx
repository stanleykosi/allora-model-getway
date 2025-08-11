import React from 'react';
import { AlertTriangle, Shield } from 'lucide-react';

interface DevelopmentWarningProps {
  className?: string;
}

export function DevelopmentWarning({ className = '' }: DevelopmentWarningProps) {
  return (
    <div className={`bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-red-500/10 border border-amber-500/20 rounded-lg p-3 sm:p-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className="w-8 h-8 bg-amber-500/20 rounded-lg flex items-center justify-center">
            <Shield className="h-4 w-4 text-amber-600" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
            <h4 className="text-sm font-semibold text-amber-700 dark:text-amber-400">
              Development Environment Notice
            </h4>
          </div>
          <p className="text-xs sm:text-sm text-amber-700/80 dark:text-amber-400/80 leading-relaxed">
            This application is currently in development. Please ensure you securely save your seed phrases and wallet credentials.
            <span className="font-medium"> Never share these credentials with anyone.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
