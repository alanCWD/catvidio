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

  constructor() {
    this.initialize();
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
    return this.isConfigured;
  }

  async uploadVideo(options: UploadOptions): Promise<UploadResult> {
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
}

export const youtubeUploader = new YouTubeUploader();
