export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-light" style={{ colorScheme: "light", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
