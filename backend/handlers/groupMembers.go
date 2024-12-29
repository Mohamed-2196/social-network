package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

func HandleGroupMembers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	fmt.Println("ENTER")
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

	var group Group

	err = json.NewDecoder(r.Body).Decode(&group)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}
	query := `
	SELECT group_id
	FROM groups
	ORDER BY group_id DESC
	LIMIT 1;
`

	var lastGroupID int
	err = DB.QueryRow(query).Scan(&lastGroupID)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Errorf("no groups found")
		}
		fmt.Errorf("query failed: %w", err)
	}

	fmt.Println(group)
	fmt.Println(userID)

	query = `
		INSERT INTO group_membership (group_id, user_id, admin)
		VALUES (?, ?, TRUE);
	`

	// Execute the query
	_, err = DB.Exec(query, lastGroupID, userID)
	if err != nil {
		fmt.Errorf("failed to insert group membership: %w", err)
	}

	query = `
		INSERT INTO group_membership (group_id, user_id, admin)
		VALUES (?, ?, FALSE);
	`
	for _, user := range group.UsersID {
		_, err = DB.Exec(query, lastGroupID, user)
		if err != nil {
			fmt.Errorf("failed to insert group membership: %w", err)
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Members Added :D"})
}


