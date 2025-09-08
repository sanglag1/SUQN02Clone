"use client";

import { useSignIn, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();
  const { user, isSignedIn } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Forgot password state
  const [authView, setAuthView] = useState<"sign-in" | "forgot">("sign-in");
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [isCompletingReset, setIsCompletingReset] = useState(false);
  const [resetStep, setResetStep] = useState<"enter-email" | "verify-code">("enter-email");
  const [infoMessage, setInfoMessage] = useState("");

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, user, router]);

  if (!isLoaded || !signIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-purple-300 rounded-full animate-spin animate-reverse"></div>
        </div>
      </div>
    );
  }

  // Don't render if user is signed in (will redirect)
  if (isSignedIn) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });
      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        router.replace("/dashboard");
      } else {
        console.error("Sign in failed", result);
        setErrorMessage("Sign in failed. Please check your credentials.");
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setIsLoadingGoogle(true);
      setErrorMessage("");
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard"
      });
    } catch (err) {
      console.error("Error signing in with Google:", err);
      setErrorMessage("Failed to sign in with Google. Please try again.");
      setIsLoadingGoogle(false);
    }
  };

  // Forgot password: Step 1 - send email code
  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsSendingReset(true);
    try {
      await signIn.create({
        strategy: 'reset_password_email_code',
        identifier: resetEmail,
      });
      setInfoMessage("We sent a 6-digit code to your email.");
      setResetStep("verify-code");
    } catch (err: unknown) {
      console.error("send reset code error", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to send reset code");
    } finally {
      setIsSendingReset(false);
    }
  };

  // Forgot password: Step 2 - verify code, set new password
  const handleCompleteReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setInfoMessage("");
    setIsCompletingReset(true);
    try {
      const attempt = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: resetCode,
      });

      if (attempt.status === 'needs_new_password') {
        const final = await signIn.resetPassword({
          password: newPassword,
        });
        if (final.status === 'complete') {
          await setActive({ session: final.createdSessionId });
          router.replace('/dashboard');
          return;
        }
      }

      // If we got here, something unexpected happened
      setErrorMessage("Could not complete password reset. Please try again.");
    } catch (err: unknown) {
      console.error("complete reset error", err);
      setErrorMessage(err instanceof Error ? err.message : "Failed to reset password");
    } finally {
      setIsCompletingReset(false);
    }
  };

  return (
    <div className="min-h-dvh h-dvh flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br from-blue-400/20 via-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl from-indigo-400/20 via-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="relative w-full max-w-7xl grid grid-cols-1 lg:grid-cols-5 rounded-3xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-xl border border-white/50 h-full">
        {/* Left hero panel */}
        <div className="hidden lg:flex lg:col-span-3 h-full relative items-center justify-center p-12 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 bg-white/20 rounded-full blur-2xl animate-pulse"></div>
            <div className="absolute bottom-20 right-20 w-40 h-40 bg-blue-300/20 rounded-full blur-2xl animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-purple-300/20 rounded-full blur-xl animate-pulse delay-1000"></div>
          </div>
          
          {/* Decorative grid */}
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent bg-grid-pattern"></div>
          
          <div className="relative z-10 max-w-lg space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-blue-100">Secure & Trusted</span>
              </div>
              
              <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Welcome back to your journey
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Access your personalized dashboard, continue learning, and unlock new opportunities with our secure platform.
              </p>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Bank-level Security</h3>
                  <p className="text-slate-400 text-sm">Your data is protected with enterprise encryption</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Lightning Fast</h3>
                  <p className="text-slate-400 text-sm">Optimized for speed and performance</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-6 sm:p-8 lg:col-span-2 h-full overflow-auto flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {authView === 'sign-in' ? 'Sign In' : 'Reset Password'}
                </h2>
              </div>
              <p className="text-gray-600">
                {authView === 'sign-in' 
                  ? 'Welcome back! Please enter your credentials to continue.' 
                  : resetStep === 'enter-email' 
                    ? 'Enter your email to receive a reset code.' 
                    : 'Enter the code and your new password.'}
              </p>
            </div>

            {authView === 'sign-in' ? (
              <>
                {/* Sign in with Google */}
                <button
                  onClick={signInWithGoogle}
                  disabled={isLoadingGoogle}
                  className="group relative w-full inline-flex items-center justify-center py-3 px-4 rounded-xl shadow-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  {isLoadingGoogle ? (
                    <span className="flex items-center">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </span>
                  ) : (
                    "Continue with Google"
                  )}
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                {errorMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => { setAuthView('forgot'); setErrorMessage(""); setInfoMessage(""); setResetEmail(email || ""); setResetStep('enter-email'); }}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
                      >
                        Forgot password?
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isLoading ? (
                      <span className="flex items-center">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Sign in
                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>

                <div className="mt-6">
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">New to our platform?</span>
                    </div>
                  </div>

                  <div className="mt-5">
                    <Link
                      href="/sign-up"
                      className="group w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                    >
                      Create new account
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              <>
                {errorMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-red-700">{errorMessage}</p>
                    </div>
                  </div>
                )}
                {infoMessage && (
                  <div className="mb-5 p-4 rounded-xl bg-blue-50 border border-blue-100">
                    <div className="flex items-center">
                      <svg className="w-5 h-5 text-blue-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-sm text-blue-700">{infoMessage}</p>
                    </div>
                  </div>
                )}

                {resetStep === 'enter-email' ? (
                  <form className="space-y-5" onSubmit={handleSendResetCode}>
                    <div className="space-y-2">
                      <label htmlFor="resetEmail" className="block text-sm font-medium text-gray-700">Email Address</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                          </svg>
                        </div>
                        <input
                          id="resetEmail"
                          name="resetEmail"
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="you@example.com"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <button
                        type="button"
                        onClick={() => setAuthView('sign-in')}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back to sign in
                      </button>
                      <button
                        type="submit"
                        disabled={isSendingReset}
                        className="inline-flex items-center justify-center py-2.5 px-6 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:transform-none"
                      >
                        {isSendingReset ? (
                          <span className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Sending...
                          </span>
                        ) : (
                          'Send reset code'
                        )}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form className="space-y-5" onSubmit={handleCompleteReset}>
                    <div className="space-y-2">
                      <label htmlFor="resetCode" className="block text-sm font-medium text-gray-700">Verification Code</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <input
                          id="resetCode"
                          name="resetCode"
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]{6}"
                          required
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white text-center text-lg tracking-wider"
                          placeholder="123456"
                          maxLength={6}
                        />
                      </div>
                      <p className="text-xs text-gray-500">Enter the 6-digit code sent to your email</p>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">New Password</label>
                      <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                          </svg>
                        </div>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white"
                          placeholder="Enter your new password"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3">
                      <button
                        type="button"
                        onClick={() => { setResetStep('enter-email'); setInfoMessage(""); setErrorMessage(""); }}
                        className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isCompletingReset}
                        className="inline-flex items-center justify-center py-2.5 px-6 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:transform-none"
                      >
                        {isCompletingReset ? (
                          <span className="flex items-center">
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                            Resetting...
                          </span>
                        ) : (
                          <span className="flex items-center">
                            Reset password
                            <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}