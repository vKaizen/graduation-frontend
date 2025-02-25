"use client"

import React, { useState } from "react";
import { Eye, EyeOff, Mail, Lock, User, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ModernLogin() {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      const response = await fetch("http://localhost:3000/users/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      const data = await response.json();
      console.log("Login successful", data);
      router.push("/dashboard");
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
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
      const response = await fetch('http://localhost:3000/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fullName,
          email: signUpEmail,
          jobTitle,
          bio,
          password: signUpPassword
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Registration failed");
      }

      console.log("Signup successful", data);
      router.push("/dashboard");

    } catch (error) {
      setError(error.message || "An error occurred during registration.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#272638] p-4 w-full max-w-md">
      <Card className="w-full max-w-md bg-[#2f2d45] border-none shadow-xl">
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#1e1d2d] p-1 rounded-lg">
              <TabsTrigger
                value="login"
                className="data-[state=active]:bg-[#2f2d45] data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 ease-in-out"
              >
                Login
              </TabsTrigger>
              <TabsTrigger
                value="signup"
                className="data-[state=active]:bg-[#2f2d45] data-[state=active]:text-white text-gray-400 rounded-md transition-all duration-300 ease-in-out"
              >
                Sign Up
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeTab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <CardTitle className="text-xl font-bold text-center text-white">Welcome back</CardTitle>
              <CardDescription className="text-center text-gray-400 text-sm">
                Enter your credentials to access your account
              </CardDescription>
              {error && <p className="text-red-500 text-center text-sm">{error}</p>}
              <div className="mb-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    required
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
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
              <Button type="submit" className="w-full bg-white text-[#272638] hover:bg-gray-200" disabled={isLoading}>
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
              <CardTitle className="text-xl font-bold text-center text-white">Create an account</CardTitle>
              <CardDescription className="text-center text-gray-400 text-sm">Sign up to get started</CardDescription>
              <div className="mb-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Full Name"
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Email"
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="mb-3">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
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
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="signup-confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
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
                  <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  <Input
                    id="signup-job-title"
                    type="text"
                    placeholder="Job Title"
                    className="bg-[#272638] text-white border-gray-600 focus:border-white pl-10"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                  />
                </div>
              </div>
              <div className="mb-3">
                <textarea
                  id="signup-bio"
                  placeholder="Tell us about yourself"
                  className="w-full h-20 bg-[#272638] text-white border border-gray-600 focus:border-white rounded-md p-2 resize-none text-sm"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full bg-white text-[#272638] hover:bg-gray-200">
                Sign up
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
