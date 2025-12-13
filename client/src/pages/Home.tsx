import { Layout } from "@/components/Layout";
import { WideVideoCard } from "@/components/WideVideoCard";
import { ShortsShelf } from "@/components/ShortsShelf";
import { MOCK_VIDEOS } from "@/lib/mock-data";
import { Search, Bell, Cast, User } from "lucide-react";

export default function Home() {
  const wideVideos = MOCK_VIDEOS.filter(v => v.type === 'video');
  const shorts = MOCK_VIDEOS.filter(v => v.type === 'short');

  // Logic: First wide video -> Shorts Shelf -> Remaining wide videos
  const firstVideo = wideVideos[0];
  const remainingVideos = wideVideos.slice(1);

  return (
    <Layout>
      <div className="bg-background min-h-screen pb-16">
        {/* YouTube-style Header */}
        <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm flex justify-between items-center px-4 py-3 border-b border-border/10 shadow-sm">
          <div className="flex items-center gap-1">
             <div className="w-7 h-7 bg-red-600 rounded-lg flex items-center justify-center text-white">
               <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" focusable="false"><path d="M10,15L15.19,12L10,9V15M21.56,7.17C21.69,7.64 21.78,8.27 21.84,9.07C21.91,9.87 21.94,10.56 21.94,11.16L22,12C22,14.19 21.84,15.8 21.56,16.83C21.31,17.73 20.73,18.31 19.83,18.56C19.36,18.69 18.5,18.78 17.18,18.84C15.88,18.91 14.69,18.94 13.59,18.94L12,19C7.81,19 5.2,18.84 4.17,18.56C3.27,18.31 2.69,17.73 2.44,16.83C2.31,16.36 2.22,15.73 2.16,14.93C2.09,14.13 2.06,13.44 2.06,12.84L2,12C2,9.81 2.16,8.2 2.44,7.17C2.69,6.27 3.27,5.69 4.17,5.44C4.64,5.31 5.5,5.22 6.82,5.16C8.12,5.09 9.31,5.06 10.41,5.06L12,5C16.19,5 18.8,5.16 19.83,5.44C20.73,5.69 21.31,6.27 21.56,7.17Z"></path></svg>
             </div>
             <span className="text-lg font-bold tracking-tight ml-1 font-sans">PurrStream</span>
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
