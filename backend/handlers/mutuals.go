package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Mutual struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}

func HandleMutuals(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

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

	query := `
		SELECT u.user_id, u.nickname, u.email
		FROM user_relationships ur1
		JOIN user_relationships ur2
		  ON ur1.followed_id = ur2.follower_id AND ur1.follower_id = ur2.followed_id
		JOIN users u
		  ON ur1.followed_id = u.user_id
		WHERE ur1.follower_id = ? AND ur1.status = 'accepted' AND ur2.status = 'accepted';
	`

	rows, err := DB.Query(query, userID)
	if err != nil {
		http.Error(w, "Query execution failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var mutuals []Mutual

	for rows.Next() {
		var mutual Mutual
		if err := rows.Scan(&mutual.UserID, &mutual.Name, &mutual.Email); err != nil {
			http.Error(w, "Error scanning rows", http.StatusInternalServerError)
			return
		}
		mutuals = append(mutuals, mutual)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(mutuals); err != nil {
		http.Error(w, "Error encoding JSON", http.StatusInternalServerError)
		return
	}

}
