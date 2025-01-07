package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

// PostComment represents a comment structure
type PostComment struct {
	CommentID   int    `json:"comment_id"`
	UserID      int    `json:"user_id"`
	GroupID     int    `json:"group_id"`
	PostID      int    `json:"post_id"`
	Content     string `json:"content"`
	AuthorName  string `json:"author_name"`
	AuthorImage string `json:"author_image"`
	CreatedAt   string `json:"created_at"`
}

func HandleGetPostDetails(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Hello1")

	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	// postIDStr := r.URL.Query().Get("post_id")
	// postID, err := strconv.Atoi(postIDStr)
	// if err != nil {
	// 	http.Error(w, "Invalid post_id", http.StatusBadRequest)
	// 	return
	// }

	vars := mux.Vars(r)
	postIDStr := vars["postid"]

	// Convert groupid to an integer
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid groupid", http.StatusBadRequest)
		return
	}
	fmt.Println("Hello22")

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

	comments := []PostComment{}
	query = `
	SELECT c.comment_id, c.user_id, c.content, u.nickname, u.image, c.created_at
	FROM comments c
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
		var comment PostComment
		if err := rows.Scan(&comment.CommentID, &comment.UserID, &comment.Content, &comment.AuthorName, &comment.AuthorImage, &comment.CreatedAt); err == nil {
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

func HandleAddComment(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	postIDStr := r.FormValue("postId")
	postID, err := strconv.Atoi(postIDStr)
	if err != nil {
		http.Error(w, "Invalid post_id", http.StatusBadRequest)
		return
	}

	content := r.FormValue("content")
	if content == "" {
		http.Error(w, "Content cannot be empty", http.StatusBadRequest)
		return
	}

	query := `
        INSERT INTO comments (post_id, user_id, content, created_at)
        VALUES (?, ?, ?, ?)
    `
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = DB.Exec(query, postID, userID, content, now)
	if err != nil {
		http.Error(w, "Failed to add comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment added successfully"})
}

func submitComment(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	var comment PostComment // Define your Comment struct
	err := json.NewDecoder(r.Body).Decode(&comment)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}
	// Logic to insert the comment into the database
	// Return success response
}

// HandleAddGroupComment handles adding a comment to a group post
func HandleAddGroupComment(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	// Decode the request body to get postId and content
	var requestBody struct {
		PostID  int    `json:"postId"`  // Post ID to associate the comment with
		Content string `json:"content"` // Content of the comment
	}

	err = json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	// Validate the content
	if requestBody.Content == "" {
		http.Error(w, "Content cannot be empty", http.StatusBadRequest)
		return
	}

	// Insert the comment into the group_post_comments table
	query := `
		INSERT INTO group_post_comments (group_id, post_id, user_id, content, created_at)
		VALUES (?, ?, ?, ?, ?)
	`
	now := time.Now().Format("2006-01-02 15:04:05")
	_, err = DB.Exec(query /* group_id */, 1, requestBody.PostID, userID, requestBody.Content, now) // Replace 1 with the actual group_id if needed
	if err != nil {
		http.Error(w, "Failed to add comment", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Comment added successfully"})
}

// HandleGetGroupComments retrieves comments for a specific group post
func HandleGetGroupComments(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	var requestBody struct {
		PostID int `json:"postId"` // Define a struct to read the postId from the body
	}

	// Decode the request body to get the postId
	err := json.NewDecoder(r.Body).Decode(&requestBody)
	if err != nil {
		http.Error(w, "Invalid input", http.StatusBadRequest)
		return
	}

	postID := requestBody.PostID // Use the postId from the decoded body

	query := `
		SELECT c.comment_id, c.user_id, c.content, u.nickname, u.image, c.created_at
		FROM group_comments c
		JOIN users u ON c.user_id = u.user_id
		WHERE c.post_id = ?
		ORDER BY c.created_at ASC
	`
	rows, err := DB.Query(query, postID)
	if err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []PostComment
	for rows.Next() {
		var comment PostComment
		if err := rows.Scan(&comment.CommentID, &comment.UserID, &comment.Content, &comment.AuthorName, &comment.AuthorImage, &comment.CreatedAt); err == nil {
			comments = append(comments, comment)
		}
	}

	json.NewEncoder(w).Encode(comments)
}
