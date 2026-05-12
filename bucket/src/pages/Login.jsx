import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Sparkles, Eye, EyeOff } from "lucide-react";
import { supabase } from "../lib/supabase";
import AuthBackground from "../components/AuthBackground";

export default function Login() {
  const { user, loading, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  // FIX #2: The Bouncer - Redirect already logged-in users
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    // Custom Validation (Replaces 'required' attribute)
    if (!email || !password) {
      setError("please enter your email and password");
      return;
    }

    setIsLoading(true);
    const { error } = await signIn(email, password);
    setIsLoading(false);

    if (error) {
      if (
        error.message?.includes("Invalid login credentials") ||
        error.message?.includes("user not found")
      ) {
        setError("looks like this account doesn't exist, please create one!");
      } else {
        setError(error.message);
      }
    } else {
      navigate("/");
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError(null);

    if (!forgotPasswordEmail) {
      setError("please enter your email address");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(
      forgotPasswordEmail,
      {
        redirectTo: `${window.location.origin}/update-password`,
      },
    );

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      setResetSuccess(true);
      setForgotPasswordEmail("");
      setTimeout(() => {
        setResetSuccess(false);
        setShowForgotPassword(false);
      }, 3000);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-x-hidden lowercase font-poppins">
      <AuthBackground />

      <div
        className="relative z-10 w-full max-w-[420px] rounded-[2rem] p-6 sm:p-8 md:p-10 flex flex-col gap-6 mx-4 md:mx-0 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.7)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-sniglet font-extrabold text-ink">
              bucket
            </h1>
            <Sparkles size={28} className="text-cornflower" />
          </div>
          <p
            className="text-sm font-medium"
            style={{ color: "rgba(26,26,46,0.6)" }}
          >
            welcome back
          </p>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm font-medium animate-fade-in"
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label
              className="text-xs sm:text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(26,26,46,0.6)" }}
            >
              email
            </label>
            <input
              type="email"
              className="px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm shadow-inner"
              style={{
                background: "rgba(255,255,255,0.75)",
                border: "1.5px solid rgba(255,255,255,0.8)",
                color: "#1a1a2e",
              }}
              onFocus={(e) =>
                (e.target.style.borderColor = "rgba(100,149,237,0.5)")
              }
              onBlur={(e) =>
                (e.target.style.borderColor = "rgba(255,255,255,0.8)")
              }
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-xs sm:text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "rgba(26,26,46,0.6)" }}
            >
              password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm pr-12 shadow-inner"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1.5px solid rgba(255,255,255,0.8)",
                  color: "#1a1a2e",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-[0.875rem] rounded-[0.75rem] font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 mt-2 shadow-md"
            style={{
              background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
            }}
          >
            {isLoading ? "signing in..." : "sign in"}
          </button>
        </form>

        {!showForgotPassword ? (
          <button
            type="button"
            onClick={() => setShowForgotPassword(true)}
            className="text-xs font-medium hover:underline transition-all"
            style={{ color: "#6495ed" }}
          >
            forgot password?
          </button>
        ) : (
          <form
            onSubmit={handleForgotPassword}
            className="flex flex-col gap-3 pt-2 border-t border-white/20 animate-fade-in"
          >
            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                email
              </label>
              <input
                type="email"
                className="px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm shadow-inner"
                style={{
                  background: "rgba(255,255,255,0.75)",
                  border: "1.5px solid rgba(255,255,255,0.8)",
                  color: "#1a1a2e",
                }}
                onFocus={(e) =>
                  (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                }
                onBlur={(e) =>
                  (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                }
                value={forgotPasswordEmail}
                onChange={(e) => setForgotPasswordEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-[0.75rem] rounded-[0.75rem] font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-md"
                style={{
                  background:
                    "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
                }}
              >
                {isLoading ? "sending..." : "send reset link"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForgotPassword(false);
                  setError(null);
                }}
                className="flex-1 py-[0.75rem] rounded-[0.75rem] font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: "rgba(255,255,255,0.3)",
                  color: "rgba(26,26,46,0.7)",
                }}
              >
                cancel
              </button>
            </div>
            {resetSuccess && (
              <div
                className="px-3 py-2 rounded-lg text-xs font-medium text-center animate-fade-in"
                style={{
                  color: "#059669",
                  background: "rgba(5,150,105,0.1)",
                }}
              >
                check your email for a reset link
              </div>
            )}
          </form>
        )}

        <p
          className="text-center text-xs font-medium"
          style={{ color: "rgba(26,26,46,0.6)" }}
        >
          don't have an account?{" "}
          <Link
            to="/signup"
            className="font-bold hover:underline underline-offset-2"
            style={{ color: "#6495ed" }}
          >
            sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
