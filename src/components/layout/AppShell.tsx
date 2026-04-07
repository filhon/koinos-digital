import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

interface AppShellProps {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
  userAvatar?: string;
}

export function AppShell({
  children,
  userEmail,
  userName,
  userAvatar,
}: AppShellProps) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: "var(--surface-0)" }}
    >
      {/* Sidebar: oculta em mobile (< 640px), ícones em 640–1024px, expandida > 1024px */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header
          userEmail={userEmail}
          userName={userName}
          userAvatar={userAvatar}
        />

        {/* Content */}
        <main
          id="main-content"
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 pb-20 sm:pb-6"
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {/* Bottom nav: apenas mobile (< 640px) */}
      <BottomNav />
    </div>
  );
}
