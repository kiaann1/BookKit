export default function LegalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl flex-1 px-4 py-10 sm:px-6">{children}</div>
  );
}
