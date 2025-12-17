import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ArrowLeft, Save, User, FileText } from "lucide-react";
import { useLocation } from "wouter";
import { MOCK_USER } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const [_, setLocation] = useLocation();
  const { toast } = useToast();
  const [name, setName] = useState(MOCK_USER.username);
  const [tagline, setTagline] = useState(MOCK_USER.tagline);

  const handleSave = () => {
    MOCK_USER.username = name;
    MOCK_USER.tagline = tagline;

    toast({
      title: "Profile Updated",
      description: "Your changes have been saved.",
    });

    setLocation("/profile");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="p-4 flex items-center justify-between border-b border-border/40">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation("/profile")} className="p-2 -ml-2 hover:bg-secondary rounded-full">
              <ArrowLeft size={24} />
            </button>
            <h1 className="font-bold text-xl">Settings</h1>
          </div>
          <button 
            onClick={handleSave}
            className="text-primary font-bold text-sm bg-primary/10 px-4 py-2 rounded-full hover:bg-primary/20 transition-colors"
          >
            Save
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Public Profile Section */}
          <section className="space-y-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Public Profile</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User size={16} />
                  Display Name
                </label>
                <input 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Your Name"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <FileText size={16} />
                  Tagline / Bio
                </label>
                <textarea 
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full bg-secondary/30 border border-border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none h-24"
                  placeholder="Tell us about your cat..."
                />
                <p className="text-xs text-muted-foreground text-right">{tagline.length}/150</p>
              </div>
            </div>
          </section>

          {/* Account Section (Mock) */}
          <section className="space-y-4">
             <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Account</h2>
             <div className="bg-secondary/30 rounded-xl overflow-hidden border border-border">
               <button className="w-full text-left px-4 py-3 hover:bg-secondary/50 border-b border-border flex justify-between items-center text-sm">
                 <span>Notification Preferences</span>
               </button>
               <button className="w-full text-left px-4 py-3 hover:bg-secondary/50 border-b border-border flex justify-between items-center text-sm">
                 <span>Privacy & Safety</span>
               </button>
               <button className="w-full text-left px-4 py-3 hover:bg-secondary/50 text-red-500 text-sm font-medium">
                 Log Out
               </button>
             </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
