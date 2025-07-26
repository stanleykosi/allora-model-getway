import { SignIn } from '@clerk/clerk-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-fit rounded-lg bg-surface p-3">
            <img src="/logo.svg" alt="Allora Logo" className="h-10 w-10" />
          </div>
          <CardTitle>Welcome to the Allora Gateway</CardTitle>
          <CardDescription>Sign in to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <SignIn 
            appearance={{
              elements: {
                formButtonPrimary: "bg-primary hover:bg-primary/90 text-white",
                card: "bg-transparent shadow-none",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "bg-surface border border-border text-text-primary hover:bg-surface/80",
                formFieldInput: "bg-surface border border-border text-text-primary",
                formFieldLabel: "text-text-primary",
                footerActionLink: "text-primary hover:text-primary/80",
                dividerLine: "bg-border",
                dividerText: "text-text-secondary"
              }
            }}
            redirectUrl="/"
          />
        </CardContent>
      </Card>
    </div>
  );
} 