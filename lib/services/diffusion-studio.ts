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
  private frameRate: number = 30; // Default frame rate
  
  /**
   * Convert milliseconds to frames based on the frame rate
   * @param ms - Time in milliseconds
   * @returns Equivalent number of frames
   */
  private msToFrames(ms: number): number {
    return Math.round((ms / 1000) * this.frameRate);
  }
  
  /**
   * Convert frames to milliseconds based on the frame rate
   * @param frames - Number of frames
   * @returns Equivalent time in milliseconds
   */
  private framesToMs(frames: number): number {
    return Math.round((frames / this.frameRate) * 1000);
  }

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
    
    // Calculate the total duration of the video
    let totalDuration = 0;
    for (const section of videoData.data) {
      if (section.points && section.points.length > 0) {
        const lastPoint = section.points[section.points.length - 1];
        totalDuration = Math.max(totalDuration, lastPoint.endTime);
      }
    }
    
    console.log(`Total video duration: ${totalDuration}ms (${totalDuration / 1000}s)`);
    
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
    console.log('Checking audio format for URL:', url);
    
    // Extract the base filename without query parameters
    try {
      // First check if the content-type parameter indicates audio
      if (url.includes('response-content-type=audio') || 
          url.includes('content-type=audio')) {
        console.log('URL contains audio content-type parameter, treating as supported audio');
        return true;
      }
      
      // Parse the URL to get the pathname
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      console.log('Extracted pathname:', pathname);
      
      // Check for audio extensions in the pathname
      const supportedFormats = ['.mp3', '.wav', '.m4a', '.ogg', '.aac'];
      const hasAudioExtension = supportedFormats.some(format => pathname.toLowerCase().endsWith(format));
      
      if (hasAudioExtension) {
        console.log('URL pathname has supported audio extension');
        return true;
      }
      
      // If we can't determine from the pathname, check the full URL for audio indicators
      if (url.includes('.mp3') || url.includes('.wav') || url.includes('.m4a') || 
          url.includes('.ogg') || url.includes('.aac')) {
        console.log('URL contains audio extension in query parameters or elsewhere');
        return true;
      }
      
      // // As a last resort, check for common audio-related terms in the URL
      // if (url.includes('audio') || url.includes('sound') || url.includes('voice') || 
      //     url.includes('speech') || url.includes('tts')) {
      //   console.log('URL contains audio-related terms, treating as supported audio');
      //   return true;
      // }
      
      console.log('No audio format indicators found in URL');
      return false;
    } catch (error) {
      console.error('Error parsing URL:', error);
      // If we can't parse the URL, check if it contains audio extensions anywhere
      const containsAudioExtension = url.includes('.mp3') || url.includes('.wav') || 
                                    url.includes('.m4a') || url.includes('.ogg') || 
                                    url.includes('.aac');
      console.log('Fallback check for audio extensions:', containsAudioExtension);
      return containsAudioExtension;
    }
  }

  /**
   * Process a single video section
   * @param section - The video section to process
   */
  private async processSection(section: VideoSection): Promise<void> {
    console.log(`Processing section: ${section.sectionId}`);
    
    // Find the section's start and end times from the first and last points
    let sectionStartTime = 0;
    let sectionEndTime = 0;
    
    if (section.points && section.points.length > 0) {
      sectionStartTime = section.points[0].startTime;
      sectionEndTime = section.points[section.points.length - 1].endTime;
      console.log(`Section time range: ${sectionStartTime}ms to ${sectionEndTime}ms (${(sectionEndTime - sectionStartTime) / 1000}s)`);
    }
    
    // Add audio track for the section at the correct position in the timeline
    if (section.audioUrl) {
      try {
        // Check if the audio format is supported
        if (!this.isSupportedAudioFormat(section.audioUrl)) {
          console.warn(`Unsupported audio format: ${section.audioUrl}`);
          console.log('Continuing without audio due to unsupported format');
        } else {
          // Use a proxied URL for the audio to avoid CORS issues
          const proxiedAudioUrl = this.createProxyUrl(section.audioUrl, 'audio');
          console.log(`Using proxied audio URL: ${proxiedAudioUrl}`);
          
          // Create an audio source
          console.log('Creating audio source from URL');
          const audioSource = await core.Source.from<core.AudioSource>(proxiedAudioUrl);
          console.log('Audio source created successfully');
          
          // Create an audio clip from the source
          const audioClip = new core.AudioClip(audioSource);
          console.log('Audio clip created');
          
          // Position the audio clip at the correct start time in the timeline
          // Convert milliseconds to frames (assuming 30fps)
          const startFrames = this.msToFrames(sectionStartTime);
          console.log(`Positioning audio at ${sectionStartTime}ms (frame ${startFrames})`);
          
          // Set the position of the audio clip in the timeline
          audioClip.offset(startFrames);
          
          // Add to composition
          await this.composition.add(audioClip);
          console.log('Audio clip added to composition successfully');
        }
      } catch (error) {
        console.error(`Error adding audio clip: ${error}`);
        console.log('Continuing without audio due to error');
      }
    }

    // Process all video points in the section
    if (section.points && section.points.length > 0) {
      console.log(`Processing ${section.points.length} video points`);
      for (const point of section.points) {
        await this.addVideoPoint(point);
      }
    }
  }

  /**
   * Add a video point to the composition
   * @param point - The video point to add
   */
  private async addVideoPoint(point: VideoPoint): Promise<void> {
    try {
      console.log(`Adding video point: ${point.videoId} (${point.startTime}ms to ${point.endTime}ms)`);
      
      // Calculate duration in milliseconds and frames
      const durationMs = point.endTime - point.startTime;
      const durationFrames = this.msToFrames(durationMs);
      const startFrame = this.msToFrames(point.startTime);
      
      console.log(`Video duration: ${durationMs}ms (${durationFrames} frames), starting at frame ${startFrame}`);
      
      // Check if the video format is supported
      if (!this.isSupportedVideoFormat(point.videoUrl)) {
        console.warn(`Unsupported video format: ${point.videoUrl}`);
        console.log('Using placeholder for unsupported video format');
        this.addPlaceholder(point);
        return;
      }

      // Use a proxied URL for the video to avoid CORS issues
      const originalUrl = point.videoUrl;
      const videoUrl = this.createProxyUrl(originalUrl, 'video');
      console.log(`Using proxied video URL: ${videoUrl}`);
      
      // Create a video source from the URL
      console.log(`Creating video source from URL: ${videoUrl}`);
      const videoSource = await core.Source.from<core.VideoSource>(videoUrl);
      console.log('Video source created successfully');
      
      // Create a video clip from the source
      const videoClip = new core.VideoClip(videoSource, {
        position: 'center', // Center the video in the composition
        width: '100%',      // Use the full width of the composition
        height: '100%',     // Use the full height of the composition
        muted: true,        // Mute the video since we'll use the audio track from the section
      });
      
      // Position the clip at the exact frame in the timeline
      console.log(`Positioning video at frame ${startFrame} (${point.startTime}ms)`);
      videoClip.offset(startFrame);
      
      // Trim the clip to the exact duration needed
      console.log(`Trimming video to ${durationFrames} frames (${durationMs}ms)`);
      videoClip.subclip(0, durationFrames);
      
      // Add to composition
      await this.composition.add(videoClip);
      console.log(`Video point ${point.videoId} added successfully`);
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
    console.log(`Adding placeholder for video point: ${point.videoId}`);
    
    // Calculate frames from milliseconds
    const startFrame = this.msToFrames(point.startTime);
    const endFrame = this.msToFrames(point.endTime);
    
    // Create a placeholder with the thumbnail image, but proxy it to avoid CORS issues
    const proxiedThumbnailUrl = this.createProxyUrl(point.videoThumbnail, 'image');
    console.log(`Using proxied thumbnail URL: ${proxiedThumbnailUrl}`);
    
    const imageClip = new core.ImageClip(proxiedThumbnailUrl, {
      position: 'center',
      width: '100%',
      height: '100%',
    });
    
    // Position the image at the correct frame in the timeline
    console.log(`Positioning placeholder at frame ${startFrame} (${point.startTime}ms)`);
    imageClip.offset(startFrame);
    
    // Set the duration of the placeholder
    const durationFrames = endFrame - startFrame;
    console.log(`Setting placeholder duration to ${durationFrames} frames (${point.endTime - point.startTime}ms)`);
    // Use trim instead of subclip for ImageClip as it doesn't have subclip method
    imageClip.trim(0, durationFrames);
    
    // Add to composition
    this.composition.add(imageClip);
    console.log('Placeholder added successfully');
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
