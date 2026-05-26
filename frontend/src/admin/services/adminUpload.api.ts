import axios from "axios";
import { api } from "../../lib/api";

export interface UploadImageResult {
  url: string;
  filename: string;
}

function resolveUploadBaseURL(): string {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv != null && fromEnv !== "") {
    return fromEnv;
  }
  if (import.meta.env.DEV) {
    return "";
  }
  return "http://localhost:3000";
}

export function resolveAssetUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const base = resolveUploadBaseURL();
  return `${base}${pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`}`;
}

export async function uploadAdminImage(file: File): Promise<UploadImageResult> {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post("/api/v1/admin/upload/image", formData, {
    baseURL: api.defaults.baseURL,
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });

  return response.data.data as UploadImageResult;
}
