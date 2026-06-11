import Link from "next/link";

type FollowCountLinksProps = {
  username: string;
  followers: number;
  following: number;
  canViewLists: boolean;
};

function CountLabel({
  count,
  label,
  href,
  canViewLists,
}: {
  count: number;
  label: string;
  href: string;
  canViewLists: boolean;
}) {
  const content = (
    <>
      <strong>{count}</strong> {label}
    </>
  );

  if (!canViewLists) {
    return <span className="text-muted-foreground">{content}</span>;
  }

  return (
    <Link
      href={href}
      className="text-muted-foreground transition-colors hover:text-foreground"
    >
      {content}
    </Link>
  );
}

export function FollowCountLinks({
  username,
  followers,
  following,
  canViewLists,
}: FollowCountLinksProps) {
  return (
    <div className="flex flex-wrap justify-center gap-4 text-sm sm:justify-start">
      <CountLabel
        count={followers}
        label="followers"
        href={`/u/${username}/followers`}
        canViewLists={canViewLists}
      />
      <CountLabel
        count={following}
        label="following"
        href={`/u/${username}/following`}
        canViewLists={canViewLists}
      />
    </div>
  );
}
