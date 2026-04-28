import { useState, useEffect } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Home, List, User } from "lucide-react";
import Iridescence from "./Iridescence";

export default function Layout() {
  const { user } = useAuth();
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItems = [
    { path: "/", label: "home", icon: Home },
    { path: "/lists", label: "collections", icon: List },
    { path: "/profile", label: "profile", icon: User },
  ];

  // --- REUSABLE GLASS STYLE ---
  const navGlassStyle = {
    background: "rgba(100, 149, 237, 0.75)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
    border: "1px solid rgba(255,255,255,0.3)",
    boxShadow:
      "0 8px 32px rgba(100,149,237,0.4), 0 2px 8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.2)",
  };

  return (
    <div className="min-h-screen flex flex-col bg-cream relative overflow-x-hidden">
      {/* Persistent background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
        }}
      >
        <Iridescence color={[0.4, 0.6, 1.0]} speed={0.5} amplitude={0.06} />
      </div>
      {/* Cornflower blue filter overlay */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1,
          pointerEvents: "none",
          background: "rgba(100, 149, 237, 0.35)",
        }}
      />

      {/* Desktop navbar */}
      {!isMobile && (
        <header className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-fit group">
          <div
            className="rounded-full px-10 py-2 flex items-center gap-4 group-hover:gap-24 transition-all duration-500 ease-out"
            style={navGlassStyle}
          >
            <Link
              to="/"
              className="flex items-center text-white hover:scale-105 transition-transform"
            >
              <span
                style={{ fontFamily: "'Sniglet', cursive", fontWeight: 800 }}
                className="text-2xl tracking-wide drop-shadow-sm text-white"
              >
                bucket
              </span>
            </Link>

            <nav className="flex items-center justify-center gap-5 group-hover:gap-10 transition-all duration-500 ease-out">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`lowercase font-bold px-4 py-2 rounded-full transition-all duration-300 flex items-center text-sm whitespace-nowrap ${
                      isActive
                        ? "bg-white text-cornflower shadow-md scale-105"
                        : "text-white/80 hover:text-white hover:bg-white/20 hover:scale-105"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>
      )}

      {/* Mobile bottom tab bar */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={navGlassStyle}
      >
        <div className="flex justify-around items-center h-20 px-4">
          {navItems.map((item) => {
            const IconComponent = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center w-14 h-14 rounded-2xl transition-all ${
                  isActive ? "bg-white/30" : "hover:bg-white/10"
                }`}
              >
                <IconComponent
                  size={24}
                  className={isActive ? "text-white" : "text-white/70"}
                />
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Main Page Content */}
      <main className="flex-1 w-full relative z-10 px-4 sm:px-6 md:px-8 pt-8 md:pt-28 pb-24 md:pb-12 overflow-x-hidden">
        <div className="relative z-10">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
