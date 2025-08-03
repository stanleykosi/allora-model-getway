import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Github, Lock, Zap, Globe } from 'lucide-react';
import LogoUrl from '@/assets/model-gateway-tight.svg';

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-surface/20 text-text-primary relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-30 blur-3xl hidden sm:block" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-64 sm:w-96 h-64 sm:h-96 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-full opacity-30 blur-3xl hidden sm:block" />

      <div className="flex flex-col justify-center items-center min-h-screen p-4 sm:p-6 lg:p-8">
        <div className="w-full max-w-md space-y-6 sm:space-y-8 z-10">
          <div className="text-center">
            <a href="/" className="inline-block mb-3 sm:mb-4 hover:scale-105 transition-transform duration-300">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border border-primary/30 shadow-lg shadow-primary/20 bg-surface/50">
                <img src={LogoUrl} alt="Model Gateway" className="w-full h-full object-contain p-1" />
              </div>
            </a>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create your Model Gateway Account
            </h1>
            <p className="mt-1 sm:mt-2 text-sm sm:text-base text-text-secondary">
              Sign up to get started
            </p>
          </div>

          <div className="flex justify-center">
            <SignUp
              path="/sign-up"
              routing="path"
              signInUrl="/login"
              redirectUrl="/dashboard"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 sm:gap-4 text-center">
            {[
              { icon: Lock, text: 'Secure' },
              { icon: Zap, text: 'Fast' },
              { icon: Globe, text: 'Modern' },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <div key={index} className="flex flex-col items-center justify-center text-text-secondary hover:text-primary transition-colors duration-300">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 mb-1" />
                  <span className="text-xs sm:text-sm font-medium">{item.text}</span>
                </div>
              );
            })}
          </div>

          <div className="text-center">
            <a
              href="https://github.com/stanleykosi/allora-mcp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-secondary hover:text-primary transition-colors duration-300 ease-in-out inline-flex items-center space-x-2 hover:scale-105 transform"
            >
              <Github className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="text-sm">View on GitHub</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
