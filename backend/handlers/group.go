package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type Group struct {
	GroupName string   `json:"groupTitle"`
	GroupDesc string   `json:"groupDescription"`
	UsersIDs  []string `json:"ids"`
}

func HandleGroup(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id
	fmt.Println("rqid", requesterID)
	var group Group

	err = json.NewDecoder(r.Body).Decode(&group)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	if group.GroupName == "" || group.GroupDesc == "" {
		http.Error(w, "You must specify title and Group description", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	// Insert the group into the groups table and get the group_id
	result, err := DB.Exec("INSERT INTO groups (title, description, admin_id) VALUES (?, ?, ?)",
		group.GroupName, group.GroupDesc, requesterID)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Retrieve the group_id
	groupID, err := result.LastInsertId()
	if err != nil {
		http.Error(w, "Could not retrieve group ID", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Convert user IDs from strings to integers
	usersIDsWithoutAdmin, err := ConvertStringsToIntegers(group.UsersIDs)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Prepare the membership insertions
	membershipInsertions := make([]string, 0, len(usersIDsWithoutAdmin)+1)
	membershipValues := make([]interface{}, 0, len(usersIDsWithoutAdmin)+1)

	// First, insert the requestor with status 'accepted'
	membershipInsertions = append(membershipInsertions, "(?, ?, 'accepted')")
	membershipValues = append(membershipValues, requesterID, groupID) // group_id and user_id

	// Insert each user with status 'pending'
	for _, userID := range usersIDsWithoutAdmin {
		membershipInsertions = append(membershipInsertions, "(?, ?, 'pending')")
		membershipValues = append(membershipValues, userID, groupID) // group_id and user_id
	}

	// Build the final SQL query
	query := "INSERT INTO group_membership (user_id, group_id, status) VALUES " +
		join(membershipInsertions, ", ")

	// Execute the insertions
	_, err = DB.Exec(query, membershipValues...)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	var followerName string
	err = DB.QueryRow("SELECT nickname FROM users WHERE user_id = ?", requesterID).Scan(&followerName)
	if err != nil {
		http.Error(w, "Follower not found", http.StatusInternalServerError)
		return
	}

	for _, user := range usersIDsWithoutAdmin {
		Sendinviterequest(user, requesterID, int(groupID), followerName)
	}

	// Respond with the group ID
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message":  "Group created and users added successfully",
		"group_id": groupID,
	})
}

// Helper function to join slices into a string
func join(elements []string, separator string) string {
	if len(elements) == 0 {
		return ""
	}
	result := elements[0]
	for _, elem := range elements[1:] {
		result += separator + elem
	}
	return result
}

func ConvertStringsToIntegers(stringArray []string) ([]int, error) {
	intArray := make([]int, len(stringArray))
	for i, str := range stringArray {
		num, err := strconv.Atoi(str)
		if err != nil {
			return nil, err // Return error if conversion fails
		}
		intArray[i] = num
	}
	return intArray, nil
}

func Sendinviterequest(receiverid int, senderid int, groupid int, sendername string) {
	notificationContent := fmt.Sprintf("%s sent you a group invite.", sendername)
	hiddenInfo := fmt.Sprintf("%d", groupid) // Store the relationship ID in hidden info
	_, err := DB.Exec("INSERT INTO notifications (user_id, type, content, sender_id, hidden_info) VALUES ($1, $2, $3, $4, $5)", receiverid, "groupInvitation", notificationContent, senderid, hiddenInfo)
	if err != nil {
		fmt.Println("error inserting send invite request of groups", err)
		return
	}
	countQuery := `
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = $1
    `
	var count int
	err = DB.QueryRow(countQuery, receiverid).Scan(&count)
	if err != nil {
		fmt.Println(err)
		return
	}

	if len(clients[receiverid]) > 0 {
		for _, client := range clients[receiverid] {
			sendNotificationCount(client, count)
			Sendupdatednotification(client, receiverid)
		}
	}
}

func Sendjoinrequest(receiverid int, senderid int, groupid int, sendername string) {
	notificationContent := fmt.Sprintf("%s wants to join your group.", sendername)
	hiddenInfo := fmt.Sprintf("%d", groupid) // Store the relationship ID in hidden info
	_, err := DB.Exec("INSERT INTO notifications (user_id, type, content, sender_id, hidden_info) VALUES ($1, $2, $3, $4, $5)", receiverid, "groupJoinRequest", notificationContent, senderid, hiddenInfo)
	if err != nil {
		fmt.Println("error inserting send invite request of groups", err)
		return
	}
	countQuery := `
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = $1
    `
	var count int
	err = DB.QueryRow(countQuery, receiverid).Scan(&count)
	if err != nil {
		fmt.Println(err)
		return
	}

	if len(clients[receiverid]) > 0 {
		for _, client := range clients[receiverid] {
			sendNotificationCount(client, count)
			Sendupdatednotification(client, receiverid)
		}
	}
}
