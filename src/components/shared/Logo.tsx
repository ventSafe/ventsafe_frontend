import Image from "next/image";
import Link from "next/link";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <Image
        src="/images/Logo.png"
        alt="VentSafe Logo"
        width={100}
        height={100}
      />
    </Link>
  );
}
