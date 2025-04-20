"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Briefcase } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { setAuthCookie, setUserIdCookie } from "@/lib/cookies";
import { login, register } from "@/api-service";

export default function ModernLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const [fullName, setFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [bio, setBio] = useState("");

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const data = await login(email, password);
      console.log("Login successful", data);

      // Set cookies instead of using localStorage
      setAuthCookie(data.accessToken);

      // Extract userId from JWT token and set it in cookie
      const tokenParts = data.accessToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.sub || payload.id;
        setUserIdCookie(userId);
      }

      // Store defaultWorkspaceId in localStorage for workspace context
      if (data.defaultWorkspaceId) {
        console.log("Storing defaultWorkspaceId:", data.defaultWorkspaceId);
        localStorage.setItem("defaultWorkspaceId", data.defaultWorkspaceId);
      }

      // Get the callback URL from the query parameters
      const callbackUrl = searchParams.get("callbackUrl");

      // Force a hard refresh to ensure cookies are properly set
      window.location.href = callbackUrl || "/home";
    } catch (error) {
      console.error("Login error:", error);
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Ensure passwords match
    if (signUpPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      const data = await register(
        signUpEmail,
        signUpPassword,
        fullName,
        jobTitle,
        bio
      );

      console.log("Signup successful:", data);

      // After successful registration, log the user in automatically
      const loginData = await login(signUpEmail, signUpPassword);

      // Set auth cookies
      setAuthCookie(loginData.accessToken);

      // Extract userId from JWT token and set it in cookie
      const tokenParts = loginData.accessToken.split(".");
      if (tokenParts.length === 3) {
        const payload = JSON.parse(atob(tokenParts[1]));
        const userId = payload.sub || payload.id;
        setUserIdCookie(userId);
      }

      // Store defaultWorkspaceId in localStorage for workspace context
      if (loginData.defaultWorkspaceId) {
        console.log(
          "Storing defaultWorkspaceId:",
          loginData.defaultWorkspaceId
        );
        localStorage.setItem(
          "defaultWorkspaceId",
          loginData.defaultWorkspaceId
        );
      }

      // Redirect to home page
      window.location.href = "/home";
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred during registration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#1a1a1a] p-4 w-full max-w-md">
      <Card className="w-full max-w-md bg-[#353535] border-none shadow-xl">
        <CardHeader>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 bg-[#1a1a1a] p-1 rounded-lg">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-[#353535] data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 ease-in-out"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-[#353535] data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 ease-in-out"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <CardTitle className="text-xl font-bold text-center text-white">
                Welcome back
              </CardTitle>
              <CardDescription className="text-center text-gray-400 text-sm">
                Enter your credentials to access your account
              </CardDescription>
              {error && (
                <p className="text-red-500 text-center text-sm">{error}</p>
              )}
              <div className="mb-3">
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="bg-[#1a1a1a] text-white border-gray-600 focus:border-white pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    className="bg-[#1a1a1a] text-white border-gray-600 focus:border-white pl-10"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button
                type="submit"
                className="w-full bg-white text-[#35353c] hover:bg-gray-200"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
              <div className="text-xs text-center">
                <a href="#" className="text-gray-400 hover:text-white">
                  Forgot your password?
                </a>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <CardTitle className="text-xl font-bold text-center text-white">
                Create an account
              </CardTitle>
              <CardDescription className="text-center text-gray-400 text-sm">
                Sign up to get started
              </CardDescription>
              <div className="mb-3">
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Full Name"
                    className="bg-[#1a1a1a] text-white border-[#575656] focus:border-white pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Mail
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Email"
                    className="bg-[#1a1a1a] text-white border-[#575656] focus:border-white pl-10"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="bg-[#1a1a1a] text-white border-[#575656] focus:border-white pl-10"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="signup-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="bg-[#1a1a1a] text-white border-[#575656] focus:border-white pl-10"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={togglePasswordVisibility}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Briefcase
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <Input
                    id="signup-job-title"
                    type="text"
                    placeholder="Job Title"
                    className="bg-[#1a1a1a] text-white border-[#575656] focus:border-white pl-10"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <textarea
                  id="signup-bio"
                  placeholder="Tell us about yourself"
                  className="w-full h-20 bg-[#1a1a1a] text-white border border-[#575656] focus:border-white rounded-md p-2 resize-none text-sm"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-[#1a1a1a] text-white hover:bg-gray-200"
              >
                Sign up
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
