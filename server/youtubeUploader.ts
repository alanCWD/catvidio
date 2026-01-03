import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';

const OAuth2 = google.auth.OAuth2;

const SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/youtube'
];

function getRedirectUri(): string {
  const devDomain = process.env.REPLIT_DEV_DOMAIN;
  if (devDomain) {
    return `https://${devDomain}/api/youtube/callback`;
  }
  return 'http://localhost:5000/api/youtube/callback';
}

interface YouTubeCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

interface UploadOptions {
  filePath: string;
  title: string;
  description: string;
  tags?: string[];
  categoryId?: string;
  privacyStatus?: 'private' | 'unlisted' | 'public';
  thumbnailPath?: string;
  onProgress?: (progress: number) => void;
}

interface UploadResult {
  youtubeId: string;
  url: string;
  thumbnail: string;
}

class YouTubeUploader {
  private oauth2Client: any;
  private youtube: any;
  private isConfigured: boolean = false;
  private initialized: boolean = false;

  constructor() {
    // Defer initialization until first use for faster startup
  }

  private ensureInitialized() {
    if (!this.initialized) {
      this.initialize();
      this.initialized = true;
    }
  }

  // Parse ISO 8601 duration (e.g., "PT1M30S" = 90 seconds)
  private parseDuration(duration: string): number {
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    return hours * 3600 + minutes * 60 + seconds;
  }

  private initialize() {
    const clientId = process.env.YOUTUBE_CLIENT_ID;
    const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
    const refreshToken = process.env.YOUTUBE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      console.log('YouTube API credentials not configured. Video upload to YouTube disabled.');
      this.isConfigured = false;
      return;
    }

    this.oauth2Client = new OAuth2(
      clientId,
      clientSecret,
      getRedirectUri()
    );

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    this.youtube = google.youtube({
      version: 'v3',
      auth: this.oauth2Client
    });

    this.isConfigured = true;
    console.log('YouTube API configured successfully');
  }

  isReady(): boolean {
    this.ensureInitialized();
    return this.isConfigured;
  }

  async uploadVideo(options: UploadOptions): Promise<UploadResult> {
    this.ensureInitialized();
    if (!this.isConfigured) {
      throw new Error('YouTube API not configured. Please set YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, and YOUTUBE_REFRESH_TOKEN environment variables.');
    }

    const {
      filePath,
      title,
      description,
      tags = ['cat', 'cats', 'catvid', 'catvid.io', 'cute cats', 'funny cats'],
      categoryId = '15', // 15 = Pets & Animals
      privacyStatus = 'private',
      thumbnailPath,
      onProgress
    } = options;

    const fileSize = fs.statSync(filePath).size;

    try {
      const res = await this.youtube.videos.insert(
        {
          part: ['snippet', 'status'],
          requestBody: {
            snippet: {
              title: title.slice(0, 100), // YouTube title limit
              description: `${description}\n\n🐱 Uploaded via catvid.io - The #1 Cat Video Platform`,
              tags,
              categoryId,
              defaultLanguage: 'en',
              defaultAudioLanguage: 'en'
            },
            status: {
              privacyStatus,
              selfDeclaredMadeForKids: false,
              embeddable: true
            }
          },
          media: {
            body: fs.createReadStream(filePath)
          }
        },
        {
          onUploadProgress: (evt: any) => {
            if (onProgress && evt.bytesRead) {
              const progress = Math.round((evt.bytesRead / fileSize) * 100);
              onProgress(progress);
            }
          }
        }
      );

      const videoId = res.data.id;
      
      // Try to set custom thumbnail if provided
      if (thumbnailPath && fs.existsSync(thumbnailPath)) {
        try {
          await this.youtube.thumbnails.set({
            videoId: videoId,
            media: {
              body: fs.createReadStream(thumbnailPath)
            }
          });
          console.log(`Custom thumbnail set for video ${videoId}`);
        } catch (thumbError: any) {
          // Thumbnail upload may fail if channel isn't verified - continue anyway
          console.log(`Could not set custom thumbnail: ${thumbError.message || 'Unknown error'}`);
        }
      }
      
      return {
        youtubeId: videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`
      };
    } catch (error: any) {
      console.error('YouTube upload error:', error);
      
      if (error.code === 403) {
        if (error.message?.includes('quota')) {
          throw new Error('YouTube API quota exceeded. Please try again tomorrow.');
        }
        throw new Error('YouTube API access denied. Please check your credentials.');
      } else if (error.code === 400) {
        throw new Error('Invalid video format or parameters.');
      } else if (error.code === 401) {
        throw new Error('YouTube authentication failed. Please refresh your credentials.');
      }
      
      throw new Error(`YouTube upload failed: ${error.message || 'Unknown error'}`);
    }
  }

  generateAuthUrl(): string {
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      throw new Error('YouTube client credentials not configured');
    }

    const redirectUri = getRedirectUri();
    const tempClient = new OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri
    );

    return tempClient.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent'
    });
  }

  getRedirectUri(): string {
    return getRedirectUri();
  }

  async exchangeCodeForTokens(code: string): Promise<{ refreshToken: string }> {
    if (!process.env.YOUTUBE_CLIENT_ID || !process.env.YOUTUBE_CLIENT_SECRET) {
      throw new Error('YouTube client credentials not configured');
    }

    const redirectUri = getRedirectUri();
    const tempClient = new OAuth2(
      process.env.YOUTUBE_CLIENT_ID,
      process.env.YOUTUBE_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await tempClient.getToken(code);
    
    if (!tokens.refresh_token) {
      throw new Error('No refresh token received. Please try authorization again.');
    }

    return {
      refreshToken: tokens.refresh_token
    };
  }

  async getChannelVideos(maxResults: number = 50): Promise<any[]> {
    this.ensureInitialized();
    if (!this.isConfigured) {
      console.log('YouTube API not configured - cannot fetch channel videos');
      return [];
    }

    try {
      // First, get the authenticated user's channel
      const channelResponse = await this.youtube.channels.list({
        part: ['contentDetails'],
        mine: true
      });

      if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
        console.log('No channel found for authenticated user');
        return [];
      }

      const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

      // Fetch videos from the uploads playlist
      const playlistResponse = await this.youtube.playlistItems.list({
        part: ['snippet', 'contentDetails', 'status'],
        playlistId: uploadsPlaylistId,
        maxResults: maxResults
      });

      if (!playlistResponse.data.items) {
        return [];
      }

      // Get video IDs to fetch additional details (view counts, etc.)
      const videoIds = playlistResponse.data.items.map((item: any) => item.contentDetails.videoId);
      
      const videosResponse = await this.youtube.videos.list({
        part: ['snippet', 'statistics', 'status', 'contentDetails'],
        id: videoIds.join(',')
      });

      const videoDetails = new Map();
      if (videosResponse.data.items) {
        videosResponse.data.items.forEach((video: any) => {
          const duration = video.contentDetails?.duration || 'PT0S';
          const durationSeconds = this.parseDuration(duration);
          
          // Detect aspect ratio from thumbnails - Shorts have vertical thumbnails (height > width)
          const thumbnails = video.snippet?.thumbnails;
          let isVertical = false;
          
          // Check maxres, high, or medium thumbnail for dimensions
          const thumb = thumbnails?.maxres || thumbnails?.high || thumbnails?.medium || thumbnails?.default;
          if (thumb && thumb.width && thumb.height) {
            isVertical = thumb.height > thumb.width;
          }
          
          // A Short is a vertical video (portrait aspect ratio)
          // Duration is not the primary factor - aspect ratio is
          const isShort = isVertical;
          
          videoDetails.set(video.id, {
            viewCount: parseInt(video.statistics?.viewCount || '0'),
            likeCount: parseInt(video.statistics?.likeCount || '0'),
            commentCount: parseInt(video.statistics?.commentCount || '0'),
            privacyStatus: video.status?.privacyStatus,
            durationSeconds,
            isShort,
            isVertical
          });
        });
      }

      return playlistResponse.data.items.map((item: any) => {
        const videoId = item.contentDetails.videoId;
        const details = videoDetails.get(videoId) || {};
        
        return {
          youtubeId: videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails?.maxres?.url || 
                    item.snippet.thumbnails?.high?.url || 
                    item.snippet.thumbnails?.medium?.url ||
                    `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
          publishedAt: item.snippet.publishedAt,
          channelTitle: item.snippet.channelTitle,
          viewCount: details.viewCount || 0,
          likeCount: details.likeCount || 0,
          commentCount: details.commentCount || 0,
          privacyStatus: details.privacyStatus || 'unknown',
          isShort: details.isShort || false,
          isVertical: details.isVertical || false,
          url: `https://www.youtube.com/watch?v=${videoId}`
        };
      });
    } catch (error: any) {
      console.error('Error fetching channel videos:', error.message);
      return [];
    }
  }
}

export const youtubeUploader = new YouTubeUploader();
