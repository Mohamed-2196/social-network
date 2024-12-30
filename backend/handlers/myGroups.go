package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func HandleMyGroups(w http.ResponseWriter, r *http.Request) {
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
	// g.group_id, g.name, g.description, g.created_at, g.type
	query := `
	SELECT g.group_id, g.title, g.description
	FROM groups g
	INNER JOIN group_membership gm ON g.group_id = gm.group_id
	WHERE gm.user_id = $1
	AND gm.status = 'accepted'
	`

	rows, err := DB.Query(query, userID)
	if err != nil {
		http.Error(w, "Query execution failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groups []PublicGroup

	for rows.Next() {
		var group PublicGroup
		if err := rows.Scan(&group.GroupID, &group.Name, &group.Description); err != nil {
			http.Error(w, "Error scanning rows", http.StatusInternalServerError)
			return
		}
		groups = append(groups, group)
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(groups); err != nil {
		http.Error(w, "Error encoding JSON", http.StatusInternalServerError)
		return
	}

}
