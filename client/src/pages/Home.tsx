import { Layout } from "@/components/Layout";
import { WideVideoCard } from "@/components/WideVideoCard";
import { ShortsShelf } from "@/components/ShortsShelf";
import { Search, Bell, Cast, X, Tv2, Smartphone, Laptop } from "lucide-react";
import { Logo } from "@/components/Branding";
import { useState, useEffect, useRef } from "react";
import { fetchAllVideos, fetchNotifications, markNotificationsRead } from "@/lib/api";
import { formatVideoForComponent } from "@/lib/format";

const CAT_HASHTAGS = [
  { tag: "#CatFails", emoji: "😹", count: "2.1M" },
  { tag: "#FunnyCats", emoji: "😂", count: "5.3M" },
  { tag: "#CatZoomies", emoji: "🏃", count: "1.8M" },
  { tag: "#CatMemes", emoji: "🐱", count: "4.2M" },
  { tag: "#KittenVideos", emoji: "🐈", count: "3.7M" },
  { tag: "#CatsOfYouTube", emoji: "📺", count: "2.9M" },
  { tag: "#CatReactions", emoji: "😮", count: "1.5M" },
  { tag: "#SleepyCats", emoji: "😴", count: "890K" },
  { tag: "#CatTok", emoji: "🎵", count: "6.1M" },
  { tag: "#ChonkyCats", emoji: "🍔", count: "1.2M" },
];

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCast, setShowCast] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAllVideos()
      .then(data => {
        const formatted = data.map(formatVideoForComponent);
        
        // Sort videos: wide videos first (sorted by most recent), then shorts (also by most recent)
        const sorted = formatted.sort((a: any, b: any) => {
          // Wide videos come before shorts
          if (a.type === 'video' && b.type === 'short') return -1;
          if (a.type === 'short' && b.type === 'video') return 1;
          
          // Within same type, sort by upload date (most recent first)
          const dateA = new Date(a.uploadedAt || 0).getTime();
          const dateB = new Date(b.uploadedAt || 0).getTime();
          return dateB - dateA;
        });
        
        setVideos(sorted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch videos:', err);
        setLoading(false);
      });
    
    // Fetch notifications
    fetchNotifications()
      .then(data => {
        setNotifications(data);
        setUnreadCount(data.filter((n: any) => !n.read).length);
      })
      .catch(err => console.error('Failed to fetch notifications:', err));
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenNotifications = () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications && unreadCount > 0) {
      markNotificationsRead().then(() => {
        setUnreadCount(0);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      });
    }
  };

  const wideVideos = videos.filter(v => v.type === 'video');
  const shorts = videos.filter(v => v.type === 'short');

  // Build alternating pattern: 1 wide -> 4 zoomies -> 1 wide -> 4 zoomies -> ...
  // Returns an array of content blocks to render
  const buildContentBlocks = () => {
    const blocks: { type: 'wide' | 'zoomies', data: any }[] = [];
    let wideIndex = 0;
    let shortsIndex = 0;
    
    while (wideIndex < wideVideos.length || shortsIndex < shorts.length) {
      // Add one wide video if available
      if (wideIndex < wideVideos.length) {
        blocks.push({ type: 'wide', data: wideVideos[wideIndex] });
        wideIndex++;
      }
      
      // Add up to 4 shorts as a shelf if available
      if (shortsIndex < shorts.length) {
        const shortsSlice = shorts.slice(shortsIndex, shortsIndex + 4);
        blocks.push({ type: 'zoomies', data: shortsSlice });
        shortsIndex += 4;
      }
    }
    
    return blocks;
  };
  
  const contentBlocks = buildContentBlocks();

  if (loading) {
    return (
      <Layout>
        <div className="bg-background min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading cat videos...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="bg-background min-h-screen pb-16">
        {/* YouTube-style Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm flex justify-between items-center px-4 py-3 border-b border-border/10 shadow-sm">
          <div className="flex items-center gap-1">
             <Logo className="w-8 h-8" />
             <span className="text-xl font-black tracking-tighter ml-1 font-sans">catvid.io</span>
          </div>
          <div className="flex items-center gap-4">
            {/* Cast Button */}
            <button 
              onClick={() => setShowCast(true)} 
              className="p-1 hover:bg-secondary/50 rounded-full transition-colors"
              data-testid="button-cast"
            >
              <Cast size={20} className="text-foreground" />
            </button>
            
            {/* Notifications Button */}
            <div className="relative" ref={notifRef}>
              <button 
                onClick={handleOpenNotifications}
                className="p-1 hover:bg-secondary/50 rounded-full transition-colors relative"
                data-testid="button-notifications"
              >
                <Bell size={20} className="text-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 top-10 w-72 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-border bg-secondary/30">
                    <h3 className="font-bold text-sm">Notifications</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-muted-foreground text-sm">
                        <Bell size={32} className="mx-auto mb-2 opacity-30" />
                        <p>No notifications yet</p>
                        <p className="text-xs mt-1">You'll see updates here when someone subscribes!</p>
                      </div>
                    ) : (
                      notifications.map((notif: any) => (
                        <div key={notif.id} className={`p-3 border-b border-border/50 hover:bg-secondary/30 transition-colors ${!notif.read ? 'bg-primary/5' : ''}`}>
                          <p className="text-sm">{notif.message}</p>
                          <p className="text-xs text-muted-foreground mt-1">{notif.timestamp}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Search Button */}
            <div className="relative" ref={searchRef}>
              <button 
                onClick={() => setShowSearch(!showSearch)}
                className="p-1 hover:bg-secondary/50 rounded-full transition-colors"
                data-testid="button-search"
              >
                <Search size={20} className="text-foreground" />
              </button>
              
              {/* Search Dropdown with Hashtags */}
              {showSearch && (
                <div className="absolute right-0 top-10 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-border bg-secondary/30">
                    <h3 className="font-bold text-sm">Trending Cat Hashtags</h3>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {CAT_HASHTAGS.map((item) => (
                      <button 
                        key={item.tag}
                        onClick={() => setShowSearch(false)}
                        className="w-full p-3 flex items-center justify-between hover:bg-secondary/50 transition-colors text-left"
                        data-testid={`hashtag-${item.tag}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{item.emoji}</span>
                          <span className="text-sm font-medium">{item.tag}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{item.count} videos</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        
        {/* Cast Modal */}
        {showCast && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={() => setShowCast(false)}>
            <div className="bg-card rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="p-4 flex justify-between items-center border-b border-border">
                <h2 className="font-bold text-lg">Connect to a device</h2>
                <button onClick={() => setShowCast(false)} className="p-1 hover:bg-secondary rounded-full">
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 text-center">
                <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tv2 size={40} className="text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2">Enjoy catvid.io on your home device</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Watch cat videos on your TV or smart display by connecting to a compatible device.
                </p>
                <div className="space-y-3">
                  <button className="w-full p-3 bg-secondary/50 rounded-xl flex items-center gap-3 hover:bg-secondary transition-colors">
                    <Tv2 size={24} className="text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Smart TV</p>
                      <p className="text-xs text-muted-foreground">Cast to your television</p>
                    </div>
                  </button>
                  <button className="w-full p-3 bg-secondary/50 rounded-xl flex items-center gap-3 hover:bg-secondary transition-colors">
                    <Laptop size={24} className="text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Computer</p>
                      <p className="text-xs text-muted-foreground">Open in browser</p>
                    </div>
                  </button>
                  <button className="w-full p-3 bg-secondary/50 rounded-xl flex items-center gap-3 hover:bg-secondary transition-colors">
                    <Smartphone size={24} className="text-muted-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-sm">Mobile Device</p>
                      <p className="text-xs text-muted-foreground">Continue on phone</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Categories / Filter Chips */}
        <div className="sticky top-[52px] z-30 bg-background py-2 px-3 flex gap-2 overflow-x-auto no-scrollbar border-b border-border/10">
          {["All", "Funny", "Kittens", "Music", "Live", "Recently Uploaded"].map((cat, i) => (
            <button 
              key={cat}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${i === 0 ? "bg-foreground text-background" : "bg-secondary text-foreground hover:bg-secondary/80"}`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Content Feed */}
        <div className="pt-2">
          {contentBlocks.map((block, index) => (
            block.type === 'wide' 
              ? <WideVideoCard key={`wide-${block.data.id}`} video={block.data} />
              : <ShortsShelf key={`zoomies-${index}`} shorts={block.data} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
