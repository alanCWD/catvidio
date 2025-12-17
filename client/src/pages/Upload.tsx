import { useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { UploadCloud, CheckCircle2, Youtube } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { createVideo, fetchCurrentUser } from "@/lib/api";

export default function Upload() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<any>(null);
  const [uploadStep, setUploadStep] = useState<"form" | "processing" | "done">("form");
  const [formData, setFormData] = useState({
    youtubeId: "",
    title: "",
    description: "",
    type: "video" as "video" | "short",
  });

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Error",
        description: "Please create a profile first",
        variant: "destructive",
      });
      setLocation("/create-profile");
      return;
    }

    setUploadStep("processing");
    
    try {
      await createVideo({
        userId: user.id,
        youtubeId: formData.youtubeId,
        title: formData.title,
        description: formData.description,
        type: formData.type,
        thumbnail: `https://i.ytimg.com/vi/${formData.youtubeId}/hqdefault.jpg`,
      });

      setUploadStep("done");
      toast({
        title: "Video Submitted!",
        description: "Your cat video is now live!",
      });
      setTimeout(() => {
        setLocation("/profile");
      }, 1500);
    } catch (error) {
      console.error('Failed to create video:', error);
      toast({
        title: "Error",
        description: "Failed to submit video. Please try again.",
        variant: "destructive",
      });
      setUploadStep("form");
    }
  };

  return (
    <Layout>
      <div className="p-6 h-full flex flex-col pb-24">
        <header className="mb-8">
          <h1 className="text-3xl font-black mb-2">Submit Video</h1>
          <p className="text-muted-foreground">Submit a YouTube video ID to share your cat with the world.</p>
        </header>

        <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
          {uploadStep === "form" && (
            <motion.form 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl flex items-start gap-3">
                <Youtube size={24} className="text-primary mt-0.5 shrink-0" />
                <div className="text-sm">
                  <p className="font-bold text-foreground">YouTube Video ID</p>
                  <p className="text-muted-foreground">Paste the ID from a YouTube URL (e.g., dQw4w9WgXcQ from youtube.com/watch?v=dQw4w9WgXcQ)</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">YouTube Video ID</label>
                <input 
                  required
                  data-testid="input-youtube-id"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 font-mono"
                  placeholder="dQw4w9WgXcQ"
                  value={formData.youtubeId}
                  onChange={e => setFormData({...formData, youtubeId: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Title</label>
                <input 
                  required
                  data-testid="input-title"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. My cat did a backflip!"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Description (optional)</label>
                <textarea 
                  data-testid="input-description"
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                  placeholder="Tell us about this cat video..."
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Type</label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    data-testid="button-type-video"
                    onClick={() => setFormData({...formData, type: "video"})}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      formData.type === "video" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Regular Video
                  </button>
                  <button
                    type="button"
                    data-testid="button-type-short"
                    onClick={() => setFormData({...formData, type: "short"})}
                    className={`flex-1 py-3 rounded-xl font-bold transition-all ${
                      formData.type === "short" 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-secondary text-foreground hover:bg-secondary/80"
                    }`}
                  >
                    Zoomies (Short)
                  </button>
                </div>
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  data-testid="button-submit"
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                >
                  Submit Video
                </button>
                <p className="text-xs text-center text-muted-foreground mt-4 px-4">
                  By submitting, you agree to our Terms of Service. The video will be embedded from YouTube.
                </p>
              </div>
            </motion.form>
          )}

          {uploadStep === "processing" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center gap-6"
            >
              <div className="w-24 h-24 relative">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Processing...</h3>
                <p className="text-muted-foreground">Optimizing for the PurrStream Network</p>
              </div>
            </motion.div>
          )}

          {uploadStep === "done" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-6"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Success!</h3>
                <p className="text-muted-foreground">Your video is live and ready to earn.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
