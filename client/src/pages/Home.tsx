import { Layout } from "@/components/Layout";
import { WideVideoCard } from "@/components/WideVideoCard";
import { ShortsShelf } from "@/components/ShortsShelf";
import { Search, Bell, Cast } from "lucide-react";
import { Logo } from "@/components/Branding";
import { useState, useEffect } from "react";
import { fetchVideos } from "@/lib/api";
import { formatVideoForComponent } from "@/lib/format";

export default function Home() {
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVideos()
      .then(data => {
        const formatted = data.map(formatVideoForComponent);
        setVideos(formatted);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch videos:', err);
        setLoading(false);
      });
  }, []);

  const wideVideos = videos.filter(v => v.type === 'video');
  const shorts = videos.filter(v => v.type === 'short');

  // Logic: First wide video -> Shorts Shelf -> Remaining wide videos
  const firstVideo = wideVideos[0];
  const remainingVideos = wideVideos.slice(1);

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
            <Cast size={20} className="text-foreground" />
            <Bell size={20} className="text-foreground" />
            <Search size={20} className="text-foreground" />
          </div>
        </header>

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
          {firstVideo && <WideVideoCard video={firstVideo} />}
          
          <ShortsShelf shorts={shorts} />
          
          {remainingVideos.map(video => (
            <WideVideoCard key={video.id} video={video} />
          ))}
        </div>
      </div>
    </Layout>
  );
}
