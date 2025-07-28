import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import { Github, Lock, Zap, Globe } from 'lucide-react';
import AlloraIcon from '../components/icons/AlloraIcon';

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background to-surface/20 text-text-primary flex justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-gradient-to-br from-primary/20 to-accent/20 rounded-full opacity-30 blur-3xl" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-full opacity-30 blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <div className="inline-block p-3 bg-gradient-to-br from-primary via-accent to-purple-500 rounded-2xl shadow-lg shadow-primary/25 mb-4">
            <AlloraIcon className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Create your Model Gateway Account
          </h1>
          <p className="mt-2 text-md text-text-secondary">
            Sign up to get started
          </p>
        </div>

        <div className="bg-surface/50 backdrop-blur-xl p-8 rounded-2xl shadow-xl border border-border/50 w-full">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/login"
            redirectUrl="/dashboard"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Lock, text: 'Secure' },
            { icon: Zap, text: 'Fast' },
            { icon: Globe, text: 'Modern' },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div key={index} className="flex items-center justify-center space-x-2 text-text-secondary hover:text-primary transition-colors duration-300">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.text}</span>
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
            <Github className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
