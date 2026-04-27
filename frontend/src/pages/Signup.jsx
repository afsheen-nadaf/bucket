import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";
import { Sparkles } from "lucide-react";
import Iridescence from "../components/Iridescence";

export default function Signup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const validateUsername = (value) => {
    if (value.length < 3) {
      setUsernameError("At least 3 characters");
      return false;
    }
    if (value.includes(" ")) {
      setUsernameError("No spaces allowed");
      return false;
    }
    if (!/^[a-z0-9_]+$/.test(value)) {
      setUsernameError("Lowercase, numbers, and underscore only");
      return false;
    }
    setUsernameError("");
    return true;
  };

  const handleUsernameChange = (e) => {
    const value = e.target.value.toLowerCase();
    setUsername(value);
    if (value) validateUsername(value);
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateUsername(username)) {
      setUsernameError("Username invalid");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setError("First and last name are required");
      return;
    }

    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", username)
      .maybeSingle();
    if (existing) {
      setUsernameError("this username is already taken");
      return;
    }

    setIsLoading(true);
    const { error } = await signUp(
      email,
      password,
      firstName,
      lastName,
      username,
    );
    setIsLoading(false);
    if (error) setError(error.message);
    else navigate("/");
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center p-4 overflow-x-hidden">
      {/* Iridescent background */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 0,
          pointerEvents: "none",
          opacity: 0.4,
        }}
      >
        <Iridescence color={[0.4, 0.6, 1.0]} speed={0.5} amplitude={0.06} />
      </div>

      {/* Glass card */}
      <div
        className="relative z-10 w-full max-w-[420px] rounded-[2rem] p-10 md:p-10 flex flex-col gap-6 mx-4 md:mx-0"
        style={{
          background: "rgba(255,255,255,0.55)",
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(255,255,255,0.7)",
        }}
      >
        {/* Header */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-poppins font-extrabold text-ink">
              bucket
            </h1>
            <Sparkles size={28} className="text-cornflower" />
          </div>
          <p className="text-sm" style={{ color: "rgba(26,26,46,0.6)" }}>
            join the collection
          </p>
        </div>

        {/* Error message */}
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

        {/* Form */}
        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          {/* First and Last Name - Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                First Name
              </label>
              <input
                type="text"
                required
                className="px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm"
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
                placeholder="John"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label
                className="text-xs font-bold uppercase tracking-wide"
                style={{ color: "rgba(26,26,46,0.6)" }}
              >
                Last Name
              </label>
              <input
                type="text"
                required
                className="px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm"
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
                placeholder="Doe"
              />
            </div>
          </div>

          {/* Username */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "rgba(26,26,46,0.6)" }}
            >
              Username
            </label>
            <div>
              <input
                type="text"
                required
                className="w-full px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm"
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
                <p className="text-xs mt-1" style={{ color: "#dc2626" }}>
                  {usernameError}
                </p>
              )}
            </div>
          </div>

          {/* Email */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "rgba(26,26,46,0.6)" }}
            >
              Email
            </label>
            <input
              type="email"
              required
              className="px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm"
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

          {/* Password */}
          <div className="flex flex-col gap-2">
            <label
              className="text-xs font-bold uppercase tracking-wide"
              style={{ color: "rgba(26,26,46,0.6)" }}
            >
              Password
            </label>
            <input
              type="password"
              required
              className="px-4 py-3 rounded-[0.75rem] outline-none transition-all text-sm"
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
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-[0.875rem] rounded-[0.75rem] font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 mt-2"
            style={{
              background: "linear-gradient(135deg, #6495ed 0%, #8b6cf7 100%)",
            }}
          >
            {isLoading ? "creating account..." : "create account"}
          </button>
        </form>

        {/* Login link */}
        <p
          className="text-center text-xs"
          style={{ color: "rgba(26,26,46,0.6)" }}
        >
          already have an account?{" "}
          <Link to="/login" className="font-bold" style={{ color: "#6495ed" }}>
            log in
          </Link>
        </p>
      </div>
    </div>
  );
}
