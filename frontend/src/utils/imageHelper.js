// imageHelper.js (ESM)
export const optimizeImage = (url, width = 500) => {
    if (!url) return 'https://via.placeholder.com/400'; // Fallback if no image
    if (!url.includes('cloudinary')) return url; // Don't touch non-Cloudinary images

    // Inject transformation parameters after "/upload/"
    // w_{width} = Resize to specific width (default 500px)
    // q_auto    = Automatic quality (reduces file size without losing visual quality)
    // f_auto    = Automatic format (serves WebP to Chrome, etc.)
    return url.replace('/upload/', `/upload/w_${width},q_auto,f_auto/`);
};