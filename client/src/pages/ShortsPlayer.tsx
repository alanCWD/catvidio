import { useRoute, useLocation } from "wouter";
import { MOCK_VIDEOS } from "@/lib/mock-data";
import { ArrowLeft, ThumbsUp, MessageSquare, Share2, MoreVertical } from "lucide-react";
import { useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";

export default function ShortsPlayer() {
  const [match, params] = useRoute("/shorts/:id");
  const [location, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);

  const initialVideoId = params?.id;
  const shorts = MOCK_VIDEOS.filter(v => v.type === 'short');
  
  // Reorder shorts so the clicked one is first
  const sortedShorts = [
    ...shorts.filter(s => s.id === initialVideoId),
    ...shorts.filter(s => s.id !== initialVideoId)
  ];

  const handleBack = () => {
    setLocation("/");
  };

  return (
    <div className="bg-black text-white h-screen w-full relative max-w-md mx-auto overflow-hidden">
      {/* Top Bar Overlay */}
      <div className="absolute top-0 left-0 right-0 p-4 z-50 flex justify-between items-center bg-gradient-to-b from-black/40 to-transparent">
        <button onClick={handleBack} className="p-2 -ml-2">
          <ArrowLeft size={24} />
        </button>
        <div className="flex gap-4">
          <button><MoreVertical size={24} /></button>
        </div>
      </div>

      {/* Snap Scroll Container */}
      <div 
        ref={containerRef}
        className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
        style={{ scrollBehavior: 'smooth' }}
      >
        {sortedShorts.map((video) => (
          <div key={video.id} className="h-full w-full snap-start relative bg-gray-900 flex items-center justify-center">
            {/* Video Player */}
            <div className="w-full h-full relative">
               <iframe
                src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${video.youtubeId}`}
                title={video.title}
                className="w-full h-full object-cover pointer-events-none" // Disable interaction with YT player to keep swipe feeling native
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
              {/* Overlay for touch events if needed */}
              <div className="absolute inset-0 bg-transparent z-10" />
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-2 bottom-32 z-20 flex flex-col gap-6 items-center">
              <div className="flex flex-col items-center gap-1">
                <div className="bg-zinc-800/60 p-3 rounded-full backdrop-blur-sm">
                  <ThumbsUp size={24} fill="currentColor" />
                </div>
                <span className="text-xs font-medium">{video.upvotes > 1000 ? (video.upvotes/1000).toFixed(1) + 'K' : video.upvotes}</span>
              </div>
              
              <div className="flex flex-col items-center gap-1">
                <div className="bg-zinc-800/60 p-3 rounded-full backdrop-blur-sm">
                  <MessageSquare size={24} />
                </div>
                <span className="text-xs font-medium">{video.comments}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="bg-zinc-800/60 p-3 rounded-full backdrop-blur-sm">
                  <Share2 size={24} />
                </div>
                <span className="text-xs font-medium">Share</span>
              </div>
            </div>

            {/* Bottom Meta Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-zinc-700 rounded-full overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.author}`} />
                </div>
                <span className="font-bold text-sm">@{video.author}</span>
                <button className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full">Subscribe</button>
              </div>
              <h2 className="text-sm font-medium line-clamp-2 w-[85%]">{video.title}</h2>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
