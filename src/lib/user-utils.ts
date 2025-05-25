/**
 * Utility functions for user display in the application
 */

/**
 * Format a username from an email address
 * @param email User email address
 * @returns Formatted display name
 */
export const formatUsername = (email: string): string => {
  if (!email || !email.includes("@")) return email;

  return email
    .split("@")[0]
    .replace(/\./g, " ")
    .replace(/(\w)(\w*)/g, (_, first, rest) => first.toUpperCase() + rest);
};

/**
 * Get initials from a user's name
 * @param name Full name
 * @returns Uppercase initials (e.g. "JD" for "John Doe")
 */
export const getInitials = (name: string): string => {
  if (!name) return "?";

  return name
    .split(" ")
    .map((part) => (part ? part[0] : ""))
    .join("")
    .toUpperCase();
};

/**
 * Get user display name from various formats (ID, email, object)
 * @param user User identifier (string ID, email, or user object)
 * @param userMap Mapping of user IDs to user details
 * @returns User display name
 */
export const getUserName = (
  user: string | { userId: string; name: string; _id?: string },
  userMap: Record<string, { email: string; fullName: string }>
): string => {
  // Helper function to find a user by email
  const findUserByEmail = (email: string) => {
    const foundUser = Object.values(userMap).find((u) => u.email === email);
    return foundUser?.fullName || email;
  };

  // If the user is a string, it could be a user ID or email
  if (typeof user === "string") {
    // If it's an email, look for a matching user by email
    if (user.includes("@")) {
      return findUserByEmail(user);
    }

    // If it's a user ID, look it up in the userMap
    return userMap[user]?.fullName || userMap[user]?.email || user;
  }

  // Handle the activity log user object from backend
  if (user && typeof user === "object") {
    // If name is provided in the object and it's an email, try to find the full name
    if (user.name && user.name.includes("@")) {
      return findUserByEmail(user.name);
    }

    // If name is provided (and not an email), use it
    if (user.name) {
      return user.name;
    }

    // If userId is provided, look it up in the userMap
    if (user.userId && userMap[user.userId]) {
      return userMap[user.userId].fullName || userMap[user.userId].email;
    }
  }

  // Fallback for any other case
  return "Unknown User";
};

/**
 * Get a simplified display name from a user ID
 * @param userId User ID or email
 * @param userMap Mapping of user IDs to user details
 * @returns User display name
 */
export const getDisplayName = (
  userId: string,
  userMap: Record<string, { fullName: string; email: string }>
): string => {
  // If we have user data, use the full name
  if (userMap[userId]?.fullName) {
    return userMap[userId].fullName;
  }

  // For email addresses, format the username part
  if (userId.includes("@")) {
    return formatUsername(userId);
  }

  // Fallback for IDs
  return `User ${userId.substring(0, 6)}`;
};
