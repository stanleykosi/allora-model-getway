import { SignUp } from '@clerk/clerk-react';
import { Sparkles, Github, Lock, Zap, Globe } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 flex justify-center items-center p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-0 left-0 -translate-x-1/4 -translate-y-1/4 w-96 h-96 bg-blue-100 rounded-full opacity-50 blur-3xl" />
      <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 w-96 h-96 bg-purple-100 rounded-full opacity-50 blur-3xl" />

      <div className="w-full max-w-md space-y-8 z-10">
        <div className="text-center">
          <div className="inline-block p-2 bg-white rounded-full shadow-md mb-4">
            <Sparkles className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Create your Allora Gateway Account
          </h1>
          <p className="mt-2 text-md text-gray-600">
            Sign up to get started
          </p>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-xl w-full">
          <SignUp
            path="/sign-up"
            routing="path"
            signInUrl="/login"
            redirectUrl="/dashboard"
            appearance={{
              elements: {
                formButtonPrimary:
                  'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 duration-300 ease-in-out',
                formFieldInput:
                  'w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-lg py-3 px-4 text-base transition-colors duration-300 ease-in-out',
                footerActionLink:
                  'text-blue-600 hover:text-blue-700 font-medium transition-colors duration-300 ease-in-out',
                socialButtonsBlockButton:
                  'border-gray-300 hover:bg-gray-100 transition-colors duration-300 ease-in-out rounded-lg',
                dividerLine: 'bg-gray-300',
                dividerText: 'text-gray-500',
              },
            }}
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
              <div key={index} className="flex items-center justify-center space-x-2 text-gray-600">
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            );
          })}
        </div>

        <div className="text-center">
          <a
            href="https://github.com/allora-network/allora-mcp-node"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 transition-colors duration-300 ease-in-out inline-flex items-center space-x-2"
          >
            <Github className="h-4 w-4" />
            <span>View on GitHub</span>
          </a>
        </div>
      </div>
    </div>
  );
}
