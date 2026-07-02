import type { Metadata } from "next";
import '@/styles/style.scss'
import { QueryProvider } from '@/providers/query-provider'

export const metadata: Metadata = {
  title: "Whale ERP",
  description: "Whale ERP",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
