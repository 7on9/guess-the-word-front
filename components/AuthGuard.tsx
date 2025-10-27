"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/lib/auth";

interface AuthGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/auth/login" }: AuthGuardProps) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Simple token check - if no token, redirect
    if (!isAuthenticated()) {
      router.push(redirectTo);
    }
  }, [router, redirectTo]);

  // During SSR hydration - show minimal loading to prevent flash
  if (!isClient) {
    return (
      <div className="min-h-screen bg-background">
        {/* Minimal blank state during hydration */}
      </div>
    );
  }

  // No token - redirect is happening
  if (!isAuthenticated()) {
    return null;
  }

  // Token exists - show content immediately
  // If token is expired, the API 401 interceptor will handle it
  return <>{children}</>;
}
