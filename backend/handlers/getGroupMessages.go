package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
)

func HandleGetGroupMessage(w http.ResponseWriter, r *http.Request) {
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

	query := `SELECT DISTINCT sender_id, content FROM group_messages WHERE group_id = ?`
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

	for i := range groupMessages {
		groupMessages[i].CreatedAt = time.Now().Format("2006-01-02 15:04:05")
		name, err := getUsernameByID(groupMessages[i].SenderID)
		if err != nil {
			fmt.Println(err, "P")
			return
		}
		groupMessages[i].Name = name
	}

	if err := rows.Err(); err != nil {
		fmt.Println(err, "MOREZ")
		return
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
