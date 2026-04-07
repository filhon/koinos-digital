"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { checkPermission, isLeadershipRole } from "@/lib/auth/permissions";
import type { MemberRole } from "@/lib/auth/session";
import type { AppModule, PermissionAction } from "@/lib/auth/permissions";

interface UsePermissionsResult {
  role: MemberRole;
  can: (module: AppModule, action: PermissionAction) => boolean;
  isLeadership: boolean;
}

export function usePermissions(): UsePermissionsResult {
  const [role, setRole] = useState<MemberRole>("visitante");

  useEffect(() => {
    const supabase = createClient();

    async function loadRole() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const jwt = user.app_metadata as Record<string, unknown>;
        setRole((jwt.role as MemberRole) ?? "visitante");
      }
    }

    loadRole();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  return {
    role,
    can: (module, action) => checkPermission(role, module, action),
    isLeadership: isLeadershipRole(role),
  };
}
