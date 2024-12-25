package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type PublicGroup struct {
	GroupID     int       `json:"group_id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	CreatedAt   time.Time `json:"created_at"`
	Type        bool      `json:"type"`
}

func HandlePublicGroup(w http.ResponseWriter, r *http.Request) {
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
    SELECT g.group_id, g.name, g.description, g.created_at, g.type
    FROM groups g
    LEFT JOIN group_membership gm
    ON g.group_id = gm.group_id AND gm.user_id = ?
    WHERE g.type = 0 AND gm.user_id IS NULL;
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
		if err := rows.Scan(&group.GroupID, &group.Name, &group.Description, &group.CreatedAt, &group.Type); err != nil {
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
