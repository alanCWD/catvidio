import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { processAndUploadToYouTube, ensureDirectories, isYouTubeConfigured } from "./videoProcessor";
import { youtubeUploader } from "./youtubeUploader";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";

const uploadStorage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureDirectories();
    cb(null, path.join(process.cwd(), 'uploads', 'raw'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: uploadStorage,
  limits: { fileSize: 500 * 1024 * 1024 }, // 500MB limit
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'video/x-matroska'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only video files are allowed.'));
    }
  }
});

// Helper to get the authenticated user's profile ID
async function getAuthenticatedUserId(req: any): Promise<number | null> {
  const authUserId = req.user?.claims?.sub;
  if (!authUserId) return null;
  
  const user = await storage.getUserByAuthId(authUserId);
  return user?.id ?? null;
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup Replit Auth (must be BEFORE other routes)
  await setupAuth(app);
  registerAuthRoutes(app);

  // ========== USER ROUTES ==========
  
  // Get current user's cat profile
  app.get("/api/user/me", isAuthenticated, async (req: any, res) => {
    try {
      const authUserId = req.user?.claims?.sub;
      if (!authUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const user = await storage.getUserByAuthId(authUserId);
      if (!user) {
        return res.status(404).json({ error: "Profile not found", needsProfile: true });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create or update user profile
  app.post("/api/user/profile", isAuthenticated, async (req: any, res) => {
    try {
      const authUserId = req.user?.claims?.sub;
      if (!authUserId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const data = insertUserSchema.parse(req.body);
      
      // Check if user already has a profile
      const existingUser = await storage.getUserByAuthId(authUserId);
      
      if (existingUser) {
        // Update existing profile
        const updated = await storage.updateUser(existingUser.id, data);
        return res.json(updated);
      }
      
      // Create new profile linked to auth user
      const newUser = await storage.createUser({
        ...data,
        authUserId,
      });
      res.json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      // Check for duplicate username error
      if ((error as any)?.code === '23505' && (error as any)?.constraint === 'users_username_unique') {
        return res.status(409).json({ error: "This username is already taken. Please choose a different name." });
      }
      console.error('Profile save error:', error);
      res.status(500).json({ error: "Failed to save profile" });
    }
  });

  // Update user profile
  app.patch("/api/user/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertUserSchema.partial().parse(req.body);
      
      const user = await storage.updateUser(id, updates);
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // ========== VIDEO ROUTES ==========
  
  // Helper function to sync video types and privacy from YouTube
  // Uses HEAD request with redirect: manual - status 200 = Short, 302/303 = regular video
  // Also syncs privacy status from YouTube API
  async function syncVideoTypesFromYouTube(videos: any[]) {
    const videosWithYoutubeId = videos.filter(v => v.youtubeId);
    if (videosWithYoutubeId.length === 0) return;
    
    // Get fresh data from YouTube API for privacy status
    let youtubeVideos: any[] = [];
    try {
      youtubeVideos = await youtubeUploader.getChannelVideos(100);
    } catch (error) {
      console.error('[sync] Failed to fetch YouTube videos for privacy sync:', error);
    }
    const youtubeVideoMap = new Map(youtubeVideos.map(v => [v.youtubeId, v]));
    
    // Check each video's type and privacy against YouTube
    const syncPromises = videosWithYoutubeId.map(async (video) => {
      try {
        const updates: any = {};
        
        // HEAD request with manual redirect - same approach as getChannelVideos
        const response = await fetch(`https://www.youtube.com/shorts/${video.youtubeId}`, {
          method: 'HEAD',
          redirect: 'manual',
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          }
        });
        
        // 200 = Short (vertical), 302/303 = Regular video (horizontal)
        const isShort = response.status === 200;
        const correctType = isShort ? 'short' : 'video';
        
        if (video.type !== correctType) {
          console.log(`[sync] Updating video "${video.title}" (${video.youtubeId}) type: "${video.type}" -> "${correctType}"`);
          updates.type = correctType;
          video.type = correctType;
        }
        
        // Sync privacy status from YouTube API data
        const ytVideo = youtubeVideoMap.get(video.youtubeId);
        if (ytVideo && ytVideo.privacyStatus) {
          if (video.privacyStatus !== ytVideo.privacyStatus) {
            console.log(`[sync] Updating video "${video.title}" (${video.youtubeId}) privacy: "${video.privacyStatus}" -> "${ytVideo.privacyStatus}"`);
            updates.privacyStatus = ytVideo.privacyStatus;
            video.privacyStatus = ytVideo.privacyStatus;
          }
        }
        
        if (Object.keys(updates).length > 0) {
          await storage.updateVideo(video.id, updates);
        }
      } catch (error) {
        console.error(`[sync] Error checking video ${video.youtubeId}:`, error);
      }
    });
    
    await Promise.all(syncPromises);
  }
  
  // Get all videos with stats
  app.get("/api/videos", async (req, res) => {
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const allVideos = await storage.getAllVideos();
      
      // Sync video types and privacy from YouTube (non-blocking - don't fail if YouTube API is unavailable)
      syncVideoTypesFromYouTube(allVideos).catch(err => {
        console.log('[sync] YouTube sync skipped (API unavailable):', err.message || err);
      });
      
      // Filter to only public videos (exclude private and unlisted)
      const publicVideos = allVideos.filter((video: any) => 
        !video.privacyStatus || video.privacyStatus === 'public'
      );
      
      // Fetch stats for each video
      const videosWithStats = await Promise.all(
        publicVideos.map(async (video) => {
          const upvoteCount = await storage.getUpvoteCount(video.id);
          const comments = await storage.getCommentsByVideo(video.id);
          const author = await storage.getUser(video.userId);
          
          return {
            ...video,
            upvoteCount,
            commentCount: comments.length,
            author: author ? {
              id: author.id,
              username: author.username,
              avatar: author.avatar,
              avatarColor: author.avatarColor,
              avatarPositionX: author.avatarPositionX ?? 50,
              avatarPositionY: author.avatarPositionY ?? 50,
              avatarScale: author.avatarScale ?? 100,
            } : { username: "Unknown", avatarColor: "#FF0055" },
          };
        })
      );
      
      res.json(videosWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch videos" });
    }
  });

  // Get single video with full stats
  app.get("/api/videos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const videoData = await storage.getVideoWithStats(id);
      
      if (!videoData) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.json(videoData);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch video" });
    }
  });

  // Create video (legacy - YouTube ID method)
  app.post("/api/videos", async (req, res) => {
    try {
      const data = insertVideoSchema.parse(req.body);
      const video = await storage.createVideo(data);
      res.json(video);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create video" });
    }
  });

  // Upload video file for processing
  app.post("/api/videos/upload", isAuthenticated, upload.single('video'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(403).json({ error: "Please create your profile first", needsProfile: true });
      }
      
      const title = req.body.title || "Untitled Video";
      const description = req.body.description || "";
      const type = req.body.type || "short";
      const originalAudioOnly = req.body.originalAudioOnly === "true";

      // Create video record with pending status
      const video = await storage.createVideo({
        userId,
        title,
        description,
        type,
        status: "pending",
        originalFilename: req.file.originalname,
        rawFilePath: req.file.path,
        originalAudioOnly,
      });

      // Start processing in background
      (async () => {
        try {
          await storage.updateVideo(video.id, { status: "processing" });
          
          const result = await processAndUploadToYouTube(
            req.file!.path,
            video.id,
            title,
            description
          );
          
          // Update video with processed paths and YouTube ID
          await storage.updateVideo(video.id, {
            status: "uploaded",
            processedFilePath: result.processedPath,
            thumbnail: result.youtubeId 
              ? result.thumbnail 
              : `/api/videos/${video.id}/thumbnail`,
            youtubeId: result.youtubeId || undefined,
          });
          
          console.log(`Video ${video.id} processed successfully${result.youtubeId ? ` (YouTube: ${result.youtubeId})` : ''}`);
        } catch (error: any) {
          console.error(`Video ${video.id} processing failed:`, error);
          await storage.updateVideo(video.id, {
            status: "failed",
            processingError: error.message || "Unknown processing error",
          });
        }
      })();

      res.json({ 
        id: video.id, 
        status: "pending",
        message: "Video uploaded and queued for processing" 
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      res.status(500).json({ error: error.message || "Failed to upload video" });
    }
  });

  // Get video processing status
  app.get("/api/videos/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.json({
        id: video.id,
        status: video.status,
        error: video.processingError,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch video status" });
    }
  });

  // Serve video thumbnail
  app.get("/api/videos/:id/thumbnail", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video || !video.processedFilePath) {
        return res.status(404).json({ error: "Thumbnail not found" });
      }
      
      const thumbnailPath = path.join(process.cwd(), 'uploads', 'processed', `thumb_${id}.jpg`);
      res.sendFile(thumbnailPath);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch thumbnail" });
    }
  });

  // Serve processed video
  app.get("/api/videos/:id/stream", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const video = await storage.getVideo(id);
      
      if (!video || !video.processedFilePath) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      res.sendFile(video.processedFilePath);
    } catch (error) {
      res.status(500).json({ error: "Failed to stream video" });
    }
  });

  // Get user's videos
  app.get("/api/user/:userId/videos", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const videos = await storage.getVideosByUser(userId);
      
      // Fetch stats for each video
      const videosWithStats = await Promise.all(
        videos.map(async (video) => {
          const upvoteCount = await storage.getUpvoteCount(video.id);
          const comments = await storage.getCommentsByVideo(video.id);
          
          return {
            ...video,
            upvoteCount,
            commentCount: comments.length,
          };
        })
      );
      
      res.json(videosWithStats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user videos" });
    }
  });

  // ========== UPVOTE ROUTES ==========
  
  // Toggle upvote
  app.post("/api/videos/:videoId/upvote", isAuthenticated, async (req: any, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(403).json({ error: "Please create your profile first", needsProfile: true });
      }
      
      const hasUpvoted = await storage.hasUserUpvoted(userId, videoId);
      
      if (hasUpvoted) {
        await storage.deleteUpvote(userId, videoId);
        const count = await storage.getUpvoteCount(videoId);
        return res.json({ upvoted: false, count });
      }
      
      await storage.createUpvote({ userId, videoId });
      const count = await storage.getUpvoteCount(videoId);
      res.json({ upvoted: true, count });
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle upvote" });
    }
  });

  // Check if user has upvoted
  app.get("/api/videos/:videoId/upvote/status", async (req: any, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = await getAuthenticatedUserId(req);
      
      const count = await storage.getUpvoteCount(videoId);
      // If not logged in, return upvoted: false
      if (!userId) {
        return res.json({ upvoted: false, count });
      }
      
      const hasUpvoted = await storage.hasUserUpvoted(userId, videoId);
      res.json({ upvoted: hasUpvoted, count });
    } catch (error) {
      res.status(500).json({ error: "Failed to check upvote status" });
    }
  });

  // ========== COMMENT ROUTES ==========
  
  // Get comments for video
  app.get("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const comments = await storage.getCommentsByVideo(videoId);
      res.json(comments);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  // Create comment
  app.post("/api/videos/:videoId/comments", isAuthenticated, async (req: any, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.status(403).json({ error: "Please create your profile first", needsProfile: true });
      }
      
      const data = insertCommentSchema.parse({
        ...req.body,
        userId,
        videoId,
      });
      
      const comment = await storage.createComment(data);
      res.json(comment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  // ========== LEADERBOARD ROUTES ==========
  
  // Get top videos
  app.get("/api/leaderboard/videos", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topVideos = await storage.getTopVideos(limit);
      res.json(topVideos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top videos" });
    }
  });

  // Get top creators
  app.get("/api/leaderboard/creators", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topCreators = await storage.getTopCreators(limit);
      res.json(topCreators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch top creators" });
    }
  });

  // ========== YOUTUBE CONFIG ROUTES ==========
  
  // Check YouTube configuration status
  app.get("/api/youtube/status", async (req, res) => {
    res.json({ 
      configured: isYouTubeConfigured(),
      message: isYouTubeConfigured() 
        ? "YouTube API is configured. Videos will be uploaded to YouTube."
        : "YouTube API not configured. Videos will be stored locally only."
    });
  });

  // Get videos from YouTube channel (works in both dev and production)
  app.get("/api/youtube/channel-videos", async (req, res) => {
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const maxResults = parseInt(req.query.maxResults as string) || 50;
      const videos = await youtubeUploader.getChannelVideos(maxResults);
      // Filter to only return public videos (exclude private and unlisted)
      const publicVideos = videos.filter((v: any) => v.privacyStatus === 'public');
      res.json(publicVideos);
    } catch (error: any) {
      console.error('Error fetching channel videos:', error);
      res.status(500).json({ error: "Failed to fetch channel videos" });
    }
  });

  // Generate YouTube authorization URL
  app.get("/api/youtube/auth-url", async (req, res) => {
    try {
      const authUrl = youtubeUploader.generateAuthUrl();
      const redirectUri = youtubeUploader.getRedirectUri();
      res.json({ authUrl, redirectUri });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to generate auth URL" });
    }
  });

  // OAuth callback - redirects to setup page with code
  app.get("/api/youtube/callback", async (req, res) => {
    const code = req.query.code as string;
    const error = req.query.error as string;
    
    if (error) {
      return res.redirect(`/admin/youtube-setup?error=${encodeURIComponent(error)}`);
    }
    
    if (code) {
      return res.redirect(`/admin/youtube-setup?code=${encodeURIComponent(code)}`);
    }
    
    res.redirect('/admin/youtube-setup?error=No authorization code received');
  });

  // Exchange authorization code for refresh token
  app.post("/api/youtube/exchange-code", async (req, res) => {
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: "Authorization code is required" });
      }
      const result = await youtubeUploader.exchangeCodeForTokens(code);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to exchange code" });
    }
  });

  // ========== NOTIFICATION ROUTES ==========
  
  // Get notifications for current user
  app.get("/api/notifications", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.json([]); // Return empty array if not logged in
      }
      const notifs = await storage.getNotificationsByUser(userId);
      
      // Format timestamps for display
      const formatted = notifs.map(n => ({
        ...n,
        timestamp: formatTimeAgo(n.createdAt),
      }));
      
      res.json(formatted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch notifications" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/read", async (req: any, res) => {
    try {
      const userId = await getAuthenticatedUserId(req);
      if (!userId) {
        return res.json({ success: true }); // No-op if not logged in
      }
      await storage.markNotificationsRead(userId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark notifications as read" });
    }
  });

  // ========== SUBSCRIPTION ROUTES ==========
  
  // Subscribe to a creator
  app.post("/api/subscribe/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const subscriberId = await getAuthenticatedUserId(req);
      if (!subscriberId) {
        return res.status(403).json({ error: "Please create your profile first", needsProfile: true });
      }
      const creatorId = parseInt(req.params.creatorId);
      
      if (subscriberId === creatorId) {
        return res.status(400).json({ error: "Cannot subscribe to yourself" });
      }
      
      const alreadySubscribed = await storage.hasSubscribed(subscriberId, creatorId);
      if (alreadySubscribed) {
        return res.status(400).json({ error: "Already subscribed" });
      }
      
      await storage.createSubscription(subscriberId, creatorId);
      
      // Create notification for the creator
      const subscriber = await storage.getUser(subscriberId);
      await storage.createNotification({
        userId: creatorId,
        type: "new_subscriber",
        message: `🎉 @${subscriber?.username || 'Someone'} just subscribed to your channel!`,
      });
      
      res.json({ subscribed: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to subscribe" });
    }
  });

  // Unsubscribe from a creator
  app.post("/api/unsubscribe/:creatorId", isAuthenticated, async (req: any, res) => {
    try {
      const subscriberId = await getAuthenticatedUserId(req);
      if (!subscriberId) {
        return res.status(403).json({ error: "Please create your profile first", needsProfile: true });
      }
      const creatorId = parseInt(req.params.creatorId);
      
      await storage.deleteSubscription(subscriberId, creatorId);
      res.json({ subscribed: false });
    } catch (error) {
      res.status(500).json({ error: "Failed to unsubscribe" });
    }
  });

  // Check subscription status
  app.get("/api/subscription/:creatorId/status", async (req: any, res) => {
    try {
      const subscriberId = await getAuthenticatedUserId(req);
      if (!subscriberId) {
        return res.json({ subscribed: false }); // Not logged in = not subscribed
      }
      const creatorId = parseInt(req.params.creatorId);
      
      const isSubscribed = await storage.hasSubscribed(subscriberId, creatorId);
      res.json({ subscribed: isSubscribed });
    } catch (error) {
      res.status(500).json({ error: "Failed to check subscription status" });
    }
  });

  // ========== CREATOR MANAGEMENT ROUTES ==========
  
  // Get all creators
  app.get("/api/creators", async (req, res) => {
    try {
      const creators = await storage.getAllCreators();
      res.json(creators);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch creators" });
    }
  });

  // Create a new creator profile
  app.post("/api/creators", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const creator = await storage.createUser(data);
      res.json(creator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      if ((error as any)?.code === '23505') {
        return res.status(409).json({ error: "Username already taken" });
      }
      res.status(500).json({ error: "Failed to create creator" });
    }
  });

  // Update a creator profile
  app.patch("/api/creators/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = insertUserSchema.partial().parse(req.body);
      const creator = await storage.updateUser(id, updates);
      res.json(creator);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
      }
      res.status(500).json({ error: "Failed to update creator" });
    }
  });

  // ========== YOUTUBE VIDEO ASSIGNMENT ROUTES ==========
  
  // Get all YouTube video to creator mappings
  app.get("/api/youtube-video-creators", async (req, res) => {
    // Prevent caching to ensure fresh data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    
    try {
      const mappings = await storage.getAllYoutubeVideoCreators();
      res.json(mappings);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch mappings" });
    }
  });

  // Assign a YouTube video to a creator
  app.post("/api/youtube-video-creators", async (req, res) => {
    try {
      const { youtubeId, creatorId } = req.body;
      if (!youtubeId || typeof youtubeId !== 'string') {
        return res.status(400).json({ error: "youtubeId is required and must be a string" });
      }
      if (!creatorId || typeof creatorId !== 'number') {
        return res.status(400).json({ error: "creatorId is required and must be a number" });
      }
      
      // Verify the creator exists
      const creator = await storage.getUser(creatorId);
      if (!creator) {
        return res.status(404).json({ error: "Creator not found" });
      }
      
      const mapping = await storage.assignYoutubeVideoToCreator(youtubeId, creatorId);
      res.json(mapping);
    } catch (error) {
      res.status(500).json({ error: "Failed to assign video to creator" });
    }
  });

  // Remove a YouTube video to creator mapping
  app.delete("/api/youtube-video-creators/:youtubeId", async (req, res) => {
    try {
      const { youtubeId } = req.params;
      await storage.removeYoutubeVideoCreator(youtubeId);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove mapping" });
    }
  });

  return httpServer;
}

// Helper function to format time ago
function formatTimeAgo(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateObj.toLocaleDateString();
}
