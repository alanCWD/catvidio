export function formatViews(views: number): string {
  if (views >= 1000000) {
    return `${(views / 1000000).toFixed(1)}M views`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(0)}K views`;
  }
  return `${views} views`;
}

export function formatUploadTime(date: string): string {
  const now = new Date();
  const uploaded = new Date(date);
  const diffMs = now.getTime() - uploaded.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  }
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  }
  const years = Math.floor(diffDays / 365);
  return years === 1 ? '1 year ago' : `${years} years ago`;
}

export function formatEarnings(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function formatVideoForComponent(video: any) {
  return {
    ...video,
    views: formatViews(video.views),
    uploaded: formatUploadTime(video.uploadedAt),
    uploadedAt: video.uploadedAt, // Keep raw date for sorting
    earnings: formatEarnings(video.earnings),
    upvotes: video.upvoteCount || 0,
    comments: video.commentCount || 0,
  };
}
