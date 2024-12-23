package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type PostRequest struct {
	Privacy string `json:"privacy"`
	Content string `json:"content"`
	Image   string `json:"image"`
}

type PostResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type Post struct {
	ID      int    `json:"id"`
	Content string `json:"content"`
	Image   string `json:"image"`
	Privacy string `json:"privacy"`
}

type PostsResponse struct {
	Status string `json:"status"`
	Data   []Post `json:"data,omitempty"`
	Error  string `json:"error,omitempty"`
}


func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	id := session.id
	if id == 0 {
        sendErrorResponse(w, "Invalid session", http.StatusUnauthorized)
		http.Redirect(w,r,"/auth",http.StatusNonAuthoritativeInfo)
        return
    }
	var req PostRequest
	req.Content = r.FormValue("content")
	req.Privacy = r.FormValue("privacy")
	var imagefilename string
	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		imagefilename, err = saveFile(file, handler)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}

	postID, err := SavePost(DB, id, req.Privacy, req.Content, imagefilename)
	if err != nil {
		fmt.Printf("Error saving post: %v\n", err)
		sendErrorResponse(w, "Failed to save post", http.StatusInternalServerError)
		return
	}
	response := PostResponse{
		Status:  "success",
		Message: fmt.Sprintf("Post created successfully with ID %d", postID),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
		sendErrorResponse(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func SavePost(db *sql.DB, userID int, privacy, contentText, contentImage string) (int, error) {
	fmt.Println("In SavePost function")
	query := `
    INSERT INTO posts (user_id, content_text, content_image, privacy, created_at) 
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`
	result, err := db.Exec(query, userID, contentText, contentImage,privacy, )
	if err != nil {
		fmt.Println("Error saving into the database:", err)
		return 0, err
	}

	postID, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last inserted post ID: %w", err)
	}
	return int(postID), nil
}

func sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)
	response := PostResponse{
		Status:  "error",
		Message: message,
	}
	_ = json.NewEncoder(w).Encode(response)
}

func CreatedPostsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	userID := session.id

	posts, err := GetPosts(DB, userID)
	if err != nil {
		fmt.Printf("Error fetching posts: %v\n", err)
		sendErrorResponse(w, "Failed to fetch posts", http.StatusInternalServerError)
		return
	}

	response := PostsResponse{
		Status: "success",
		Data:   posts,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
		sendErrorResponse(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func GetPosts(db *sql.DB, userID int) ([]Post, error) {
	query := `
    SELECT post_id, content_text, content_image, privacy 
    FROM posts 
    WHERE user_id = ? 
    ORDER BY created_at DESC
`
	rows, err := db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		if err := rows.Scan(&post.ID, &post.Content, &post.Image, &post.Privacy); err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

