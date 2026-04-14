import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { BookHeart } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    const { error } = await signIn(email, password);
    if (error) setError(error.message);
    else navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-warmGray/10 p-8">
        <div className="flex flex-col items-center mb-8 text-cornflower">
          <BookHeart size={48} className="mb-2" />
          <h1 className="text-3xl text-ink">Welcome back</h1>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-warmGray mb-1">
              Email
            </label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 rounded-xl border border-warmGray/30 focus:outline-none focus:ring-2 focus:ring-lightTint focus:border-cornflower transition-all bg-cream/50"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-warmGray mb-1">
              Password
            </label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 rounded-xl border border-warmGray/30 focus:outline-none focus:ring-2 focus:ring-lightTint focus:border-cornflower transition-all bg-cream/50"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            type="submit"
            className="mt-2 w-full bg-cornflower hover:bg-cornflower/90 text-white font-medium py-2.5 rounded-xl transition-colors"
          >
            Log in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-warmGray">
          Don't have an account?{" "}
          <Link
            to="/signup"
            className="text-cornflower font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
