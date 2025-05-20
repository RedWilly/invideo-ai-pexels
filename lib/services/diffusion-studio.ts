"use client";
import * as core from '@diffusionstudio/core';
import { VideoPoint, VideoSection, VideoData } from '@/lib/types/video';

/**
 * DiffusionStudioService - Handles video composition and rendering using Diffusion Studio
 */
export class DiffusionStudioService {
  private composition: any; // core.Composition
  private player: HTMLDivElement | null = null;

  /**
   * Initialize the Diffusion Studio service
   */
  constructor() {
    this.composition = new core.Composition({
      width: 1920,
      height: 1080
    });
  }

  /**
   * Attach the composition to a player element for visualization
   * @param playerElement - The HTML element to attach the player to
   */
  public attachPlayer(playerElement: HTMLDivElement): void {
    this.player = playerElement;
    this.composition.attachPlayer(this.player);
  }

  /**
   * Process video data and create a composition
   * @param videoData - The video data from the API
   * @returns Promise that resolves when the composition is ready
   */
  public async processVideoData(videoData: VideoData): Promise<void> {
    if (!videoData.success || !videoData.data || videoData.data.length === 0) {
      throw new Error('Invalid video data');
    }

    console.log('Processing video data with sections:', videoData.data.length);
    
    // Process all sections in sequence to create one continuous video
    for (const section of videoData.data) {
      await this.processSection(section);
    }
  }

  /**
   * Create a proxy URL for external resources to avoid CORS issues
   * @param url - The original URL
   * @param type - The type of media (audio, video, image)
   * @returns A proxied URL that can be used without CORS issues
   */
  private createProxyUrl(url: string, type: 'audio' | 'video' | 'image' = 'video'): string {
    // Check if this is an external URL that might have CORS issues
    if (url.startsWith('http') && !url.includes('localhost')) {
      // For development, we'll use a local proxy
      // In production, you might want to use a service like cors-anywhere or set up your own proxy
      return `/api/proxy?url=${encodeURIComponent(url)}&type=${type}`;
    }
    return url;
  }

  /**
   * Process a single video section
   * @param section - The video section to process
   */
  private async processSection(section: VideoSection): Promise<void> {
    // Add audio track for the section
    if (section.audioUrl) {
      try {
        // Use a proxied URL for the audio to avoid CORS issues
        const proxiedAudioUrl = this.createProxyUrl(section.audioUrl, 'audio');
        console.log(`Using proxied audio URL: ${proxiedAudioUrl}`);
        const audioClip = new core.AudioClip(proxiedAudioUrl);
        await this.composition.add(audioClip);
      } catch (error) {
        console.error(`Error adding audio clip: ${error}`);
        // Continue without audio if there's an error
        console.log('Continuing without audio due to error');
      }
    }

    // Process each video point in the section
    for (const point of section.points) {
      await this.addVideoPoint(point);
    }
  }

  /**
   * Add a video point to the composition
   * @param point - The video point to add
   */
  private async addVideoPoint(point: VideoPoint): Promise<void> {
    // Calculate duration in frames
    const durationInFrames = point.endTime - point.startTime;
    
    // Use the actual video URL from the point data, but proxy it to avoid CORS issues
    const originalUrl = point.videoUrl;
    const videoUrl = this.createProxyUrl(originalUrl, 'video');
    
    console.log(`Adding video clip: ${point.text} (${point.startTime}-${point.endTime})`);
    console.log(`Using proxied video URL: ${videoUrl}`);
    
    try {
      // Check if the URL is a video format that Diffusion Studio supports
      if (!this.isSupportedVideoFormat(originalUrl)) {
        console.warn(`Unsupported video format: ${originalUrl}`);
        // Fall back to placeholder immediately for unsupported formats
        this.addPlaceholder(point);
        return;
      }
      
      // Create video clip
      const videoClip = new core.VideoClip(videoUrl, {
        position: 'center',
        width: '100%',
        height: '100%',
      });
      
      // Set timing using offset and subclip methods
      // The offset places the clip at the correct position in the timeline
      // The subclip trims the clip to the desired duration
      videoClip.offset(point.startTime);
      videoClip.subclip(0, durationInFrames);
      
      // Add to composition
      await this.composition.add(videoClip);
    } catch (error) {
      console.error(`Error adding video clip for point ${point.videoId}:`, error);
      // Fallback to a placeholder if video can't be loaded
      this.addPlaceholder(point);
    }
  }

  /**
   * Add a placeholder for a failed video
   * @param point - The video point to create a placeholder for
   */
  /**
   * Check if a URL points to a supported video format
   * @param url - The URL to check
   * @returns True if the URL points to a supported video format
   */
  private isSupportedVideoFormat(url: string): boolean {
    // Diffusion Studio typically supports MP4 and WebM
    const supportedFormats = ['.mp4', '.webm'];
    return supportedFormats.some(format => url.toLowerCase().endsWith(format));
  }

  private addPlaceholder(point: VideoPoint): void {
    // Create a placeholder with the thumbnail image, but proxy it to avoid CORS issues
    const proxiedThumbnailUrl = this.createProxyUrl(point.videoThumbnail, 'image');
    console.log(`Using proxied thumbnail URL: ${proxiedThumbnailUrl}`);
    const imageClip = new core.ImageClip(proxiedThumbnailUrl, {
      position: 'center',
      width: '100%',
      height: '100%',
    });
    
    // Set timing using trim method
    const startFrame = point.startTime;
    const endFrame = point.endTime;
    imageClip.trim(startFrame, endFrame);
    
    // Add to composition
    this.composition.add(imageClip);
  }

  /**
   * Render the composition to a video file
   * @param filename - The name of the output file
   * @returns Promise that resolves with the URL of the rendered video
   */
  public async renderToFile(filename: string): Promise<string> {
    const encoder = new core.Encoder(this.composition);
    await encoder.render(filename);
    return filename; // In a real implementation, return a URL to the rendered file
  }

  /**
   * Get the current composition
   * @returns The current composition
   */
  public getComposition(): any {
    return this.composition;
  }

  /**
   * Play the composition in the attached player
   */
  public play(): void {
    if (this.player) {
      this.composition.play();
    } else {
      console.warn('No player attached. Call attachPlayer() first.');
    }
  }

  /**
   * Pause the composition in the attached player
   */
  public pause(): void {
    if (this.player) {
      this.composition.pause();
    } else {
      console.warn('No player attached. Call attachPlayer() first.');
    }
  }

  /**
   * Seek to a specific time in the composition
   * @param time - The time to seek to in milliseconds
   */
  public seekTo(time: number): void {
    if (this.player) {
      this.composition.seekTo(time / 1000); // Convert to seconds
    } else {
      console.warn('No player attached. Call attachPlayer() first.');
    }
  }
}
