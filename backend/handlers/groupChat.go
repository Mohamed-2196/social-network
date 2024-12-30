package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type groupChat struct {
	GroupID     int      `json:"groupID"`
	Name        string   `json:"groupName"`
	Description string   `json:"groupDescription"`
	Users       []Member `json:"users"`
	AdminID int `json:"adminID"`
}

type Member struct {
	UserID int    `json:"user_id"`
	Name   string `json:"username"`
	Admin  bool   `json:"admin"`
	Me     bool   `json:"me"`
	Image string `json:"image"`
}

func HandleGroupChat(w http.ResponseWriter, r *http.Request) {
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
	session, ok := sessions[sessionToken]
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
	fmt.Println("CHECK1")
	userID := session.id

	var membershipCount int
	membershipQuery := `SELECT COUNT(*) FROM group_membership 
                        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`
	err = DB.QueryRow(membershipQuery, groupID, userID).Scan(&membershipCount)
	if err != nil {
		log.Fatal("Error checking group membership:", err)
		sendErrorResponse(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}

	if membershipCount == 0 {
		sendErrorResponse(w, "User is not a member of the group", http.StatusForbidden)
		return
	}
	var groupInfo groupChat

	groupQuery := `
		SELECT group_id, title, description, admin_id
		FROM groups
		WHERE group_id = ?;
	`
	var adminUserID int
	err = DB.QueryRow(groupQuery, groupID).Scan(
		&groupInfo.GroupID,
		&groupInfo.Name,
		&groupInfo.Description,
		&adminUserID,
	)

	if err != nil {
		fmt.Println(err)
		return
	}

	memberQuery := `
		SELECT gm.user_id, u.image
		FROM group_membership gm
		JOIN users u ON gm.user_id = u.user_id
		WHERE gm.group_id = ? AND gm.status = 'accepted';
	`

	rows, err := DB.Query(memberQuery, groupID)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer rows.Close()

	var members []Member

	for rows.Next() {
		var member Member
		if err := rows.Scan(&member.UserID, &member.Image); err != nil {
			fmt.Println(err)
			return
		}
		member.Admin = (member.UserID == adminUserID)
		members = append(members, member)
	}

	for i := range members {
		members[i].Me = (members[i].UserID == userID)
		members[i].Name, err = getUsernameByID(members[i].UserID)
		if err != nil {
			fmt.Println(err)
			return
		}
	}

	groupInfo.Users = members

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(groupInfo); err != nil {
		http.Error(w, "Error encoding JSON", http.StatusInternalServerError)
		return
	}
}

func getUsernameByID(id int) (string, error) {
	var username string
	err := DB.QueryRow("SELECT nickname FROM users WHERE user_id = ?", id).Scan(&username)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", fmt.Errorf("no user found with email: %s", id)
		}
		return "", fmt.Errorf("error querying database: %v", err)
	}
	return username, nil
}
