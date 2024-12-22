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
    } catch (error) {
      setErrorMessage(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} flex items-center justify-center min-h-screen`}>
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
          {/* Dark Mode Toggle Button */}
          <label className="inline-flex items-center relative">
            <input
              className="peer hidden"
              id="toggle"
              type="checkbox"
              checked={isDarkMode}
              onChange={toggleTheme}
            />
            <div className="relative w-[110px] h-[50px] bg-white peer-checked:bg-zinc-500 rounded-full after:absolute after:content-[''] after:w-[40px] after:h-[40px] after:bg-gradient-to-r from-orange-500 to-yellow-400 peer-checked:after:from-zinc-900 peer-checked:after:to-zinc-900 after:rounded-full after:top-[5px] after:left-[5px] active:after:w-[50px] peer-checked:after:left-[105px] peer-checked:after:translate-x-[-100%] shadow-sm duration-300 after:duration-300 after:shadow-md"></div>
          </label>
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
                className="input w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 transition duration-200"
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
