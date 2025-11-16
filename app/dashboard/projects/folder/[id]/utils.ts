export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return (
    Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  );
};

export const formatTotalSize = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(1)} GB`;
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

// Enhanced Cloudinary URL formatting
export const formatCloudinaryUrl = (
  url: string,
  options: {
    forDownload?: boolean;
    forPreview?: boolean;
  } = {}
): string => {
  const { forDownload = false, forPreview = false } = options;

  if (!url.includes("cloudinary.com")) {
    return url;
  }

  let formattedUrl = url;

  // Check if it's a raw file (PDF, document) by URL pattern
  const isRawFile = url.includes("/raw/upload/");
  const isPDF = url.includes(".pdf");
  const isDocument = /\.(docx?|xlsx?|pptx?|txt)$/i.test(url);

  if (isRawFile) {
    // For raw files (PDFs, documents), we don't need to modify the URL structure
    if (forDownload) {
      // Add download parameter
      formattedUrl += isPDF ? "?fl_attachment" : "?dl=1";
    } else if (forPreview && isPDF) {
      // Use Google Docs viewer for PDF preview
      formattedUrl = `https://docs.google.com/gview?url=${encodeURIComponent(formattedUrl)}&embedded=true`;
    }
  } else {
    // For image files
    if (forDownload) {
      formattedUrl += "?dl=1";
    }
  }

  return formattedUrl;
};

// Check if file can be previewed in browser
export const canPreviewFile = (fileType: string): boolean => {
  const previewableTypes = [
    "image/",
    "video/",
    "audio/",
    "application/pdf",
    "text/plain",
    "text/html",
    "application/json",
  ];

  return previewableTypes.some((type) => fileType.includes(type));
};

// Get appropriate viewer for file type
export const getFileViewerType = (
  fileType: string
): "image" | "video" | "audio" | "pdf" | "text" | "unsupported" => {
  if (fileType.startsWith("image/")) return "image";
  if (fileType.startsWith("video/")) return "video";
  if (fileType.startsWith("audio/")) return "audio";
  if (fileType.includes("pdf")) return "pdf";
  if (fileType.includes("text")) return "text";
  return "unsupported";
};
