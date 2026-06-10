export const ShelfStatus = {
  WANT_TO_READ: "WANT_TO_READ",
  CURRENTLY_READING: "CURRENTLY_READING",
  READ: "READ",
  DNF: "DNF",
} as const;

export type ShelfStatus = (typeof ShelfStatus)[keyof typeof ShelfStatus];

export const SHELF_STATUS_LABELS: Record<ShelfStatus, string> = {
  WANT_TO_READ: "Want to Read",
  CURRENTLY_READING: "Currently Reading",
  READ: "Read",
  DNF: "Did Not Finish",
};

export const SHELF_STATUS_OPTIONS = Object.entries(SHELF_STATUS_LABELS).map(
  ([value, label]) => ({
    value: value as ShelfStatus,
    label,
  }),
);
