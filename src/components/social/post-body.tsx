import Link from "next/link";

const MENTION_PATTERN = /(@[a-z0-9_]+)/gi;

type PostBodyProps = {
  body: string;
  className?: string;
};

export function PostBody({ body, className }: PostBodyProps) {
  const parts = body.split(MENTION_PATTERN);

  return (
    <p className={className}>
      {parts.map((part, index) => {
        const match = part.match(/^@([a-z0-9_]+)$/i);
        if (!match) {
          return <span key={index}>{part}</span>;
        }

        const username = match[1]!.toLowerCase();
        return (
          <Link
            key={index}
            href={`/u/${username}`}
            className="font-medium text-primary hover:underline"
          >
            @{username}
          </Link>
        );
      })}
    </p>
  );
}
