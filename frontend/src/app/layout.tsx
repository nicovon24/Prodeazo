import { Montserrat } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import "./globals.css";
import { Providers } from "./providers";

const montserrat = Montserrat({
  subsets: ["latin"],
  variable: "--font-montserrat",
  weight: ["700", "900"],
});

export const metadata = {
  title: "Prodeazo",
  description: "Pronósticos y estadísticas del Mundial 2026",
  icons: {
    icon: "/logo-mundial-2026.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body 
        className={`${GeistSans.variable} ${montserrat.variable} antialiased min-h-screen bg-background text-foreground font-sans`} 
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
