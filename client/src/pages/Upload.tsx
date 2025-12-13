import { useState } from "react";
import { Layout } from "@/components/Layout";
import { UploadCloud, CheckCircle2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

export default function Upload() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStep, setUploadStep] = useState<"select" | "details" | "processing" | "done">("select");
  const [formData, setFormData] = useState({
    title: "",
    tags: "",
  });

  const handleFileSelect = () => {
    // Mock file selection
    setUploadStep("details");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setUploadStep("processing");
    
    // Simulate upload and processing
    setTimeout(() => {
      setUploadStep("done");
      toast({
        title: "Video Submitted!",
        description: "Your cat is now being reviewed by our team.",
      });
      setTimeout(() => {
        setLocation("/profile");
      }, 1500);
    }, 2000);
  };

  return (
    <Layout>
      <div className="p-6 h-full flex flex-col">
        <header className="mb-8">
          <h1 className="text-3xl font-black mb-2">Upload</h1>
          <p className="text-muted-foreground">Share your cat with the world and start earning.</p>
        </header>

        <div className="flex-1 flex flex-col justify-center">
          {uploadStep === "select" && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="border-2 border-dashed border-border rounded-3xl p-10 flex flex-col items-center justify-center text-center gap-4 bg-card/50 hover:bg-card/80 transition-colors cursor-pointer group"
              onClick={handleFileSelect}
            >
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud size={40} className="text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Select Video</h3>
                <p className="text-sm text-muted-foreground mt-1">MP4 or MOV up to 100MB</p>
              </div>
            </motion.div>
          )}

          {uploadStep === "details" && (
            <motion.form 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
              onSubmit={handleSubmit}
            >
              <div className="bg-secondary/30 p-4 rounded-xl flex items-center gap-3">
                 <div className="w-12 h-12 bg-black rounded-lg shrink-0" />
                 <div className="text-sm">
                   <p className="font-bold">cute_cat_jumping.mp4</p>
                   <p className="text-muted-foreground">12.5 MB • Ready</p>
                 </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Title</label>
                <input 
                  required
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="e.g. My cat did a backflip!"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">Tags (comma separated)</label>
                <input 
                  className="w-full bg-card border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="#funny, #jump, #fail"
                  value={formData.tags}
                  onChange={e => setFormData({...formData, tags: e.target.value})}
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98]"
                >
                  Publish Video
                </button>
                <p className="text-xs text-center text-muted-foreground mt-4 px-4">
                  By publishing, you agree to our Terms of Service and grant PurrStream distribution rights.
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
