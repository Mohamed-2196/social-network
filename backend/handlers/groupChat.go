package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

type groupChat struct {
	GroupID     int      `json:"groupID"`
	Name        string   `json:"groupName"`
	Description string   `json:"groupDescription"`
	Users       []Member `json:"users"`
	AdminID     int      `json:"adminID"`
}
type InviteRequest struct {
	UserIDs []string `json:"userIDs"`
}

type Member struct {
	UserID int    `json:"user_id"`
	Name   string `json:"username"`
	Admin  bool   `json:"admin"`
	Me     bool   `json:"me"`
	Image  string `json:"image"`
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

	groupIDStr := r.PathValue("groupid")

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

func Inviteothers(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)

	// Check for session token
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id
	fmt.Println("Requester ID:", requesterID)

	groupIDStr := r.PathValue("groupid")

	// Convert groupid to an integer
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Check if requester is a member of the group
	var membershipCount int
	membershipQuery := `SELECT COUNT(*) FROM group_membership 
                        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`
	err = DB.QueryRow(membershipQuery, groupID, requesterID).Scan(&membershipCount)
	if err != nil {
		log.Printf("Error checking group membership: %v", err)
		sendErrorResponse(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}

	if membershipCount == 0 {
		sendErrorResponse(w, "User is not a member of the group", http.StatusForbidden)
		return
	}

	// Read user IDs from the request body
	var inviteRequest InviteRequest
	err = json.NewDecoder(r.Body).Decode(&inviteRequest)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	// Convert user IDs from strings to integers
	usersIDsWithoutAdmin, err := ConvertStringsToIntegers(inviteRequest.UserIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Check for existing memberships with 'pending' or 'accepted' status
	existingUsers := make(map[int]bool)
	placeholders := make([]string, len(usersIDsWithoutAdmin))
	for i := range placeholders {
		placeholders[i] = "?"
	}

	query := fmt.Sprintf("SELECT user_id FROM group_membership WHERE group_id = ? AND user_id IN (%s) AND status IN ('pending', 'accepted')",
		strings.Join(placeholders, ","))

	args := make([]interface{}, 0, len(usersIDsWithoutAdmin)+1)
	args = append(args, groupID)
	for _, id := range usersIDsWithoutAdmin {
		args = append(args, id)
	}

	rows, err := DB.Query(query, args...)
	if err != nil {
		log.Printf("Error querying existing memberships: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var userID int
		if err := rows.Scan(&userID); err != nil {
			log.Printf("Error scanning row: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		existingUsers[userID] = true
	}

	// Prepare the membership insertions for users who do not have pending or accepted status
	var newInvites []int
	for _, userID := range usersIDsWithoutAdmin {
		if !existingUsers[userID] {
			newInvites = append(newInvites, userID)
		}
	}

	// If there are new invites, insert them into the database
	if len(newInvites) > 0 {
		placeholders = make([]string, len(newInvites))
		for i := range placeholders {
			placeholders[i] = "(?, ?, 'pending')"
		}
		insertQuery := fmt.Sprintf("INSERT INTO group_membership (user_id, group_id, status) VALUES %s",
			strings.Join(placeholders, ", "))

		args = make([]interface{}, 0, len(newInvites)*2)
		for _, userID := range newInvites {
			args = append(args, userID, groupID)
		}

		_, err = DB.Exec(insertQuery, args...)
		if err != nil {
			log.Printf("Error inserting new memberships: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		// Send invitation requests to each newly invited user
		var followerName string
		err = DB.QueryRow("SELECT nickname FROM users WHERE user_id = ?", requesterID).Scan(&followerName)
		if err != nil {
			log.Printf("Error fetching follower name: %v", err)
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		for _, userID := range newInvites {
			Sendinviterequest(userID, requesterID, groupID, followerName)
		}
	}

	// Respond with success, regardless of whether new invitations were sent
	w.WriteHeader(http.StatusOK)
	response := map[string]interface{}{
		"group_id": groupID,
	}
	if len(newInvites) > 0 {
		response["message"] = "Users invited successfully"
	} else {
		response["message"] = "No new users to invite"
	}
	json.NewEncoder(w).Encode(response)
}

func Request(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)

	// Check for session token
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id
	fmt.Println("Requester ID:", requesterID)

	groupIDStr := r.PathValue("groupid")

	// Convert groupid to an integer
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	// Check if requester is already a member of the group
	var membershipCount int
	membershipQuery := `SELECT COUNT(*) FROM group_membership 
                        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`
	err = DB.QueryRow(membershipQuery, groupID, requesterID).Scan(&membershipCount)
	if err != nil {
		log.Printf("Error checking group membership: %v", err)
		sendErrorResponse(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}

	if membershipCount > 0 {
		sendErrorResponse(w, "User is already a member of the group", http.StatusBadRequest)
		return
	}

	// Get the admin ID from the groups table
	var adminID int
	adminQuery := `SELECT admin_id FROM groups WHERE group_id = ?`
	err = DB.QueryRow(adminQuery, groupID).Scan(&adminID)
	if err != nil {
		log.Printf("Error retrieving admin ID: %v", err)
		sendErrorResponse(w, "Error retrieving admin ID", http.StatusInternalServerError)
		return
	}

	// Insert the requester into the group_membership with status 'pending'
	insertQuery := `INSERT INTO group_membership (user_id, group_id, status) VALUES (?, ?, 'pending')`
	_, err = DB.Exec(insertQuery, requesterID, groupID)
	if err != nil {
		log.Printf("Error inserting into group_membership: %v", err)
		sendErrorResponse(w, "Error joining the group", http.StatusInternalServerError)
		return
	}

	// Send a notification to the admin
	var requesterName string
	nameQuery := `SELECT nickname FROM users WHERE user_id = ?`
	err = DB.QueryRow(nameQuery, requesterID).Scan(&requesterName)
	if err != nil {
		log.Printf("Error retrieving requester name: %v", err)
		sendErrorResponse(w, "Error retrieving requester name", http.StatusInternalServerError)
		return
	}

	Sendjoinrequest(adminID, requesterID, groupID, requesterName)

	// Respond with a success message
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Request to join the group has been sent.",
	})
}
