"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { toast } from "react-toastify";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MapRoundedIcon from "@mui/icons-material/MapRounded";
import ExploreRoundedIcon from "@mui/icons-material/ExploreRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const NAV = [
  { label: "Home", href: "/", icon: HomeRoundedIcon, match: (p: string) => p === "/" },
  { label: "Map", href: "/map", icon: MapRoundedIcon, match: (p: string) => p.startsWith("/map") },
  { label: "Discover", href: "/discover", icon: ExploreRoundedIcon, match: (p: string) => p.startsWith("/discover") },
  { label: "Meals", href: "/meal-planner", icon: RestaurantMenuRoundedIcon, match: (p: string) => p.startsWith("/meal-planner") },
  { label: "Trips", href: "/travel-plans", icon: LuggageRoundedIcon, match: (p: string) => p.startsWith("/travel-plan") },
];

const DRAWER_LINKS = [
  { label: "Profile", href: "/profile" },
  { label: "Saved restaurants", href: "/saved-restaurants" },
  { label: "Explore by city", href: "/travel-planning" },
  { label: "Search history", href: "/search-history" },
];

export const NavBar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { isLoggedIn, user, userName, status } = useCurrentUser();
  const [drawer, setDrawer] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Hide the app chrome on the public marketing/auth screens.
  const bareRoutes = ["/mainUI", "/login", "/register"];
  const bare = bareRoutes.includes(pathname);

  const handleLogout = async () => {
    setDrawer(false);
    await signOut({ redirect: false });
    toast.success("Logged out - see you soon!");
    router.push("/login");
  };

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-[1100] border-b border-[var(--border)] bg-[var(--surface)]/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Brand */}
          <Link href={isLoggedIn ? "/" : "/mainUI"} className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-sunset text-lg shadow-[var(--shadow-sm)]">
              🐰
            </span>
            <span className="font-display text-lg font-extrabold tracking-tight text-[var(--text)]">
              Finding <span className="text-gradient">Nibbles</span>
            </span>
          </Link>

          {/* Desktop nav */}
          {isLoggedIn && !bare && (
            <div className="hidden items-center gap-1 md:flex">
              {NAV.map((item) => {
                const active = item.match(pathname);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 rounded-full px-3.5 py-2 text-sm font-bold transition-colors ${
                      active
                        ? "bg-sunset-soft text-[var(--terracotta-strong)]"
                        : "text-[var(--text-muted)] hover:bg-[var(--bg)] hover:text-[var(--text)]"
                    }`}
                  >
                    <Icon fontSize="small" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          )}

          {/* Right actions */}
          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {/* While auth is still unknown, render nothing here so the bar
                doesn't flip between logged-out and logged-in states. */}
            {bare || status === "loading" ? null : !isLoggedIn ? (
              <>
                <Link href="/login" className="rounded-full px-3 py-2 text-sm font-bold text-[var(--text-muted)] hover:text-[var(--text)]">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="rounded-full bg-sunset px-4 py-2 text-sm font-extrabold text-white shadow-[var(--shadow-sm)] hover:brightness-105"
                >
                  Sign up
                </Link>
              </>
            ) : (
              <>
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  className="grid h-9 w-9 place-items-center rounded-full text-[var(--text)] hover:bg-[var(--bg)] md:hidden"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <CloseRoundedIcon fontSize="small" /> : <MenuRoundedIcon fontSize="small" />}
                </button>
                <button
                  onClick={() => setDrawer(true)}
                  className="flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--bg)] py-1 pl-1 pr-3 hover:shadow-[var(--shadow-sm)]"
                  aria-label="Open profile menu"
                >
                  <span className="grid h-7 w-7 place-items-center overflow-hidden rounded-full bg-sunset-soft">
                    {user?.profile?.profileImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.profile.profileImage} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PersonRoundedIcon fontSize="small" className="text-[var(--terracotta)]" />
                    )}
                  </span>
                  <span className="hidden max-w-[8rem] truncate text-sm font-bold text-[var(--text)] sm:block">
                    {userName}
                  </span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile nav sheet */}
        {isLoggedIn && !bare && mobileOpen && (
          <div className="border-t border-[var(--border)] bg-[var(--surface)] px-3 py-2 md:hidden">
            {NAV.map((item) => {
              const active = item.match(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold ${
                    active ? "bg-sunset-soft text-[var(--terracotta-strong)]" : "text-[var(--text)]"
                  }`}
                >
                  <Icon fontSize="small" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Profile drawer */}
      {drawer && (
        <>
          <div className="fixed inset-0 z-[1200] bg-black/40 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="fixed right-0 top-0 z-[1300] flex h-full w-80 max-w-[85vw] flex-col bg-[var(--surface)] p-6 shadow-[var(--shadow-lg)]">
            <div className="flex justify-end">
              <button onClick={() => setDrawer(false)} className="grid h-9 w-9 place-items-center rounded-full hover:bg-[var(--bg)]" aria-label="Close">
                <CloseRoundedIcon />
              </button>
            </div>
            <div className="mt-2 flex flex-col items-center gap-3 pb-6">
              <div className="h-20 w-20 overflow-hidden rounded-full ring-4 ring-[var(--bg)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={user?.profile?.profileImage || "/images/default-profile-pic.png"}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="text-center">
                <div className="font-display text-lg font-extrabold text-[var(--text)]">{userName}</div>
                {user?.username && <div className="text-sm text-[var(--text-muted)]">@{user.username}</div>}
              </div>
            </div>
            <nav className="flex flex-1 flex-col gap-1">
              {DRAWER_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setDrawer(false)}
                  className="rounded-xl px-4 py-3 font-bold text-[var(--text)] hover:bg-[var(--bg)]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
            <button
              onClick={handleLogout}
              className="mt-2 rounded-xl border border-[var(--border)] px-4 py-3 font-bold text-[var(--paprika)] hover:bg-[var(--bg)]"
            >
              Log out
            </button>
          </aside>
        </>
      )}
    </>
  );
};
