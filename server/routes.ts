import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { processAndUploadToYouTube, ensureDirectories, isYouTubeConfigured } from "./videoProcessor";
import { youtubeUploader } from "./youtubeUploader";

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

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // ========== USER ROUTES ==========
  
  // Get current user (mock session for now - ID 1)
  app.get("/api/user/me", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // Create or update user profile
  app.post("/api/user/profile", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      
      // For now, always update user ID 1 (mock session)
      // In a real app, you'd get the user ID from the session
      const existingUser = await storage.getUser(1);
      
      if (existingUser) {
        // Update existing user
        const updated = await storage.updateUser(existingUser.id, data);
        return res.json(updated);
      }
      
      // Create new user
      const newUser = await storage.createUser(data);
      res.json(newUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors });
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
  
  // Get all videos with stats
  app.get("/api/videos", async (req, res) => {
    try {
      const allVideos = await storage.getAllVideos();
      
      // Fetch stats for each video
      const videosWithStats = await Promise.all(
        allVideos.map(async (video) => {
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
            } : { username: "Unknown" },
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
  app.post("/api/videos/upload", upload.single('video'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No video file provided" });
      }

      const userId = 1; // Mock user ID
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
  app.post("/api/videos/:videoId/upvote", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = 1; // Mock user ID for now
      
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
  app.get("/api/videos/:videoId/upvote/status", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = 1; // Mock user ID
      
      const hasUpvoted = await storage.hasUserUpvoted(userId, videoId);
      const count = await storage.getUpvoteCount(videoId);
      
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
  app.post("/api/videos/:videoId/comments", async (req, res) => {
    try {
      const videoId = parseInt(req.params.videoId);
      const userId = 1; // Mock user ID
      
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

  // Generate YouTube authorization URL
  app.get("/api/youtube/auth-url", async (req, res) => {
    try {
      const authUrl = youtubeUploader.generateAuthUrl();
      res.json({ authUrl });
    } catch (error: any) {
      res.status(400).json({ error: error.message || "Failed to generate auth URL" });
    }
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

  return httpServer;
}
