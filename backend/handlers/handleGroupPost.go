package handlers

import (
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
	GroupID     int    `json:"group_id"`
	Content     string `json:"content_text"`
	Image       string `json:"content_image"`
	AuthorID    int    `json:"author_id"`
	AuthorName  string `json:"author_name"`
	AuthorImage string `json:"author_image"`
}

func HanldeGroupPost(w http.ResponseWriter, r *http.Request) {
	fmt.Println("GROUP POST")
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	groupIDstr:= r.FormValue("groupid")
	groupID,err := strconv.Atoi(groupIDstr)
	if err!= nil {
        http.Error(w, "Invalid groupid", http.StatusBadRequest)
        fmt.Println(err)
        return
    }
	// groupID, err := getGroupIDFromRequest(r)
	// if err != nil {
	// 	http.Error(w, err.Error(), http.StatusBadRequest)
	// 	fmt.Println(err)
	// 	fmt.Println("11")
	// 	return
	// }

	if !isUserGroupMember(userID, groupID) {
		sendErrorResponse(w, "User is not a member of the group", http.StatusForbidden)
		return
	}

	var postreq GroupPostRequest
	postreq.Content = r.FormValue("content")
	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		postreq.Image, err = saveFile(file, handler)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}


	var nickname string
	var image string
	err = DB.QueryRow("SELECT nickname, image FROM users WHERE user_id = ?", userID).Scan(&nickname, &image)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	post := GroupPost{
		Content:     postreq.Content,
		Image:       postreq.Image,
		AuthorID:    userID,
		GroupID:     groupID,
		AuthorName:  nickname,
		AuthorImage: image,
	}

	now := time.Now().Format("2006-01-02 15:04:05")

	members, err := getGroupMembers(groupID)
	if err != nil {
		http.Error(w, "Error fetching group members", http.StatusInternalServerError)
		return
	}

	// Insert the post and get the last inserted ID
	var lastInsertID int64
	query := `
		INSERT INTO group_post (group_id, user_id, content_text, content_image, created_at)
		VALUES (?, ?, ?, ?, ?)
	`
	result, err := DB.Exec(query, groupID, userID, postreq.Content, postreq.Image, now)
	if err != nil {
		http.Error(w, "Failed to create post", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Get the last inserted ID
	lastInsertID, err = result.LastInsertId()
	if err != nil {
		http.Error(w, "Failed to retrieve post ID", http.StatusInternalServerError)
		return
	}

	// Update the post with the new ID
	post.GroupPostID = int(lastInsertID)

	messageToClient := MessageToClient{
		Type:        "new_post",
		PostMessage: post,
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
	json.NewEncoder(w).Encode(map[string]string{"message": "Post SENT"})
}
