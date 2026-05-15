import { getUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CheckinLoader } from "./checkin-loader";

export default async function CheckinScannerPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  return <CheckinLoader memberId={user.id} />;
}
