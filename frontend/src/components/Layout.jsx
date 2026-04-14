import { useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogOut, Menu, X } from "lucide-react";

export default function Layout() {
  const { signOut } = useAuth();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/lists", label: "My Lists" },
    { path: "/friends", label: "Friends" },
    { path: "/profile", label: "Profile" },
  ];

  // --- REUSABLE GLASS STYLE ---
  // Lowered opacity to 0.75 to let the frosted glass blur shine through!
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
      {/* --- FLOATING NAVBAR --- */}
      <header className="fixed top-4 inset-x-4 md:inset-x-auto md:left-1/2 md:-translate-x-1/2 z-50 md:w-fit group">
        {/* UPDATED EXPANSION: 
          Locked the padding (md:px-10) so the distance to the edge never changes.
          Added group-hover:md:gap-24 to push the items apart from the center!
        */}
        <div
          className="rounded-full px-4 py-2 md:px-10 flex items-center gap-2 md:gap-4 group-hover:md:gap-24 transition-all duration-500 ease-out"
          style={navGlassStyle}
        >
          <div className="w-24 md:w-36 shrink-0 flex justify-start">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center text-white hover:scale-105 transition-transform"
            >
              <span className="font-sniglet text-2xl font-extrabold tracking-wide mt-1 drop-shadow-sm">
                bucket
              </span>
            </Link>
          </div>

          {/* UPDATED GAP: Center links also push apart slightly on hover */}
          <nav className="hidden md:flex items-center justify-center gap-1 md:gap-5 group-hover:md:gap-10 transition-all duration-500 ease-out shrink-0">
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

          <div className="hidden md:flex w-24 md:w-36 shrink-0 justify-end">
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-white/90 hover:text-white hover:bg-white/20 transition-colors text-sm font-normal lowercase px-4 py-2 rounded-full"
            >
              <span>log out</span>
              <LogOut size={16} />
            </button>
          </div>

          <div className="md:hidden flex w-24 shrink-0 justify-end">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-full hover:bg-white/20 transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* --- MOBILE DROPDOWN MENU --- */}
        <div
          className={`absolute top-full left-0 right-0 mt-2 mx-2 rounded-3xl overflow-hidden transition-all duration-300 md:hidden ${
            isMobileMenuOpen
              ? "max-h-96 opacity-100"
              : "max-h-0 opacity-0 pointer-events-none"
          }`}
          style={navGlassStyle}
        >
          <nav className="flex flex-col p-4 gap-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`lowercase font-bold px-4 py-3 rounded-2xl transition-all duration-200 text-center ${
                    isActive
                      ? "bg-white text-cornflower shadow-sm"
                      : "text-white/90 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
            <hr className="border-white/20 my-2" />
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                signOut();
              }}
              className="flex items-center justify-center gap-2 text-white bg-white/10 hover:bg-white/20 px-4 py-3 rounded-2xl transition-colors font-normal lowercase w-full"
            >
              <LogOut size={18} />
              <span>log out</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Page Content - Push down content so it doesn't hide behind the floating nav */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 pt-28 pb-12 relative z-10">
        <Outlet />
      </main>
    </div>
  );
}
