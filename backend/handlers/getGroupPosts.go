package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	// Ensure this is included for router
)

type GroupPostResponse struct {
	GroupPostID int    `json:"id"`
	GroupID     int    `json:"group_id"`
	Content     string `json:"content_text"`
	Image       string `json:"content_image"`
	AuthorID    int    `json:"author_id"`
	AuthorName  string `json:"author_name"`
	AuthorImage string `json:"author_image"`
	CreatedAt   string `json:"created_at"`
}

func HandleGetGroupPosts(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	// Get the group ID from the URL
	groupIDStr := r.PathValue("groupid")
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		sendErrorResponse(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

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

	// Check if the user is a member of the group with accepted status
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

	// Now fetch the posts for the group along with author details
	query := `
		SELECT gp.group_post_id, gp.group_id, gp.user_id, gp.content_text, 
		       gp.content_image, gp.created_at, u.nickname, u.image
		FROM group_post gp
		JOIN users u ON gp.user_id = u.user_id
		WHERE gp.group_id = ?`

	rows, err := DB.Query(query, groupID)
	if err != nil {
		log.Fatal("Error executing query:", err)
		sendErrorResponse(w, "Error fetching group posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groupPosts []GroupPostResponse

	for rows.Next() {
		var post GroupPostResponse
		err := rows.Scan(
			&post.GroupPostID,
			&post.GroupID,
			&post.AuthorID,
			&post.Content,
			&post.Image,
			&post.CreatedAt,
			&post.AuthorName,
			&post.AuthorImage,
		)
		if err != nil {
			log.Fatal("Error scanning row:", err)
		}
		groupPosts = append(groupPosts, post)
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(groupPosts)
	if err != nil {
		fmt.Println("Error encoding GroupPosts:", err)
		return
	}
}
