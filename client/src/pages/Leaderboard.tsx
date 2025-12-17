import { Layout } from "@/components/Layout";
import { Trophy, DollarSign, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchTopVideos, fetchTopCreators } from "@/lib/api";
import { formatEarnings } from "@/lib/format";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"videos" | "creators">("videos");
  const [topVideos, setTopVideos] = useState<any[]>([]);
  const [topCreators, setTopCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchTopVideos(10),
      fetchTopCreators(10)
    ])
      .then(([videos, creators]) => {
        setTopVideos(videos);
        setTopCreators(creators);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch leaderboard:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading leaderboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 pb-24">
        <header className="mb-6 text-center">
          <div className="inline-block p-3 bg-yellow-100 rounded-full mb-3 text-yellow-600">
            <Trophy size={32} strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl font-black text-foreground">Leaderboard</h1>
          <p className="text-sm text-muted-foreground">Top earners this week</p>
        </header>

        {/* Tabs */}
        <div className="flex p-1 bg-secondary/50 rounded-xl mb-6">
          <button
            onClick={() => setActiveTab("videos")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "videos" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Top Videos
          </button>
          <button
            onClick={() => setActiveTab("creators")}
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${
              activeTab === "creators" 
                ? "bg-card text-foreground shadow-sm" 
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Top Creators
          </button>
        </div>

        <div className="space-y-4">
          {activeTab === "videos" ? (
            topVideos.map((video, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={video.id}
                className="bg-card border border-border p-3 rounded-xl flex items-center gap-4 shadow-sm"
              >
                <div className="font-black text-lg text-muted-foreground/50 w-6 text-center">
                  {index + 1}
                </div>
                <div className="w-16 h-16 rounded-lg bg-black overflow-hidden relative shrink-0">
                  <img src={video.thumbnail || `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{video.author?.username || 'Unknown'}</p>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md w-fit">
                    <DollarSign size={10} strokeWidth={3} />
                    {formatEarnings(video.earnings || 0)}
                  </div>
                </div>
                {index === 0 && <Crown size={24} className="text-yellow-500" fill="currentColor" />}
              </motion.div>
            ))
          ) : (
            topCreators.map((creator, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={creator.id}
                className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 shadow-sm"
              >
                <div className="font-black text-lg text-muted-foreground/50 w-6 text-center">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden border border-border">
                  <img src={creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.username}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{creator.username}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <DollarSign size={12} strokeWidth={3} />
                    {formatEarnings(creator.totalEarnings || 0)}
                  </div>
                </div>
                {index === 0 && <Crown size={24} className="text-yellow-500" fill="currentColor" />}
              </motion.div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
