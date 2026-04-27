export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-light-surface flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-near-black font-black text-4xl" style={{ lineHeight: 0.85 }}>
            Think Decision
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
