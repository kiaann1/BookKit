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

export type PostItem = {
  id: string;
  body: string;
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
};

export type UserSearchResult = SocialAuthor & {
  isFollowing: boolean;
  followerCount: number;
};
