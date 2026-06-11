import { ContinueReadingCard } from "@/components/dashboard/continue-reading-card";
import { getContinueReading } from "@/lib/progress";

type ContinueReadingSectionProps = {
  userId: string;
};

export async function ContinueReadingSection({
  userId,
}: ContinueReadingSectionProps) {
  const book = await getContinueReading(userId);
  return <ContinueReadingCard book={book} />;
}
