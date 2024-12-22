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
			fmt.Println(err)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sessionToken := c.Value
	session, ok := sessions[sessionToken]
	if !ok {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		fmt.Println(err)

		return
	}

	userID := session.id

	// Query the database for user data along with counts
	var (
		createdAt      string
		email          string
		firstName      string
		lastName       string
		nickname       string
		birthday       string
		image          string
		about          string
		private        bool
		followersCount int
		followingCount int
		postCount      int
	)

	// SQL query to retrieve user information and counts
	query := `
		SELECT 
    u.created_at, 
    u.email, 
    u.first_name, 
    u.last_name, 
    u.nickname, 
    u.birthday, 
    u.image, 
    u.about, 
    u.private,
    (SELECT COUNT(*) FROM user_relationships WHERE followed_id = ?) AS followers_count,
    (SELECT COUNT(*) FROM user_relationships WHERE follower_id = ?) AS following_count,
    (SELECT COUNT(*) FROM posts WHERE user_id = ?) AS post_count
FROM users u 
WHERE u.user_id = ?`

	row := DB.QueryRow(query, userID, userID, userID, userID)

	err = row.Scan(&createdAt, &email, &firstName, &lastName, &nickname, &birthday, &image, &about, &private, &followersCount, &followingCount, &postCount)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
			fmt.Println(err)
			return
		}
		fmt.Println(err)
		http.Error(w, "Database error", http.StatusInternalServerError)

		return
	}

	// Prepare the response data
	response := map[string]interface{}{
		"created_at":      createdAt,
		"email":           email,
		"first_name":      firstName,
		"last_name":       lastName,
		"nickname":        nickname,
		"birthday":        birthday,
		"image":           image,
		"about":           about,
		"private":         private,
		"followers_count": followersCount,
		"following_count": followingCount,
		"post_count":      postCount,
	}

	// Send the response
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
