package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type GroupPollRequest struct {
	GroupID     string   `json:"groupid"`
	Title       string   `json:"pollTopic"`
	Discription string   `json:"pollDescription"`
	Options     []string `json:"pollOptions"`
}

func saveGroupPoll(groupID, userID int, title string, description string, options []string) (GroupMessage, error) {
	now := time.Now().Format("2006-01-02 15:04:05")
	query := `INSERT INTO group_event (title, description, created_by, created_at , group_id)
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := DB.Exec(query, title, description, userID, now, groupID)
	if err != nil {
		fmt.Println(err)
		return GroupMessage{}, err
	}

	pollID, err := result.LastInsertId()
	if err != nil {
		fmt.Println(err)
		return GroupMessage{}, err
	}

	for _, option := range options {
		optionQuery := `INSERT INTO event_option (content , event_id) VALUES (?, ?)`
		_, err := DB.Exec(optionQuery, option, pollID)
		if err != nil {
			fmt.Errorf("failed to save poll options: %w", err)
			return GroupMessage{}, err
		}
	}
	//change the dummy data to actual data
	query = `INSERT INTO group_messages(group_id , sender_id , created_at , group_post_id , content) VALUES(?,?,?,?,?)`
	_, err = DB.Exec(query, groupID, userID, now, pollID, "hh")
	if err != nil {
		err = fmt.Errorf("failed to save poll in messages: %w", err)
		return GroupMessage{}, err
	}

	query = `INSERT INTO notifications(user_id , type , content , sender_id , hidden_info) VALUES (? ,? ,?,?,?)`
	notification := fmt.Sprintf("%s ,event is created .", title)

	members, err := getGroupMembers(groupID)
	if err != nil {
		fmt.Errorf("Error fetching group members", http.StatusInternalServerError)
	}

	for _, user := range members {
		_, err = DB.Exec(query, user.UserID, "groupEvent", notification, userID, groupID)
		if err != nil {
			err = fmt.Errorf("failed to save notification : %w", err)
			return GroupMessage{}, err
		}
		recipientConns := clients[user.UserID]
		countQuery := `
	SELECT COUNT(*) 
	FROM notifications 
	WHERE user_id = $1
`
		var count int
		err := DB.QueryRow(countQuery, user.UserID).Scan(&count)
		if err != nil {
			fmt.Println(err)
		}
		for _, conn := range recipientConns {
			sendNotificationCount(conn, count)
			Sendupdatednotification(conn, user.UserID)
			if err != nil {
				fmt.Println("Error sending message to recipient:", err)
			}
		}
	}

	var newMessage GroupMessage
	userQuery := `
    SELECT gm.group_id, gm.sender_id, gm.created_at, u.nickname, u.image, gm.group_post_id, ge.title, ge.description
    FROM group_messages gm
    JOIN users u ON gm.sender_id = u.user_id
    LEFT JOIN group_event ge ON gm.group_post_id = ge.event_id
    WHERE gm.group_id = ? AND gm.sender_id = ? AND gm.created_at = ?
`

	err = DB.QueryRow(userQuery, groupID, userID, now).Scan(
		&newMessage.GroupID,
		&newMessage.SenderID,
		&newMessage.CreatedAt,
		&newMessage.Name,
		&newMessage.AuthorImage,
		&newMessage.PollID,
		&newMessage.PollTitle,
		&newMessage.PollDescription,
	)
	if err != nil {
		fmt.Println("Error adding data to newMessage", err)
	}

	if newMessage.PollID != 0 {
		optionsQuery := `SELECT option_id, content FROM event_option WHERE event_id = ?`
		optionRows, err := DB.Query(optionsQuery, newMessage.PollID)
		if err != nil {
			return GroupMessage{}, fmt.Errorf("failed to fetch poll options: %w", err)
		}
		defer optionRows.Close()

		for optionRows.Next() {
			var option PollOption
			err := optionRows.Scan(&option.OptionID, &option.Content)
			if err != nil {
				return GroupMessage{}, fmt.Errorf("failed to scan poll option: %w", err)
			}
			newMessage.PollOptions = append(newMessage.PollOptions, option)
		}

		if err := optionRows.Err(); err != nil {
			return GroupMessage{}, fmt.Errorf("error after iterating poll options: %w", err)
		}
	}
	return newMessage, nil
}

func HandleGroupPoll(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

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
	var pollreq GroupPollRequest
	err = json.NewDecoder(r.Body).Decode(&pollreq)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}
	fmt.Println(pollreq)

	if pollreq.Title == "" || pollreq.Discription == "" || len(pollreq.Options) < 2 {
		http.Error(w, "Missing required fields", http.StatusBadRequest)
		return
	}

	newMessage, err := saveGroupPoll(groupID, userID, pollreq.Title, pollreq.Discription, pollreq.Options)
	if err != nil {
		fmt.Println(err)
		fmt.Println("opppsss cant be saved")
	}

	members, err := getGroupMembers(groupID)
	if err != nil {
		http.Error(w, "Error fetching group members", http.StatusInternalServerError)
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

	w.WriteHeader(http.StatusOK)
	fmt.Println("polll issss heeerrrree")
	json.NewEncoder(w).Encode(map[string]string{"message": "Poll SENT"})
}
