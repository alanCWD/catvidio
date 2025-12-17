import { Link, useLocation } from "wouter";
import { ZoomiesLogo, HomeNavIcon, SubscriptionsNavIcon, UploadNavIcon } from "@/components/Branding";
import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "@/lib/api";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["currentUser"],
    queryFn: fetchCurrentUser,
    staleTime: 30000,
  });

  const isActive = (path: string) => location === path;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col max-w-md mx-auto shadow-2xl overflow-hidden relative border-x border-border/40">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto no-scrollbar relative">
        {children}
      </main>

      {/* Bottom Navigation - YouTube Style */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-background border-t border-border/20 px-2 py-1 flex justify-between items-center z-50 h-[56px]">
        <Link href="/">
          <a className={`flex flex-col items-center gap-1 w-full py-1 ${isActive("/") ? "text-foreground" : "text-foreground"}`}>
            <HomeNavIcon className="w-6 h-6" active={isActive("/")} />
            <span className="text-[10px] font-normal">Home</span>
          </a>
        </Link>
        
        <Link href="/shorts/s1"> 
          <a className={`flex flex-col items-center gap-1 w-full py-1 ${location.includes("/shorts") ? "text-foreground" : "text-foreground"}`}>
             {/* Zoomies Icon */}
            <div className="relative">
               <ZoomiesLogo className="w-6 h-6" active={location.includes("/shorts")} />
            </div>
            <span className="text-[10px] font-normal">Zoomies</span>
          </a>
        </Link>

        <Link href="/upload">
          <a className="flex flex-col items-center justify-center w-full py-1">
            <UploadNavIcon className="w-6 h-6 text-foreground" active={isActive("/upload")} />
            <span className="text-[10px] font-normal">Create</span>
          </a>
        </Link>

        <Link href="/leaderboard">
          <a className={`flex flex-col items-center gap-1 w-full py-1 ${isActive("/leaderboard") ? "text-foreground" : "text-foreground"}`}>
            <SubscriptionsNavIcon className="w-6 h-6" active={isActive("/leaderboard")} />
            <span className="text-[10px] font-normal">Subscriptions</span>
          </a>
        </Link>

        <Link href="/profile">
          <a className={`flex flex-col items-center gap-1 w-full py-1 ${isActive("/profile") ? "text-foreground" : "text-foreground"}`}>
            <div 
              className="w-7 h-7 rounded-full p-[2px]" 
              style={{ backgroundColor: user?.avatarColor || "#FF0055" }}
            >
              <div className="w-full h-full rounded-full overflow-hidden bg-background">
                <img src={user?.avatar || "/api/placeholder-cat.jpg"} alt="You" className="w-full h-full object-cover" />
              </div>
            </div>
            <span className="text-[10px] font-normal">You</span>
          </a>
        </Link>
      </nav>
    </div>
  );
}
