export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -my-5 sm:-mx-6 sm:-my-10">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">
        {children}
      </div>
    </div>
  );
}
