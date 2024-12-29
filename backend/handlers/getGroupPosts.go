package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type GroupPostFetch struct {
	GroupPostID  int    `json:"group_post_id"`
	GroupID      int    `json:"group_id"`
	UserID       int    `json:"user_id"`
	ContentText  string `json:"content_text"`
	ContentImage string `json:"content_image"`
	CreatedAt    string `json:"created_at"`
}

func HandleGetGroupPosts(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	userid := session.id
	if userid == 0 {
		sendErrorResponse(w, "Invalid session", http.StatusUnauthorized)
		http.Redirect(w, r, "/auth", http.StatusNonAuthoritativeInfo)
		return
	}
	query := `SELECT group_post_id, group_id, user_id, content_text, content_image, created_at FROM group_post`

	rows, err := DB.Query(query)
	if err != nil {
		log.Fatal("Error executing query:", err)
	}
	defer rows.Close()

	var groupPosts []GroupPostFetch

	for rows.Next() {
		var post GroupPostFetch
		err := rows.Scan(
			&post.GroupPostID,
			&post.GroupID,
			&post.UserID,
			&post.ContentText,
			&post.ContentImage,
			&post.CreatedAt,
		)
		if err != nil {
			log.Fatal("Error scanning row:", err)
		}
		groupPosts = append(groupPosts, post)
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(groupPosts)
	if err != nil {
		fmt.Println("Error encoding GroupMessage:", err)
		return
	}

}
