export type SocialAuthor = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type PostBookTag = {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
};

export type PostType = "TEXT" | "IMAGE" | "ARTICLE" | "VIDEO";

export type PostItem = {
  id: string;
  type: PostType;
  title: string | null;
  body: string;
  mediaUrl: string | null;
  createdAt: Date;
  author: SocialAuthor;
  book: PostBookTag | null;
  likeCount: number;
  commentCount: number;
  likedByViewer: boolean;
};

export type CommentItem = {
  id: string;
  body: string;
  createdAt: Date;
  author: SocialAuthor;
};

export type FeedPage = {
  posts: PostItem[];
  nextCursor: string | null;
};

export type FriendReadingItem = {
  reader: SocialAuthor;
  book: {
    id: string;
    title: string;
    author: string;
    coverUrl: string | null;
  };
  progressPercent: number | null;
  lastReadAt: Date | null;
};

export type FriendsActivity = {
  recentPosts: PostItem[];
  friendsReading: FriendReadingItem[];
  followingCount: number;
};

export type FollowCounts = {
  followers: number;
  following: number;
};

export type PublicProfile = {
  id: string;
  username: string;
  displayName: string;
  bio: string | null;
  avatarUrl: string | null;
  genrePreferences: string[];
  createdAt: Date;
  followCounts: FollowCounts;
  isFollowing: boolean;
  isSelf: boolean;
  isPrivate: boolean;
  canViewFullProfile: boolean;
  canViewFollowLists: boolean;
  isBlockedByViewer: boolean;
  hasBlockedViewer: boolean;
  canMessage: boolean;
};

export type UserSearchResult = SocialAuthor & {
  isFollowing: boolean;
  followerCount: number;
};
