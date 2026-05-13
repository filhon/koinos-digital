import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth/session";
import { getTodayReading } from "@/actions/leitura";
import { getReadingHistory } from "@/actions/leitura";
import { BibleReader } from "./bible-reader";

export const metadata = {
  title: "Leitura Diária | Koinos",
};

export default async function LeituraPage() {
  const user = await getUser();
  if (!user) redirect("/login");

  const [readingResult, historyResult] = await Promise.all([
    getTodayReading(),
    getReadingHistory({ days: 30 }),
  ]);

  const reading =
    readingResult && !("code" in readingResult) && readingResult.data
      ? readingResult.data
      : null;

  const history =
    historyResult && !("code" in historyResult) && historyResult.data
      ? historyResult.data
      : [];

  return (
    <BibleReader
      initialReading={reading}
      history={history}
      userEmail={user.email ?? ""}
    />
  );
}
