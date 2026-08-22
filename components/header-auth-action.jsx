"use client";

import { SignInButton } from "@clerk/nextjs";
import { Button } from "./ui/button";
import { usePathname } from "next/navigation";

export function HeaderAuthAction() {
  const pathname = usePathname();
  
  if (pathname === "/sign-in" || pathname === "/sign-up") {
    return null;
  }
  
  return (
    <SignInButton forceRedirectUrl="/dashboard">
      <Button variant="outline">Login</Button>
    </SignInButton>
  );
}
