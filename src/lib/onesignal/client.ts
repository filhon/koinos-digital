"use client";

import OneSignal from "react-onesignal";

let initialized = false;

export async function initOneSignal(memberId: string): Promise<void> {
  if (initialized) return;
  const appId = process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  if (!appId) return;

  initialized = true;
  await OneSignal.init({
    appId,
    allowLocalhostAsSecureOrigin: true,
  });

  // Registra o membro para poder segmentar notificações por ID
  await OneSignal.login(memberId);
}

export async function requestPushPermission(): Promise<void> {
  await OneSignal.Notifications.requestPermission();
}

export function getPushPermissionStatus(): NotificationPermission {
  if (typeof Notification === "undefined") return "default";
  return Notification.permission;
}

export { OneSignal };
