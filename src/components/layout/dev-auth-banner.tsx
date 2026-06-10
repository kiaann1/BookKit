import { isAuthDisabled } from "@/lib/dev-auth";

export function DevAuthBanner() {
  if (!isAuthDisabled()) {
    return null;
  }

  return (
    <div className="border-b border-primary/15 bg-primary/8 px-4 py-1.5 text-center text-xs text-primary">
      Dev mode — auth disabled
    </div>
  );
}
