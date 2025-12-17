import { Layout } from "@/components/Layout";
import { Settings, Wallet, TrendingUp, PlayCircle, DollarSign, Edit2 } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";
import { fetchCurrentUser, fetchUserVideos } from "@/lib/api";
import { formatEarnings, formatVideoForComponent } from "@/lib/format";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchCurrentUser(),
      fetchCurrentUser().then(u => u ? fetchUserVideos(u.id) : [])
    ])
      .then(([userData, userVideos]) => {
        setUser(userData);
        if (userVideos.length > 0) {
          setVideos(userVideos.map(formatVideoForComponent));
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch profile:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading profile...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-screen p-6">
          <p className="text-muted-foreground mb-4">No profile found</p>
          <Link href="/create-profile">
            <button className="bg-primary text-primary-foreground px-6 py-3 rounded-lg font-bold">
              Create Profile
            </button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="pb-20">
        {/* Header Profile Section */}
        <div className="bg-card border-b border-border/50 p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="relative">
               {/* Avatar Container with Dynamic Border Color */}
              <div 
                className="w-24 h-24 rounded-full p-1"
                style={{ backgroundColor: user.avatarColor || '#FF0055' }}
              >
                <div className="w-full h-full bg-card rounded-full overflow-hidden border-4 border-white">
                  <img 
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
                    alt="avatar" 
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <Link href="/create-profile">
                <button className="absolute -bottom-1 -right-1 bg-foreground text-background p-2 rounded-full shadow-lg hover:scale-105 transition-transform">
                  <Edit2 size={14} />
                </button>
              </Link>
            </div>
            
            <Link href="/settings">
              <button className="p-2 rounded-full hover:bg-secondary transition-colors">
                <Settings size={20} className="text-muted-foreground" />
              </button>
            </Link>
          </div>

          <h1 className="text-2xl font-black mb-1">{user.username}</h1>
          <p className="text-sm text-muted-foreground mb-6">{user.tagline || "Cat Enthusiast & Content Creator"}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Wallet size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Wallet</span>
              </div>
              <div className="text-2xl font-black text-foreground">
                {formatEarnings(user.walletBalance || 0)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Available to cash out</div>
            </div>

            <div className="bg-secondary/30 border border-border p-4 rounded-xl">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
              </div>
              <div className="text-2xl font-black text-foreground">
                {((user.totalViews || 0) / 1000).toFixed(1)}k
              </div>
              <div className="text-xs text-muted-foreground mt-1">+12% this week</div>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <PlayCircle size={20} className="text-primary" />
            My Videos
          </h2>
          
          <div className="space-y-4">
            {videos.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No videos yet</p>
            ) : (
              videos.map(video => (
                <div key={video.id} className="bg-card border border-border rounded-xl p-3 flex gap-4 shadow-sm">
                  <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden relative shrink-0">
                    <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} alt={video.title} className="w-full h-full object-cover opacity-80" />
                  </div>
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-sm truncate mb-1">{video.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <TrendingUp size={12} />
                        {video.upvotes || 0}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                        <DollarSign size={10} />
                        {video.earnings}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
