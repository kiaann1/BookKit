export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[calc(100dvh-3.5rem-var(--mobile-nav-height)-env(safe-area-inset-bottom,0px))] md:mx-auto md:min-h-0 md:max-w-5xl md:py-8">
      {children}
    </div>
  );
}
