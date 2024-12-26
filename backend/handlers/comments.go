package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type Comment struct {
	CommentID       int    `json:"comment_id"`        // Comment ID
	PostID          int    `json:"post_id"`           // Associated Post ID
	UserID          int    `json:"user_id"`           // Comment author ID
	Content         string `json:"content"`           // Comment content
	Image           string `json:"image,omitempty"`   // Comment author's image
	AuthorFirstName string `json:"author_first_name"` // Comment author's first name
	AuthorLastName  string `json:"author_last_name"`  // Comment author's last name
	AuthorImage     string `json:"author_image"`      // Comment author's image URL
}

// PostWithComments represents a post and its comments.
type PostWithComments struct {
	Post     Post      `json:"post"`
	Comments []Comment `json:"comments"`
}

// GetPostAndCommentsHandler fetches a post and its associated comments based on user permissions.
func GetPostAndCommentsHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	fmt.Println("inside")
	w.Header().Set("Content-Type", "application/json")

	postId := r.URL.Query().Get("postId")
	if postId == "" {
		sendErrorResponse(w, "Post ID is required", http.StatusBadRequest)
		return
	}

	cookie, err := r.Cookie("session_token")
	if err != nil {
		sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id

	// Fetch post privacy and author ID
	var postPrivacy string
	var authorID int
	err = DB.QueryRow("SELECT user_id, privacy FROM posts WHERE post_id = ?", postId).Scan(&authorID, &postPrivacy)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Fetch user privacy status
	var user UserProfile
	err = DB.QueryRow("SELECT private FROM users WHERE user_id = ?", requesterID).Scan(&user.Private)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Logic for permissions based on privacy settings
	if !user.Private {
		// Public account
		if postPrivacy == "private" {
			// Check if the user has explicit permission to view the private post
			var hasPermission bool
			err = DB.QueryRow("SELECT EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = ? AND user_id = ?)", postId, requesterID).Scan(&hasPermission)
			if err != nil || !hasPermission {
				sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		} else if postPrivacy == "almost_private" {
			var followStatus string
			err = DB.QueryRow("SELECT status FROM user_relationships WHERE follower_id = ? AND followed_id = ?", requesterID, authorID).Scan(&followStatus)
			if err != nil && err != sql.ErrNoRows {
				http.Error(w, "Server error", http.StatusInternalServerError)
				return
			}
		}
	} else {
		// Private account
		if postPrivacy == "private" {
			var hasPermission bool
			err = DB.QueryRow("SELECT EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = ? AND user_id = ?)", postId, requesterID).Scan(&hasPermission)
			if err != nil || !hasPermission {
				sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		} else if postPrivacy == "almost_private" {
			var followStatus string
			err = DB.QueryRow("SELECT status FROM user_relationships WHERE follower_id = ? AND followed_id = ?", requesterID, authorID).Scan(&followStatus)
			if err != nil && err != sql.ErrNoRows {
				http.Error(w, "Server error", http.StatusInternalServerError)
				return
			}
			if followStatus != "accepted" {
				// Check if the user has explicit permission to view the almost private post
				var hasPermission bool
				err = DB.QueryRow("SELECT EXISTS (SELECT 1 FROM post_allowed_users WHERE post_id = ? AND user_id = ?)", postId, requesterID).Scan(&hasPermission)
				if err != nil || !hasPermission {
					sendErrorResponse(w, "Unauthorized", http.StatusUnauthorized)
					return
				}
			}
		}
	}

	// Fetch the full post details
	var post Post
	err = DB.QueryRow(`
        SELECT 
            post_id, 
            user_id, 
            content_text, 
            content_image, 
            privacy, 
            (SELECT first_name FROM users WHERE user_id = posts.user_id) AS author_first_name,
            (SELECT last_name FROM users WHERE user_id = posts.user_id) AS author_last_name,
            (SELECT image FROM users WHERE user_id = posts.user_id) AS author_image
        FROM posts WHERE post_id = ?`, postId).Scan(
		&post.ID,
		&post.AuthorID,
		&post.Content,
		&post.Image,
		&post.Privacy,
		&post.AuthorFirstName,
		&post.AuthorLastName,
		&post.AuthorImage,
	)
	if err != nil {
		http.Error(w, "Post not found", http.StatusNotFound)
		return
	}

	// Check if the requester has liked the post
	var userLiked int
	err = DB.QueryRow("SELECT COUNT(*) FROM post_interaction WHERE post_id = ? AND user_id = ? AND interaction = TRUE", postId, requesterID).Scan(&userLiked)
	if err != nil {
		http.Error(w, "Error checking like status", http.StatusInternalServerError)
		return
	}
	post.UserLiked = userLiked > 0 // Set userLiked to true if the requester has liked the post

	// Fetch comments related to the post along with author information
	rows, err := DB.Query(`
        SELECT 
            comment_id, 
            post_id, 
            user_id, 
            content, 
            image, 
            (SELECT first_name FROM users WHERE user_id = comments.user_id) AS author_first_name,
            (SELECT last_name FROM users WHERE user_id = comments.user_id) AS author_last_name,
            (SELECT image FROM users WHERE user_id = comments.user_id) AS author_image
        FROM comments 
        WHERE post_id = ?`, postId)
	if err != nil {
		http.Error(w, "Failed to fetch comments", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var comments []Comment
	for rows.Next() {
		var comment Comment
		err := rows.Scan(&comment.CommentID, &comment.PostID, &comment.UserID, &comment.Content, &comment.Image,
			&comment.AuthorFirstName, &comment.AuthorLastName, &comment.AuthorImage)
		if err != nil {
			http.Error(w, "Failed to scan comment", http.StatusInternalServerError)
			return
		}
		comments = append(comments, comment)
	}

	// Prepare the response
	response := struct {
		Post     Post      `json:"post"`
		Comments []Comment `json:"comments"`
	}{
		Post:     post,
		Comments: comments,
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// CreateCommentHandler handles comment creation.
func CreateCommentHandler(w http.ResponseWriter, r *http.Request) {
    enableCORS(w, r)
    w.Header().Set("Content-Type", "application/json")

    Content := r.FormValue("content")
    postId := r.FormValue("postId") // Ensure this matches your frontend input
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

    // Retrieve user ID from session (assuming you have session management in place)
    cookie, err := r.Cookie("session_token")
    if err != nil {
        sendErrorResponse(w, "Session not found", http.StatusUnauthorized)
        return
    }

    session := sessions[cookie.Value]
    userID := session.id

    // Insert new comment into the database
    query := `
        INSERT INTO comments (post_id, user_id, content, image) 
        VALUES (?, ?, ?, ?)
    `
    result, err := DB.Exec(query, postId, userID, Content, imagefilename)
    if err != nil {
        http.Error(w, "Failed to create comment", http.StatusInternalServerError)
        return
    }

    // Get the ID of the newly created comment
    commentID, err := result.LastInsertId()
    if err != nil {
        http.Error(w, "Failed to retrieve comment ID", http.StatusInternalServerError)
        return
    }

    // Retrieve the full comment details from the database
    var comment Comment
    selectQuery := `
        SELECT c.comment_id, c.post_id, c.user_id, c.content, c.image, 
               u.first_name AS author_first_name, u.last_name AS author_last_name, u.image AS author_image
        FROM comments c 
        JOIN users u ON c.user_id = u.user_id
        WHERE c.comment_id = ?
    `
    err = DB.QueryRow(selectQuery, commentID).Scan(&comment.CommentID, &comment.PostID, &comment.UserID, 
        &comment.Content, &comment.Image, &comment.AuthorFirstName, &comment.AuthorLastName, &comment.AuthorImage)
    if err != nil {
        http.Error(w, "Failed to retrieve comment details", http.StatusInternalServerError)
		fmt.Println(err)
        return
    }

    // Return the newly created comment as a JSON response
    w.WriteHeader(http.StatusCreated)
    json.NewEncoder(w).Encode(comment)
}