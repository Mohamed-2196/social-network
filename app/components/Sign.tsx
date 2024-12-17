'use client';
import { useState } from "react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-indigo-300">
      <div className="max-w-md w-full p-8 border-2 border-indigo-600 rounded-xl shadow-lg bg-white mt-10 mb-8">
        <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-6">
          {isSignUp ? "Join Us" : "Welcome Back"}
        </h2>
        <form className="space-y-4">
          {isSignUp && (
            <>
              <div>
                <input 
                  type="text" 
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="First Name" 
                  required 
                />
              </div>
              <div>
                <input 
                  type="text" 
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Last Name" 
                  required 
                />
              </div>
              <div>
                <input 
                  type="date" 
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                />
              </div>
            </>
          )}
          <div>
            <input 
              type="email" 
              className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Email" 
              required 
            />
          </div>
          <div>
            <input 
              type="password" 
              className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Password" 
              required 
            />
          </div>
          {isSignUp && (
            <>
              <div>
                <input 
                  type="text" 
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Nickname (Optional)" 
                />
              </div>
              <div>
                <textarea 
                  className="textarea textarea-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="About Me (Optional)" 
                  rows="3"
                ></textarea>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload Avatar/Image (Optional)</span>
                </label>
                <input 
                  type="file" 
                  className="file-input file-input-bordered w-full bg-gray-200" 
                  accept="image/*"
                />
              </div>
            </>
          )}
          <button className="btn btn-primary w-full mt-4 mb-6 p-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition duration-200">
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
        <div className="flex justify-center mb-4">
          <button
            className="btn btn-outline hover:bg-red-500 mt-2 w-full hover:text-white transition-colors duration-300 p-3 rounded-md border border-gray-300"
            onClick={() => alert('Sign in with Google')}
          >
            Sign in with Google
          </button>
        </div>
        <p className="text-center mt-4 text-gray-600">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
          <button className="text-indigo-500 font-semibold" onClick={toggleAuthMode}>
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </p>
      </div>
    </div>
  );
}