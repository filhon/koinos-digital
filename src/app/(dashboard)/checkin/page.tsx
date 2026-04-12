import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CheckinScanner } from "./checkin-scanner";

export default async function CheckinScannerPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return <CheckinScanner memberId={user.id} />;
}
