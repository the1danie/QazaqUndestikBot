"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, BookOpen, PenLine, FileText, Video, Tag } from "lucide-react";

const NAV = [
  { href: "/dashboard/erezhe",    label: "Ереже",   icon: BookOpen },
  { href: "/dashboard/zhattyghu", label: "Жаттығу", icon: PenLine  },
  { href: "/dashboard/test",      label: "Тест",    icon: FileText },
  { href: "/dashboard/video",     label: "Видео",   icon: Video    },
  { href: "/dashboard/topics",    label: "Тақырыптар", icon: Tag     },
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
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href}>
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm gap-2 ${
                  active
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "text-gray-300 hover:bg-gray-700 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Button>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start text-gray-400 hover:text-white hover:bg-gray-700 gap-2"
        >
          <LogOut className="h-4 w-4" />
          Шығу
        </Button>
      </div>
    </aside>
  );
}
