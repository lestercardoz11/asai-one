import Link from "next/link";
import Image from "next/image";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <Image src="/logo.png" alt="ASAI.One" width={48} height={48} className="h-12 w-12 opacity-70" />
      <p className="type-mono mt-6 text-navy-500">Error 404</p>
      <h1 className="type-display mt-3 text-6xl text-navy-800 sm:text-7xl">
        Off the map
      </h1>
      <p className="mt-3 max-w-sm text-ink-60">
        This route doesn&apos;t exist. Let&apos;s get you back on course.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className={buttonVariants({ size: "lg" })}>
          Back home
        </Link>
        <Link href="/shop" className={buttonVariants({ variant: "secondary", size: "lg" })}>
          Browse the shop
        </Link>
      </div>
    </div>
  );
}
