import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RetainAI — Student Retention Early Warning System",
  description: "AI-powered early-warning system that predicts student dropout risk, explains contributing factors, and recommends interventions.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="min-h-screen">
          <nav className="border-b border-[var(--border)] bg-[var(--card)]">
            <div style={{ width: "100%", maxWidth: "1440px", margin: "0 auto", padding: "0 24px" }}>
              <div className="flex items-center justify-between h-16">
                <a href="/" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent)] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 20V10" />
                      <path d="M18 20V4" />
                      <path d="M6 20v-4" />
                    </svg>
                  </div>
                  <div>
                    <span className="text-lg font-bold text-white tracking-tight">RetainAI</span>
                    <span className="text-xs text-[var(--muted)] block -mt-1">Early Warning System</span>
                  </div>
                </a>
                <div className="flex items-center gap-6">
                  <a href="/" className="text-sm text-[var(--muted)] hover:text-white transition-colors">Dashboard</a>
                  <a href="/students" className="text-sm text-[var(--muted)] hover:text-white transition-colors">Students</a>
                  <a href="/model-info" className="text-sm text-[var(--muted)] hover:text-white transition-colors">Model Info</a>
                </div>
              </div>
            </div>
          </nav>
          <main style={{ width: "100%", maxWidth: "1440px", margin: "0 auto", padding: "24px 24px" }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
