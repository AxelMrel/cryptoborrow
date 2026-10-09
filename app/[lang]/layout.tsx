import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Geist_Mono, Poppins } from "next/font/google";
import "../globals.css";
import { hasLocale, locales } from "@/i18n/config";
import { dictionaries } from "@/i18n/dict";
import { I18nProvider } from "@/i18n/provider";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Toutes les langues sont pré-générées (obligatoire avec Cache Components).
export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

export async function generateMetadata({ params }: LayoutProps<"/[lang]">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};
  const t = dictionaries[lang].home.meta;
  return { title: t.title, description: t.description };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[lang]">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();

  return (
    <html lang={lang} className={`${poppins.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <I18nProvider locale={lang} dict={dictionaries[lang]}>{children}</I18nProvider>
      </body>
    </html>
  );
}
