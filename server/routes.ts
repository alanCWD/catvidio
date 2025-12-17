import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVideoSchema, insertCommentSchema } from "@shared/schema";
import { z } from "zod";

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
            author: author?.username || "Unknown",
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

  // Create video
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

  return httpServer;
}
