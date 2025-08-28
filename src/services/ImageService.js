import ImageResizer from 'react-native-image-resizer';
// import { Image } from 'react-native';
import storage from '@react-native-firebase/storage';

// Image service for handling compression and uploads
export class ImageService {
  
  // Compress image for thumbnail (small size for list views)
  static async createThumbnail(uri, width = 150, height = 150, quality = 70) {
    try {
      const result = await ImageResizer.createResizedImage(
        uri,
        width,
        height,
        'JPEG',
        quality,
        0,
        undefined,
        false,
        {
          mode: 'cover', // or 'contain' based on your needs
          onlyScaleDown: false,
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Thumbnail creation error:', error);
      throw error;
    }
  }

  // Compress image for full size (detail view - still compressed but larger)
  static async createCompressedImage(uri, width = 1024, height = 1024, quality = 90) {
    try {
      const result = await ImageResizer.createResizedImage(
        uri,
        width,
        height,
        'JPEG',
        quality,
        0,
        undefined,
        false,
        {
          mode: 'cover',
          onlyScaleDown: true, // Only scale down, never scale up
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Image compression error:', error);
      throw error;
    }
  }

  // Upload single image to Firebase Storage
  static async uploadImage(uri, folder = 'issues', filename = null) {
    try {
      const uploadFilename = filename || `${Date.now()}_${Math.random().toString(36).substring(2, 15)}.jpg`;
      const reference = storage().ref(`${folder}/${uploadFilename}`);
      await reference.putFile(uri);
      return await reference.getDownloadURL();
    } catch (error) {
      console.error('Image upload error:', error);
      throw error;
    }
  }

  // Process and upload both thumbnail and full image
  static async processAndUploadImages(originalUri, folder = 'issues') {
    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2, 15);
      
      // Create both versions
      const [thumbnailUri, fullImageUri] = await Promise.all([
        this.createThumbnail(originalUri),
        this.createCompressedImage(originalUri)
      ]);

      // Upload both versions
      const [thumbnailUrl, fullImageUrl] = await Promise.all([
        this.uploadImage(thumbnailUri, `${folder}/thumbnails`, `thumb_${timestamp}_${randomId}.jpg`),
        this.uploadImage(fullImageUri, `${folder}/full`, `full_${timestamp}_${randomId}.jpg`)
      ]);

      return {
        thumbnailUrl,
        fullImageUrl,
        success: true
      };
    } catch (error) {
      console.error('Process and upload error:', error);
      return {
        thumbnailUrl: null,
        fullImageUrl: null,
        success: false,
        error: error.message
      };
    }
  }

  // Batch process multiple images (if needed in future)
//   static async processBatchImages(imageUris, folder = 'issues') {
//     try {
//       const results = await Promise.allSettled(
//         imageUris.map(uri => this.processAndUploadImages(uri, folder))
//       );
      
//       return results.map((result, index) => ({
//         originalIndex: index,
//         success: result.status === 'fulfilled' && result.value.success,
//         data: result.status === 'fulfilled' ? result.value : null,
//         error: result.status === 'rejected' ? result.reason.message : 
//                (result.value && !result.value.success ? result.value.error : null)
//       }));
//     } catch (error) {
//       console.error('Batch processing error:', error);
//       throw error;
//     }
//   }

  // Delete images from Firebase (cleanup utility)
//   static async deleteImages(urls) {
//     try {
//       const deletePromises = urls.map(url => {
//         const ref = storage().refFromURL(url);
//         return ref.delete();
//       });
      
//       await Promise.allSettled(deletePromises);
//       return { success: true };
//     } catch (error) {
//       console.error('Delete images error:', error);
//       return { success: false, error: error.message };
//     }
//   }

  // Get image dimensions (utility function)
//   static async getImageDimensions(uri) {
//     return new Promise((resolve, reject) => {
//       Image.getSize(
//         uri,
//         (width, height) => resolve({ width, height }),
//         (error) => reject(error)
//       );
//     });
//   }

  // Validate image before processing
//   static async validateImage(uri, maxSizeMB = 10) {
//     try {
//       // You might need to implement file size check based on your needs
//       // This is a basic validation
//       const dimensions = await this.getImageDimensions(uri);
      
//       if (dimensions.width < 100 || dimensions.height < 100) {
//         throw new Error('Image too small (minimum 100x100)');
//       }
      
//       if (dimensions.width > 4000 || dimensions.height > 4000) {
//         throw new Error('Image too large (maximum 4000x4000)');
//       }
      
//       return { valid: true, dimensions };
//     } catch (error) {
//       return { valid: false, error: error.message };
//     }
//   }
}

// Export individual functions for convenience
export const createThumbnail = ImageService.createThumbnail;
export const createCompressedImage = ImageService.createCompressedImage;
export const uploadImage = ImageService.uploadImage;
export const processAndUploadImages = ImageService.processAndUploadImages;
export const deleteImages = ImageService.deleteImages;

export default ImageService;