import type { Metadata } from 'next';
import './globals.css';
import Sidebar from '@/components/sidebar';


export const metadata: Metadata = {
  title: 'Health Content AI',
  description: 'AI-powered content generation for health websites',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex h-screen bg-gray-50">
          <Sidebar />
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
