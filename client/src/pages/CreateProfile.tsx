import { useState, useRef, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { ArrowLeft, Camera, Sparkles, Wand2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { createOrUpdateProfile } from "@/lib/api";

const CAT_COLORS = [
  "#FF0055", // Hot Pink
  "#00E5FF", // Cyan
  "#7B00FF", // Purple
  "#FFDD00", // Yellow
  "#FF3300", // Red Orange
  "#00FF66", // Lime Green
];

export default function CreateProfile() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const { user, isLoading, isAuthenticated } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [step, setStep] = useState<"upload" | "processing" | "result">("upload");
  const [name, setName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [detectedColor, setDetectedColor] = useState(CAT_COLORS[0]);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = "/api/login";
    }
  }, [isLoading, isAuthenticated]);

  useEffect(() => {
    if (user?.username) {
      setName(user.username);
    }
  }, [user]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const imageUrl = URL.createObjectURL(file);
      setSelectedImage(imageUrl);
      
      // Simulate "AI Processing"
      setStep("processing");
      setTimeout(() => {
        setStep("result");
        // Pick a random distinct color
        const randomColor = CAT_COLORS[Math.floor(Math.random() * CAT_COLORS.length)];
        setDetectedColor(randomColor);
      }, 2500);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast({
        title: "Error",
        description: "Please enter a name for your cat.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    try {
      // Convert image to base64 if present
      let avatarBase64: string | undefined = undefined;
      if (selectedImage) {
        const response = await fetch(selectedImage);
        const blob = await response.blob();
        const reader = new FileReader();
        avatarBase64 = await new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        });
      }

      const profileData: { username: string; avatarColor: string; avatar?: string } = {
        username: name.trim(),
        avatarColor: detectedColor,
      };
      
      if (avatarBase64) {
        profileData.avatar = avatarBase64;
      }

      await createOrUpdateProfile(profileData);

      toast({
        title: "Profile Created!",
        description: `Welcome to catvid.io, ${name}!`,
      });

      setLocation("/profile");
    } catch (error) {
      console.error('Failed to save profile:', error);
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !isAuthenticated) {
    return (
      <Layout>
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center gap-4">
          <button onClick={() => setLocation("/profile")} className="p-2 -ml-2 hover:bg-secondary rounded-full">
            <ArrowLeft size={24} />
          </button>
          <h1 className="font-bold text-xl">Create Cat Profile</h1>
        </div>

        <div className="flex-1 p-6 flex flex-col items-center justify-center">
          <AnimatePresence mode="wait">
            {step === "upload" && (
              <motion.div 
                key="upload"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm flex flex-col gap-8"
              >
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-black">Who is this star?</h2>
                  <p className="text-muted-foreground">Upload a photo to generate a unique AI aura.</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold ml-1">Cat's Name</label>
                    <input 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-primary/20"
                      placeholder="e.g. Sir Purrs A Lot"
                    />
                  </div>

                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square bg-secondary/30 border-2 border-dashed border-border rounded-full flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-secondary/50 transition-colors group relative overflow-hidden"
                  >
                    <Camera size={48} className="text-muted-foreground group-hover:text-foreground transition-colors" />
                    <span className="font-bold text-muted-foreground group-hover:text-foreground">Upload Photo</span>
                    <input 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      className="hidden"
                      onChange={handleImageSelect}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === "processing" && (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="flex flex-col items-center gap-6 text-center"
              >
                <div className="relative w-48 h-48">
                   {/* Scanning Effect */}
                   <motion.div 
                     className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/20 to-transparent w-full h-1/3 blur-xl z-20"
                     animate={{ top: ["-20%", "120%"] }}
                     transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                   />
                   <div className="w-full h-full rounded-full overflow-hidden border-4 border-muted relative z-10">
                     <img src={selectedImage!} className="w-full h-full object-cover opacity-80" />
                   </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center justify-center gap-2">
                    <Sparkles className="text-yellow-500 animate-pulse" />
                    Analyzing Cuteness...
                  </h3>
                  <p className="text-muted-foreground mt-2">Detecting head shape & aura...</p>
                </div>
              </motion.div>
            )}

            {step === "result" && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-8 w-full max-w-sm"
              >
                <div className="text-center">
                  <h2 className="text-3xl font-black mb-2">It's a Match!</h2>
                  <p className="text-muted-foreground">We found a {detectedColor} aura for {name}.</p>
                </div>

                <div className="relative group">
                  <motion.div 
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.5 }}
                    className="w-48 h-48 rounded-full p-2 relative z-10"
                    style={{ backgroundColor: detectedColor }}
                  >
                    <div className="w-full h-full rounded-full bg-white border-4 border-white overflow-hidden shadow-inner">
                      <img src={selectedImage!} className="w-full h-full object-cover" />
                    </div>
                  </motion.div>
                  
                  {/* Glow Effect */}
                  <div 
                    className="absolute inset-0 blur-3xl opacity-40 z-0"
                    style={{ backgroundColor: detectedColor }}
                  />
                  
                  <div className="absolute -bottom-4 -right-4 bg-background border border-border px-3 py-1 rounded-full shadow-lg flex items-center gap-1 z-20">
                     <Wand2 size={12} className="text-primary" />
                     <span className="text-xs font-bold">AI Generated</span>
                  </div>
                </div>

                <button 
                  onClick={handleSave}
                  disabled={isSaving || !name.trim()}
                  className="w-full bg-primary text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </button>
                {!name.trim() && (
                  <p className="text-center text-sm text-destructive">Please enter a name for your cat above.</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
