"use client";
import * as core from '@diffusionstudio/core';
import { VideoPoint, VideoSection, VideoData } from '@/lib/types/video';

/**
 * DiffusionStudioService - Handles video composition and rendering using Diffusion Studio
 */
export class DiffusionStudioService {
  private composition: any; // core.Composition
  private player: HTMLDivElement | null = null;
  private container: HTMLDivElement | null = null;

  /**
   * Initialize the Diffusion Studio service
   */
  constructor() {
    // Create a composition with standard HD dimensions
    // Note: fps is not in the type definition but is supported according to documentation
    this.composition = new core.Composition({
      width: 1920,
      height: 1080
      // fps: 30 - removed due to TypeScript error
    });
  }

  /**
   * Attach the composition to a player element for visualization
   * @param containerElement - The container element to attach the player to
   */
  public attachPlayer(containerElement: HTMLDivElement): void {
    try {
      console.log('Creating player in container element');
      this.container = containerElement;
      
      // Make sure the container element is properly sized and visible
      if (!this.container) {
        throw new Error('Container element is null');
      }
      
      // Style the container
      this.container.style.position = 'relative';
      this.container.style.width = '100%';
      this.container.style.height = '100%';
      this.container.style.display = 'flex';
      this.container.style.justifyContent = 'center';
      this.container.style.alignItems = 'center';
      this.container.style.overflow = 'hidden';
      this.container.style.backgroundColor = '#000';
      
      // Create a new player element
      this.player = document.createElement('div');
      this.player.id = 'diffusion-studio-player';
      this.player.style.position = 'absolute';
      
      // Add the player to the container
      this.container.innerHTML = '';
      this.container.appendChild(this.player);
      
      // According to documentation, we need to use mount() instead of attachPlayer
      this.composition.mount(this.player);
      
      // Set proper scaling for the player
      const containerWidth = this.container.clientWidth;
      const containerHeight = this.container.clientHeight;
      
      // Calculate scale to fit the composition in the container while maintaining aspect ratio
      const scale = Math.min(
        containerWidth / this.composition.width,
        containerHeight / this.composition.height
      );
      
      // Apply styles to the player element
      this.player.style.width = `${this.composition.width}px`;
      this.player.style.height = `${this.composition.height}px`;
      this.player.style.transform = `scale(${scale})`;
      this.player.style.transformOrigin = 'top left';
      
      console.log(`Player successfully created and mounted with scale: ${scale}`);
    } catch (error) {
      console.error('Error creating and mounting player:', error);
      throw new Error(`Failed to create and mount player: ${error}`);
    }
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
   * Check if a URL is a supported audio format
   * @param url - The URL to check
   * @returns True if the URL points to a supported audio format
   */
  private isSupportedAudioFormat(url: string): boolean {
    // Diffusion Studio typically supports MP3, WAV, and M4A
    const supportedFormats = ['.mp3', '.wav', '.m4a'];
    return supportedFormats.some(format => url.toLowerCase().endsWith(format));
  }

  /**
   * Process a single video section
   * @param section - The video section to process
   */
  private async processSection(section: VideoSection): Promise<void> {
    // Add audio track for the section
    if (section.audioUrl) {
      try {
        // Check if the audio format is supported
        if (!this.isSupportedAudioFormat(section.audioUrl)) {
          console.warn(`Unsupported audio format: ${section.audioUrl}`);
          console.log('Continuing without audio due to unsupported format');
          return;
        }
        
        // Use a proxied URL for the audio to avoid CORS issues
        const proxiedAudioUrl = this.createProxyUrl(section.audioUrl, 'audio');
        console.log(`Using proxied audio URL: ${proxiedAudioUrl}`);
        
        // According to documentation, we need to create an audio source first
        console.log('Creating audio source from URL');
        const audioSource = await core.Source.from<core.AudioSource>(proxiedAudioUrl);
        console.log('Audio source created successfully');
        
        // Then create an audio clip from the source
        const audioClip = new core.AudioClip(audioSource);
        console.log('Audio clip created, adding to composition');
        
        // Add to composition
        await this.composition.add(audioClip);
        console.log('Audio clip added to composition successfully');
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
    try {
      console.log('Starting video rendering process...');
      
      // Create an encoder with the composition and specific settings
      const encoder = new core.Encoder(this.composition, {
        video: {
          enabled: true,
          codec: 'avc', // H.264 codec
          bitrate: 10e6, // 10 Mbps
          fps: 30, // 30 frames per second as requested
          resolution: 1, // 1x resolution (same as composition)
        },
        audio: {
          enabled: true,
          sampleRate: 48000,
          numberOfChannels: 2,
          bitrate: 128e3, // 128 kbps
          codec: 'aac',
        },
      });
      
      console.log('Encoder created with 30fps settings');
      
      // Check if the browser supports the File System Access API
      if ('showSaveFilePicker' in window) {
        try {
          console.log('Using File System Access API for saving...');
          // Use the File System Access API for better performance
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename || 'video.mp4',
            types: [
              {
                description: 'Video File',
                accept: { 'video/mp4': ['.mp4'] },
              },
            ],
          });
          
          console.log('File handle acquired, rendering video...');
          await encoder.render(fileHandle);
          return 'Video saved successfully using File System Access API';
        } catch (fsError) {
          console.warn('File System Access API failed, falling back to download:', fsError);
          // Fall back to download if user cancels or there's an error
        }
      }
      
      // Fallback: download the file
      console.log('Using fallback download method...');
      await encoder.render(filename);
      console.log('Video rendering complete');
      return `Video downloaded as ${filename}`;
    } catch (error) {
      console.error('Error rendering video:', error);
      throw new Error(`Failed to render video: ${error instanceof Error ? error.message : String(error)}`);
    }
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
    try {
      if (!this.player) {
        console.warn('No player attached. Call attachPlayer() first.');
        return;
      }
      
      console.log('Starting playback');
      // According to documentation, play() returns a Promise
      this.composition.play().catch((error: Error) => {
        console.error('Error during playback:', error);
      });
    } catch (error) {
      console.error('Error starting playback:', error);
    }
  }

  /**
   * Pause the composition in the attached player
   */
  public pause(): void {
    try {
      if (!this.player) {
        console.warn('No player attached. Call attachPlayer() first.');
        return;
      }
      
      console.log('Pausing playback');
      // According to documentation, pause() returns a Promise
      this.composition.pause().catch((error: Error) => {
        console.error('Error pausing playback:', error);
      });
    } catch (error) {
      console.error('Error pausing playback:', error);
    }
  }

  /**
   * Seek to a specific time in the composition
   * @param time - The time to seek to in milliseconds
   */
  public seekTo(time: number): void {
    try {
      if (!this.player) {
        console.warn('No player attached. Call attachPlayer() first.');
        return;
      }
      
      console.log(`Seeking to time: ${time}ms (${time/1000}s)`);
      // According to documentation, seek() returns a Promise
      this.composition.seek(time / 1000).catch((error: Error) => { // Convert to seconds
        console.error('Error seeking:', error);
      });
    } catch (error) {
      console.error('Error seeking:', error);
    }
  }
}
