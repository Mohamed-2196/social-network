package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

type MessageInput struct {
	Message string `json:"message"`
}

type GroupMessage struct {
	SenderID  int    `json:"sender_id"`
	Name      string `json:"name"`
	CreatedAt string `json:"created_at"`
	Content   string `json:"content"`
}

type MessageClient struct {
	Type          string         `json:"type"`
	MessageClient []GroupMessage `json:"messageClient"`
}

// ReceiversID    []int     `json:"receivers_id"`
// GroupMessageID int       `json:"group_message_id"`

func HandleGroupMessage(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	fmt.Println("ENTER MESSAGING ")
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			http.Error(w, "No active session", http.StatusUnauthorized)
			fmt.Println(err, "1")
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	sessionToken := c.Value
	session, ok := sessions[sessionToken]
	if !ok {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		fmt.Println(err, "2")
		return
	}

	deleteMessagesIfRowCountIs20(DB)

	vars := mux.Vars(r)
	groupIDStr := vars["groupid"]

	// Convert groupid to an integer
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid groupid", http.StatusBadRequest)
		fmt.Println(err, "3")
		return
	}

	var userMessage MessageInput
	err = json.NewDecoder(r.Body).Decode(&userMessage)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	userID := session.id
	// myName, err := getUsernameByID(userID)
	if err != nil {
		fmt.Println(err, "getting username")
		return
	}

	memberQuery := `
	SELECT user_id, admin
	FROM group_membership
	WHERE group_id = ?;
`

	rows, err := DB.Query(memberQuery, groupID)
	if err != nil {
		fmt.Println(err, "4")
		return
	}
	defer rows.Close()

	// Iterate through members and add them to the group
	var members []Member

	for rows.Next() {
		var member Member
		if err := rows.Scan(&member.UserID, &member.Admin); err != nil {
			fmt.Println(err, "5")
			return
		}
		members = append(members, member)
	}

	query := `
		INSERT INTO group_messages (group_id, sender_id, receiver_id, content)
		VALUES (?, ?, ?, ?)
	`

	for i := range members {
		uid := members[i].UserID
		_, err = DB.Exec(query, groupID, userID, uid, userMessage.Message)
		if err != nil {
			fmt.Println(err, "6")
			return
		}
	}

	query = `SELECT DISTINCT sender_id, content FROM group_messages WHERE group_id = ?`
	rows, err = DB.Query(query, groupID)
	if err != nil {
		fmt.Println(err, "ERROR")
		return
	}
	defer rows.Close()

	var groupMessages []GroupMessage

	for rows.Next() {
		var groupMessage GroupMessage
		if err := rows.Scan(&groupMessage.SenderID, &groupMessage.Content); err != nil {
			fmt.Println(err, "MORE")
			return
		}
		groupMessages = append(groupMessages, groupMessage)
	}

	if err := rows.Err(); err != nil {
		fmt.Println(err, "MOREZ")
		return
	}

	for i := range groupMessages {
		groupMessages[i].CreatedAt = time.Now().Format("2006-01-02 15:04:05")
		name, err := getUsernameByID(groupMessages[i].SenderID)
		if err != nil {
			fmt.Println(err, "P")
			return
		}
		groupMessages[i].Name = name
	}

	for i := range members {
		uid := members[i].UserID
		if len(clients[uid]) > 0 && uid != userID {
			for _, client := range clients[uid] {
				sendMessageToClient(client, groupMessages)
			}
		}
	}

	// fmt.Println(groupMessages)
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(groupMessages)
	if err != nil {
		fmt.Println("Error encoding GroupMessage:", err)
		return
	}

}

func sendMessageToClient(ws *websocket.Conn, messages []GroupMessage) {
	message := MessageClient{
		Type:          "messagesToClient",
		MessageClient: messages,
	}

	jsonMessage, err := json.Marshal(message)
	if err != nil {
		fmt.Println(err)
		return
	}

	err = ws.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		fmt.Println(err)
		return
	}
}

func deleteMessagesIfRowCountIs20(db *sql.DB) error {
	// Step 1: Get row count
	var rowCount int
	err := db.QueryRow("SELECT COUNT(*) FROM group_messages").Scan(&rowCount)
	if err != nil {
		return fmt.Errorf("failed to get row count: %w", err)
	}

	// Step 2: Delete all rows if row count is 20
	if rowCount > 20 {
		_, err := db.Exec("DELETE FROM group_messages")
		if err != nil {
			return fmt.Errorf("failed to delete rows: %w", err)
		}
	}

	return nil
}
