package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
)

type MessageInput struct {
	Message string `json:"message"`
}

type GroupMessage struct {
	SenderID        int          `json:"sender_id"`
	GroupID         int          `json:"group_id"`
	Name            string       `json:"name"`
	CreatedAt       string       `json:"created_at"`
	Content         string       `json:"content"`
	AuthorImage     string       `json:"author_image"`
	PollID          int          `json:"Poll_id"`
	PollTitle       string       `json:"poll_title"`
	PollDescription string       `json:"poll_description"`
	PollOptions     []PollOption `json:"poll_options"`
	//PollVotes
}

type MessageToClient struct {
	Type          string       `json:"type"`
	MessageClient GroupMessage `json:"messageClient"`
	PostMessage   GroupPost    `json:"postMessage"`
}

func HandleGroupMessage(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	log.Println("ENTER MESSAGING")

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	groupID, err := getGroupIDFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !isUserGroupMember(userID, groupID) {
		sendErrorResponse(w, "User is not a member of the group", http.StatusForbidden)
		return
	}

	userMessage, err := decodeMessageInput(r)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		return
	}

	members, err := getGroupMembers(groupID)
	if err != nil {
		http.Error(w, "Error fetching group members", http.StatusInternalServerError)
		return
	}

	newMessage, err := saveGroupMessage(groupID, userID, userMessage.Message)
	if err != nil {
		http.Error(w, "Error saving message", http.StatusInternalServerError)
		fmt.Println("ahem", err)
		return
	}

	// Create the message to send to clients
	messageToClient := MessageToClient{
		Type:          "new_message",
		MessageClient: newMessage,
	}

	// Send the message to all connected clients
	for _, user := range members {
		if len(clients[user.UserID]) > 0 {
			for _, client := range clients[user.UserID] {
				// Send the structured message to the connected client
				err := client.WriteJSON(messageToClient)
				if err != nil {
					log.Printf("Error sending message to user %d: %v", user.UserID, err)
				}
			}
		}
	}
}

func getUserIDFromSession(r *http.Request) (int, error) {
	c, err := r.Cookie("session_token")
	if err != nil {
		return 0, fmt.Errorf("no active session")
	}
	sessionToken := c.Value
	session, ok := sessions[sessionToken]
	if !ok {
		return 0, fmt.Errorf("invalid session")
	}
	return session.id, nil
}

func getGroupIDFromRequest(r *http.Request) (int, error) {
	groupIDStr := r.PathValue("groupid")
	return strconv.Atoi(groupIDStr)
}

func isUserGroupMember(userID, groupID int) bool {
	var membershipCount int
	membershipQuery := `SELECT COUNT(*) FROM group_membership 
                        WHERE group_id = ? AND user_id = ? AND status = 'accepted'`
	err := DB.QueryRow(membershipQuery, groupID, userID).Scan(&membershipCount)
	if err != nil {
		log.Printf("Error checking group membership: %v", err)
		return false
	}
	return membershipCount > 0
}

func decodeMessageInput(r *http.Request) (MessageInput, error) {
	var userMessage MessageInput
	err := json.NewDecoder(r.Body).Decode(&userMessage)
	if err != nil {
		return MessageInput{}, err
	}
	return userMessage, nil
}

func getGroupInfo(groupID int) (groupChat, error) {
	var groupInfo groupChat
	groupQuery := `
        SELECT group_id, title, description, admin_id
        FROM groups
        WHERE group_id = ?;
    `
	err := DB.QueryRow(groupQuery, groupID).Scan(
		&groupInfo.GroupID,
		&groupInfo.Name,
		&groupInfo.Description,
		&groupInfo.AdminID,
	)
	return groupInfo, err
}

func getGroupMembers(groupID int) ([]Member, error) {
	memberQuery := `
    SELECT user_id, user_id = (SELECT admin_id FROM groups WHERE group_id = ?) as is_admin
    FROM group_membership
    WHERE group_id = ?;
    `
	rows, err := DB.Query(memberQuery, groupID, groupID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var members []Member
	for rows.Next() {
		var member Member
		if err := rows.Scan(&member.UserID, &member.Admin); err != nil {
			return nil, err
		}
		members = append(members, member)
	}
	return members, nil
}

func saveGroupMessage(groupID, userID int, message string) (GroupMessage, error) {
	// Define the current time
	now := time.Now().Format("2006-01-02 15:04:05")

	// Prepare the SQL query to insert the message with the current timestamp
	query := `
        INSERT INTO group_messages (group_id, sender_id, content, created_at)
        VALUES (?, ?, ?, ?)
    `
	_, err := DB.Exec(query, groupID, userID, message, now)
	if err != nil {
		return GroupMessage{}, err
	}

	// Prepare a query to get the message along with user nickname and image
	var newMessage GroupMessage
	userQuery := `
        SELECT gm.group_id, gm.sender_id, gm.content, gm.created_at, u.nickname, u.image
        FROM group_messages gm
        JOIN users u ON gm.sender_id = u.user_id
        WHERE gm.group_id = ? AND gm.sender_id = ? AND gm.created_at = ?
    `
	err = DB.QueryRow(userQuery, groupID, userID, now).Scan(
		&newMessage.GroupID,
		&newMessage.SenderID,
		&newMessage.Content,
		&newMessage.CreatedAt,
		&newMessage.Name, // Assuming you add these fields to GroupMessage,
		&newMessage.AuthorImage,
	)
	if err != nil {
		return GroupMessage{}, err
	}

	// Return the new message with user nickname and image
	return newMessage, nil
}
