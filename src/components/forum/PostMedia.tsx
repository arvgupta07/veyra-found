/**
 * Renders whatever media a forum post carries: a photo, an uploaded video or an
 * embedded YouTube / Vimeo clip pasted as a link.
 */

/** Returns an embed URL when the link is a YouTube or Vimeo video, else null. */
export function embedUrl(raw: string): string | null {
  const url = raw.trim();
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export function PostMedia({
  imageUrl,
  videoUrl,
  className = "",
}: {
  imageUrl?: string | null;
  videoUrl?: string | null;
  className?: string;
}) {
  const embed = videoUrl ? embedUrl(videoUrl) : null;

  if (!imageUrl && !videoUrl) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {imageUrl && (
        <img src={imageUrl} alt="" loading="lazy"
          className="max-h-72 w-full rounded-xl border-2 border-ink object-cover" />
      )}
      {videoUrl && (embed ? (
        <div className="aspect-video w-full overflow-hidden rounded-xl border-2 border-ink bg-ink">
          <iframe src={embed} title="Video" allowFullScreen loading="lazy"
            allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
            className="h-full w-full" />
        </div>
      ) : (
        <video src={videoUrl} controls preload="metadata"
          className="max-h-80 w-full rounded-xl border-2 border-ink bg-ink" />
      ))}
    </div>
  );
}
