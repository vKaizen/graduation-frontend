"use client";

import dynamic from "next/dynamic";

// Dynamic import wrapped in a client component
const NotificationsDropdown = dynamic(() => import("./NotificationsDropdown"), {
  ssr: false,
});

export function NotificationsContainer() {
  return <NotificationsDropdown />;
}
