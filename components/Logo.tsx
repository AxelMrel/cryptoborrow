import Image from "next/image";

/** Logo CoinPulse (public/logo.png, fond transparent). */
export default function Logo({ className = "h-10" }: { className?: string }) {
  return <Image src="/logo.png" alt="CoinPulse" width={2020} height={779} priority className={`${className} w-auto`} />;
}
