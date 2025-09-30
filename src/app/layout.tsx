import "./globals.css";

export const metadata = {
  title: 'Weatherly',
  description: 'Weather app built with Next.js, TypeScript and Tailwind'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
