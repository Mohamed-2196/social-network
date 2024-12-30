package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
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

func Invitableusers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)

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
	_, ok := sessions[sessionToken]
	if !ok {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	vars := mux.Vars(r)
	groupIDStr := vars["groupid"]

	// Convert groupid to an integer
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid groupid", http.StatusBadRequest)
		return
	}

	// Fetch users that are not pending or accepted in the specified group
	query := `SELECT user_id, first_name, last_name, image 
              FROM users 
              WHERE user_id NOT IN (
                  SELECT user_id 
                  FROM group_membership 
                  WHERE group_id = ? 
                  AND status IN ('pending', 'accepted')
              )`

	rows, err := DB.Query(query, groupID)
	if err != nil {
		http.Error(w, "Database query error", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
	defer rows.Close()
	var users []struct {
		ID        string `json:"id"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Avatar    string `json:"avatar"`
	}

	for rows.Next() {
		var user struct {
			ID        string `json:"id"`
			FirstName string `json:"first_name"`
			LastName  string `json:"last_name"`
			Avatar    string `json:"avatar"`
		}
		if err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Avatar); err != nil {
			http.Error(w, "Error scanning user data", http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		http.Error(w, "Error processing results", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Respond with the list of users
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
}
