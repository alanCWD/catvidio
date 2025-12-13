export interface Video {
  id: string;
  youtubeId: string;
  title: string;
  description: string;
  tags: string[];
  upvotes: number;
  comments: number;
  author: string;
  thumbnail: string;
  earnings: number;
}

export interface Comment {
  id: string;
  videoId: string;
  user: string;
  text: string;
  timestamp: string;
}

export const MOCK_VIDEOS: Video[] = [
  {
    id: "1",
    youtubeId: "QH2-TGUlwu4", // Nyan Cat
    title: "Infinite Space Cat",
    description: "The classic space traveler.",
    tags: ["#Classic", "#Space", "#Music"],
    upvotes: 12500,
    comments: 342,
    author: "GalaxyPurr",
    thumbnail: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop",
    earnings: 142.50
  },
  {
    id: "2",
    youtubeId: "J---aiyznGQ", // Keyboard Cat
    title: "Musical Prodigy",
    description: "He plays better than I do.",
    tags: ["#Music", "#Talent", "#Classic"],
    upvotes: 8900,
    comments: 120,
    author: "PianoPaws",
    thumbnail: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?q=80&w=1000&auto=format&fit=crop",
    earnings: 89.00
  },
  {
    id: "3",
    youtubeId: "0Bmhjf0rKe8", // Surprised Kitty
    title: "Tickles!",
    description: "Can't stop laughing at this one.",
    tags: ["#Cute", "#Kitten", "#Laugh"],
    upvotes: 15600,
    comments: 560,
    author: "TickleMonster",
    thumbnail: "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?q=80&w=1000&auto=format&fit=crop",
    earnings: 156.00
  },
  {
    id: "4",
    youtubeId: "XyNlqQId-nk", // Top 10 Funny Cat Videos
    title: "Weekend Vibes",
    description: "Just chilling on a sunday.",
    tags: ["#Chill", "#Sleep", "#Vibes"],
    upvotes: 3200,
    comments: 45,
    author: "SleepyHead",
    thumbnail: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=1000&auto=format&fit=crop",
    earnings: 32.00
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
  videos: ["1", "3"] // IDs of videos owned by user
};
