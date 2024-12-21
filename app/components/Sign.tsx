'use client';
import { useState } from "react";

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    email: '',
    password: '',
    nickname: '',
    aboutMe: '',
    avatar: null
  });

  const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;

  const toggleAuthMode = () => {
    setIsSignUp(!isSignUp);
  };

  const handleInputChange = (e) => {
    const { name, value, files } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: files ? files[0] : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const url = isSignUp ? `${serverUrl}/signup` : `${serverUrl}/signin`;
    const formDataToSend = new FormData();

    Object.keys(formData).forEach(key => {
      if (formData[key] !== null && formData[key] !== '') {
        formDataToSend.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formDataToSend,
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
      if (response.ok) {
        const data = await response.json();
        console.log('Success:', data);
        // Handle successful sign up/in here (e.g., redirect, store token, etc.)
      } else {
        console.error('Server Error:', response.statusText);
        // Handle server errors here
      }
    } catch (error) {
      console.error('Network Error:', error);
      // Handle network errors here
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-indigo-100 to-indigo-300">
      <div className="max-w-md w-full p-8 border-2 border-indigo-600 rounded-xl shadow-lg bg-white mt-10 mb-8">
        <h2 className="text-4xl font-extrabold text-center text-indigo-700 mb-6">
          {isSignUp ? "Join Us" : "Welcome Back"}
        </h2>
        <form className="space-y-4" onSubmit={handleSubmit} encType="multipart/form-data">
          {isSignUp && (
            <>
              <div>
                <input 
                  type="text" 
                  name="firstName"
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="First Name" 
                  required 
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <input 
                  type="text" 
                  name="lastName"
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Last Name" 
                  required 
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <input 
                  type="date" 
                  name="dateOfBirth"
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  required 
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
          <div>
            <input 
              type="email" 
              name="email"
              className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Email" 
              required 
              onChange={handleInputChange}
            />
          </div>
          <div>
            <input 
              type="password" 
              name="password"
              className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
              placeholder="Password" 
              required 
              onChange={handleInputChange}
            />
          </div>
          {isSignUp && (
            <>
              <div>
                <input 
                  type="text" 
                  name="nickname"
                  className="input input-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="Nickname (Optional)" 
                  onChange={handleInputChange}
                />
              </div>
              <div>
                <textarea 
                  name="aboutMe"
                  className="textarea textarea-bordered w-full p-3 rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  placeholder="About Me (Optional)" 
                  rows="3"
                  onChange={handleInputChange}
                ></textarea>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Upload Avatar/Image (Optional)</span>
                </label>
                <input
                  type="file"
                  name="avatar"
                  className="file-input file-input-bordered file-input-primary w-full" 
                  accept="image/*"
                  onChange={handleInputChange}
                />
              </div>
            </>
          )}
          <button type="submit" className="btn btn-primary w-full mt-4 mb-6 p-3 rounded-md bg-indigo-600 text-white hover:bg-indigo-700 transition duration-200">
            {isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>
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
