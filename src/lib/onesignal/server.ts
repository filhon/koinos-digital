import * as OneSignal from "@onesignal/node-onesignal";

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID ?? "";
const ONESIGNAL_REST_API_KEY = process.env.ONESIGNAL_REST_API_KEY ?? "";

function getClient(): OneSignal.DefaultApi {
  const config = OneSignal.createConfiguration({
    restApiKey: ONESIGNAL_REST_API_KEY,
  });
  return new OneSignal.DefaultApi(config);
}

export async function sendPushNotification(opts: {
  memberIds: string[];
  title: string;
  message: string;
  url?: string;
  data?: Record<string, string>;
}): Promise<void> {
  if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) return;
  if (opts.memberIds.length === 0) return;

  try {
    const client = getClient();
    const notification = new OneSignal.Notification();
    notification.app_id = ONESIGNAL_APP_ID;
    notification.headings = { en: opts.title, pt: opts.title };
    notification.contents = { en: opts.message, pt: opts.message };
    notification.include_aliases = {
      external_id: opts.memberIds,
    };
    notification.target_channel = "push";
    if (opts.url) notification.url = opts.url;
    if (opts.data) notification.data = opts.data;

    await client.createNotification(notification);
  } catch {
    // Push é fire-and-forget — não propaga erro para não quebrar o fluxo principal
  }
}

export async function sendPushToChurch(opts: {
  memberIds: string[];
  title: string;
  message: string;
  url?: string;
}): Promise<void> {
  await sendPushNotification(opts);
}
