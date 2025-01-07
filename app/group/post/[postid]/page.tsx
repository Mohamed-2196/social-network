"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation"; 
import Nav from "../../../components/nav"; // Adjust the path as necessary
import { Loading } from '../../../components/loading'; // Adjust the path as necessary
import Bug from '../../../components/error'; // Adjust the path as necessary

export default function GroupPostPage() {
    const { postid } = useParams(); // Extract postId from URL parameters
    const [post, setPost] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL;
    const [error, setError] = useState(null);
    
    useEffect(() => {
        const fetchPostData = async () => {
            if (!postid) return; // Wait until postId is available
            const url = `${serverUrl}/group/post/${postid}`; // Construct the URL

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    credentials: 'include',
                });

                if (response.ok) {
                    const data = await response.json();
                    setPost(data.post); // Assuming the API returns { post: object }
                    setComments(data.comments || []); // Ensure comments is an array
                } else {
                    console.error('Failed to fetch post data');
                    setError("error");
                }
            } catch (error) {
                console.error('Fetch error:', error);
            }
        };

        const fetchComments = async () => {
            console.log("Fetching comments for post ID:", postid);
            const response = await fetch(`${serverUrl}/group/post/${postid}/comments`, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ postId: postid }), // Send postId in the body
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Fetched comments:", data);
                setComments(data); // Update comments with the fetched data
            } else {
                console.error('Failed to fetch comments');
            }
        };

        fetchPostData();
        fetchComments(); // Call fetchComments to load comments

    }, [postid, serverUrl]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission
    
        if (!newComment.trim()) {
            console.error("Comment content is empty."); // Log if the comment is empty
            return; // Prevent submitting empty comments
        }
    
        console.log("Submitting comment:", { content: newComment, postId: postid });
    
        const formData = new FormData();
        formData.append('content', newComment); // Append the comment content
        formData.append('postId', postid); // Ensure this matches the backend key
    
        try {
            const response = await fetch(`${serverUrl}/group/post/${postid}/comments`, {
                method: 'POST',
                credentials: 'include',
                body: formData,
            });
    
            if (!response.ok) {
                const errorText = await response.text(); // Get the error message from the response
                console.error("Failed to submit comment:", errorText); // Log the error message
                throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const result = await response.json();
            console.log("Comment submitted successfully:", result);
    
            setComments(prevComments => [...prevComments, result]); // Update comments with the new comment
            setNewComment(''); // Clear the input
        } catch (error) {
            console.error("Error submitting comment:", error);
        }
    };

    if (error) return <Bug message={"You may not have permission to view this Post!!"} />;
    if (!post) return <Loading />;

    return (
        <>
        <Nav />
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold">{post.title}</h1>
            <p>{post.content_text}</p>
            {post.content_image && (
                <img src={`${serverUrl}/uploads/${post.content_image}`} alt="Post Image" />
            )}

            {/* Comments Section */}
            <div className="comments mt-4">
                <h2 className="text-xl font-semibold">Comments</h2>
                <ul>
                    {comments.length > 0 ? (
                        comments.map(comment => (
                            <li key={comment.comment_id} className="border-b py-2">
                                <strong>{comment.author_name}</strong>: {comment.content}
                            </li>
                        ))
                    ) : (
                        <li>No comments yet.</li>
                    )}
                </ul>
            </div>

            {/* Comment Submission Form */}
            <form onSubmit={handleCommentSubmit} className="mt-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="textarea textarea-bordered w-full h-24"
                    required
                />
                <div className="card-actions justify-end mt-2">
                    <button type="submit" className="btn btn-primary">Submit Comment</button>
                </div>
            </form>
        </div>
        </>
    );
}