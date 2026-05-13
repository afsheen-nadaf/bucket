import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthBackground from "../components/AuthBackground";

export default function UpdatePassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  // Listen for the PASSWORD_RECOVERY event to know when to show the update password form
  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // Clear the URL query parameters to prevent confusion if the user refreshes the page
        window.history.replaceState(null, "", window.location.pathname);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setError(null);

    // Custom validation messages replacing the ugly browser defaults!
    if (!password) {
      setError("please enter a new password");
      return;
    }

    if (!confirmPassword) {
      setError("please confirm your new password");
      return;
    }

    if (password !== confirmPassword) {
      setError("passwords do not match");
      return;
    }

    if (password.length < 6) {
      setError("password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({
      password: password,
    });

    setIsLoading(false);

    if (error) {
  setError(error.message);
} else {
  setSuccess(true);
  setTimeout(async () => {
    await supabase.auth.signOut();
    navigate("/login");
  }, 2500);
}
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-x-hidden lowercase">
      <AuthBackground />

      <div
        className="relative z-10 w-full max-w-[420px] rounded-[2rem] p-10 md:p-10 flex flex-col gap-6 mx-4 md:mx-0 shadow-xl"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.7)",
        }}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-poppins font-extrabold text-ink">
              bucket
            </h1>
            <Sparkles size={28} className="text-cornflower" />
          </div>
          <p className="text-sm" style={{ color: "rgba(26,26,46,0.6)" }}>
            set a new password
          </p>
        </div>

        {error && (
          <div
            className="px-4 py-3 rounded-xl text-sm font-medium"
            style={{
              background: "rgba(220, 38, 38, 0.1)",
              color: "#dc2626",
            }}
          >
            {error}
          </div>
        )}

        {success ? (
          <div className="flex flex-col items-center gap-4 py-4 animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-500">
              <CheckCircle2 size={32} strokeWidth={2.5} />
            </div>
            <div className="text-center">
              <h2 className="font-poppins font-bold text-ink text-lg">
                password updated!
              </h2>
              <p className="text-sm text-ink/60 mt-1">taking you to login...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                new password
              </label>
              <div className="relative">
                {/* Removed 'required' attribute */}
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm pr-12"
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

            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                confirm password
              </label>
              <div className="relative">
                {/* Removed 'required' attribute */}
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm pr-12"
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
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
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
              {isLoading ? "updating..." : "update password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}