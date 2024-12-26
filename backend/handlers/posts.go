package handlers

// import (
// 	"encoding/json"
// 	"fmt"
// 	"net/http"
// )

// func HandlePosts(w http.ResponseWriter, r *http.Request) {
// 	enableCORS(w, r)

// 	if r.Method != http.MethodPost {
// 		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
// 		return
// 	}

// 	c, err := r.Cookie("session_token")
// 	if err != nil {
// 		if err == http.ErrNoCookie {
// 			http.Error(w, "No active session", http.StatusUnauthorized)
// 			fmt.Println(err)
// 			return
// 		}
// 		http.Error(w, err.Error(), http.StatusBadRequest)
// 		return
// 	}
// 	sessionToken := c.Value
// 	_, ok := sessions[sessionToken]
// 	if !ok {
// 		http.Error(w, "Invalid session", http.StatusUnauthorized)
// 		fmt.Println(err)
// 		return
// 	}

// 	query := `
// 		SELECT 
//     p.post_id,
//     p.user_id,
//     p.content_text,
//     p.content_image,
//     p.privacy,
//     COUNT(pi.id) AS like_count
// FROM posts p
// LEFT JOIN post_interaction pi
//     ON p.post_id = pi.post_id AND pi.interaction = TRUE
// GROUP BY p.post_id, p.user_id, p.content_text, p.content_image, p.privacy, p.created_at
// ORDER BY p.created_at DESC;

// 	`

// 	rows, err := DB.Query(query)
// 	if err != nil {
// 		http.Error(w, "Query execution failed", http.StatusInternalServerError)
// 		return
// 	}
// 	defer rows.Close()

// 	var posts []Post

// 	for rows.Next() {
// 		var post Post
// 		if err := rows.Scan(&post.ID, &post.UID, &post.Content, &post.Image, &post.Privacy, &post.LikeCount); err != nil {
// 			http.Error(w, "Error scanning rows", http.StatusInternalServerError)
// 			return
// 		}
// 		posts = append(posts, post)
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	if err := json.NewEncoder(w).Encode(posts); err != nil {
// 		http.Error(w, "Error encoding JSON", http.StatusInternalServerError)
// 		return
// 	}

// 	// fmt.Println(posts)

// }
