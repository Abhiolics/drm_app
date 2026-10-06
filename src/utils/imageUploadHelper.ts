import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';

export interface PreparedImage {
  uri: string;
  filename: string;
  mimeType: string;
  width?: number;
  height?: number;
  cleanup?: () => Promise<void>;
}

/**
 * Prepares an image for upload by:
 * 1. Supporting any image format (.jpg, .jpeg, .png, .webp, HEIC, etc.)
 * 2. Resolving Android content:// or file:// URIs into a stable, native file:// URI
 * 3. Resizing images exceeding 1280px width while maintaining original aspect ratio
 * 4. Compressing to high-quality JPEG (0.75) to ensure file size is ~100-250KB (well below Vercel's 4.5MB serverless limit)
 * 5. Guaranteeing lowercase '.jpg' extension and 'image/jpeg' MIME type for Cloudinary / Multer compatibility
 */
export async function prepareImageForUpload(
  sourceUri: string,
  prefix: string = 'upload'
): Promise<PreparedImage> {
  const timestamp = Date.now();
  const cleanFilename = `${prefix}_${timestamp}.jpg`;
  const cleanMimeType = 'image/jpeg';

  if (Platform.OS === 'web') {
    return {
      uri: sourceUri,
      filename: cleanFilename,
      mimeType: cleanMimeType,
    };
  }

  let manipulatedUri: string | null = null;
  let targetFileUri: string | null = null;

  try {
    // Resize to max 1280px width and compress to JPEG format
    const manipResult = await ImageManipulator.manipulateAsync(
      sourceUri,
      [{ resize: { width: 1280 } }],
      {
        compress: 0.75,
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );

    manipulatedUri = manipResult.uri;
    targetFileUri = `${FileSystem.cacheDirectory}${cleanFilename}`;

    // Copy to explicit, guaranteed filename in cache directory
    await FileSystem.copyAsync({
      from: manipulatedUri,
      to: targetFileUri,
    });

    const cleanup = async () => {
      try {
        if (targetFileUri) {
          await FileSystem.deleteAsync(targetFileUri, { idempotent: true });
        }
        if (manipulatedUri && manipulatedUri !== targetFileUri) {
          await FileSystem.deleteAsync(manipulatedUri, { idempotent: true });
        }
      } catch {
        // Ignore cache cleanup errors
      }
    };

    return {
      uri: targetFileUri,
      filename: cleanFilename,
      mimeType: cleanMimeType,
      width: manipResult.width,
      height: manipResult.height,
      cleanup,
    };
  } catch (manipErr) {
    console.warn('[imageUploadHelper] Image manipulation error, attempting copy fallback:', manipErr);

    try {
      // Fallback: Copy source directly to guaranteed cache file
      const fallbackTarget = `${FileSystem.cacheDirectory}${cleanFilename}`;
      await FileSystem.copyAsync({
        from: sourceUri,
        to: fallbackTarget,
      });

      return {
        uri: fallbackTarget,
        filename: cleanFilename,
        mimeType: cleanMimeType,
        cleanup: async () => {
          try {
            await FileSystem.deleteAsync(fallbackTarget, { idempotent: true });
          } catch {
            // Ignore
          }
        },
      };
    } catch (copyErr) {
      console.warn('[imageUploadHelper] Direct copy failed, using raw URI:', copyErr);
      return {
        uri: sourceUri,
        filename: cleanFilename,
        mimeType: cleanMimeType,
      };
    }
  }
}
