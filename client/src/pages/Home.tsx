import { Layout } from "@/components/Layout";
import { VideoCard } from "@/components/VideoCard";
import { MOCK_VIDEOS } from "@/lib/mock-data";

export default function Home() {
  return (
    <Layout>
      <div className="p-4 pt-6 max-w-md mx-auto">
        <header className="mb-6 flex justify-between items-center px-2">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-primary">PurrStream</h1>
            <p className="text-xs text-muted-foreground font-medium">Curated Feline Entertainment</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-bold text-primary">Beta</span>
          </div>
        </header>

        <div className="space-y-2">
          {MOCK_VIDEOS.map((video) => (
            <VideoCard key={video.id} video={video} />
          ))}
        </div>
        
        <div className="h-12 flex items-center justify-center text-muted-foreground text-sm font-medium">
          You've reached the end! 🐱
        </div>
      </div>
    </Layout>
  );
}
