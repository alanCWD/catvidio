export interface Video {
  id: string;
  type: 'video' | 'short';
  youtubeId: string;
  title: string;
  description: string;
  tags: string[];
  upvotes: number;
  comments: number;
  author: string;
  thumbnail: string;
  earnings: number;
  views: string;
  uploaded: string;
  topComment?: {
    user: string;
    text: string;
  };
}

export interface Comment {
  id: string;
  videoId: string;
  user: string;
  text: string;
  timestamp: string;
}

export const MOCK_VIDEOS: Video[] = [
  // Wide Video 1
  {
    id: "1",
    type: 'video',
    youtubeId: "QH2-TGUlwu4", 
    title: "Nyan Cat - Original",
    description: "The legendary space traveler.",
    tags: ["#Classic", "#Space"],
    upvotes: 12500,
    comments: 342,
    author: "GalaxyPurr",
    thumbnail: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop",
    earnings: 142.50,
    views: "205M views",
    uploaded: "12 years ago",
    topComment: { user: "InternetUser", text: "This is history right here." }
  },
  // Shorts Shelf Items (2-5)
  {
    id: "s1",
    type: 'short',
    youtubeId: "J---aiyznGQ",
    title: "Keyboard Cat Reborn",
    description: "Playing him off.",
    tags: ["#Music"],
    upvotes: 5000,
    comments: 100,
    author: "PianoPaws",
    thumbnail: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1000&auto=format&fit=crop",
    earnings: 20.00,
    views: "1.2M views",
    uploaded: "2 days ago"
  },
  {
    id: "s2",
    type: 'short',
    youtubeId: "0Bmhjf0rKe8",
    title: "Surprised Kitty!",
    description: "Tickles.",
    tags: ["#Cute"],
    upvotes: 8000,
    comments: 200,
    author: "TickleMonster",
    thumbnail: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1000&auto=format&fit=crop",
    earnings: 35.00,
    views: "890K views",
    uploaded: "5 days ago"
  },
  {
    id: "s3",
    type: 'short',
    youtubeId: "XyNlqQId-nk",
    title: "Sleepy Sunday",
    description: "Vibes only.",
    tags: ["#Sleep"],
    upvotes: 2000,
    comments: 40,
    author: "SleepyHead",
    thumbnail: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?q=80&w=1000&auto=format&fit=crop",
    earnings: 12.00,
    views: "450K views",
    uploaded: "1 week ago"
  },
  {
    id: "s4",
    type: 'short',
    youtubeId: "tntOCGkgt98", // Cat Vibing to Ievan Polkka
    title: "Vibing Cat",
    description: "He is feeling it.",
    tags: ["#Vibe"],
    upvotes: 15000,
    comments: 600,
    author: "VibeCheck",
    thumbnail: "https://images.unsplash.com/photo-1495360019602-e0019216774a?q=80&w=1000&auto=format&fit=crop",
    earnings: 55.00,
    views: "2.1M views",
    uploaded: "3 days ago"
  },
  // Wide Video 2
  {
    id: "2",
    type: 'video',
    youtubeId: "C_O-a64I6SE", // Maru Box
    title: "I love boxes!",
    description: "If I fits, I sits.",
    tags: ["#Maru", "#Box"],
    upvotes: 9500,
    comments: 150,
    author: "MuguMogu",
    thumbnail: "https://images.unsplash.com/photo-1513245543132-31f507417b26?q=80&w=1000&auto=format&fit=crop",
    earnings: 89.00,
    views: "5.4M views",
    uploaded: "4 years ago",
    topComment: { user: "BoxLover", text: "The slide at the end 😂" }
  },
  // Wide Video 3
  {
    id: "3",
    type: 'video',
    youtubeId: "WEkSYw3o5is", // Screaming Cat
    title: "Let me in!",
    description: "Why is the door closed?",
    tags: ["#Loud"],
    upvotes: 4500,
    comments: 80,
    author: "LoudMouth",
    thumbnail: "https://images.unsplash.com/photo-1501820488136-72669149e0d4?q=80&w=1000&auto=format&fit=crop",
    earnings: 42.00,
    views: "890K views",
    uploaded: "6 months ago"
  }
];

export const MOCK_COMMENTS: Comment[] = [
  { id: "c1", videoId: "1", user: "CatLover99", text: "This never gets old!", timestamp: "2m ago" },
  { id: "c2", videoId: "1", user: "DogPerson", text: "Okay, this is actually cute.", timestamp: "5m ago" },
  { id: "c3", videoId: "2", user: "MusicMaestro", text: "A true artist.", timestamp: "1h ago" },
];

export const MOCK_USER = {
  id: "user_555",
  username: "PurrMaster",
  walletBalance: 420.69,
  totalViews: 154200,
  videos: ["1", "3"] 
};
