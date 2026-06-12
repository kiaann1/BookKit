import { PageShell } from "@/components/layout/page-shell";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <PageShell width="medium" className="space-y-6">
      <SettingsNav />
      {children}
    </PageShell>
  );
}
