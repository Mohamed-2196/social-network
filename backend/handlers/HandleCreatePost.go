package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
)

type PostRequest struct {
	Privacy string `json:"privacy"`
	Content string `json:"content"`
	Image   string `json:"image"`
}

type PostResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type Post struct {
    ID        int    `json:"id"`         // Post ID
    Content   string `json:"content"`    // Content text
    Image     string `json:"image"`      // Content image URL
    Privacy   string `json:"privacy"`    // Privacy setting
    LikeCount int    `json:"like_count"` // Number of likes
    UserLiked bool   `json:"user_liked"` // Whether the user liked the post
}

type PostsResponse struct {
    Status       string `json:"status"`
    CreatedPosts []Post `json:"created_posts"`
    LikedPosts   []Post `json:"liked_posts"`
}
type InteractionPayload struct {
	PostID int  `json:"postId"`
	Like   bool `json:"like"`
}

func CreatePostHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")
	cookie, err := r.Cookie("session_token")
	if err != nil {
		fmt.Println("No session cookie found:", err)
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	id := session.id
	if id == 0 {
		sendErrorResponse(w, "Invalid session", http.StatusUnauthorized)
		http.Redirect(w, r, "/auth", http.StatusNonAuthoritativeInfo)
		return
	}
	var req PostRequest
	req.Content = r.FormValue("content")
	req.Privacy = r.FormValue("privacy")
	var imagefilename string
	file, handler, err := r.FormFile("image")
	if err == nil {
		defer file.Close()
		imagefilename, err = saveFile(file, handler)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			fmt.Println(err)
			return
		}
	}

	postID, err := SavePost(DB, id, req.Privacy, req.Content, imagefilename)
	if err != nil {
		fmt.Printf("Error saving post: %v\n", err)
		sendErrorResponse(w, "Failed to save post", http.StatusInternalServerError)
		return
	}
	response := PostResponse{
		Status:  "success",
		Message: fmt.Sprintf("Post created successfully with ID %d", postID),
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		fmt.Printf("Error encoding response: %v\n", err)
		sendErrorResponse(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}

func SavePost(db *sql.DB, userID int, privacy, contentText, contentImage string) (int, error) {
	fmt.Println("In SavePost function")
	query := `
    INSERT INTO posts (user_id, content_text, content_image, privacy, created_at) 
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
`
	result, err := db.Exec(query, userID, contentText, contentImage, privacy)
	if err != nil {
		fmt.Println("Error saving into the database:", err)
		return 0, err
	}

	postID, err := result.LastInsertId()
	if err != nil {
		return 0, fmt.Errorf("failed to get last inserted post ID: %w", err)
	}
	return int(postID), nil
}

func sendErrorResponse(w http.ResponseWriter, message string, statusCode int) {
	w.WriteHeader(statusCode)
	response := PostResponse{
		Status:  "error",
		Message: message,
	}
	_ = json.NewEncoder(w).Encode(response)
}

func CreatedPostsHandler(w http.ResponseWriter, r *http.Request) {
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

    // Fetch created posts
    createdPosts, err := GetPosts(DB, userID)
    if err != nil {
        fmt.Printf("Error fetching created posts: %v\n", err)
        sendErrorResponse(w, "Failed to fetch created posts", http.StatusInternalServerError)
        return
    }

    // Fetch liked posts
    likedPosts, err := GetLikedPosts(DB, userID)
    if err != nil {
        fmt.Printf("Error fetching liked posts: %v\n", err)
        sendErrorResponse(w, "Failed to fetch liked posts", http.StatusInternalServerError)
        return
    }

    // Create response including both created and liked posts
    response := PostsResponse{
        Status:       "success",
        CreatedPosts: createdPosts,
        LikedPosts:   likedPosts,
    }

    if err := json.NewEncoder(w).Encode(response); err != nil {
        fmt.Printf("Error encoding response: %v\n", err)
        sendErrorResponse(w, "Error encoding response", http.StatusInternalServerError)
        return
    }
}

func GetPosts(db *sql.DB, userID int) ([]Post, error) {
	query := `
    SELECT p.post_id, p.content_text, p.content_image, p.privacy,
           COUNT(CASE WHEN pi.interaction = TRUE THEN 1 END) AS like_count,
           MAX(CASE WHEN pi.user_id = ? AND pi.interaction = TRUE THEN 1 ELSE 0 END) AS user_liked
    FROM posts p
    LEFT JOIN post_interaction pi ON p.post_id = pi.post_id
    WHERE p.user_id = ?
    GROUP BY p.post_id
    ORDER BY p.created_at DESC
`

	rows, err := db.Query(query, userID, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []Post
	for rows.Next() {
		var post Post
		var likeCount int
		var userLiked int

		if err := rows.Scan(&post.ID, &post.Content, &post.Image, &post.Privacy, &likeCount, &userLiked); err != nil {
			return nil, err
		}

		// Set likes and userLiked fields in the Post struct
		post.LikeCount = likeCount
		post.UserLiked = userLiked == 1 // Convert to boolean

		posts = append(posts, post)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return posts, nil
}

func LikePostHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("hihi")	
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

	var payload InteractionPayload
	if err := json.NewDecoder(r.Body).Decode(&payload); err != nil {
		http.Error(w, "Bad Request", http.StatusBadRequest)
		return
	}

	// Connect to your database (this assumes you have a `DB` variable initialized)
	// db, err := sql.Open("driver-name", "database=...") // Adjust as needed

	// Update the post_interaction table
	query := `
		INSERT INTO post_interaction (post_id, user_id, interaction)
		VALUES (?, ?, ?)
		ON CONFLICT (post_id, user_id) 
		DO UPDATE SET interaction = excluded.interaction
	`

	_, err = DB.Exec(query, payload.PostID, userID, payload.Like)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		log.Println("Error updating post interaction:", err)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Interaction updated successfully"})
}

func GetLikedPosts(db *sql.DB, userID int) ([]Post, error) {
    query := `
    SELECT p.post_id, p.content_text, p.content_image, p.privacy,
           COUNT(pi.id) AS like_count,
           MAX(CASE WHEN pi.user_id = ? THEN 1 ELSE 0 END) AS user_liked
    FROM posts p
    JOIN post_interaction pi ON p.post_id = pi.post_id
    WHERE pi.user_id = ? AND pi.interaction = TRUE
    GROUP BY p.post_id
    ORDER BY p.created_at DESC
`

    rows, err := db.Query(query, userID, userID)
    if err != nil {
        return nil, err
    }
    defer rows.Close()

    var posts []Post
    for rows.Next() {
        var post Post
        var likeCount int
        var userLiked int

        if err := rows.Scan(&post.ID, &post.Content, &post.Image, &post.Privacy, &likeCount, &userLiked); err != nil {
            return nil, err
        }

        post.LikeCount = likeCount
        post.UserLiked = userLiked == 1 // Convert to boolean

        posts = append(posts, post)
    }

    if err := rows.Err(); err != nil {
        return nil, err
    }

    return posts, nil
}