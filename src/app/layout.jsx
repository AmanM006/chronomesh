import './globals.css';
import SmoothScroll from '../components/SmoothScroll';

export const metadata = {
  title: 'ChronoMesh — Distributed Multi-Agent State & Memory OS',
  description: 'Built with CockroachDB (Vector + MCP + ccloud + Agent Skills) & AWS Bedrock',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body suppressHydrationWarning className="bg-black text-neutral-200 min-h-screen antialiased selection:bg-[#bef264]/30 selection:text-[#bef264] font-['Plus_Jakarta_Sans',sans-serif]">
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}
