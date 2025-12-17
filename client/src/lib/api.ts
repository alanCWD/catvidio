export async function fetchVideos() {
  const response = await fetch('/api/videos');
  if (!response.ok) throw new Error('Failed to fetch videos');
  return response.json();
}

export async function fetchVideo(id: number) {
  const response = await fetch(`/api/videos/${id}`);
  if (!response.ok) throw new Error('Failed to fetch video');
  return response.json();
}

export async function createVideo(data: {
  userId: number;
  youtubeId: string;
  title: string;
  description?: string;
  type: 'video' | 'short';
  thumbnail?: string;
}) {
  const response = await fetch('/api/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to create video');
  return response.json();
}

export async function toggleUpvote(videoId: number) {
  const response = await fetch(`/api/videos/${videoId}/upvote`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Failed to toggle upvote');
  return response.json();
}

export async function getUpvoteStatus(videoId: number) {
  const response = await fetch(`/api/videos/${videoId}/upvote/status`);
  if (!response.ok) throw new Error('Failed to get upvote status');
  return response.json();
}

export async function fetchComments(videoId: number) {
  const response = await fetch(`/api/videos/${videoId}/comments`);
  if (!response.ok) throw new Error('Failed to fetch comments');
  return response.json();
}

export async function createComment(videoId: number, text: string) {
  const response = await fetch(`/api/videos/${videoId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!response.ok) throw new Error('Failed to create comment');
  return response.json();
}

export async function fetchCurrentUser() {
  const response = await fetch('/api/user/me');
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error('Failed to fetch user');
  }
  return response.json();
}

export async function createOrUpdateProfile(data: {
  username: string;
  tagline?: string;
  avatar?: string;
  avatarColor?: string;
}) {
  const response = await fetch('/api/user/profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Failed to save profile');
  return response.json();
}

export async function fetchUserVideos(userId: number) {
  const response = await fetch(`/api/user/${userId}/videos`);
  if (!response.ok) throw new Error('Failed to fetch user videos');
  return response.json();
}

export async function fetchTopVideos(limit: number = 10) {
  const response = await fetch(`/api/leaderboard/videos?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top videos');
  return response.json();
}

export async function fetchTopCreators(limit: number = 10) {
  const response = await fetch(`/api/leaderboard/creators?limit=${limit}`);
  if (!response.ok) throw new Error('Failed to fetch top creators');
  return response.json();
}
