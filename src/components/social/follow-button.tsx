"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type FollowButtonProps = {
  username: string;
  initialFollowing: boolean;
  isSelf: boolean;
};

export function FollowButton({
  username,
  initialFollowing,
  isSelf,
}: FollowButtonProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  if (isSelf) {
    return null;
  }

  async function toggleFollow() {
    setLoading(true);

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(username)}/follow`, {
        method: following ? "DELETE" : "POST",
      });

      if (!response.ok) {
        return;
      }

      setFollowing(!following);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      size="sm"
      variant={following ? "outline" : "default"}
      disabled={loading}
      onClick={() => void toggleFollow()}
    >
      {loading ? "…" : following ? "Following" : "Follow"}
    </Button>
  );
}
