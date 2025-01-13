package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/websocket"
)

type UserProfile struct {
	FirstName      string `json:"first_name"`
	LastName       string `json:"last_name"`
	Nickname       string `json:"nickname"`
	Email          string `json:"email"`
	Birthday       string `json:"birthday"`
	Image          string `json:"image"`
	About          string `json:"about"`
	Private        bool   `json:"private"`
	FollowersCount int    `json:"followers_count"`
	FollowingCount int    `json:"following_count"`
	PostCount      int    `json:"post_count"`
	FollowStatus   string `json:"follow_status"` // New field to indicate follow status
	CreatedAt      string `json:"created_at"`
	Match          bool   `json:"match"`
	Chat           bool   `json:"chat"`
}
type UserProfileResponse struct {
	Status        string      `json:"status"`
	User          UserProfile `json:"user"`
	Posts         []Post      `json:"posts,omitempty"`
	LikedPosts    []Post      `json:"liked_posts,omitempty"`
	FollowRequest bool        `json:"follow_request,omitempty"`
}

type Relationship struct {
	Status string `json:"status"`
}

type NotificationMessage struct {
	Type  string `json:"type"`
	Count int    `json:"count"`
}

func GetUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id
	targetUserID := r.URL.Query().Get("userid")

	var user UserProfile

	// Fetch user data with counts
	userQuery := `
    SELECT 
        created_at, 
        first_name, 
        last_name, 
        nickname, 
        email, 
        birthday, 
        image, 
        about, 
        private,
        (SELECT COUNT(*) FROM user_relationships WHERE followed_id = $1 AND status = 'accepted') AS followers_count,
        (SELECT COUNT(*) FROM user_relationships WHERE follower_id = $1 AND status = 'accepted') AS following_count,
        (SELECT COUNT(*) FROM posts WHERE user_id = $1) AS post_count
    FROM users 
    WHERE user_id = $2`

	err = DB.QueryRow(userQuery, targetUserID, targetUserID).Scan(
		&user.CreatedAt, &user.FirstName, &user.LastName, &user.Nickname,
		&user.Email, &user.Birthday, &user.Image,
		&user.About, &user.Private,
		&user.FollowersCount, &user.FollowingCount, &user.PostCount)

	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	if strconv.Itoa(requesterID) == targetUserID {
		user.Match = true // User is the current user
	}
	inttargetUserID, err := strconv.Atoi(targetUserID)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	chatStatus, err := CheckIfFollowing(DB, requesterID, inttargetUserID)
	if err != nil {
		// Handle the error appropriately, e.g. log it or return
		http.Error(w, "Server error", http.StatusInternalServerError)
		return // or handle accordingly
	}
	user.Chat = chatStatus // Assign the value to the struct field	// Check the relationship status
	var followStatus string
	relationshipQuery := `
        SELECT status FROM user_relationships 
        WHERE follower_id = $1 AND followed_id = $2`
	err = DB.QueryRow(relationshipQuery, requesterID, targetUserID).Scan(&followStatus)

	if err != nil && err != sql.ErrNoRows {
		http.Error(w, "Server error", http.StatusInternalServerError)
		return
	}

	// Determine the follow status
	if followStatus == "accepted" {
		user.FollowStatus = "following" // User is following
	} else if followStatus == "pending" {
		user.FollowStatus = "request_sent" // Follow request is pending
	} else {
		user.FollowStatus = "not_following" // Not following
	}

	response := UserProfileResponse{
		Status: "success",
		User:   user,
	}

	// Fetch created posts based on privacy settings
	postsQuery := `
        SELECT p.post_id, p.content_text, p.content_image, p.privacy,
               COUNT(CASE WHEN pi.interaction = TRUE THEN 1 END) AS like_count,
               MAX(CASE WHEN pi.user_id = $1 AND pi.interaction = TRUE THEN 1 ELSE 0 END) AS user_liked,
               u.user_id AS author_id,
               u.first_name AS author_first_name,
               u.last_name AS author_last_name,
               u.image AS author_image
        FROM posts p
        LEFT JOIN post_interaction pi ON p.post_id = pi.post_id
        JOIN users u ON p.user_id = u.user_id
        WHERE p.user_id = $2`

	// Logic for fetching posts based on privacy and follow status
	if !user.Private {
		// Public account
		postsQuery += ` AND (p.privacy = 'public'`
		postsQuery += ` OR (p.privacy = 'almost_private' AND EXISTS (SELECT 1 FROM user_relationships WHERE follower_id = $1 AND followed_id = $2 AND status = 'accepted'))`
		postsQuery += ` OR (p.privacy = 'private' AND EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = p.post_id AND user_id = $1))`
	} else {
		// Private account
		postsQuery += ` AND (p.privacy = 'public'`
		postsQuery += ` OR (p.privacy = 'almost_private' AND EXISTS (SELECT 1 FROM user_relationships WHERE follower_id = $1 AND followed_id = $2 AND status = 'accepted'))`
		postsQuery += ` OR (p.privacy = 'private' AND EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = p.post_id AND user_id = $1 AND EXISTS (SELECT 1 FROM user_relationships WHERE follower_id = $1 AND followed_id = $2 AND status = 'accepted')))`
	}

	postsQuery += `) GROUP BY p.post_id, u.user_id ORDER BY p.created_at DESC`

	rows, err := DB.Query(postsQuery, requesterID, targetUserID)
	if err != nil {
		http.Error(w, "Error fetching posts", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var post Post
		var userLiked int
		if err := rows.Scan(&post.ID, &post.Content, &post.Image, &post.Privacy, &post.LikeCount, &userLiked,
			&post.AuthorID, &post.AuthorFirstName, &post.AuthorLastName, &post.AuthorImage); err != nil {
			http.Error(w, "Error scanning posts", http.StatusInternalServerError)
			return
		}
		post.UserLiked = userLiked == 1
		response.Posts = append(response.Posts, post)
	}

	// Fetch liked posts based on account privacy
	if !user.Private || user.FollowStatus == "following" {
		likedPostsQuery := `
            SELECT p.post_id, p.content_text, p.content_image, 
                   COUNT(CASE WHEN pi.interaction = TRUE THEN 1 END) AS like_count,
                   u.user_id AS author_id,
                   u.first_name AS author_first_name,
                   u.last_name AS author_last_name,
                   u.image AS author_image,
                   MAX(CASE WHEN pi.user_id = $1 THEN 1 ELSE 0 END) AS user_liked
           	 FROM posts p
            JOIN post_interaction pi ON p.post_id = pi.post_id
            JOIN users u ON p.user_id = u.user_id
            WHERE pi.user_id = $2
        `

		if !user.Private {
			// Public account - all liked posts
			likedPostsQuery += ` AND (p.privacy = 'public'`
			likedPostsQuery += ` OR (p.privacy = 'almost_private' AND EXISTS (SELECT 1 FROM user_relationships WHERE follower_id = $1 AND followed_id = u.user_id AND status = 'accepted'))`
			likedPostsQuery += ` OR (p.privacy = 'private' AND EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = p.post_id AND user_id = $1))`
		} else {
			// Private account - user must follow the target user
			likedPostsQuery += ` AND EXISTS (SELECT 1 FROM user_relationships WHERE follower_id = $1 AND followed_id = u.user_id AND status = 'accepted')`
			likedPostsQuery += ` AND (p.privacy = 'public'`
			likedPostsQuery += ` OR (p.privacy = 'almost_private' AND EXISTS (SELECT 1 FROM user_relationships WHERE follower_id = $1 AND followed_id = u.user_id AND status = 'accepted'))`
			likedPostsQuery += ` OR (p.privacy = 'private' AND EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = p.post_id AND user_id = $1))`
		}

		likedPostsQuery += `) GROUP BY p.post_id, u.user_id ORDER BY p.created_at DESC`

		likedRows, err := DB.Query(likedPostsQuery, requesterID, targetUserID)
		if err != nil {
			http.Error(w, "Error fetching liked posts", http.StatusInternalServerError)
			return
		}
		defer likedRows.Close()

		for likedRows.Next() {
			var likedPost Post
			var userLiked int
			if err := likedRows.Scan(&likedPost.ID, &likedPost.Content, &likedPost.Image, &likedPost.LikeCount,
				&likedPost.AuthorID, &likedPost.AuthorFirstName, &likedPost.AuthorLastName, &likedPost.AuthorImage, &userLiked); err != nil {
				http.Error(w, "Error scanning liked posts", http.StatusInternalServerError)
				return
			}
			likedPost.UserLiked = userLiked == 1
			response.LikedPosts = append(response.LikedPosts, likedPost)
		}
	}

	// Encode the response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
		sendErrorResponse(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
func SendFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	followerID := session.id
	followedIDStr := r.URL.Query().Get("userid")
	followedID, err := strconv.Atoi(followedIDStr)
	if err != nil || followedID == followerID {
		http.Error(w, "Invalid followed user ID", http.StatusBadRequest)
		return
	}

	// Check if the followed user exists and their privacy setting
	var isPrivate bool
	err = DB.QueryRow("SELECT private FROM users WHERE user_id = $1", followedID).Scan(&isPrivate)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Get the follower's name
	var followerName string
	err = DB.QueryRow("SELECT nickname FROM users WHERE user_id = $1", followerID).Scan(&followerName)
	if err != nil {
		http.Error(w, "Follower not found", http.StatusInternalServerError)
		return
	}

	var relationshipID int
	if !isPrivate {
		// Accept the follow request directly for public accounts
		err = DB.QueryRow("INSERT INTO user_relationships (follower_id, followed_id, status) VALUES ($1, $2, 'accepted') RETURNING id", followerID, followedID).Scan(&relationshipID)
		if err != nil {
			http.Error(w, "Failed to accept follow request", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"message": "Follow request accepted", "status": "accepted"})
	} else {
		// For private accounts, set status to pending
		err = DB.QueryRow("INSERT INTO user_relationships (follower_id, followed_id, status) VALUES ($1, $2, 'pending') RETURNING id", followerID, followedID).Scan(&relationshipID)
		if err != nil {
			http.Error(w, "Failed to send follow request", http.StatusInternalServerError)
			return
		}

		// Create a notification for the followed user
		notificationContent := fmt.Sprintf("%s sent you a follow request.", followerName)
		hiddenInfo := fmt.Sprintf("%d", relationshipID) // Store the relationship ID in hidden info
		_, err = DB.Exec("INSERT INTO notifications (user_id, type, content, sender_id, hidden_info) VALUES ($1, $2, $3, $4, $5)", followedID, "followRequest", notificationContent, followerID, hiddenInfo)
		if err != nil {
			http.Error(w, "Failed to create notification", http.StatusInternalServerError)
			return
		}
		json.NewEncoder(w).Encode(map[string]string{"message": "Follow request sent", "status": "pending"})

	}

	countQuery := `
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = $1
    `
	var count int
	err = DB.QueryRow(countQuery, followedID).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
	fmt.Println("m")
	fmt.Println(clients)
	fmt.Println(clients[followedID])

	if len(clients[followedID]) > 0 {
		fmt.Println("mm2")
		for _, client := range clients[followedID] {
			fmt.Println("mmmm")
			sendNotificationCount(client, count)
			Sendupdatednotification(client, followedID)
		}
	}
}

// Accept a follow request
func AcceptFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	followedID := session.id
	followerIDStr := r.URL.Query().Get("userid")
	followerID, err := strconv.Atoi(followerIDStr)
	if err != nil {
		http.Error(w, "Invalid follower user ID", http.StatusBadRequest)
		return
	}

	// Update the relationship status to accepted
	_, err = DB.Exec("UPDATE user_relationships SET status = 'accepted' WHERE follower_id = $1 AND followed_id = $2", followerID, followedID)
	if err != nil {
		http.Error(w, "Failed to accept follow request", http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]string{"message": "Follow request accepted"})
}

func sendNotificationCount(ws *websocket.Conn, count int) {
	message := NotificationMessage{
		Type:  "notificationCount",
		Count: count,
	}

	// Convert the message to JSON
	jsonMessage, err := json.Marshal(message)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Send the JSON message through the WebSocket
	err = ws.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		fmt.Println(err)
		return
	}
}

func Sendupdatednotification(ws *websocket.Conn, userID int) {
	query := `
    SELECT id, type, content, created_at, hidden_info, COALESCE(sender_id, 0) 
    FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC
`
	rows, err := DB.Query(query, userID)
	if err != nil {
		fmt.Println(err)
		return
	}
	defer rows.Close()

	// Define the struct type for notifications
	type Notification struct {
		ID         int       `json:"id"`
		Type       string    `json:"type"`
		Content    string    `json:"content"`
		CreatedAt  time.Time `json:"created_at"`
		HiddenInfo string    `json:"hidden_info"`
		SenderID   int       `json:"sender_id"` // Change to string for UUID
	}

	// Prepare a slice to hold notifications
	type NewNotification struct {
		Notifications []Notification `json:"notifications"`
		Type          string         `json:"type"`
	}
	notifications := []Notification{}

	// Iterate through the result set
	for rows.Next() {
		var notification Notification
		if err := rows.Scan(&notification.ID, &notification.Type, &notification.Content, &notification.CreatedAt, &notification.HiddenInfo, &notification.SenderID); err != nil {
			fmt.Println(err)
			return
		}
		notifications = append(notifications, notification)
	}

	// Check for any errors from iterating over rows
	if err := rows.Err(); err != nil {
		fmt.Println(err)
		return
	}
	data := NewNotification{
		Notifications: notifications,
		Type:          "notifications",
	}
	jsonMessage, err := json.Marshal(data)
	if err != nil {
		fmt.Println(err)
		return
	}

	// Send the JSON message through the WebSocket
	err = ws.WriteMessage(websocket.TextMessage, jsonMessage)
	if err != nil {
		fmt.Println(err)
		return
	}
}

func SendUnfollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	followerID := session.id
	followedIDStr := r.URL.Query().Get("userid")
	followedID, err := strconv.Atoi(followedIDStr)
	if err != nil || followedID == followerID {
		http.Error(w, "Invalid followed user ID", http.StatusBadRequest)
		return
	}

	// Check if the relationship exists
	var relationshipID int
	err = DB.QueryRow("SELECT id FROM user_relationships WHERE follower_id = $1 AND followed_id = $2", followerID, followedID).Scan(&relationshipID)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "No relationship found", http.StatusNotFound)
			return
		}
		http.Error(w, "Database error", http.StatusInternalServerError)
		return
	}

	// Delete the relationship
	_, err = DB.Exec("DELETE FROM user_relationships WHERE id = $1", relationshipID)
	if err != nil {
		http.Error(w, "Failed to unfollow user", http.StatusInternalServerError)
		return
	}

	// Send response
	json.NewEncoder(w).Encode(map[string]string{"status": "unfollowed"})
}

func CheckIfFollowing(db *sql.DB, user1ID, user2ID int) (bool, error) {
	query := `
	SELECT EXISTS (
		SELECT 1 FROM user_relationships 
		WHERE (follower_id = ? AND followed_id = ? OR follower_id = ? AND followed_id = ?) 
		AND status = 'accepted'
	) AS is_following;`

	var isFollowing bool
	err := db.QueryRow(query, user1ID, user2ID, user2ID, user1ID).Scan(&isFollowing)
	if err != nil {
		return false, err
	}
	return isFollowing, nil
}
