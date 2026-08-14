"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCurrentUser } from "@/lib/useCurrentUser";

type NavItem = { label: string; path: string };

const navItems: NavItem[] = [
  { label: "Meal Manager", path: "/meal-planner" },
  { label: "Search History", path: "/search-history" },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useCurrentUser();
  const profileImage = user?.profile?.profileImage || "/images/default-profile-pic.png";

  return (
    <div className="w-60 bg-[#d5a16e] px-5 pb-5 min-h-full font-[Comic_Sans_MS,cursive,sans-serif] shadow-md">
      <div className="w-16 h-16 rounded-full overflow-hidden mt-4 mb-6 border-2 border-white mx-auto">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
      </div>

      {navItems.map((item) => (
        <Link
          key={item.path}
          href={item.path}
          className={`block w-full px-4 py-3 text-white font-bold text-base text-left rounded-lg transition-colors duration-200 ${
            pathname === item.path ? "bg-[#b87b45]" : "hover:bg-[#b87b45]"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
};
