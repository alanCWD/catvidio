import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Video } from "@/lib/mock-data";
import { Drawer } from "vaul";

interface WideVideoCardProps {
  video: Video;
}

export function WideVideoCard({ video }: WideVideoCardProps) {
  const [showComments, setShowComments] = useState(false);

  return (
    <div className="flex flex-col mb-4">
      {/* Video Container */}
      <div className="relative w-full aspect-video bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}?controls=1&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`}
          title={video.title}
          className="w-full h-full absolute inset-0 object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Meta Data */}
      <div className="px-3 py-3 flex gap-3">
        {/* Author Avatar */}
        <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden shrink-0 mt-1">
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.author}`} 
            alt="avatar" 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-[15px] leading-tight line-clamp-2 text-foreground mb-1">
              {video.title}
            </h3>
            <button className="text-foreground p-1 -mr-2">
              <MoreVertical size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-1 text-[12px] text-muted-foreground">
            <span>{video.author}</span>
            <span>•</span>
            <span>{video.views}</span>
            <span>•</span>
            <span>{video.uploaded}</span>
          </div>

          {/* Truncated Comment Preview */}
          {video.topComment && (
            <Drawer.Root>
              <Drawer.Trigger asChild>
                <div className="mt-3 bg-secondary/30 p-2 rounded-lg cursor-pointer active:bg-secondary/50 transition-colors">
                  <div className="flex gap-2 items-start">
                    <span className="text-[10px] font-bold text-foreground shrink-0">{video.topComment.user}</span>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{video.topComment.text}</p>
                  </div>
                </div>
              </Drawer.Trigger>
              <Drawer.Portal>
                <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
                <Drawer.Content className="bg-card flex flex-col rounded-t-[10px] h-[60vh] fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 focus:outline-none">
                  <div className="p-4 bg-card rounded-t-[10px] flex-1">
                    <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
                    <h2 className="font-bold text-lg mb-4">Comments</h2>
                    <p className="text-muted-foreground text-center py-10">Sign in to view all comments</p>
                  </div>
                </Drawer.Content>
              </Drawer.Portal>
            </Drawer.Root>
          )}
        </div>
      </div>
    </div>
  );
}
