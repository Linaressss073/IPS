"use client";

import * as React from "react";
import { getMyAccess, MyAccess, Permission } from "@/lib/api/staff";
import { useApiAuth } from "@/lib/api/use-api-auth";

type AccessState = {
  /** null while loading. */
  access: MyAccess | null;
  can: (permission: Permission) => boolean;
  reload: () => void;
};

const AccessContext = React.createContext<AccessState>({
  access: null,
  can: () => false,
  reload: () => {},
});

/**
 * Loads once per IPS what the signed-in user may do, so pages only offer
 * those actions. The API enforces the same permissions on every request.
 */
export function AccessProvider(props: { teamId: string; children: React.ReactNode }) {
  const auth = useApiAuth();
  const [access, setAccess] = React.useState<MyAccess | null>(null);
  const [version, setVersion] = React.useState(0);

  React.useEffect(() => {
    let cancelled = false;
    getMyAccess(auth, props.teamId)
      .then((data) => !cancelled && setAccess(data))
      .catch(
        () =>
          !cancelled &&
          setAccess({ userId: "", isAdmin: false, roles: [], permissions: [] }),
      );
    return () => {
      cancelled = true;
    };
  }, [auth, props.teamId, version]);

  const value = React.useMemo<AccessState>(
    () => ({
      access,
      can: (permission) => access?.permissions.includes(permission) ?? false,
      reload: () => setVersion((v) => v + 1),
    }),
    [access],
  );

  return <AccessContext.Provider value={value}>{props.children}</AccessContext.Provider>;
}

export function useAccess() {
  return React.useContext(AccessContext);
}

/** Message for pages the user's roles do not allow. */
export function NoPermission(props: { what: string }) {
  return (
    <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-8 md:py-8">
      <p className="max-w-xl rounded-md border px-4 py-3 text-sm text-muted-foreground">
        Tus roles en esta IPS no permiten {props.what}. Si lo necesitas, pide a un administrador que te asigne el
        rol correspondiente en Administración → Personal.
      </p>
    </div>
  );
}
