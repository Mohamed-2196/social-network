"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Import useRouter
import { Loading } from "./components/loading";
import HomePage from "./components/home";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null for loading state
  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL + "/cook";
  const router = useRouter(); // Initialize useRouter

  useEffect(() => {
    const checkAuthCookie = async () => {
      try {
        const response = await fetch(serverUrl, {
          method: "POST",
          credentials: "include", // Important to include cookies
        });

        if (response.ok) {
          setIsAuthenticated(true); // Cookie is valid
        } else {
          setIsAuthenticated(false); // Cookie is invalid or not set
          router.push('/auth'); // Redirect to /auth if not authenticated
        }
      } catch (error) {
        console.error("Error fetching cookie validation:", error);
        setIsAuthenticated(false); // Handle error by setting unauthenticated
        router.push('/auth'); // Redirect to /auth if there's an error
      }
    };

    checkAuthCookie();
  }, [serverUrl, router]); // Include router in dependency array

  // Show loading state while checking
  if (isAuthenticated === null) {
    return     <Loading />;
  }

  // Prevent rendering the home page until authentication state is determined
  if (!isAuthenticated) {
    return null; // Do not render anything if not authenticated
  }

  // Render home page if authenticated
  return (
    <div className="flex flex-col min-h-screen bg-base-200">
      <HomePage />
    </div>
  );
}