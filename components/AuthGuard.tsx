"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useProfile, isAuthenticated } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/auth/login" }: AuthGuardProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const { data: user, isLoading, error } = useProfile();

  // Set client flag after hydration
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    // Only run on client side
    if (!isClient) return;
    
    // Check if we have a token first
    if (!isAuthenticated()) {
      router.push(redirectTo);
      return;
    }
    
    // If profile query failed and we're not loading, redirect
    if (!isLoading && (!user || error)) {
      router.push(redirectTo);
    }
  }, [user, isLoading, error, router, redirectTo, isClient]);

  // Show loading state while checking auth or during SSR
  if (!isClient || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  // Show error or redirect state (only on client side)
  if (isClient && (!isAuthenticated() || !user || error)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // User is authenticated, show the protected content
  return <>{children}</>;
}
