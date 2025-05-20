"use client";

import { VideoData } from "@/lib/types/video";

/**
 * StorageService - Handles IndexedDB operations for caching media and storing video history
 */
export class StorageService {
  private dbName = 'script2video-db-v2';
  private mediaStoreName = 'media-store';
  private videoStoreName = 'video-store';
  private db: IDBDatabase | null = null;
  private dbPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the IndexedDB database
   * @returns Promise that resolves when the database is ready
   */
  private initDB(): Promise<IDBDatabase> {
    if (this.dbPromise) {
      return this.dbPromise;
    }

    this.dbPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB is not supported in this browser');
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = window.indexedDB.open(this.dbName, 1);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('IndexedDB opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create media store for caching media assets
        if (!db.objectStoreNames.contains(this.mediaStoreName)) {
          const mediaStore = db.createObjectStore(this.mediaStoreName, { keyPath: 'url' });
          mediaStore.createIndex('type', 'type', { unique: false });
          mediaStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Media store created');
        }
        
        // Create video store for storing video history
        if (!db.objectStoreNames.contains(this.videoStoreName)) {
          // Use a unique ID that includes timestamp to avoid reusing IDs
          const videoStore = db.createObjectStore(this.videoStoreName, { keyPath: 'uniqueId' });
          videoStore.createIndex('timestamp', 'timestamp', { unique: false });
          videoStore.createIndex('title', 'title', { unique: false });
          console.log('Video store created');
        }
      };
    });

    return this.dbPromise;
  }

  /**
   * Store media in IndexedDB
   * @param url - URL of the media
   * @param data - ArrayBuffer containing the media data
   * @param type - Type of media (audio, video, image)
   * @returns Promise that resolves when the media is stored
   */
  public async storeMedia(url: string, data: ArrayBuffer, type: 'audio' | 'video' | 'image'): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.mediaStoreName], 'readwrite');
      const store = transaction.objectStore(this.mediaStoreName);
      
      const mediaObject = {
        url,
        data,
        type,
        timestamp: Date.now()
      };
      
      const request = store.put(mediaObject);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          console.log(`Media stored in IndexedDB: ${url}`);
          resolve();
        };
        
        request.onerror = (event) => {
          console.error('Error storing media in IndexedDB:', event);
          reject(new Error('Failed to store media'));
        };
      });
    } catch (error) {
      console.error('Error in storeMedia:', error);
      throw error;
    }
  }

  /**
   * Get media from IndexedDB
   * @param url - URL of the media
   * @returns Promise that resolves with the media data or null if not found
   */
  public async getMedia(url: string): Promise<ArrayBuffer | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.mediaStoreName], 'readonly');
      const store = transaction.objectStore(this.mediaStoreName);
      
      const request = store.get(url);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            console.log(`Media retrieved from IndexedDB: ${url}`);
            resolve(result.data);
          } else {
            console.log(`Media not found in IndexedDB: ${url}`);
            resolve(null);
          }
        };
        
        request.onerror = (event) => {
          console.error('Error retrieving media from IndexedDB:', event);
          reject(new Error('Failed to retrieve media'));
        };
      });
    } catch (error) {
      console.error('Error in getMedia:', error);
      return null;
    }
  }

  /**
   * Store video data in IndexedDB
   * @param videoData - The video data to store
   * @param title - Title of the video
   * @returns Promise that resolves with the ID of the stored video
   */
  public async storeVideoData(videoData: VideoData, title: string): Promise<string> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.videoStoreName], 'readwrite');
      const store = transaction.objectStore(this.videoStoreName);
      
      // Extract thumbnail from the first point if available
      const thumbnail = this.extractThumbnail(videoData);
      
      // Create a unique ID that includes timestamp to prevent ID reuse
      const uniqueId = `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      const videoObject = {
        uniqueId,
        videoData,
        title,
        timestamp: Date.now(),
        thumbnail
      };
      
      return new Promise((resolve, reject) => {
        const request = store.add(videoObject);
        
        request.onsuccess = () => {
          console.log(`Video stored in IndexedDB with ID: ${uniqueId}`);
          
          // Wait for transaction to complete before resolving
          transaction.oncomplete = () => {
            console.log(`Video storage transaction completed for ID: ${uniqueId}`);
            resolve(uniqueId);
          };
        };
        
        request.onerror = (event) => {
          console.error('Error storing video in IndexedDB:', event);
          reject(new Error('Failed to store video'));
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error when storing video:', event);
          reject(new Error('Transaction failed when storing video'));
        };
      });
    } catch (error) {
      console.error('Error in storeVideoData:', error);
      throw error;
    }
  }

  /**
   * Get video data from IndexedDB
   * @param id - Unique ID of the video
   * @returns Promise that resolves with the video data or null if not found
   */
  public async getVideoData(id: string): Promise<{ uniqueId: string, videoData: VideoData, title: string, timestamp: number, thumbnail: string } | null> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.videoStoreName], 'readonly');
      const store = transaction.objectStore(this.videoStoreName);
      
      const request = store.get(id);
      
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const result = request.result;
          if (result) {
            console.log(`Video data retrieved from IndexedDB: ${id}`);
            resolve(result);
          } else {
            console.log(`Video data not found in IndexedDB: ${id}`);
            resolve(null);
          }
        };
        
        request.onerror = (event) => {
          console.error('Error retrieving video data from IndexedDB:', event);
          reject(new Error('Failed to retrieve video data'));
        };
      });
    } catch (error) {
      console.error('Error in getVideoData:', error);
      return null;
    }
  }

  /**
   * Get all videos from IndexedDB
   * @returns Promise that resolves with an array of all videos
   */
  public async getAllVideos(): Promise<Array<{ uniqueId: string, videoData: VideoData, title: string, timestamp: number, thumbnail: string }>> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.videoStoreName], 'readonly');
      const store = transaction.objectStore(this.videoStoreName);
      
      // Define our result array with the correct type
      const result: Array<{ uniqueId: string, videoData: VideoData, title: string, timestamp: number, thumbnail: string }> = [];
      
      // Get all records
      return new Promise((resolve, reject) => {
        const request = store.index('timestamp').openCursor(null, 'prev'); // Sort by timestamp descending
        
        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest).result as IDBCursorWithValue;
          
          if (cursor) {
            const record = cursor.value;
            
            // Check if this is an old format record (with id instead of uniqueId)
            if (!record.uniqueId && 'id' in record) {
              // Create a new record with the new format
              const newFormatRecord = {
                uniqueId: `video_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
                videoData: record.videoData,
                title: record.title || 'Untitled Video',
                timestamp: record.timestamp || Date.now(),
                thumbnail: record.thumbnail || ''
              };
              
              // Add to our result array
              result.push(newFormatRecord);
              
              // Schedule an update to convert the old record to the new format
              // We do this in a timeout to avoid interfering with the cursor
              setTimeout(() => {
                try {
                  if (this.db) {
                    const updateTx = this.db.transaction([this.videoStoreName], 'readwrite');
                    const updateStore = updateTx.objectStore(this.videoStoreName);
                    
                    // Delete the old record
                    const deleteRequest = updateStore.delete(cursor.key);
                    deleteRequest.onsuccess = () => {
                      // Add the new format record
                      updateStore.add(newFormatRecord);
                      console.log(`Converted old format video to new format with ID: ${newFormatRecord.uniqueId}`);
                    };
                  }
                } catch (error) {
                  console.error('Error converting old format record:', error);
                }
              }, 100);
            } else if (record.uniqueId) {
              // This is already in the new format
              result.push(record as { uniqueId: string, videoData: VideoData, title: string, timestamp: number, thumbnail: string });
            }
            
            // Move to the next record
            cursor.continue();
          } else {
            // No more records
            console.log(`Retrieved ${result.length} videos from IndexedDB`);
            resolve(result);
          }
        };
        
        request.onerror = (event) => {
          console.error('Error retrieving videos from IndexedDB:', event);
          reject(new Error('Failed to retrieve videos'));
        };
      });
    } catch (error) {
      console.error('Error in getAllVideos:', error);
      return [];
    }
  }

  /**
   * Delete a video from IndexedDB
   * @param id - Unique ID of the video to delete
   * @returns Promise that resolves when the video is deleted
   */
  public async deleteVideo(id: string): Promise<void> {
    try {
      const db = await this.initDB();
      const transaction = db.transaction([this.videoStoreName], 'readwrite');
      const store = transaction.objectStore(this.videoStoreName);
      
      const request = store.delete(id);
      
      return new Promise((resolve, reject) => {
        // Listen for both request success and transaction completion
        request.onsuccess = () => {
          console.log(`Video deletion request successful for ID: ${id}`);
          // We don't resolve here - we wait for transaction to complete
        };
        
        request.onerror = (event) => {
          console.error('Error deleting video from IndexedDB:', event);
          reject(new Error('Failed to delete video'));
        };
        
        // Add transaction complete handler to ensure data is actually committed
        transaction.oncomplete = () => {
          console.log(`Video deletion transaction completed for ID: ${id}`);
          resolve();
        };
        
        transaction.onerror = (event) => {
          console.error('Transaction error when deleting video:', event);
          reject(new Error('Transaction failed when deleting video'));
        };
        
        transaction.onabort = (event) => {
          console.error('Transaction aborted when deleting video:', event);
          reject(new Error('Transaction aborted when deleting video'));
        };
      });
    } catch (error) {
      console.error('Error in deleteVideo:', error);
      throw error;
    }
  }

  /**
   * Extract a thumbnail from video data
   * @param videoData - The video data
   * @returns URL of the thumbnail
   */
  private extractThumbnail(videoData: VideoData): string {
    if (videoData.data && videoData.data.length > 0 && 
        videoData.data[0].points && videoData.data[0].points.length > 0) {
      return videoData.data[0].points[0].videoThumbnail;
    }
    return '';
  }
}

// Create a singleton instance
export const storageService = new StorageService();
