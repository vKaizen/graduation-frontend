"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

export default function GoalsOverviewPage() {
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    // Only redirect once to avoid infinite loops
    if (!hasRedirectedRef.current) {
      hasRedirectedRef.current = true;
      // Redirect to my-goals page
      router.push("/insights/goals/my-goals");
    }
  }, [router]);

  return (
    <div className="flex items-center justify-center h-screen bg-[#121212] text-white">
      <div className="text-gray-400">Redirecting to goals...</div>
    </div>
  );
}
