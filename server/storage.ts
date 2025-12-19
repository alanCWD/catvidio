import { 
  users, videos, upvotes, comments, subscriptions, notifications,
  type User, type InsertUser,
  type Video, type InsertVideo,
  type Upvote, type InsertUpvote,
  type Comment, type InsertComment,
  type Subscription, type InsertSubscription,
  type Notification, type InsertNotification
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<InsertUser>): Promise<User>;
  
  // Videos
  getAllVideos(): Promise<Video[]>;
  getVideo(id: number): Promise<Video | undefined>;
  getVideosByUser(userId: number): Promise<Video[]>;
  createVideo(insertVideo: InsertVideo): Promise<Video>;
  updateVideo(id: number, updates: Partial<Video>): Promise<Video>;
  getVideoWithStats(id: number): Promise<{
    video: Video;
    upvoteCount: number;
    commentCount: number;
    author: User;
  } | undefined>;
  
  // Upvotes
  createUpvote(insertUpvote: InsertUpvote): Promise<Upvote>;
  deleteUpvote(userId: number, videoId: number): Promise<void>;
  hasUserUpvoted(userId: number, videoId: number): Promise<boolean>;
  getUpvoteCount(videoId: number): Promise<number>;
  
  // Comments
  getCommentsByVideo(videoId: number): Promise<Array<Comment & { author: User }>>;
  createComment(insertComment: InsertComment): Promise<Comment>;
  
  // Leaderboards
  getTopVideos(limit: number): Promise<Array<Video & { upvoteCount: number; author: User }>>;
  getTopCreators(limit: number): Promise<Array<User & { totalEarnings: number; videoCount: number }>>;
  
  // Subscriptions
  createSubscription(subscriberId: number, creatorId: number): Promise<Subscription>;
  deleteSubscription(subscriberId: number, creatorId: number): Promise<void>;
  hasSubscribed(subscriberId: number, creatorId: number): Promise<boolean>;
  
  // Notifications
  getNotificationsByUser(userId: number): Promise<Notification[]>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationsRead(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<InsertUser>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Videos
  async getAllVideos(): Promise<Video[]> {
    return await db.select().from(videos).orderBy(desc(videos.uploadedAt));
  }

  async getVideo(id: number): Promise<Video | undefined> {
    const [video] = await db.select().from(videos).where(eq(videos.id, id));
    return video || undefined;
  }

  async getVideosByUser(userId: number): Promise<Video[]> {
    return await db
      .select()
      .from(videos)
      .where(eq(videos.userId, userId))
      .orderBy(desc(videos.uploadedAt));
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const [video] = await db
      .insert(videos)
      .values(insertVideo)
      .returning();
    return video;
  }

  async updateVideo(id: number, updates: Partial<Video>): Promise<Video> {
    const [video] = await db
      .update(videos)
      .set(updates)
      .where(eq(videos.id, id))
      .returning();
    return video;
  }

  async getVideoWithStats(id: number) {
    const [result] = await db
      .select({
        video: videos,
        author: users,
        upvoteCount: sql<number>`cast(count(distinct ${upvotes.id}) as int)`,
        commentCount: sql<number>`cast(count(distinct ${comments.id}) as int)`,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .leftJoin(upvotes, eq(upvotes.videoId, videos.id))
      .leftJoin(comments, eq(comments.videoId, videos.id))
      .where(eq(videos.id, id))
      .groupBy(videos.id, users.id);

    return result || undefined;
  }

  // Upvotes
  async createUpvote(insertUpvote: InsertUpvote): Promise<Upvote> {
    const [upvote] = await db
      .insert(upvotes)
      .values(insertUpvote)
      .returning();
    return upvote;
  }

  async deleteUpvote(userId: number, videoId: number): Promise<void> {
    await db
      .delete(upvotes)
      .where(and(eq(upvotes.userId, userId), eq(upvotes.videoId, videoId)));
  }

  async hasUserUpvoted(userId: number, videoId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(upvotes)
      .where(and(eq(upvotes.userId, userId), eq(upvotes.videoId, videoId)));
    return !!result;
  }

  async getUpvoteCount(videoId: number): Promise<number> {
    const [result] = await db
      .select({ count: sql<number>`cast(count(*) as int)` })
      .from(upvotes)
      .where(eq(upvotes.videoId, videoId));
    return result?.count || 0;
  }

  // Comments
  async getCommentsByVideo(videoId: number): Promise<Array<Comment & { author: User }>> {
    const results = await db
      .select({
        comment: comments,
        author: users,
      })
      .from(comments)
      .innerJoin(users, eq(comments.userId, users.id))
      .where(eq(comments.videoId, videoId))
      .orderBy(desc(comments.createdAt));

    return results.map(r => ({ ...r.comment, author: r.author }));
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db
      .insert(comments)
      .values(insertComment)
      .returning();
    return comment;
  }

  // Leaderboards
  async getTopVideos(limit: number) {
    const results = await db
      .select({
        video: videos,
        author: users,
        upvoteCount: sql<number>`cast(count(${upvotes.id}) as int)`,
      })
      .from(videos)
      .innerJoin(users, eq(videos.userId, users.id))
      .leftJoin(upvotes, eq(upvotes.videoId, videos.id))
      .groupBy(videos.id, users.id)
      .orderBy(desc(sql`count(${upvotes.id})`))
      .limit(limit);

    return results.map(r => ({ ...r.video, upvoteCount: r.upvoteCount, author: r.author }));
  }

  async getTopCreators(limit: number) {
    const results = await db
      .select({
        user: users,
        totalEarnings: sql<number>`cast(sum(${videos.earnings}) as int)`,
        videoCount: sql<number>`cast(count(${videos.id}) as int)`,
      })
      .from(users)
      .leftJoin(videos, eq(videos.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(sql`sum(${videos.earnings})`))
      .limit(limit);

    return results.map(r => ({ ...r.user, totalEarnings: r.totalEarnings || 0, videoCount: r.videoCount || 0 }));
  }

  // Subscriptions
  async createSubscription(subscriberId: number, creatorId: number): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values({ subscriberId, creatorId })
      .returning();
    return subscription;
  }

  async deleteSubscription(subscriberId: number, creatorId: number): Promise<void> {
    await db
      .delete(subscriptions)
      .where(and(eq(subscriptions.subscriberId, subscriberId), eq(subscriptions.creatorId, creatorId)));
  }

  async hasSubscribed(subscriberId: number, creatorId: number): Promise<boolean> {
    const [result] = await db
      .select()
      .from(subscriptions)
      .where(and(eq(subscriptions.subscriberId, subscriberId), eq(subscriptions.creatorId, creatorId)));
    return !!result;
  }

  // Notifications
  async getNotificationsByUser(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [notif] = await db
      .insert(notifications)
      .values(notification)
      .returning();
    return notif;
  }

  async markNotificationsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId));
  }
}

export const storage = new DatabaseStorage();
