import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function uploadPDF(
  buffer: Buffer,
  folder = 'psc-notes'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: 'raw', folder, format: 'pdf' },
        (err, result) => {
          if (err) reject(err);
          else resolve({ url: result!.secure_url, public_id: result!.public_id });
        }
      )
      .end(buffer);
  });
}

export async function uploadImage(
  buffer: Buffer,
  folder = 'psc-images'
): Promise<{ url: string; public_id: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { resource_type: 'image', folder, quality: 'auto', fetch_format: 'auto' },
        (err, result) => {
          if (err) reject(err);
          else resolve({ url: result!.secure_url, public_id: result!.public_id });
        }
      )
      .end(buffer);
  });
}

export async function deleteFile(publicId: string, resourceType: 'raw' | 'image' = 'raw') {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}
