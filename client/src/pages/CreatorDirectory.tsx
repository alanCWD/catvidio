import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Plus, Edit2, User, Video, Upload, Check, Move } from "lucide-react";
import { 
  fetchCreators, 
  createCreator, 
  updateCreator, 
  fetchYouTubeChannelVideos,
  fetchYoutubeVideoCreators,
  assignVideoToCreator
} from "@/lib/api";

const AURA_COLORS = [
  { name: "Red", value: "#FF0055" },
  { name: "Orange", value: "#FF8800" },
  { name: "Yellow", value: "#FFDD00" },
  { name: "Green", value: "#00CC66" },
  { name: "Blue", value: "#0088FF" },
  { name: "Purple", value: "#8855FF" },
  { name: "Pink", value: "#FF55AA" },
  { name: "Cyan", value: "#00DDDD" },
];

interface Creator {
  id: number;
  username: string;
  tagline?: string;
  avatar?: string;
  avatarColor?: string;
  avatarPositionX?: number;
  avatarPositionY?: number;
  avatarScale?: number;
}

interface YouTubeVideo {
  youtubeId: string;
  title: string;
  thumbnail: string;
}

interface VideoCreatorMapping {
  youtubeId: string;
  creatorId: number;
  creator: Creator;
}

export default function CreatorDirectory() {
  const [, setLocation] = useLocation();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideo[]>([]);
  const [videoMappings, setVideoMappings] = useState<VideoCreatorMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCreator, setEditingCreator] = useState<Creator | null>(null);
  
  const [formData, setFormData] = useState({
    username: "",
    tagline: "",
    avatarColor: "#FF0055",
    avatar: "",
    avatarPositionX: 50,
    avatarPositionY: 50,
    avatarScale: 100,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [creatorsData, videosData, mappingsData] = await Promise.all([
        fetchCreators(),
        fetchYouTubeChannelVideos().catch(() => []),
        fetchYoutubeVideoCreators().catch(() => []),
      ]);
      setCreators(creatorsData);
      setYoutubeVideos(videosData);
      setVideoMappings(mappingsData);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const resetFormData = () => {
    setFormData({
      username: "",
      tagline: "",
      avatarColor: "#FF0055",
      avatar: "",
      avatarPositionX: 50,
      avatarPositionY: 50,
      avatarScale: 100,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateCreator = async () => {
    try {
      await createCreator(formData);
      setShowCreateDialog(false);
      resetFormData();
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to create creator");
    }
  };

  const handleUpdateCreator = async () => {
    if (!editingCreator) return;
    try {
      await updateCreator(editingCreator.id, formData);
      setEditingCreator(null);
      resetFormData();
      loadData();
    } catch (error: any) {
      alert(error.message || "Failed to update creator");
    }
  };

  const handleAssignVideo = async (youtubeId: string, creatorId: number) => {
    try {
      await assignVideoToCreator(youtubeId, creatorId);
      loadData();
    } catch (error) {
      console.error("Failed to assign video:", error);
    }
  };

  const getVideoCreator = (youtubeId: string) => {
    const mapping = videoMappings.find(m => m.youtubeId === youtubeId);
    return mapping?.creatorId?.toString() || "";
  };

  const openEditDialog = (creator: Creator) => {
    setEditingCreator(creator);
    setFormData({
      username: creator.username,
      tagline: creator.tagline || "",
      avatarColor: creator.avatarColor || "#FF0055",
      avatar: creator.avatar || "",
      avatarPositionX: creator.avatarPositionX ?? 50,
      avatarPositionY: creator.avatarPositionY ?? 50,
      avatarScale: creator.avatarScale ?? 100,
    });
  };

  const renderAvatarPreview = () => {
    if (!formData.avatar) return null;
    const scale = formData.avatarScale / 100;
    return (
      <div 
        className="w-24 h-24 rounded-full overflow-hidden border-4 mx-auto relative"
        style={{ borderColor: formData.avatarColor }}
      >
        <img 
          src={formData.avatar} 
          alt="Preview" 
          className="absolute w-full h-full object-cover"
          style={{
            transform: `scale(${scale})`,
            transformOrigin: `${formData.avatarPositionX}% ${formData.avatarPositionY}%`,
          }}
        />
      </div>
    );
  };

  const renderImageEditor = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Label>Avatar Image</Label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          data-testid="button-upload-image"
        >
          <Upload size={14} className="mr-1" />
          {formData.avatar ? "Change" : "Upload"}
        </Button>
      </div>
      
      {formData.avatar && (
        <>
          {renderAvatarPreview()}
          <div className="space-y-3 pt-2">
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Move size={12} /> Horizontal Position
              </Label>
              <Slider
                value={[formData.avatarPositionX]}
                onValueChange={([val]) => setFormData({ ...formData, avatarPositionX: val })}
                min={0}
                max={100}
                step={1}
                className="mt-1"
                data-testid="slider-position-x"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500 flex items-center gap-1">
                <Move size={12} /> Vertical Position
              </Label>
              <Slider
                value={[formData.avatarPositionY]}
                onValueChange={([val]) => setFormData({ ...formData, avatarPositionY: val })}
                min={0}
                max={100}
                step={1}
                className="mt-1"
                data-testid="slider-position-y"
              />
            </div>
            <div>
              <Label className="text-xs text-gray-500">Zoom</Label>
              <Slider
                value={[formData.avatarScale]}
                onValueChange={([val]) => setFormData({ ...formData, avatarScale: val })}
                min={50}
                max={200}
                step={5}
                className="mt-1"
                data-testid="slider-zoom"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderAuraColorPicker = () => (
    <div>
      <Label>Aura Color</Label>
      <div className="flex flex-wrap gap-2 mt-2">
        {AURA_COLORS.map((color) => (
          <button
            key={color.value}
            onClick={() => setFormData({ ...formData, avatarColor: color.value })}
            className={`w-8 h-8 rounded-full border-2 relative flex items-center justify-center transition-transform ${
              formData.avatarColor === color.value 
                ? "border-white scale-110 ring-2 ring-offset-2 ring-offset-background" 
                : "border-transparent hover:scale-105"
            }`}
            style={{ 
              backgroundColor: color.value,
              "--tw-ring-color": color.value,
            } as React.CSSProperties}
            title={color.name}
            data-testid={`button-color-${color.name.toLowerCase()}`}
          >
            {formData.avatarColor === color.value && (
              <Check size={16} className="text-white drop-shadow-md" />
            )}
          </button>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-4 pb-24">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setLocation("/settings")} className="p-2 -ml-2">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-2xl font-bold">Creator Directory</h1>
        </div>

        <div className="space-y-8">
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <User size={20} />
                Creators
              </h2>
              <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-creator">
                    <Plus size={16} className="mr-2" />
                    Add Creator
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Creator</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="username">Username</Label>
                      <Input
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        placeholder="e.g., KittyLover99"
                        data-testid="input-creator-username"
                      />
                    </div>
                    <div>
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        value={formData.tagline}
                        onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                        placeholder="e.g., Cat mom of 3 furballs"
                        data-testid="input-creator-tagline"
                      />
                    </div>
                    {renderImageEditor()}
                    {renderAuraColorPicker()}
                    <Button onClick={handleCreateCreator} className="w-full" data-testid="button-save-creator">
                      Create Creator
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {creators.map((creator) => {
                const scale = (creator.avatarScale ?? 100) / 100;
                const posX = creator.avatarPositionX ?? 50;
                const posY = creator.avatarPositionY ?? 50;
                
                return (
                <Card key={creator.id} data-testid={`card-creator-${creator.id}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg overflow-hidden border-2"
                      style={{ borderColor: creator.avatarColor || "#FF0055" }}
                    >
                      {creator.avatar ? (
                        <img 
                          src={creator.avatar} 
                          alt="" 
                          className="w-full h-full object-cover" 
                          style={{
                            transform: `scale(${scale})`,
                            transformOrigin: `${posX}% ${posY}%`,
                          }}
                        />
                      ) : (
                        <div 
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: creator.avatarColor || "#FF0055" }}
                        >
                          {creator.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">@{creator.username}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        {creator.tagline || "Cat Enthusiast"}
                      </p>
                    </div>
                    <button
                      onClick={() => openEditDialog(creator)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
                      data-testid={`button-edit-creator-${creator.id}`}
                    >
                      <Edit2 size={16} />
                    </button>
                  </CardContent>
                </Card>
              );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-xl font-semibold flex items-center gap-2 mb-4">
              <Video size={20} />
              Assign Videos to Creators
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
              Assign each YouTube video to a creator. Their avatar will appear under the video in the app.
            </p>

            <div className="space-y-3">
              {youtubeVideos.map((video) => (
                <Card key={video.youtubeId} data-testid={`card-video-${video.youtubeId}`}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{video.title}</p>
                    </div>
                    <Select
                      value={getVideoCreator(video.youtubeId)}
                      onValueChange={(value) => handleAssignVideo(video.youtubeId, parseInt(value))}
                    >
                      <SelectTrigger className="w-40" data-testid={`select-creator-${video.youtubeId}`}>
                        <SelectValue placeholder="Select creator" />
                      </SelectTrigger>
                      <SelectContent>
                        {creators.map((creator) => (
                          <SelectItem key={creator.id} value={creator.id.toString()}>
                            @{creator.username}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </CardContent>
                </Card>
              ))}
              {youtubeVideos.length === 0 && (
                <p className="text-center text-gray-500 py-8">No YouTube videos found</p>
              )}
            </div>
          </section>
        </div>
      </div>

      <Dialog open={!!editingCreator} onOpenChange={(open) => !open && setEditingCreator(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Creator</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="edit-username">Username</Label>
              <Input
                id="edit-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                data-testid="input-edit-username"
              />
            </div>
            <div>
              <Label htmlFor="edit-tagline">Tagline</Label>
              <Input
                id="edit-tagline"
                value={formData.tagline}
                onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                data-testid="input-edit-tagline"
              />
            </div>
            {renderImageEditor()}
            {renderAuraColorPicker()}
            <Button onClick={handleUpdateCreator} className="w-full" data-testid="button-update-creator">
              Update Creator
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
