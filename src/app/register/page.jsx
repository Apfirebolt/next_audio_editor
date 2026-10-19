"use client";

import { useState, Fragment, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RadioIcon, ArrowRightIcon, LockClosedIcon, EnvelopeIcon, UserIcon } from "@heroicons/react/24/outline";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import AOS from "aos";
import "aos/dist/aos.css";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    AOS.init({
      duration: 800,
      once: true,
      easing: "ease-out-cubic",
    });
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!username || !email || !password) {
      setError("Please enter your username, email, and password.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.message || "Registration failed");
      }

      // Redirect on success
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Fragment>
      <Header />
      <main className="min-h-screen bg-light dark:bg-dark flex items-center justify-center p-6 transition-colors">
        <div 
          data-aos="fade-up"
          className="w-full max-w-md bg-white dark:bg-tertiary/5 border border-tertiary/20 dark:border-tertiary/10 rounded-3xl shadow-sm p-8 space-y-8"
        >
          
          {/* Brand Header */}
          <div className="text-center space-y-3" data-aos="fade-down" data-aos-delay="100">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 mb-1">
              <RadioIcon className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-wider font-heading text-dark dark:text-light">
              SoftGenie <span className="text-primary">Beats</span>
            </h1>
            <p className="text-xs text-dark/60 dark:text-light/60 font-sans leading-relaxed">
              Create your studio account to start producing tracks.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 font-sans" data-aos="fade-up" data-aos-delay="200">
            {error && (
              <div className="text-xs text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl font-medium">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label htmlFor="username" className="block text-xs font-bold text-dark dark:text-light uppercase tracking-wider font-heading">
                Producer Handle
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark/30 dark:text-light/30">
                  <UserIcon className="h-4 w-4" />
                </span>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-dark border border-tertiary/30 rounded-xl focus:outline-none focus:border-primary text-dark dark:text-light placeholder-dark/30 dark:placeholder-light/30 shadow-inner"
                  placeholder="beatmaker_99"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-xs font-bold text-dark dark:text-light uppercase tracking-wider font-heading">
                Producer Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark/30 dark:text-light/30">
                  <EnvelopeIcon className="h-4 w-4" />
                </span>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-dark border border-tertiary/30 rounded-xl focus:outline-none focus:border-primary text-dark dark:text-light placeholder-dark/30 dark:placeholder-light/30 shadow-inner"
                  placeholder="producer@softgenie.org"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-xs font-bold text-dark dark:text-light uppercase tracking-wider font-heading">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-dark/30 dark:text-light/30">
                  <LockClosedIcon className="h-4 w-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 text-sm bg-white dark:bg-dark border border-tertiary/30 rounded-xl focus:outline-none focus:border-primary text-dark dark:text-light placeholder-dark/30 dark:placeholder-light/30 shadow-inner"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold text-white bg-primary hover:bg-secondary rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/25 disabled:opacity-50 cursor-pointer"
            >
              <span>{loading ? "Initializing Studio..." : "Create Studio Account"}</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
          </form>

          {/* Footer Link */}
          <div className="text-center text-xs text-dark/60 dark:text-light/60 font-sans pt-2 border-t border-tertiary/20 dark:border-tertiary/10" data-aos="fade-in" data-aos-delay="300">
            Already have a studio account?{" "}
            <Link href="/login" className="text-primary hover:underline font-bold">
              Sign in
            </Link>
          </div>

        </div>
      </main>
      <Footer />
    </Fragment>
  );
}