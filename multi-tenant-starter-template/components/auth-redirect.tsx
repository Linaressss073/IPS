'use client';

import { useHexclaveApp } from "@hexclave/next";
import { useEffect, useState } from "react";

// Hosted auth pages can't be linked to directly (app.urls.signIn throws with hosted components),
// so these routes give plain <a href> links something to point at and forward to the hosted page.
export function AuthRedirect(props: { to: "signIn" | "signUp" }) {
  const app = useHexclaveApp();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const redirect = props.to === "signIn" ? app.redirectToSignIn : app.redirectToSignUp;
    redirect.call(app, { replace: true, noRedirectBack: true }).catch((e: unknown) => {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    });
  }, [app, props.to]);

  if (error) {
    return <div className="w-full min-h-96 flex items-center justify-center"><p>{error}</p></div>;
  }
  return <span><span className="loader" /></span>;
}
