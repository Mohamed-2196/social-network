"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    email: "",
    password: "",
    nickname: "",
    aboutMe: "",
    avatar: null,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
  const router = useRouter();

  const formRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    gsap.fromTo(
      headingRef.current,
      { opacity: 0, y: -50 },
      { opacity: 1, y: 0, duration: 1, ease: "power3.out" }
    );
    gsap.fromTo(
      formRef.current,
      { opacity: 0, y: 50 },
      { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }
    );
  }, []);

  const toggleAuthMode = () => setIsSignUp(!isSignUp);
  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: files ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (isSignUp && !formData.nickname) {
      const username = formData.email.split("@")[0];
      const randomNumber = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
      formData.nickname = username + randomNumber;
    }

    const url = isSignUp ? `${serverUrl}/signup` : `${serverUrl}/signin`;
    const formDataToSend = new FormData();

    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null && formData[key] !== "") {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(url, {
        method: "POST",
        body: formDataToSend,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      router.push("/");
      const ws = new WebSocket("ws://localhost:8080/ws");

      ws.onopen = () => {
        console.log("Connected to WebSocket server");
      };
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-gray-400" : "bg-gray-100 text-gray-900"} flex items-center justify-center min-h-screen`}>
      <div
        ref={formRef}
        className={`max-w-md w-full p-8 border-2 rounded-xl shadow-lg ${
          isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-300 bg-white"
        } mt-10 mb-8`}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 ref={headingRef} className="text-4xl font-extrabold text-center">
            {isSignUp ? "Join Us" : "Welcome Back"}
          </h2>
          {/* Dark Mode Checkbox */}
          <div className="relative">
            <input
              type="checkbox"
              id="dark-mode-toggle"
              className="hidden peer"
              checked={isDarkMode}
              onChange={toggleTheme}
            />
            <label
              htmlFor="dark-mode-toggle"
              className="flex items-center justify-center w-12 h-12 rounded-full border border-gray-400 bg-gray-200 peer-checked:bg-gray-600 cursor-pointer transition-all"
            >
              {isDarkMode ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-yellow-400"
                >
                  <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 109.79 9.79z" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-6 h-6 text-gray-700"
                >
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              )}
            </label>
          </div>
        </div>
        {errorMessage && <div className="text-red-500 text-center mb-4">{errorMessage}</div>}
        <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
          {isSignUp && (
            <>
              <input
                type="text"
                name="firstName"
                className="input w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
                placeholder="First Name"
                required
                onChange={handleInputChange}
              />
              <input
                type="text"
                name="lastName"
                className="input w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
                placeholder="Last Name"
                required
                onChange={handleInputChange}
              />
              <input
                type="date"
                name="dateOfBirth"
                className="input w-full p-3 rounded-md border-gray-300 text-gray-400 tefocus:outline-none focus:ring-2 transition duration-200"
                required
                onChange={handleInputChange}
              />
            </>
          )}
          <input
            type="email"
            name="email"
            className="input w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
            placeholder="Email"
            required
            onChange={handleInputChange}
          />
          <input
            type="password"
            name="password"
            className="input w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
            placeholder="Password"
            required
            onChange={handleInputChange}
          />
          {isSignUp && (
            <>
              <input
                type="text"
                name="nickname"
                className="input w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
                placeholder="Nickname (Optional)"
                onChange={handleInputChange}
              />
              <textarea
                name="aboutMe"
                className="textarea w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
                placeholder="About Me (Optional)"
                rows="3"
                onChange={handleInputChange}
              ></textarea>
              <label className="block">
                <span className="block text-sm font-medium mb-1">Upload Avatar (Optional)</span>
                <input
                  type="file"
                  name="avatar"
                  className="file-input w-full"
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </label>
            </>
          )}
          <button
            type="submit"
            className={`w-full mt-4 p-3 rounded-md text-white ${
              isLoading ? "bg-gray-500 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-700"
            } transition duration-200`}
            disabled={isLoading}
          >
            {isLoading ? "Loading..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <p className="text-center mt-4">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button className="text-indigo-500 font-semibold" onClick={toggleAuthMode}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}
