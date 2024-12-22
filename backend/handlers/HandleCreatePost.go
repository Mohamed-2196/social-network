package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type PostRequest struct {
	Privacy   string `json:"privacy"`
	Content string `json:"content"`
	Image   string `json:"image"`
}

type PostResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

// func (req *PostRequest) Validate() error {
// 	if req.Title == "" || req.Content == "" {
// 		return fmt.Errorf("title and content are required")
// 	}
// 	return nil
// }

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	fmt.Println("Very nice")
	w.Header().Set("Content-Type", "application/json")
	if r.Method != http.MethodPost {
		sendErrorResponse(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	fmt.Println("Very nice1")
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	id := session.id

	if err := r.ParseForm(); err != nil {
		sendErrorResponse(w, "Error parsing form data", http.StatusBadRequest)
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
	// if err := req.Validate(); err != nil {
	// 	sendErrorResponse(w, err.Error(), http.StatusBadRequest)
	// 	return
	// }
	postID, err := SavePost(DB, id, req.Privacy, req.Content, imagefilename)
	if err != nil {
		fmt.Printf("Error saving post: %v\n", err)
		sendErrorResponse(w, "Failed to save post", http.StatusInternalServerError)
		return
	}
	fmt.Println("Very nice6")
	response := PostResponse{
		Status:  "success",
		Message: fmt.Sprintf("Post created successfully with ID %d", postID),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
		sendErrorResponse(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
	fmt.Println("Very nice7")
}

func SavePost(db *sql.DB, userID int, privacy, contentText, contentImage string) (int, error) {
	fmt.Println("In SavePost function")
	query := `
    INSERT INTO posts (user_id, content_text, content_image, privacy, created_at) 
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`
	result, err := db.Exec(query, userID, contentText,privacy, contentImage)
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
