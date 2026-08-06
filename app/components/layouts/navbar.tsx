"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import Button from "../ui/button";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaMoon } from "react-icons/fa";
import { IoMdPartlySunny } from "react-icons/io";
import { useThemeStore } from "../../store/themeStore";
interface NavItem {
  name: string;
  href: string;
}
const navItems: NavItem[] = [
  { name: "Home", href: "/" },
  { name: "Discover", href: "/discover" },
  { name: "Profile", href: "/profile" },
];
export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { data: session } = useSession();
  const { theme: appTheme, toggleTheme } = useThemeStore();
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const headerVariants = {
    initial: { y: -100, opacity: 0 },
    animate: { y: 0, opacity: 1 },
    scrolled: {
      backdropFilter: "blur(20px)",
      backgroundColor:
        appTheme === "dark" ? "rgba(0, 0, 0, 0.8)" : "rgba(255, 255, 255, 0.8)",
      boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
    },
  };

  const mobileMenuVariants = {
    closed: { opacity: 0, height: 0 },
    open: { opacity: 1, height: "auto" },
  };
  const ThemeToggleButton: React.FC = () => {
    return appTheme === "light" ? (
      <button
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="rounded-md p-1"
      >
        <IoMdPartlySunny className="size-6 cursor-pointer text-accent" />
      </button>
    ) : (
      <button
        aria-label="Toggle theme"
        onClick={toggleTheme}
        className="rounded-md p-1"
      >
        <FaMoon className="size-5 cursor-pointer text-accent" />
      </button>
    );
  };
  return (
    <motion.header
      className="fixed top-0 right-0 left-0 z-50 transition-all duration-300 font-poppins"
      variants={headerVariants}
      initial="initial"
      animate={isScrolled ? "scrolled" : "animate"}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      style={{
        backdropFilter: isScrolled ? "blur(20px)" : "none",
        backgroundColor: isScrolled
          ? appTheme === "dark"
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(255, 255, 255, 0.8)"
          : "rgba(0, 0, 0, 0)",
        boxShadow: isScrolled ? "0 8px 32px rgba(0, 0, 0, 0.1)" : "none",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between lg:h-20">
          <motion.div
            className="flex items-center space-x-2"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <Link
              prefetch={false}
              href="/"
              className="flex items-center space-x-2 font-fascinate-inline text-2xl font-bold text-accent"
            >
              Debatrix
            </Link>
          </motion.div>

          <nav className="hidden items-center space-x-8 lg:flex">
            {navItems.map((item) => (
              <div key={item.name} className="relative">
                <Link
                  prefetch={false}
                  href={item.href}
                  className="text-foreground flex items-center space-x-1 font-medium transition-colors duration-200 hover:text-secondary"
                >
                  <span>{item.name}</span>
                </Link>
              </div>
            ))}
          </nav>

          <div className="hidden items-center space-x-6 lg:flex">
            <ThemeToggleButton />
            <Button
              onClick={session ? () => signOut() : () => signIn()}
              variant="secondary"
              className="text-sm"
            >
              {session ? "Sign Out" : "Sign In"}
            </Button>
          </div>
          <div className="flex items-center space-x-6 lg:hidden">
            <ThemeToggleButton />
            <motion.button
              className="hover:bg-muted rounded-lg p-2 transition-colors duration-200"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              whileTap={{ scale: 0.95 }}
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              className="overflow-hidden lg:hidden"
              variants={mobileMenuVariants}
              initial="closed"
              animate="open"
              exit="closed"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className="border-border bg-muted mt-4 space-y-2 rounded-xl border py-4">
                {navItems.map((item) => (
                  <Link
                    prefetch={false}
                    key={item.name}
                    href={item.href}
                    className="text-foreground hover:bg-secondary hover:text-background block px-4 py-3 font-medium transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <div className="space-y-2 px-4 py-2">
                  <Button
                    onClick={session ? () => signOut() : () => signIn()}
                    variant="secondary"
                    className="text-sm rounded-sm w-full"
                  >
                    {session ? "Sign Out" : "Sign In"}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}
