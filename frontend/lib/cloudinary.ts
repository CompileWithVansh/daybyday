import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

/**
 * Uploads a file buffer to Cloudinary.
 * @param file - Buffer containing the file data
 * @param folder - Cloudinary folder to store the file in
 * @returns Object with the secure URL and public ID
 */
export async function uploadToCloudinary(
  file: Buffer,
  folder: string = 'daybyday'
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder }, (error, result) => {
        if (error) reject(error);
        else resolve({ url: result!.secure_url, publicId: result!.public_id });
      })
      .end(file);
  });
}

export default cloudinary;
