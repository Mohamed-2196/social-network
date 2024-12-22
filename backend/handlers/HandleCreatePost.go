package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type PostRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
	Image   string `json:"image"`
}

type PostResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

func (req *PostRequest) Validate() error {
	if req.Title == "" || req.Content == "" {
		return fmt.Errorf("title and content are required")
	}
	return nil
}

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		sendErrorResponse(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	db, err := sql.Open("sqlite3", "./database.db")
	if err != nil {
		fmt.Println("Error opening database:", err)
		sendErrorResponse(w, "Database connection error", http.StatusInternalServerError)
		return
	}
	defer db.Close()

	var userID int
	err = db.QueryRow(`
		SELECT user_id 
		FROM sessions 
		WHERE token = ? AND expiration_time > datetime('now')
	`, cookie.Value).Scan(&userID)

	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("Invalid or expired session token:", cookie.Value)
			sendErrorResponse(w, "Invalid or expired session", http.StatusUnauthorized)
			return
		}
		fmt.Printf("Database error checking session: %v\n", err)
		sendErrorResponse(w, "Database error", http.StatusInternalServerError)
		return
	}

	var req PostRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		fmt.Printf("Error decoding request body: %v\n", err)
		sendErrorResponse(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	if err := req.Validate(); err != nil {
		sendErrorResponse(w, err.Error(), http.StatusBadRequest)
		return
	}

	postID, err := SavePost(db, userID, req.Title, req.Content, req.Image)
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

func SavePost(db *sql.DB, userID int, title, contentText, contentImage string) (int, error) {
	fmt.Println("In SavePost function")
	query := `
		INSERT INTO posts (user_id, title, content_text, content_image, created_at) 
		VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
	`
	result, err := db.Exec(query, userID, title, contentText, contentImage)
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
