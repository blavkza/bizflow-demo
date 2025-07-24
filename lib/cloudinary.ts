export function formatCloudinaryUrl(url: string, forDownload = false) {
  // Replace image/upload with raw/upload for documents
  let formattedUrl = url;

  // Check if this is likely a document (PDF, etc.)
  const isDocument = /\.(pdf|docx?|xlsx?|pptx?|txt)$/i.test(url);

  if (isDocument) {
    formattedUrl = url.replace("image/upload", "raw/upload");
  }

  // Add download flag if requested
  if (forDownload) {
    formattedUrl = isDocument
      ? `${formattedUrl}?fl_attachment`
      : `${formattedUrl}?dl=1`;
  }

  return formattedUrl;
}
