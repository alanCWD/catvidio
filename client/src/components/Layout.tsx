import { Link, useLocation } from "wouter";
import { Home, PlusSquare, User, Trophy } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-border/40">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-20 relative">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-card/90 backdrop-blur-md border-t border-border/50 px-6 py-3 flex justify-between items-center z-50">
        <Link href="/">
          <a className={`flex flex-col items-center gap-1 transition-colors ${isActive("/") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Home size={24} strokeWidth={isActive("/") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Feed</span>
          </a>
        </Link>
        
        <Link href="/leaderboard">
          <a className={`flex flex-col items-center gap-1 transition-colors ${isActive("/leaderboard") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <Trophy size={24} strokeWidth={isActive("/leaderboard") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Top</span>
          </a>
        </Link>

        <Link href="/upload">
          <a className="flex flex-col items-center justify-center -mt-8">
            <div className="bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:shadow-xl transition-transform active:scale-95 border-4 border-background">
              <PlusSquare size={28} strokeWidth={2.5} />
            </div>
          </a>
        </Link>

        <Link href="/profile">
          <a className={`flex flex-col items-center gap-1 transition-colors ${isActive("/profile") ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <User size={24} strokeWidth={isActive("/profile") ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Studio</span>
          </a>
        </Link>
      </nav>
    </div>
  );
}
