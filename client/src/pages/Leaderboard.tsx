import { Layout } from "@/components/Layout";
import { MOCK_VIDEOS, MOCK_USER } from "@/lib/mock-data";
import { Trophy, TrendingUp, DollarSign, Crown } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [activeTab, setActiveTab] = useState<"videos" | "creators">("videos");

  const sortedVideos = [...MOCK_VIDEOS].sort((a, b) => b.earnings - a.earnings);
  
  // Mock creators based on videos for now
  const creators = [
    { name: "PurrMaster", earnings: 420.69, avatar: "PurrMaster" },
    { name: "GalaxyPurr", earnings: 142.50, avatar: "GalaxyPurr" },
    { name: "TickleMonster", earnings: 156.00, avatar: "TickleMonster" },
    { name: "PianoPaws", earnings: 89.00, avatar: "PianoPaws" },
  ].sort((a, b) => b.earnings - a.earnings);

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
            sortedVideos.map((video, index) => (
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
                  <img src={video.thumbnail} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate">{video.title}</h3>
                  <p className="text-xs text-muted-foreground mb-1">{video.author}</p>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs bg-emerald-50 px-2 py-1 rounded-md w-fit">
                    <DollarSign size={10} strokeWidth={3} />
                    ${video.earnings.toFixed(2)}
                  </div>
                </div>
                {index === 0 && <Crown size={24} className="text-yellow-500" fill="currentColor" />}
              </motion.div>
            ))
          ) : (
            creators.map((creator, index) => (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                key={creator.name}
                className="bg-card border border-border p-4 rounded-xl flex items-center gap-4 shadow-sm"
              >
                <div className="font-black text-lg text-muted-foreground/50 w-6 text-center">
                  {index + 1}
                </div>
                <div className="w-12 h-12 rounded-full bg-secondary overflow-hidden border border-border">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.avatar}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base truncate">{creator.name}</h3>
                  <div className="flex items-center gap-1 text-emerald-600 font-bold text-sm">
                    <DollarSign size={12} strokeWidth={3} />
                    ${creator.earnings.toFixed(2)}
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
