export default function MessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="-mx-4 -my-5 flex min-h-0 flex-1 flex-col sm:-mx-6 sm:-my-8">
      {children}
    </div>
  );
}
