export function postPath(postId: string) {
  return `/posts/${encodeURIComponent(postId)}`;
}
