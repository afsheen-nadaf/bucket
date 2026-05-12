import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Sparkles, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import AuthBackground from "../components/AuthBackground";

export default function Signup() {
  const { user, loading, signUp } = useAuth();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Success state for email verify

  // FIX #2: The Bouncer
  useEffect(() => {
    if (user && !loading) {
      navigate("/");
    }
  }, [user, loading, navigate]);

  const validateUsername = (value) => {
    if (value.length < 3) {
      setUsernameError("at least 3 characters");
      return false;
    }
    if (value.includes(" ")) {
      setUsernameError("no spaces allowed");
      return false;
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameError("lowercase, numbers, and underscore only");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase(); // FIX #4: Force lowercase
    setUsername(value);
    if (value) validateUsername(value);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);
    setPasswordError("");

    // Custom Validation (Replaces 'required' attribute)
    if (
      !firstName.trim() ||
      !lastName.trim() ||
      !email ||
      !username ||
      !password ||
      !confirmPassword
    ) {
      setError("please fill out all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("please enter a valid email address");
      return;
    }

    if (!validateUsername(username)) {
      setUsernameError("username invalid");
      return;
    }

    if (password !== confirmPassword) {
      setPasswordError("passwords do not match");
      return;
    }

    if (password.length < 6) {
      setPasswordError("password must be at least 6 characters");
      return;
    }

    setIsLoading(true);

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();

    if (existing) {
      setUsernameError("this username is already taken");
      setIsLoading(false);
      return;
    }

    // Call your AuthContext signUp function
    const { error } = await signUp(
      email,
      password,
      firstName,
      lastName,
      username,
    );

    setIsLoading(false);

    if (error) {
      setError(error.message);
    } else {
      // Show the "Check your email" success screen!
      setIsSuccess(true);
    }
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-x-hidden lowercase font-poppins text-ink">
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
            join the collection
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

        {isSuccess ? (
          <div className="flex flex-col items-center gap-4 py-6 animate-fade-in text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-green-500 shadow-sm border border-green-200">
              <CheckCircle2 size={40} strokeWidth={2.5} />
            </div>
            <div>
              <h2 className="font-extrabold text-xl mb-2 text-slate-800">
                check your inbox!
              </h2>
              <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                we sent a verification link to{" "}
                <span className="font-bold text-slate-700">{email}</span>. click
                the link to activate your account and log in.
              </p>
            </div>
            <Link
              to="/login"
              className="mt-4 px-6 py-2.5 rounded-full bg-white/60 border border-white hover:bg-white transition-all text-sm font-bold shadow-sm hover:scale-105 active:scale-95"
              style={{ color: "#6495ed" }}
            >
              back to login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label
                  className="text-xs sm:text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "rgba(26,26,46,0.6)" }}
                >
                  first name
                </label>
                <input
                  type="text"
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
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="john"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label
                  className="text-xs sm:text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "rgba(26,26,46,0.6)" }}
                >
                  last name
                </label>
                <input
                  type="text"
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
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="doe"
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                username
              </label>
              <div>
                <input
                  type="text"
                  className="w-full px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm shadow-inner"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: usernameError
                      ? "1.5px solid rgba(220,38,38,0.5)"
                      : "1.5px solid rgba(255,255,255,0.8)",
                    color: "#1a1a2e",
                  }}
                  onFocus={(e) =>
                    !usernameError &&
                    (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                  }
                  onBlur={(e) =>
                    !usernameError &&
                    (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                  }
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="john_doe"
                />
                {usernameError && (
                  <p
                    className="text-xs mt-1 font-medium"
                    style={{ color: "#dc2626" }}
                  >
                    {usernameError}
                  </p>
                )}
              </div>
            </div>

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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-[11px] font-bold uppercase tracking-wider"
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
                    border: passwordError
                      ? "1.5px solid rgba(220,38,38,0.5)"
                      : "1.5px solid rgba(255,255,255,0.8)",
                    color: "#1a1a2e",
                  }}
                  onFocus={(e) =>
                    !passwordError &&
                    (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                  }
                  onBlur={(e) =>
                    !passwordError &&
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
                className="text-[11px] font-bold uppercase tracking-wider"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                confirm password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="w-full px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm pr-12 shadow-inner"
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: passwordError
                      ? "1.5px solid rgba(220,38,38,0.5)"
                      : "1.5px solid rgba(255,255,255,0.8)",
                    color: "#1a1a2e",
                  }}
                  onFocus={(e) =>
                    !passwordError &&
                    (e.target.style.borderColor = "rgba(100,149,237,0.5)")
                  }
                  onBlur={(e) =>
                    !passwordError &&
                    (e.target.style.borderColor = "rgba(255,255,255,0.8)")
                  }
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {passwordError && (
                <p
                  className="text-xs mt-1 font-medium"
                  style={{ color: "#dc2626" }}
                >
                  {passwordError}
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-[0.875rem] rounded-[0.75rem] font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 mt-2 shadow-md"
              style={{
                background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
              }}
            >
              {isLoading ? "creating account..." : "create account"}
            </button>
          </form>
        )}

        <p
          className="text-center text-xs font-medium"
          style={{ color: "rgba(26,26,46,0.6)" }}
        >
          already have an account?{" "}
          <Link
            to="/login"
            className="font-bold hover:underline underline-offset-2"
            style={{ color: "#6495ed" }}
          >
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}
