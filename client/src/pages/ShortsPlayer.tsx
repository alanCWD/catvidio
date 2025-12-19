import { useRoute, useLocation } from "wouter";
import { ArrowLeft, ThumbsUp, MessageSquare, Share2, MoreVertical, Play, Youtube, X, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { fetchAllVideos, fetchComments, createComment } from "@/lib/api";
import { formatVideoForComponent } from "@/lib/format";
import { Drawer } from "vaul";
import { toast } from "sonner";

export default function ShortsPlayer() {
  const [match, params] = useRoute("/shorts/:id");
  const [location, setLocation] = useLocation();
  const containerRef = useRef<HTMLDivElement>(null);
  const [shorts, setShorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [activeVideoForComments, setActiveVideoForComments] = useState<any>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    fetchAllVideos()
      .then(data => {
        const formatted = data.map(formatVideoForComponent);
        const shortVideos = formatted.filter((v: any) => v.type === 'short');
        setShorts(shortVideos);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch shorts:', err);
        setLoading(false);
      });
  }, []);

  // Track which video is currently visible
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const height = container.clientHeight;
      const newIndex = Math.round(scrollTop / height);
      if (newIndex !== activeIndex && newIndex >= 0 && newIndex < shorts.length) {
        setActiveIndex(newIndex);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [activeIndex, shorts.length]);

  const initialVideoId = params?.id;
  
  // Reorder shorts so the clicked one is first
  const sortedShorts = [
    ...shorts.filter(s => s.id.toString() === initialVideoId),
    ...shorts.filter(s => s.id.toString() !== initialVideoId)
  ];

  if (loading) {
    return (
      <div className="bg-black text-white h-screen w-full relative max-w-md mx-auto flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white/70">Loading Zoomies...</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    setLocation("/");
  };

  const handleLike = (video: any) => {
    const videoId = video.id;
    const isCurrentlyLiked = likedVideos.has(videoId);
    
    // Optimistically update UI
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (isCurrentlyLiked) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
    
    toast.success(isCurrentlyLiked ? "Like removed" : "Liked!");
  };

  const handleOpenComments = async (video: any) => {
    setActiveVideoForComments(video);
    setCommentsOpen(true);
    setLoadingComments(true);
    setComments([]);
    
    // For YouTube-only videos, show a message
    if (video.isYouTubeOnly) {
      setLoadingComments(false);
      return;
    }
    
    try {
      const numericId = parseInt(video.id);
      if (!isNaN(numericId)) {
        const fetchedComments = await fetchComments(numericId);
        setComments(fetchedComments);
      }
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !activeVideoForComments) return;
    
    if (activeVideoForComments.isYouTubeOnly) {
      toast.error("Sign in to comment on this video");
      return;
    }
    
    try {
      const numericId = parseInt(activeVideoForComments.id);
      if (!isNaN(numericId)) {
        await createComment(numericId, newComment.trim());
        setNewComment("");
        // Refresh comments
        const fetchedComments = await fetchComments(numericId);
        setComments(fetchedComments);
        toast.success("Comment added!");
      }
    } catch (err) {
      toast.error("Failed to add comment");
    }
  };

  const handleShare = async (video: any) => {
    const shareUrl = `${window.location.origin}/shorts/${video.id}`;
    const shareData = {
      title: video.title,
      text: `Check out this cat video: ${video.title}`,
      url: shareUrl,
    };
    
    try {
      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      }
    } catch (err) {
      // User cancelled or error - try clipboard fallback
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard!");
      } catch {
        toast.error("Failed to share");
      }
    }
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
        {sortedShorts.map((video, index) => (
          <div key={video.id} className="h-full w-full snap-start relative bg-gray-900 flex items-center justify-center">
            {/* Video Player - only render iframe for active video */}
            <div className="w-full h-full relative">
              {index === activeIndex ? (
                <iframe
                  src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=1&controls=0&modestbranding=1&rel=0&showinfo=0&iv_load_policy=3&playsinline=1&loop=1&playlist=${video.youtubeId}&mute=0`}
                  title={video.title}
                  className="w-full h-full object-cover pointer-events-none"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    className="w-full h-full object-cover opacity-50"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                      <Play size={48} fill="white" className="text-white ml-1" />
                    </div>
                  </div>
                </div>
              )}
              {/* Overlay for touch events if needed */}
              <div className="absolute inset-0 bg-transparent z-10" />
            </div>

            {/* Right Side Actions */}
            <div className="absolute right-2 bottom-32 z-20 flex flex-col gap-6 items-center">
              <button 
                className="flex flex-col items-center gap-1"
                onClick={() => handleLike(video)}
                data-testid={`button-like-${video.id}`}
              >
                <div className={`p-3 rounded-full backdrop-blur-sm transition-colors ${
                  likedVideos.has(video.id) ? 'bg-red-500' : 'bg-zinc-800/60'
                }`}>
                  <ThumbsUp size={24} fill={likedVideos.has(video.id) ? "white" : "currentColor"} />
                </div>
                <span className="text-xs font-medium">
                  {(() => {
                    const count = video.upvotes + (likedVideos.has(video.id) ? 1 : 0);
                    return count > 1000 ? (count/1000).toFixed(1) + 'K' : count;
                  })()}
                </span>
              </button>
              
              <button 
                className="flex flex-col items-center gap-1"
                onClick={() => handleOpenComments(video)}
                data-testid={`button-comments-${video.id}`}
              >
                <div className="bg-zinc-800/60 p-3 rounded-full backdrop-blur-sm">
                  <MessageSquare size={24} />
                </div>
                <span className="text-xs font-medium">{video.comments}</span>
              </button>

              <button 
                className="flex flex-col items-center gap-1"
                onClick={() => handleShare(video)}
                data-testid={`button-share-${video.id}`}
              >
                <div className="bg-zinc-800/60 p-3 rounded-full backdrop-blur-sm">
                  <Share2 size={24} />
                </div>
                <span className="text-xs font-medium">Share</span>
              </button>
            </div>

            {/* Bottom Meta Info */}
            <div className="absolute bottom-0 left-0 right-0 p-4 pb-8 z-20 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                {(() => {
                  const authorObj = typeof video.author === 'object' ? video.author : null;
                  const avatarColor = authorObj?.avatarColor || '#FF0055';
                  const avatar = authorObj?.avatar || null;
                  const username = authorObj?.username || (typeof video.author === 'string' ? video.author : 'Unknown');
                  const posX = authorObj?.avatarPositionX ?? 50;
                  const posY = authorObj?.avatarPositionY ?? 50;
                  const scale = (authorObj?.avatarScale ?? 100) / 100;
                  
                  return (
                    <div 
                      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border-2"
                      style={{ borderColor: avatarColor }}
                    >
                      {avatar ? (
                        <img 
                          src={avatar} 
                          alt="avatar"
                          className="w-full h-full object-cover"
                          style={{
                            transform: `scale(${scale})`,
                            transformOrigin: `${posX}% ${posY}%`,
                          }}
                        />
                      ) : (
                        <img 
                          src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} 
                          alt="avatar"
                          className="w-full h-full object-cover bg-zinc-700"
                        />
                      )}
                    </div>
                  );
                })()}
                <span className="font-bold text-sm">@{typeof video.author === 'object' ? video.author.username : video.author}</span>
                <button 
                  className="bg-white text-black text-xs font-bold px-3 py-1.5 rounded-full"
                  data-testid="button-subscribe-creator"
                >
                  Follow
                </button>
                <a 
                  href="https://www.youtube.com/@catvidioapp?sub_confirmation=1"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1"
                  data-testid="button-subscribe-youtube"
                >
                  <Youtube size={14} />
                  Subscribe
                </a>
              </div>
              <h2 className="text-sm font-medium line-clamp-2 w-[85%]">{video.title}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Comments Drawer */}
      <Drawer.Root open={commentsOpen} onOpenChange={setCommentsOpen}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 z-50" />
          <Drawer.Content className="bg-zinc-900 flex flex-col rounded-t-[10px] h-[70vh] fixed bottom-0 left-0 right-0 max-w-md mx-auto z-50 focus:outline-none">
            <div className="p-4 flex-1 flex flex-col">
              <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-700 mb-4" />
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-lg text-white">Comments</h2>
                <button onClick={() => setCommentsOpen(false)} className="p-2">
                  <X size={20} className="text-white" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                  </div>
                ) : activeVideoForComments?.isYouTubeOnly ? (
                  <div className="text-center py-8">
                    <p className="text-zinc-400 mb-4">Comments for this video are on YouTube</p>
                    <a 
                      href={`https://www.youtube.com/watch?v=${activeVideoForComments.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium"
                    >
                      <Youtube size={16} />
                      View on YouTube
                    </a>
                  </div>
                ) : comments.length === 0 ? (
                  <p className="text-zinc-400 text-center py-8">No comments yet. Be the first!</p>
                ) : (
                  comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 bg-zinc-700">
                        <img 
                          src={comment.author?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author?.username || 'user'}`} 
                          alt="" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-white">@{comment.author?.username || 'Anonymous'}</p>
                        <p className="text-sm text-zinc-300">{comment.text}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {!activeVideoForComments?.isYouTubeOnly && (
                <div className="mt-4 flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="flex-1 bg-zinc-800 text-white rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                    data-testid="input-new-comment"
                  />
                  <button 
                    onClick={handleAddComment}
                    className="bg-red-500 p-2 rounded-full"
                    data-testid="button-send-comment"
                  >
                    <Send size={18} className="text-white" />
                  </button>
                </div>
              )}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </div>
  );
}
