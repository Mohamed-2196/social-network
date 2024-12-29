package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"
)

type GroupPostRequest struct {
	GroupID string `json:"groupid"`
	Content string `json:"content"`
	Image   string `json:"image"`
}

type GroupClient struct {
	Type string `json:"type"`
}

type GroupPost struct {
	GroupPostID int    `json:"id"`
	Content     string `json:"content_text"`
	Image       string `json:"content_image"`
	LikeCount   int    `json:"like_count"`
	UserLiked   bool   `json:"user_liked"`
	AuthorID    int    `json:"author_id"`
	AuthorName  string `json:"author_name"`
	AuthorImage string `json:"author_image"`
}

func HanldeGroupPost(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GROUP POST")
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	userID := session.id
	if userID == 0 {
		sendErrorResponse(w, "Invalid session", http.StatusUnauthorized)
		http.Redirect(w, r, "/auth", http.StatusNonAuthoritativeInfo)
		return
	}

	deleteIfMore(DB)

	var req GroupPostRequest

	req.GroupID = r.FormValue("groupid")
	if err != nil {
		fmt.Println(err, 1)
		return
	}

	groupID, err := strconv.Atoi(r.FormValue("groupid"))
	if err != nil {
		fmt.Println(err)
		return
	}

	req.Content = r.FormValue("content")
	file, handler, err := r.FormFile("image")
	var imagefilename string
	if err == nil {
		defer file.Close()
		imagefilename, err = saveFile(file, handler)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}

	fmt.Println(req, "REQ")
	fmt.Println(imagefilename, "QER")

	stmt, err := DB.Prepare(`
		INSERT INTO "group_post" (
			"group_id",
			"user_id",
			"content_text",
			"content_image",
			"created_at"
		) VALUES (?, ?, ?, ?, ?);
	`)
	if err != nil {
		log.Fatal(err)
	}
	defer stmt.Close()

	createdAt := time.Now().Format("2006-01-02 15:04:05")

	_, err = stmt.Exec(req.GroupID, userID, req.Content, imagefilename, createdAt)
	if err != nil {
		log.Fatal(err)
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

	query := `SELECT group_post_id FROM group_post ORDER BY group_post_id DESC LIMIT 1`
	var lastGroupPostID int
	err = DB.QueryRow(query).Scan(&lastGroupPostID)
	if err != nil {
		if err == sql.ErrNoRows {
			fmt.Println("No rows found in the table.")
		} else {
			log.Fatal("Error executing query:", err)
		}
	} else {
		fmt.Printf("The last group_post_id is: %d\n", lastGroupPostID)
	}

	query = `
		INSERT INTO group_messages (group_id, sender_id, receiver_id, group_post_id, content)
		VALUES (?, ?, ?, ?, ?)
	`

	for i := range members {
		uid := members[i].UserID
		_, err = DB.Exec(query, groupID, userID, uid, lastGroupPostID, "")
		if err != nil {
			fmt.Println(err, "6")
			return
		}
	}

	query = `
		SELECT 
			gm.sender_id, 
			gm.created_at, 
			gp.content_image, 
			gp.content_text
		FROM 
			group_messages AS gm
		JOIN 
			group_post AS gp ON gm.group_post_id = gp.group_post_id
		WHERE 
			gp.group_post_id = ?;
	`

	rows, err = DB.Query(query, lastGroupPostID)
	if err != nil {
		log.Fatal("Error executing query:", err)
	}
	defer rows.Close()

	var groupMessages []GroupMessage

	for rows.Next() {
		var details GroupMessage
		err := rows.Scan(&details.SenderID, &details.CreatedAt, &details.PostImage, &details.PostContent)
		if err != nil {
			log.Fatal("Error scanning row:", err)
		}
		groupMessages = append(groupMessages, details)
	}

	if err = rows.Err(); err != nil {
		log.Fatal("Error iterating rows:", err)
	}

	for i := range groupMessages {
		groupMessages[i].CreatedAt = time.Now().Format("2006-01-02 15:04:05")
		groupMessages[i].GroupPostID = lastGroupPostID
		name, err := getUsernameByID(groupMessages[i].SenderID)
		if err != nil {
			fmt.Println(err, "P")
			return
		}
		groupMessages[i].Name = name
	}

	for i := range members {
		uid := members[i].UserID
		if len(clients[uid]) > 0 {
			for _, client := range clients[uid] {
				sendMessageToClient2(client, groupMessages)
			}
		}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "MSG SENT"})

}

// func sendMessageToClientGroup(ws *websocket.Conn) {
// 	message := GroupClient{
// 		Type: "groupActive",
// 	}

// 	jsonMessage, err := json.Marshal(message)
// 	if err != nil {
// 		fmt.Println(err)
// 		return
// 	}

// 	err = ws.WriteMessage(websocket.TextMessage, jsonMessage)
// 	if err != nil {
// 		fmt.Println(err)
// 		return
// 	}
// }

func deleteIfMore(db *sql.DB) error {
	// Step 1: Get row count
	var rowCount int
	err := db.QueryRow("SELECT COUNT(*) FROM group_post").Scan(&rowCount)
	if err != nil {
		return fmt.Errorf("failed to get row count: %w", err)
	}

	// Step 2: Delete all rows if row count is 20
	if rowCount > 5 {
		_, err := db.Exec("DELETE FROM group_post")
		if err != nil {
			return fmt.Errorf("failed to delete rows: %w", err)
		}
	}

	return nil
}
