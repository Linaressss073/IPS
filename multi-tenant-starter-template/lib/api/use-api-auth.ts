"use client";

import * as React from "react";
import { useAuth } from "@clerk/nextjs";
import { TokenSource } from "./client";

/**
 * The Clerk session token as a TokenSource for apiFetch. The object is
 * stable across renders (it always reads the latest getToken), so pages can
 * depend on it without re-fetching.
 */
export function useApiAuth(): TokenSource {
  const { getToken } = useAuth();
  const getTokenRef = React.useRef(getToken);
  getTokenRef.current = getToken;
  return React.useMemo(() => ({ getAccessToken: () => getTokenRef.current() }), []);
}
