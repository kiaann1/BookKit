export const FOLLOW_LIST_VISIBILITY_OPTIONS = [
  {
    value: "PUBLIC" as const,
    label: "Everyone",
    description: "Any signed-in reader can see your followers and following lists.",
  },
  {
    value: "FOLLOWERS" as const,
    label: "Followers only",
    description: "Only people who follow you can see these lists.",
  },
  {
    value: "ONLY_SELF" as const,
    label: "Only you",
    description: "Hide your followers and following lists from everyone else.",
  },
];

export type FollowListVisibility =
  (typeof FOLLOW_LIST_VISIBILITY_OPTIONS)[number]["value"];
