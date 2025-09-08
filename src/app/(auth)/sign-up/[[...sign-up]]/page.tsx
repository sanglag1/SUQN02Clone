"use client";

import { useSignUp, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from 'next/image';

export default function SignUpPage() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const { user, isSignedIn } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);
  const [code, setCode] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already signed in
  useEffect(() => {
    if (isSignedIn && user) {
      router.replace('/dashboard');
    }
  }, [isSignedIn, user, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
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

  const saveUserToDatabase = async (userData: { 
    email: string, 
    firstName: string, 
    lastName: string, 
    clerkId: string,
    avatar?: string 
  }) => {
    try {
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Failed to save user data');
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving user to database:', error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setIsLoading(true);
    
    try {
      // Tạo tài khoản với email, password, firstName, lastName
      const signUpData = {
        emailAddress: email,
        password,
        firstName,
        lastName
      };

      const result = await signUp.create(signUpData);

      if (result.status === "complete") {
        // Lưu user data vào database
        await saveUserToDatabase({
          email: email,
          firstName: firstName,
          lastName: lastName,
          clerkId: result.createdUserId as string,
        });
        
        await setActive({ session: result.createdSessionId });
        router.replace("/dashboard");
      } else {
        // Nếu cần xác thực email
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setPendingVerification(true);
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        if (error.message.includes("email address is taken")) {
          setErrorMessage("This email address is already registered. Please try another or sign in.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setErrorMessage("Please enter the verification code.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);

    try {
      const result = await signUp.attemptEmailAddressVerification({
        code,
      });

      if (result.status === "complete") {
        // Save user data to database với thông tin đã nhập
        await saveUserToDatabase({
          email: email,
          firstName: firstName || result.firstName || "",
          lastName: lastName || result.lastName || "",
          clerkId: result.createdUserId as string,
        });
        
        await setActive({ session: result.createdSessionId });
        router.replace("/dashboard");
      } else {
        setErrorMessage("Verification failed. Please check the code and try again.");
      }
    } catch (error: unknown) {
      console.error("Error:", error);
      if (error instanceof Error) {
        if (error.message.includes("incorrect code")) {
          setErrorMessage("The verification code is incorrect. Please try again.");
        } else if (error.message.includes("expired")) {
          setErrorMessage("The verification code has expired. Please request a new one.");
        } else {
          setErrorMessage(error.message);
        }
      } else {
        setErrorMessage("Verification failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignInWithGoogle = async () => {
    setIsLoading(true);
    try {
      const strategy = "oauth_google" as const;
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/dashboard",
      });
      
      // Note: The actual user data saving will happen in the sso-callback page
      // since Google OAuth flow redirects the user after successful authentication
      
    } catch (error) {
      console.error("Error:", error);
      setErrorMessage("Failed to initialize Google Sign In");
      setIsLoading(false);
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
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent bg-grid-pattern"></div>

          <div className="relative z-10 max-w-lg space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20">
                <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                <span className="text-sm text-blue-100">F.AI Interview</span>
              </div>
              <h1 className="text-4xl font-bold leading-tight bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Start your AI interview journey
              </h1>
              <p className="text-lg text-slate-300 leading-relaxed">
                Create your account to practice AI interviews, analyze JDs, take quizzes, and track your progress with detailed reports.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">AI Interviews</h3>
                  <p className="text-slate-400 text-sm">Realistic practice with AI-generated questions</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M3 12h12M3 17h8" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">JD Analyzer</h3>
                  <p className="text-slate-400 text-sm">Generate interview sets from your job description</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
                <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-medium">Quizzes & Tracking</h3>
                  <p className="text-slate-400 text-sm">Practice quizzes and track your progress</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="p-6 sm:p-8 lg:col-span-2 h-full overflow-auto flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <div className="mb-6 text-center lg:text-left">
              <h2 className="text-2xl font-bold text-gray-900">
                {pendingVerification ? "Check your email" : "Create your F.AI Interview account"}
              </h2>
              {pendingVerification && (
                <p className="mt-1 text-sm text-gray-600">
                  We have sent a verification code to {email}
                </p>
              )}
            </div>

            {errorMessage && (
              <div className="mb-5 p-4 rounded-xl bg-red-50 border border-red-100">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {!pendingVerification ? (
              <>
                <button
                  onClick={handleSignInWithGoogle}
                  type="button"
                  className="group relative w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl shadow-lg bg-white hover:bg-gray-50 border border-gray-200 text-sm font-medium text-gray-700 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none mb-6"
                >
                  <Image src="/google.svg" alt="Google logo" width={20} height={20} />
                  Continue with Google
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">or</span>
                  </div>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                        First Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="firstName"
                          name="firstName"
                          type="text"
                          autoComplete="given-name"
                          required
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                        Last Name
                      </label>
                      <div className="mt-1">
                        <input
                          id="lastName"
                          name="lastName"
                          type="text"
                          autoComplete="family-name"
                          required
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                      Email address
                    </label>
                    <div className="mt-1">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                      Password
                    </label>
                    <div className="mt-1">
                      <input
                        id="password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                        minLength={8}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="group relative w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:transform-none"
                  >
                    {isLoading ? "Creating account..." : (
                      <span className="flex items-center">
                        Sign up
                        <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <form className="space-y-5" onSubmit={verifyEmail}>
                <div className="space-y-2">
                  <label htmlFor="code" className="block text-sm font-medium text-gray-700">
                    Verification code
                  </label>
                  <div className="mt-1">
                    <input
                      id="code"
                      name="code"
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="block w-full px-3 py-3 border border-gray-300 rounded-xl shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-gray-50 focus:bg-white sm:text-sm"
                      placeholder="Enter the 6-digit code"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center py-3 px-4 rounded-xl text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:transform-none"
                >
                  {isLoading ? "Verifying..." : (
                    <span className="flex items-center">
                      Verify Email
                      <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  )}
                </button>
              </form>
            )}

            {!pendingVerification && (
              <div className="mt-6">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-gray-500">Already have an account?</span>
                  </div>
                </div>

                <div className="mt-5">
                  <Link
                    href="/sign-in"
                    className="group w-full inline-flex justify-center items-center py-3 px-4 rounded-xl shadow-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 text-sm font-medium text-gray-700 transition-all duration-200 hover:shadow-xl hover:-translate-y-0.5"
                  >
                    Sign in
                    <svg className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
