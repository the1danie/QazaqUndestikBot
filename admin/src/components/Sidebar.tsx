"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const NAV = [
  { href: "/dashboard/erezhe", label: "📚 Ереже" },
  { href: "/dashboard/zhattyghu", label: "✏️ Жаттығу" },
  { href: "/dashboard/test", label: "📝 Тест" },
  { href: "/dashboard/video", label: "📹 Видео" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-4 border-b border-gray-700">
        <h1 className="font-bold text-lg">QazaqUndestik</h1>
        <p className="text-xs text-gray-400">Админ панель</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            <Button
              variant={pathname.startsWith(item.href) ? "secondary" : "ghost"}
              className={`w-full justify-start text-sm ${
                pathname.startsWith(item.href)
                  ? "bg-blue-600 text-white hover:bg-blue-700"
                  : "text-gray-300 hover:bg-gray-700 hover:text-white"
              }`}
            >
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Шығу
        </Button>
      </div>
    </aside>
  );
}
