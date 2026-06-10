export type ReadingProgress = {
  currentPage: number;
  totalPages: number;
  progressPercent: number;
  lastReadAt: Date;
};

export type SaveProgressInput = {
  currentPage: number;
  totalPages: number;
};
