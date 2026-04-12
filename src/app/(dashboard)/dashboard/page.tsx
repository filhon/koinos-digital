import { getUser } from "@/lib/auth/session";
import { signOut } from "@/actions/auth";
import { getTodayReading } from "@/actions/devotion";
import { DailyReadingWidget } from "./daily-reading-widget";

export default async function DashboardPage() {
  const user = await getUser();
  const devotionResult = await getTodayReading();

  const devotionData =
    devotionResult && "data" in devotionResult && devotionResult.data
      ? devotionResult.data
      : null;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-3xl font-semibold text-gray-900">Koinos</h1>
          <p className="mt-2 text-gray-500">
            Dashboard em construção — Phase 1
          </p>
          {user?.email && (
            <p className="mt-1 text-sm text-gray-400">
              Logado como {user.email}
            </p>
          )}
        </div>

        {devotionData && <DailyReadingWidget initialData={devotionData} />}

        <form action={signOut} className="flex justify-center">
          <button
            type="submit"
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Sair
          </button>
        </form>
      </div>
    </main>
  );
}
