export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-layout flex flex-1 items-center justify-center px-4 py-12 sm:py-20">
      {children}
    </div>
  );
}
