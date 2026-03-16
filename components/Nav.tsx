"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { TrendingUp, ShoppingCart, AlertTriangle, Settings, BarChart2, LineChart } from "lucide-react";

const links = [
  { href: "/", label: "Portfolio", icon: BarChart2 },
  { href: "/performance", label: "Performance", icon: LineChart },
  { href: "/buy", label: "Buy Ideas", icon: ShoppingCart },
  { href: "/sell", label: "Sell Signals", icon: AlertTriangle },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Nav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2 font-semibold text-foreground mr-4">
          <TrendingUp className="h-5 w-5 text-green-500" />
          <span>MyPortfolio</span>
        </Link>
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-1.5 text-sm font-medium transition-colors px-1 py-4 border-b-2 ${
              pathname === href
                ? "text-foreground border-green-500"
                : "text-muted-foreground border-transparent hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
