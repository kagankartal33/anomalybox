"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Menu,
  X,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  BookOpen,
  Wrench,
  Shield,
  Layers,
  Boxes,
  UserRound,
  Bell,
  LogOut,
  LayoutDashboard,
  Package
} from "lucide-react";
import { premiumAssets } from "@/lib/premium-assets";

type SiteHeaderProps = {
  isLanding?: boolean;
  isAuthenticated?: boolean;
  role?: string;
  unreadCount?: number;
};

const publicNavLinks = [
  { href: "/content-ideas", label: "Content Ideas", icon: Sparkles },
  { href: "/tools", label: "Tools", icon: Wrench },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/store", label: "Store", icon: ShoppingBag },
  { href: "/pricing", label: "Pricing", icon: Layers },
  { href: "/atelier", label: "Atelier", icon: Shield },
];

export function SiteHeader({
  isLanding = false,
  isAuthenticated = false,
  role = "creator",
  unreadCount = 0,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  return (
    <>
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-[#FBF9F5]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2.5 sm:px-6 md:py-3">
          {/* Brand Logo */}
          <Link
            href={isAuthenticated ? "/boxes" : "/"}
            className="flex items-center gap-2 focus-ring py-1"
          >
            <Image
              src={premiumAssets.brand.logo}
              alt="Anomaly Box"
              width={200}
              height={44}
              sizes="160px"
              className="h-10 sm:h-12 md:h-16 w-auto object-contain"
              priority
            />
          </Link>

          {/* Desktop Navigation (>= md) */}
          <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1 text-sm font-medium">
            {isAuthenticated ? (
              <>
                <Link
                  className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                  href="/store"
                >
                  <Package className="mr-1 inline h-4 w-4 text-plum" /> Store
                </Link>
                <Link
                  className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                  href="/boxes"
                >
                  <Boxes className="mr-1 inline h-4 w-4 text-plum" /> Creator Vault
                </Link>
                <Link
                  className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                  href="/profile"
                >
                  <UserRound className="mr-1 inline h-4 w-4 text-plum" /> Profile
                </Link>
                <Link
                  aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
                  className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                  href="/profile#notifications"
                >
                  <Bell className="mr-1 inline h-4 w-4 text-plum" />
                  {unreadCount > 0 ? (
                    <span
                      aria-live="polite"
                      aria-atomic="true"
                      className="ml-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white"
                    >
                      {unreadCount}
                    </span>
                  ) : null}
                </Link>
                {role === "admin" ? (
                  <Link
                    className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                    href="/admin"
                  >
                    <LayoutDashboard className="mr-1 inline h-4 w-4 text-plum" /> Admin
                  </Link>
                ) : null}
                <form action="/api/auth/signout" method="post" className="ml-2">
                  <button
                    aria-label="Sign out"
                    className="flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 hover:bg-paper focus-ring text-ink/70 transition"
                    type="submit"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </>
            ) : (
              <>
                {publicNavLinks.map((link) => (
                  <Link
                    key={link.href}
                    className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                    href={link.href}
                  >
                    {link.label}
                  </Link>
                ))}
                {isLanding && (
                  <Link
                    className="rounded-md px-3 py-2 text-ink/80 hover:text-ink hover:bg-plum-soft/70 focus-ring transition"
                    href="#how"
                  >
                    How It Works
                  </Link>
                )}
                <Link
                  className="ml-2 rounded-md bg-ink px-4 py-2 font-semibold text-white hover:bg-black transition focus-ring shadow-sm"
                  href="/login"
                >
                  Sign in
                </Link>
              </>
            )}
          </nav>

          {/* Mobile Right Controls (< md) */}
          <div className="flex items-center gap-2 md:hidden">
            {isAuthenticated ? (
              <Link
                className="flex h-9 items-center gap-1 rounded-md bg-plum-deep px-3 text-xs font-semibold text-white shadow-sm"
                href="/boxes"
              >
                <Boxes className="h-3.5 w-3.5" />
                <span>Vault</span>
              </Link>
            ) : (
              <Link
                className="flex h-9 items-center rounded-md bg-ink px-3 text-xs font-semibold text-white hover:bg-black transition focus-ring"
                href="/login"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 bg-white text-ink hover:bg-paper transition focus-ring shadow-sm"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Standalone Fullscreen Mobile Drawer Menu (Outside Header Tree) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-[#FBF9F5] text-ink overflow-y-auto font-sans">
          {/* Drawer Top Bar */}
          <div className="flex h-14 items-center justify-between border-b border-ink/10 px-4">
            <Link
              href={isAuthenticated ? "/boxes" : "/"}
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 py-1"
            >
              <Image
                src={premiumAssets.brand.logo}
                alt="Anomaly Box"
                width={200}
                height={45}
                className="h-9 w-auto object-contain"
              />
            </Link>
            <button
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Close menu"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 bg-white text-ink hover:bg-paper transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Drawer Links List */}
          <div className="flex-1 px-4 py-6">
            <nav className="flex flex-col space-y-2.5">
              {isAuthenticated ? (
                <>
                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/boxes"
                    className="flex items-center justify-between rounded-xl border border-plum/20 bg-plum-soft/40 p-4 text-base font-semibold text-ink shadow-sm active:scale-98 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-plum text-white shadow-sm">
                        <Boxes className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-plum-deep">Creator Vault</div>
                        <div className="text-xs text-ink/60">Your unlocked shoot briefs</div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-plum" />
                  </Link>

                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/store"
                    className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4 text-base font-semibold text-ink shadow-sm active:bg-paper transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink">
                        <Package className="h-5 w-5 text-plum" />
                      </div>
                      <span>Commission a New Brief</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink/30" />
                  </Link>

                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/profile"
                    className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4 text-base font-semibold text-ink shadow-sm active:bg-paper transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink">
                        <UserRound className="h-5 w-5 text-plum" />
                      </div>
                      <span>Profile & Settings</span>
                    </div>
                    <ArrowRight className="h-4 w-4 text-ink/30" />
                  </Link>

                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/profile#notifications"
                    className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4 text-base font-semibold text-ink shadow-sm active:bg-paper transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink">
                        <Bell className="h-5 w-5 text-plum" />
                      </div>
                      <span>Notifications</span>
                    </div>
                    {unreadCount > 0 ? (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-xs font-bold text-white">
                        {unreadCount} new
                      </span>
                    ) : null}
                  </Link>

                  {role === "admin" ? (
                    <Link
                      onClick={() => setMobileMenuOpen(false)}
                      href="/admin"
                      className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4 text-base font-semibold text-ink shadow-sm active:bg-paper transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper text-ink">
                          <LayoutDashboard className="h-5 w-5 text-plum" />
                        </div>
                        <span>Admin Dashboard</span>
                      </div>
                      <ArrowRight className="h-4 w-4 text-ink/30" />
                    </Link>
                  ) : null}
                </>
              ) : (
                <>
                  {publicNavLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link
                        key={link.href}
                        onClick={() => setMobileMenuOpen(false)}
                        href={link.href}
                        className="flex items-center justify-between rounded-xl border border-ink/10 bg-white p-4 text-base font-semibold text-ink shadow-sm active:bg-paper transition"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-plum-soft/60 text-plum">
                            <Icon className="h-5 w-5" />
                          </div>
                          <span>{link.label}</span>
                        </div>
                        <ArrowRight className="h-4 w-4 text-ink/30" />
                      </Link>
                    );
                  })}
                </>
              )}
            </nav>

            {/* Bottom Actions */}
            <div className="mt-8 pt-6 border-t border-ink/10 flex flex-col gap-3">
              {isAuthenticated ? (
                <form action="/api/auth/signout" method="post" className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-ink/15 bg-white py-3.5 text-sm font-semibold text-red-600 shadow-sm active:bg-paper transition"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </form>
              ) : (
                <>
                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/store"
                    className="flex items-center justify-center gap-2 rounded-xl bg-plum-deep px-5 py-3.5 text-center font-semibold text-white shadow-md active:bg-plum transition"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    <span>Explore Store Briefs</span>
                  </Link>
                  <Link
                    onClick={() => setMobileMenuOpen(false)}
                    href="/login"
                    className="rounded-xl border border-ink/15 bg-white py-3 text-center text-sm font-semibold text-ink shadow-sm active:bg-paper transition"
                  >
                    Sign In to Creator Vault
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
