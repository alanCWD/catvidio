import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/Layout";
import { UploadCloud, CheckCircle2, Youtube, Video, Loader2, AlertCircle } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { createVideo, fetchCurrentUser, uploadVideoFile, getVideoStatus } from "@/lib/api";

type UploadMode = "file" | "youtube";

export default function Upload() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [user, setUser] = useState<any>(null);
  const [uploadMode, setUploadMode] = useState<UploadMode>("file");
  const [uploadStep, setUploadStep] = useState<"form" | "uploading" | "processing" | "done" | "error">("form");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    youtubeId: "",
    title: "",
    description: "",
    type: "short" as "video" | "short",
  });

  useEffect(() => {
    fetchCurrentUser().then(setUser).catch(console.error);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      if (!formData.title) {
        setFormData({ ...formData, title: file.name.replace(/\.[^/.]+$/, "") });
      }
    }
  };

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

    if (uploadMode === "file") {
      await handleFileUpload();
    } else {
      await handleYouTubeSubmit();
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select a video file",
        variant: "destructive",
      });
      return;
    }

    setUploadStep("uploading");
    setUploadProgress(0);

    try {
      const result = await uploadVideoFile(
        selectedFile,
        formData.title,
        formData.description,
        formData.type,
        (progress) => setUploadProgress(progress)
      );

      setUploadStep("processing");
      setProcessingStatus("Adding catvid.io branding...");

      // Poll for processing status
      const checkStatus = async () => {
        try {
          const status = await getVideoStatus(result.id);
          if (status.status === "uploaded" || status.status === "approved") {
            setUploadStep("done");
            toast({
              title: "Video Processed!",
              description: "Your branded cat video is ready for review!",
            });
            setTimeout(() => setLocation("/profile"), 1500);
          } else if (status.status === "failed") {
            setUploadStep("error");
            setErrorMessage(status.error || "Processing failed");
          } else {
            setProcessingStatus(
              status.status === "processing" 
                ? "Adding catvid.io intro & outro..." 
                : "Waiting in queue..."
            );
            setTimeout(checkStatus, 2000);
          }
        } catch (error) {
          setTimeout(checkStatus, 3000);
        }
      };
      checkStatus();
    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadStep("error");
      setErrorMessage(error.message || "Upload failed");
    }
  };

  const handleYouTubeSubmit = async () => {
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

  const resetForm = () => {
    setUploadStep("form");
    setSelectedFile(null);
    setErrorMessage("");
    setUploadProgress(0);
    setFormData({ youtubeId: "", title: "", description: "", type: "short" });
  };

  return (
    <Layout>
      <div className="p-6 h-full flex flex-col pb-24">
        <header className="mb-6">
          <h1 className="text-3xl font-black mb-2">Upload Video</h1>
          <p className="text-muted-foreground">Upload your cat video and we'll add catvid.io branding automatically.</p>
        </header>

        <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
          {uploadStep === "form" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* Mode Toggle */}
              <div className="flex gap-2 mb-6 bg-secondary/50 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadMode("file")}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    uploadMode === "file"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Video size={18} />
                  Upload File
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode("youtube")}
                  className={`flex-1 py-2.5 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                    uploadMode === "youtube"
                      ? "bg-primary text-primary-foreground shadow"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Youtube size={18} />
                  YouTube ID
                </button>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {uploadMode === "file" ? (
                  <>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                        selectedFile 
                          ? "border-primary bg-primary/5" 
                          : "border-border hover:border-primary/50 hover:bg-secondary/30"
                      }`}
                    >
                      {selectedFile ? (
                        <div className="space-y-2">
                          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                            <Video size={24} className="text-primary" />
                          </div>
                          <p className="font-bold text-sm truncate max-w-[200px] mx-auto">{selectedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                          <p className="text-xs text-primary">Click to change file</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <UploadCloud size={48} className="mx-auto text-muted-foreground" />
                          <div>
                            <p className="font-bold">Tap to select video</p>
                            <p className="text-sm text-muted-foreground">MP4, MOV, WebM up to 500MB</p>
                          </div>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="video/mp4,video/quicktime,video/webm,video/x-matroska"
                        className="hidden"
                        onChange={handleFileSelect}
                      />
                    </div>

                    <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl text-sm">
                      <p className="font-bold text-primary">🎬 Auto-Branding Enabled</p>
                      <p className="text-muted-foreground text-xs mt-1">
                        A 3-second catvid.io intro and outro will be added to your video automatically.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-secondary/50 border border-border p-3 rounded-xl flex items-start gap-3">
                      <Youtube size={20} className="text-primary mt-0.5 shrink-0" />
                      <p className="text-xs text-muted-foreground">
                        Paste the ID from a YouTube URL (e.g., dQw4w9WgXcQ from youtube.com/watch?v=dQw4w9WgXcQ)
                      </p>
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
                  </>
                )}

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
                    rows={2}
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
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
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
                      className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all ${
                        formData.type === "short" 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-secondary text-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Zoomies (Short)
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button 
                    type="submit"
                    data-testid="button-submit"
                    disabled={uploadMode === "file" ? !selectedFile : !formData.youtubeId}
                    className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {uploadMode === "file" ? "Upload & Process" : "Submit Video"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {uploadStep === "uploading" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center gap-6 py-12"
            >
              <div className="w-24 h-24 relative">
                <svg className="w-24 h-24 transform -rotate-90">
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-primary/20"
                  />
                  <circle
                    cx="48"
                    cy="48"
                    r="44"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-primary"
                    strokeDasharray={276}
                    strokeDashoffset={276 - (276 * uploadProgress) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black">{uploadProgress}%</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Uploading...</h3>
                <p className="text-muted-foreground">Sending your video to the cloud</p>
              </div>
            </motion.div>
          )}

          {uploadStep === "processing" && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center text-center gap-6 py-12"
            >
              <div className="w-24 h-24 relative">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary rounded-full border-t-transparent animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Processing Video</h3>
                <p className="text-muted-foreground">{processingStatus}</p>
              </div>
            </motion.div>
          )}

          {uploadStep === "done" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-6 py-12"
            >
              <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                <CheckCircle2 size={48} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Success!</h3>
                <p className="text-muted-foreground">Your branded video is ready for review.</p>
              </div>
            </motion.div>
          )}

          {uploadStep === "error" && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center gap-6 py-12"
            >
              <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center">
                <AlertCircle size={48} strokeWidth={3} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Upload Failed</h3>
                <p className="text-muted-foreground">{errorMessage}</p>
              </div>
              <button
                onClick={resetForm}
                className="bg-primary text-primary-foreground font-bold py-3 px-8 rounded-xl"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </Layout>
  );
}
