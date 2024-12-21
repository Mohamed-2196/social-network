package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

func UserDataHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r) // Enable CORS for this endpoint

	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			http.Error(w, "No active session", http.StatusUnauthorized)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sessionToken := c.Value
	session, ok := sessions[sessionToken]
	if !ok {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		return
	}

	userID := session.id

	// Query the database for user data
	var (
		createdAt string
		email     string
		firstName string
		lastName  string
		nickname  string
		birthday  string
		image     string
		about     string
		private   bool
	)

	row := DB.QueryRow("SELECT created_at, email, first_name, last_name, nickname, birthday, image, about, private FROM users WHERE user_id = ?", userID)

	err = row.Scan(&createdAt, &email, &firstName, &lastName, &nickname, &birthday, &image, &about, &private)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Process the data as needed, e.g., send back as JSON
	// Here, we'll just send a simple text response
	response := map[string]string{
		"created_at": createdAt,
		"email":      email,
		"first_name": firstName,
		"last_name":  lastName,
		"nickname":   nickname,
		"birthday":   birthday,
		"image":      image,
		"about":      about,
		"private":    fmt.Sprintf("%t", private),
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
