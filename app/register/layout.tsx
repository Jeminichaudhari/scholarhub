export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="force-light" style={{ colorScheme: "light", minHeight: "100vh" }}>
      {children}
    </div>
  );
}
