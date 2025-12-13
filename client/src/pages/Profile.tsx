import { Layout } from "@/components/Layout";
import { MOCK_USER, MOCK_VIDEOS } from "@/lib/mock-data";
import { Settings, Wallet, TrendingUp, PlayCircle, DollarSign } from "lucide-react";

export default function Profile() {
  const userVideos = MOCK_VIDEOS.filter(v => MOCK_USER.videos.includes(v.id));

  return (
    <Layout>
      <div className="pb-20">
        {/* Header Profile Section */}
        <div className="bg-card border-b border-border/50 p-6">
          <div className="flex justify-between items-start mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-orange-400 p-1">
              <div className="w-full h-full bg-card rounded-xl flex items-center justify-center overflow-hidden">
                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${MOCK_USER.username}`} alt="avatar" />
              </div>
            </div>
            <button className="p-2 rounded-full hover:bg-secondary transition-colors">
              <Settings size={20} className="text-muted-foreground" />
            </button>
          </div>

          <h1 className="text-2xl font-black mb-1">{MOCK_USER.username}</h1>
          <p className="text-sm text-muted-foreground mb-6">Cat Enthusiast & Content Creator</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-primary/5 border border-primary/10 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-primary mb-1">
                <Wallet size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Wallet</span>
              </div>
              <div className="text-2xl font-black text-foreground">
                ${MOCK_USER.walletBalance.toFixed(2)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">Available to cash out</div>
            </div>

            <div className="bg-secondary/30 border border-border p-4 rounded-xl">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <TrendingUp size={16} />
                <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
              </div>
              <div className="text-2xl font-black text-foreground">
                {(MOCK_USER.totalViews / 1000).toFixed(1)}k
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
            {userVideos.map(video => (
              <div key={video.id} className="bg-card border border-border rounded-xl p-3 flex gap-4 shadow-sm">
                <div className="w-24 aspect-video bg-black rounded-lg overflow-hidden relative shrink-0">
                  <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover opacity-80" />
                </div>
                <div className="flex-1 min-w-0 py-1">
                  <h3 className="font-bold text-sm truncate mb-1">{video.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      {video.upvotes}
                    </span>
                    <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded">
                      <DollarSign size={10} />
                      ${video.earnings.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
