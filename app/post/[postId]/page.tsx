"use client";

import React, { useState, useEffect } from "react";
import { FaImage } from "react-icons/fa";
import { Loading } from '../../components/loading';
import { useParams, useRouter } from "next/navigation"; 
import Nav from "../../components/nav";
import Bug from "../../components/error";


export default function PostPage() {
    const { postId } = useParams(); // Extract postId from URL parameters
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [image, setImage] = useState(null); // State for image file
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    const [isDarkMode, setIsDarkMode] = useState(false); // Local state for dark mode
    const router = useRouter(); // Initialize the router
  const [error, setError] = useState(null);

    useEffect(() => {
        // Check for dark mode preference in localStorage
        const darkModePreference = localStorage.getItem("darkMode");
        setIsDarkMode(darkModePreference === "true");
    }, []);

    useEffect(() => {
        const fetchPostData = async () => {
            if (!postId) return; // Wait until postId is available

            try {
                const response = await fetch(`${serverUrl}/post?postId=${postId}`, {
                    method: 'GET',
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setPost(data.post); 
                    setComments(data.comments || []); 
                } else {
                    console.error('Failed to fetch post data');
                    setError("error")
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };

        fetchPostData();
    }, [postId, serverUrl]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();

        if (!newComment.trim() && !image) return; // Prevent submitting empty comments or without image

        const formData = new FormData();
        formData.append('content', newComment); // Append the comment content
        if (image) {
            formData.append('image', image); // Append the selected image
        }
        formData.append('postId', postId); // Include postId in the formData

        try {
            const response = await fetch(`${serverUrl}/comments`, {
                method: 'POST',
                credentials: 'include',
                body: formData, // Send FormData with the request
            });

            if (response.ok) {
                const newCommentData = await response.json();
                setComments(prevComments => [...prevComments, newCommentData]); // Update comments with the new comment
                setNewComment(''); // Clear the input
                setImage(null); // Clear the selected image
            } else {
                console.error('Failed to submit comment');
            }
        } catch (error) {
            console.error('Comment submission error:', error);
        }
    };
    if (error) return <Bug message={"You may not have permission to view this Post!!"} />;

    return (
        <>
        <Nav />
        <div className={`min-h-screen flex flex-col ${isDarkMode ? "bg-gray-900 text-gray-100" : "bg-gray-100 text-gray-900"}`}>
            <div className="container mx-auto p-4">
                {post ? (
                    <div className={`card shadow-xl ${isDarkMode ? "bg-gray-800" : "bg-base-100"}`}>
                        <div className="card-body">
                            {/* Author Information */}
                            <div className="flex items-center mb-4">
                                {post.author_image && (
                                    <img src={`${serverUrl}/uploads/${post.author_image}`} alt={`${post.author_first_name} ${post.author_last_name}`} className="rounded-full w-12 h-12 mr-3" />
                                )}
                                <div>
                                    <h2 
                                        className="text-lg font-bold cursor-pointer" 
                                        onClick={() => router.push(`/profilepage/${post.author_id}`)} // Navigate to author profile
                                    >
                                        {post.author_first_name} {post.author_last_name}
                                    </h2>
                                </div>
                            </div>

                            {/* Post Content */}
                            <h1 className="text-2xl font-bold">{post.title}</h1>
                            <p className="text-gray-700">{post.content_text}</p>
                            {post.content_image && (
                                <img src={`${serverUrl}/uploads/${post.content_image}`} alt="Post Image" className="mt-4 w-full h-auto rounded" />
                            )}
                            <div className="comments mt-4">
                                <h2 className="text-xl font-semibold">Comments</h2>
                                <ul>
                                    {comments.length > 0 ? (
                                        comments.map(comment => (
                                            <li key={comment.comment_id} className="border-b py-2 flex items-start">
                                                {comment.author_image && (
                                                    <img 
                                                        src={`${serverUrl}/uploads/${comment.author_image}`} 
                                                        alt={`${comment.author_first_name} ${comment.author_last_name}`} 
                                                        className="rounded-full w-10 h-10 mr-3" // Adjust size as needed
                                                    />
                                                )}
                                                <div>
                                                    <strong 
                                                        className="cursor-pointer" 
                                                        onClick={() => router.push(`/profilepage/${comment.user_id}`)} // Navigate to comment author profile
                                                    >
                                                        {comment.author_first_name} {comment.author_last_name}
                                                    </strong>: {comment.content}
                                                    {comment.image && (
                                                        <img 
                                                            src={`${serverUrl}/uploads/${comment.image}`} 
                                                            alt="Comment Image" 
                                                            className="mt-2 w-48 h-auto rounded" 
                                                        />
                                                    )}
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="py-2">No comments yet.</li>
                                    )}
                                </ul>
                            </div>
                            <form onSubmit={handleCommentSubmit} className="mt-4">
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder="Write a comment..."
                                    className={`textarea textarea-bordered w-full h-24 ${isDarkMode ? "bg-gray-700 text-gray-400" : "bg-white text-gray-900"}`}
                                    required
                                />
                                <div className="flex items-center mt-2">
                                    <label className="btn btn-outline btn-sm">
                                        <FaImage className="mr-2" />
                                        Upload Image
                                        <input
                                            type="file"
                                            className="hidden"
                                            onChange={(e) => setImage(e.target.files[0])}
                                            accept="image/*"
                                        />
                                    </label>
                                    {image && <span className="text-success ml-2">Image selected</span>}
                                </div>
                                <div className="card-actions justify-end mt-2">
                                    <button type="submit" className="btn btn-primary">Submit Comment</button>
                                </div>
                            </form>
                        </div>
                    </div>
                ) : (
                    <Loading />
                )}
            </div>
        </div>
        </>
    );
}