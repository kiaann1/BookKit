import type { FollowListVisibility } from "@/lib/constants/privacy";

export type ProfilePrivacy = {
  isPrivate: boolean;
  followersListVisibility: FollowListVisibility;
};

export type PrivacyViewerContext = ProfilePrivacy & {
  profileUserId: string;
  viewerId: string;
  isFollowing: boolean;
};

export function isProfileOwner(context: PrivacyViewerContext) {
  return context.profileUserId === context.viewerId;
}

export function canViewFullProfile(context: PrivacyViewerContext) {
  if (isProfileOwner(context)) {
    return true;
  }

  if (!context.isPrivate) {
    return true;
  }

  return context.isFollowing;
}

export function canViewFollowLists(context: PrivacyViewerContext) {
  if (isProfileOwner(context)) {
    return true;
  }

  if (context.followersListVisibility === "PUBLIC") {
    return true;
  }

  if (context.followersListVisibility === "FOLLOWERS") {
    return context.isFollowing;
  }

  return false;
}
