import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { youtubeUploader } from './youtubeUploader';

const execAsync = promisify(exec);

const INTRO_PATH = path.join(process.cwd(), 'server', 'assets', 'intro.mp4');
const RAW_DIR = path.join(process.cwd(), 'uploads', 'raw');
const PROCESSED_DIR = path.join(process.cwd(), 'uploads', 'processed');

export async function ensureDirectories() {
  await fs.mkdir(RAW_DIR, { recursive: true });
  await fs.mkdir(PROCESSED_DIR, { recursive: true });
}

export async function processVideo(
  rawFilePath: string,
  videoId: number
): Promise<{ processedPath: string; thumbnail: string }> {
  await ensureDirectories();
  
  const outputFilename = `processed_${videoId}_${Date.now()}.mp4`;
  const processedPath = path.join(PROCESSED_DIR, outputFilename);
  const thumbnailPath = path.join(PROCESSED_DIR, `thumb_${videoId}.jpg`);
  
  const tempListPath = path.join(PROCESSED_DIR, `concat_${videoId}.txt`);
  const tempResizedIntro = path.join(PROCESSED_DIR, `intro_resized_${videoId}.mp4`);
  const tempResizedMain = path.join(PROCESSED_DIR, `main_resized_${videoId}.mp4`);

  try {
    const probeResult = await execAsync(
      `ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0 "${rawFilePath}"`
    );
    const [width, height] = probeResult.stdout.trim().split(',').map(Number);
    const isVertical = height > width;
    
    const targetWidth = isVertical ? 1080 : 1920;
    const targetHeight = isVertical ? 1920 : 1080;

    await execAsync(
      `ffmpeg -y -i "${INTRO_PATH}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 "${tempResizedIntro}"`
    );

    await execAsync(
      `ffmpeg -y -i "${rawFilePath}" -vf "scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2,setsar=1" -c:v libx264 -preset fast -crf 23 -c:a aac -ar 44100 "${tempResizedMain}"`
    );

    const concatList = `file '${tempResizedIntro}'\nfile '${tempResizedMain}'\nfile '${tempResizedIntro}'`;
    await fs.writeFile(tempListPath, concatList);

    await execAsync(
      `ffmpeg -y -f concat -safe 0 -i "${tempListPath}" -c copy "${processedPath}"`
    );

    await execAsync(
      `ffmpeg -y -i "${processedPath}" -ss 00:00:04 -vframes 1 -q:v 2 "${thumbnailPath}"`
    );

    await Promise.all([
      fs.unlink(tempListPath).catch(() => {}),
      fs.unlink(tempResizedIntro).catch(() => {}),
      fs.unlink(tempResizedMain).catch(() => {}),
    ]);

    return {
      processedPath,
      thumbnail: thumbnailPath,
    };
  } catch (error) {
    await Promise.all([
      fs.unlink(tempListPath).catch(() => {}),
      fs.unlink(tempResizedIntro).catch(() => {}),
      fs.unlink(tempResizedMain).catch(() => {}),
    ]);
    throw error;
  }
}

export async function cleanupFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (error) {
  }
}

export async function processAndUploadToYouTube(
  rawFilePath: string,
  videoId: number,
  title: string,
  description: string
): Promise<{ youtubeId: string; thumbnail: string; processedPath: string }> {
  // First process the video (add branding)
  const { processedPath, thumbnail } = await processVideo(rawFilePath, videoId);

  // If YouTube is configured, upload to YouTube
  if (youtubeUploader.isReady()) {
    console.log(`Uploading video ${videoId} to YouTube...`);
    
    const result = await youtubeUploader.uploadVideo({
      filePath: processedPath,
      title,
      description,
      privacyStatus: 'private', // Upload as private, to be approved later
      thumbnailPath: thumbnail, // Custom thumbnail generated from video
      onProgress: (progress) => {
        console.log(`YouTube upload progress for video ${videoId}: ${progress}%`);
      }
    });

    return {
      youtubeId: result.youtubeId,
      thumbnail: result.thumbnail,
      processedPath
    };
  }

  // YouTube not configured, return local processed video
  return {
    youtubeId: '',
    thumbnail,
    processedPath
  };
}

export function isYouTubeConfigured(): boolean {
  return youtubeUploader.isReady();
}
