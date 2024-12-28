package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"
)

type UserInfo struct {
	UserID    int    `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Image     string `json:"image"` // Pointer to handle null values
}

type Message struct {
	MessageID  int       `json:"message_id"`
	SenderID   int       `json:"sender_id"`
	ReceiverID int       `json:"receiver_id"`
	CreatedAt  time.Time `json:"created_at"`
	Content    string    `json:"content"`
}

func GetChatInfo(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id
	userID := r.URL.Query().Get("receiver_id")
	if userID == "" {
		http.Error(w, "Missing userid parameter", http.StatusBadRequest)
		return
	}
	fmt.Println("got the userid", userID)

	inttargetUserID, err := strconv.Atoi(userID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	chatStatus, err := CheckIfFollowing(DB, requesterID, inttargetUserID)
	if err != nil {
		// Handle the error appropriately, e.g. log it or return
		http.Error(w, "Server error", http.StatusInternalServerError)
		return // or handle accordingly
	}

	if !chatStatus {
		sendErrorResponse(w, "You have to follow the person", http.StatusBadRequest)
		return
	}

	var info UserInfo
	query := "SELECT user_id, first_name , last_name , nickname , image FROM users WHERE user_id = ?"
	err = DB.QueryRow(query, userID).Scan(&info.UserID, info.FirstName, &info.LastName, &info.Nickname, &info.Image)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		fmt.Println("Database query error:", err)
		return
	}

	json.NewEncoder(w).Encode(info)
}

func GetChatUsers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	// Get the session token from the cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	// Retrieve the requester ID from the session
	session := sessions[cookie.Value]
	requesterID := session.id

	// SQL query to get users that the requester follows or are following the requester
	query := `
		SELECT DISTINCT u.user_id, u.first_name, u.last_name, u.nickname, u.image
		FROM user_relationships ur
		JOIN users u ON (ur.followed_id = u.user_id OR ur.follower_id = u.user_id)
		WHERE (ur.follower_id = ? OR ur.followed_id = ?)
		AND u.user_id != ?
		ORDER BY u.nickname;`

	rows, err := DB.Query(query, requesterID, requesterID, requesterID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		fmt.Println("Database query error:", err)
		return
	}
	defer rows.Close()

	var users []UserInfo

	for rows.Next() {
		var user UserInfo
		if err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName, &user.Nickname, &user.Image); err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			fmt.Println("Row scan error:", err)
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		fmt.Println("Row iteration error:", err)
		return
	}

	json.NewEncoder(w).Encode(users)
}

func GetMessages(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	// Check for session cookie
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	// Validate session
	session, exists := sessions[cookie.Value]
	if !exists {
		sendErrorResponse(w, "Invalid session", http.StatusUnauthorized)
		return
	}
	requesterID := session.id

	// Get receiver_id from query parameters
	receiverID := r.URL.Query().Get("userid")
	if receiverID == "" {
		http.Error(w, "Missing receiver_id parameter", http.StatusBadRequest)
		return
	}

	intReceiverID, err := strconv.Atoi(receiverID)
	if err != nil {
		http.Error(w, "Invalid receiver ID", http.StatusBadRequest)
		return
	}

	// Check if requester is following the receiver
	isFollowing, err := CheckIfFollowing(DB, requesterID, intReceiverID)
	if err != nil {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	if !isFollowing {
		sendErrorResponse(w, "You must follow the user to view messages", http.StatusForbidden)
		return
	}

	// Fetch messages from the database
	messages, err := fetchMessages(requesterID, intReceiverID)
	if err != nil {
		http.Error(w, "Error fetching messages", http.StatusInternalServerError)
		return
	}

	// Send the messages as JSON response
	json.NewEncoder(w).Encode(messages)
}

func fetchMessages(senderID, receiverID int) ([]Message, error) {
	query := `
        SELECT message_id, sender_id, receiver_id, created_at, content
        FROM messages
        WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)
        ORDER BY created_at ASC
    `
	rows, err := DB.Query(query, senderID, receiverID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var messages []Message
	for rows.Next() {
		var msg Message
		err := rows.Scan(&msg.MessageID, &msg.SenderID, &msg.ReceiverID, &msg.CreatedAt, &msg.Content)
		if err != nil {
			return nil, err
		}
		messages = append(messages, msg)
	}

	return messages, nil
}
