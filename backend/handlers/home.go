package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

func HomeHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r) // Enable CORS for this endpoint

	// Get the session token from the cookie
	c, err := r.Cookie("session_token")
	if err != nil {
		if err == http.ErrNoCookie {
			http.Error(w, "No active session", http.StatusUnauthorized)
			fmt.Println(err)
			return
		}
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	sessionToken := c.Value
	session, ok := sessions[sessionToken]
	if !ok {
		http.Error(w, "Invalid session", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	userID := session.id

	// Query to get accepted followers
	followersQuery := `
		SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image
		FROM user_relationships ur
		JOIN users u ON ur.follower_id = u.user_id
		WHERE ur.followed_id = $1 AND ur.status = 'accepted'
	`

	followersRows, err := DB.Query(followersQuery, userID)
	if err != nil {
		http.Error(w, "Database error while fetching followers", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
	defer followersRows.Close()

	var followers []map[string]interface{}

	for followersRows.Next() {
		var followerID int
		var firstName, lastName, nickname, image string

		err := followersRows.Scan(&followerID, &firstName, &lastName, &nickname, &image)
		if err != nil {
			http.Error(w, "Error scanning follower row", http.StatusInternalServerError)
			fmt.Println(err)
			return
		}

		follower := map[string]interface{}{
			"id":         followerID,
			"first_name": firstName,
			"last_name":  lastName,
			"nickname":   nickname,
			"image":      image,
		}
		followers = append(followers, follower)
	}

	// Query to get public posts (max 8) with like count, user liked status, and author info
	publicPostsQuery := `
		SELECT p.post_id, p.content_text, p.content_image, p.privacy,
		       COUNT(pi.id) AS like_count,
		       MAX(CASE WHEN pi.user_id = $1 THEN 1 ELSE 0 END) AS user_liked,
		       u.user_id AS author_id, u.first_name AS author_first_name, u.last_name AS author_last_name, u.image AS author_image
		FROM posts p
		LEFT JOIN post_interaction pi ON p.post_id = pi.post_id AND pi.interaction = TRUE
		JOIN users u ON p.user_id = u.user_id
		WHERE p.privacy = 'public'
		GROUP BY p.post_id, u.user_id
		ORDER BY p.created_at DESC
		LIMIT 8
	`

	publicPostsRows, err := DB.Query(publicPostsQuery, userID)
	if err != nil {
		http.Error(w, "Database error while fetching public posts", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
	defer publicPostsRows.Close()

	var publicPosts []Post

	for publicPostsRows.Next() {
		var post Post
		var userLiked int

		err := publicPostsRows.Scan(&post.ID, &post.Content, &post.Image, &post.Privacy, &post.LikeCount, &userLiked,
			&post.AuthorID, &post.AuthorFirstName, &post.AuthorLastName, &post.AuthorImage)
		if err != nil {
			http.Error(w, "Error scanning public post row", http.StatusInternalServerError)
			fmt.Println(err)
			return
		}

		post.UserLiked = userLiked == 1 // Convert to boolean
		publicPosts = append(publicPosts, post)
	}

	// Check for errors during public posts row iteration
	if err := publicPostsRows.Err(); err != nil {
		http.Error(w, "Error processing public posts rows", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	// Query to get almost private posts (max 8) with like count, user liked status, and author info
	almostPrivatePostsQuery := `
		SELECT p.post_id, p.content_text, p.content_image, p.privacy,
		       COUNT(pi.id) AS like_count,
		       MAX(CASE WHEN pi.user_id = $1 THEN 1 ELSE 0 END) AS user_liked,
		       u.user_id AS author_id, u.first_name AS author_first_name, u.last_name AS author_last_name, u.image AS author_image
		FROM posts p
		LEFT JOIN post_interaction pi ON p.post_id = pi.post_id AND pi.interaction = TRUE
		JOIN users u ON p.user_id = u.user_id
		WHERE p.privacy = 'almost_private' AND 
		p.user_id IN (SELECT followed_id FROM user_relationships WHERE follower_id = $1 AND status = 'accepted')
		GROUP BY p.post_id, u.user_id
		ORDER BY p.created_at DESC
		LIMIT 8
	`

	almostPrivatePostsRows, err := DB.Query(almostPrivatePostsQuery, userID)
	if err != nil {
		http.Error(w, "Database error while fetching almost private posts", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
	defer almostPrivatePostsRows.Close()

	var almostPrivatePosts []Post

	for almostPrivatePostsRows.Next() {
		var post Post
		var userLiked int

		err := almostPrivatePostsRows.Scan(&post.ID, &post.Content, &post.Image, &post.Privacy, &post.LikeCount, &userLiked,
			&post.AuthorID, &post.AuthorFirstName, &post.AuthorLastName, &post.AuthorImage)
		if err != nil {
			http.Error(w, "Error scanning almost private post row", http.StatusInternalServerError)
			fmt.Println(err)
			return
		}

		post.UserLiked = userLiked == 1 // Convert to boolean
		almostPrivatePosts = append(almostPrivatePosts, post)
	}

	// Check for errors during almost private posts row iteration
	if err := almostPrivatePostsRows.Err(); err != nil {
		http.Error(w, "Error processing almost private posts rows", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}
	pposts:= publicPosts
	pposts = append(pposts, almostPrivatePosts...)
	// Prepare the combined response
	response := map[string]interface{}{
		"followers":            followers,
		"posts":         pposts,
	}

	// Send the response as JSON
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
