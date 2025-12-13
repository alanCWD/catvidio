import { useState } from "react";
import { Heart, MessageCircle, Share2, DollarSign, Send } from "lucide-react";
import { Video, MOCK_COMMENTS } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { Drawer } from "vaul";

interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  const [liked, setLiked] = useState(false);
  const [votes, setVotes] = useState(video.upvotes);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState(MOCK_COMMENTS.filter(c => c.videoId === video.id || c.videoId === "1")); // Fallback to id 1 for demo

  const handleLike = () => {
    if (liked) {
      setVotes(prev => prev - 1);
    } else {
      setVotes(prev => prev + 1);
    }
    setLiked(!liked);
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    
    const newComment = {
      id: Math.random().toString(),
      videoId: video.id,
      user: "You",
      text: commentText,
      timestamp: "Just now"
    };
    
    setComments([newComment, ...comments]);
    setCommentText("");
  };

  return (
    <div className="bg-card mb-6 rounded-3xl overflow-hidden shadow-sm border border-border/50 relative group">
      {/* Header */}
      <div className="p-4 flex items-center justify-between bg-card z-10 relative">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-secondary/50 overflow-hidden border border-border">
             <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${video.author}`} alt="avatar" />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{video.author}</h3>
            <p className="text-xs text-muted-foreground">Original Audio</p>
          </div>
        </div>
        <button className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
          Follow
        </button>
      </div>

      {/* Video Container - 4:5 Aspect Ratio */}
      <div className="relative w-full aspect-[4/5] bg-black">
        <iframe
          src={`https://www.youtube.com/embed/${video.youtubeId}?controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1`}
          title={video.title}
          className="w-full h-full absolute inset-0 object-cover"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Actions Bar */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex gap-4">
          <button 
            onClick={handleLike}
            className="flex flex-col items-center gap-1 group/btn"
          >
            <motion.div
              whileTap={{ scale: 0.8 }}
              className={`p-2 rounded-full transition-colors ${liked ? 'bg-red-50 text-red-500' : 'bg-secondary/50 text-foreground hover:bg-secondary'}`}
            >
              <Heart size={24} fill={liked ? "currentColor" : "none"} strokeWidth={liked ? 0 : 2} />
            </motion.div>
            <span className="text-xs font-bold text-muted-foreground">{votes.toLocaleString()}</span>
          </button>

          <Drawer.Root>
            <Drawer.Trigger asChild>
              <button className="flex flex-col items-center gap-1 group/btn">
                <div className="p-2 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
                  <MessageCircle size={24} />
                </div>
                <span className="text-xs font-bold text-muted-foreground">{comments.length}</span>
              </button>
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Drawer.Content className="bg-card flex flex-col rounded-t-[10px] h-[80vh] mt-24 fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 focus:outline-none">
                <div className="p-4 bg-card rounded-t-[10px] flex-1">
                  <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
                  <div className="max-w-md mx-auto h-full flex flex-col">
                    <h2 className="font-bold text-xl mb-4 text-center">Comments ({comments.length})</h2>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-secondary shrink-0 overflow-hidden">
                            <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user}`} />
                          </div>
                          <div className="bg-secondary/30 p-3 rounded-2xl rounded-tl-none flex-1">
                            <div className="flex justify-between items-baseline mb-1">
                              <span className="font-bold text-sm">{comment.user}</span>
                              <span className="text-[10px] text-muted-foreground">{comment.timestamp}</span>
                            </div>
                            <p className="text-sm">{comment.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handlePostComment} className="mt-auto border-t border-border pt-4 flex gap-2">
                      <input
                        className="flex-1 bg-secondary/50 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                      <button 
                        type="submit"
                        disabled={!commentText.trim()}
                        className="p-2 bg-primary text-primary-foreground rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={18} />
                      </button>
                    </form>
                  </div>
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>

          <button className="flex flex-col items-center gap-1 group/btn">
            <div className="p-2 rounded-full bg-secondary/50 text-foreground hover:bg-secondary transition-colors">
              <Share2 size={24} />
            </div>
            <span className="text-xs font-bold text-muted-foreground">Share</span>
          </button>
        </div>
        
        {/* Revenue Tag */}
        <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
          <DollarSign size={14} strokeWidth={3} />
          <span className="text-xs font-bold">Earns Share</span>
        </div>
      </div>

      {/* Description */}
      <div className="px-4 pb-4">
        <h4 className="font-bold text-base mb-1">{video.title}</h4>
        <p className="text-sm text-muted-foreground line-clamp-2">{video.description}</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {video.tags.map(tag => (
            <span key={tag} className="text-xs font-medium text-primary hover:underline cursor-pointer">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
