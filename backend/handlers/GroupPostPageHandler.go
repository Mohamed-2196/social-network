package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

// PostComment represents a comment structure
type GroupPostComment struct {
	CommentID   int    `json:"comment_id"`
	UserID      int    `json:"user_id"`
	GroupID     int    `json:"group_id"`
	PostID      int    `json:"post_id"`
	Content     string `json:"content"`
	AuthorName  string `json:"author_name"`
	AuthorImage string `json:"author_image"`
	CreatedAt   string `json:"created_at"`
	Image       string `json:"image,omitempty"` // Comment author's image
}

func HandleGetPostDetails(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Hello1")

	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	postIDStr := r.PathValue("postid")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id

	// Convert postid to an integer
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid postid", http.StatusBadRequest)
		return
	}
	fmt.Println("Hello22")

	// Fetch the post details
	var post GroupPost
	query := `
	SELECT group_post_id, group_id, user_id, content_text, content_image
	FROM group_post 
	WHERE group_post_id = ?`
	err = DB.QueryRow(query, postID).Scan(&post.GroupPostID, &post.GroupID, &post.AuthorID, &post.Content, &post.Image)
	if err != nil {
		fmt.Println("QUERY ERROR")
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Check if the requester is a member of the group and has an "accepted" status
	var status string
	query = `
	SELECT status 
	FROM group_membership 
	WHERE group_id = ? AND user_id = ?`
	err = DB.QueryRow(query, post.GroupID, requesterID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "You are not a member of this group", http.StatusUnauthorized)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	if status != "accepted" {
		sendErrorResponse(w, "Your membership is not accepted yet", http.StatusUnauthorized)
		return
	}

	// Fetch the author's details
	queryUser := `SELECT image, nickname FROM users WHERE user_id = ?`
	err = DB.QueryRow(queryUser, post.AuthorID).Scan(&post.AuthorImage, &post.AuthorName)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Println("No user found with the given user_id.")
			return
		}
		log.Fatal(err)
	}
	fmt.Println("Hello3")

	// Fetch comments for the post
	comments := []GroupPostComment{}
	query = `
	SELECT c.comment_id, c.user_id, c.content, c.image, u.nickname, u.image, c.created_at
	FROM group_post_comments c
	JOIN users u ON c.user_id = u.user_id
	WHERE c.post_id = ?
	ORDER BY c.created_at ASC`
	rows, err := DB.Query(query, postID)
	if err != nil {
		fmt.Println("Error: ", err)
		return
	}
	fmt.Println("Hello4")

	defer rows.Close()
	for rows.Next() {
		var comment GroupPostComment
		if err := rows.Scan(
			&comment.CommentID,
			&comment.UserID,
			&comment.Content,
			&comment.Image,
			&comment.AuthorName,
			&comment.AuthorImage,
			&comment.CreatedAt,
		); err == nil {
			comments = append(comments, comment)
		}
	}

	fmt.Println("END")
	err = json.NewEncoder(w).Encode(map[string]interface{}{
		"post":     post,
		"comments": comments,
	})
	if err != nil {
		http.Error(w, "Failed to encode response", http.StatusInternalServerError)
		return
	}
}

func HandleAddGroupComment(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	// Extract form data
	content := r.FormValue("content")
	postIDStr := r.FormValue("postId") // Ensure this matches your frontend input
	var imageFilename string

	// Handle image upload (if provided)
	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		imageFilename, err = saveFile(file, handler)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}

	// Retrieve user ID from session
	cookie, err := r.Cookie("session_token")
	if err != nil {
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	userID := session.id

	// Validate post ID
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		sendErrorResponse(w, "Invalid post ID", http.StatusBadRequest)
		return
	}

	// Fetch the group ID associated with the post
	var groupID int
	query := `SELECT group_id FROM group_post WHERE group_post_id = ?`
	err = DB.QueryRow(query, postID).Scan(&groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "Post not found", http.StatusNotFound)
			return
		}
		sendErrorResponse(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Check if the user is a member of the group with "accepted" status
	var status string
	query = `SELECT status FROM group_membership WHERE group_id = ? AND user_id = ?`
	err = DB.QueryRow(query, groupID, userID).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			sendErrorResponse(w, "You are not a member of this group", http.StatusUnauthorized)
			return
		}
		sendErrorResponse(w, "Database error", http.StatusInternalServerError)
		return
	}

	if status != "accepted" {
		sendErrorResponse(w, "Your membership is not accepted yet", http.StatusUnauthorized)
		return
	}

	// Insert new comment into the database
	query = `
        INSERT INTO group_post_comments (group_id, post_id, user_id, content, image) 
        VALUES (?, ?, ?, ?, ?)
    `
	result, err := DB.Exec(query, groupID, postID, userID, content, imageFilename)
	if err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}

	// Get the ID of the newly created comment
	commentID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to retrieve comment ID", http.StatusInternalServerError)
		return
	}

	// Retrieve the full comment details from the database
	var comment GroupPostComment
	selectQuery := `
        SELECT c.comment_id, c.group_id, c.post_id, c.user_id, c.content, c.image, c.created_at,
               u.nickname AS author_name, u.image AS author_image
        FROM group_post_comments c 
        JOIN users u ON c.user_id = u.user_id
        WHERE c.comment_id = ?
    `
	err = DB.QueryRow(selectQuery, commentID).Scan(
		&comment.CommentID, &comment.GroupID, &comment.PostID, &comment.UserID,
		&comment.Content, &comment.Image, &comment.CreatedAt,
		&comment.AuthorName, &comment.AuthorImage,
	)
	if err != nil {
		http.Error(w, "Failed to retrieve comment details", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Return the newly created comment as a JSON response
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(comment)
}
