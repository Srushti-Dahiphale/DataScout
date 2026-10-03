import { v2 as cloudinary } from "cloudinary";

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
const API_KEY = process.env.CLOUDINARY_API_KEY;
const API_SECRET = process.env.CLOUDINARY_API_SECRET;

export function cloudinaryEnabled() {
  return Boolean(CLOUD_NAME && API_KEY && API_SECRET);
}

if (cloudinaryEnabled()) {
  cloudinary.config({
    cloud_name: CLOUD_NAME,
    api_key: API_KEY,
    api_secret: API_SECRET,
  });
}

export async function uploadExportFile(
  filename: string,
  content: string,
): Promise<string> {
  if (!cloudinaryEnabled()) {
    throw new Error("Cloudinary is not configured");
  }
  const dataUri = `data:text/plain;base64,${Buffer.from(content, "utf8").toString("base64")}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: "raw",
    public_id: `datascout/exports/${filename.replace(/[^a-zA-Z0-9_-]/g, "_")}`,
    overwrite: true,
  });
  return result.secure_url;
}
