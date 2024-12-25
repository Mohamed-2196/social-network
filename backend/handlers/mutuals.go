package handlers

import (
	"fmt"
	"log"
	"net/http"
)


type Mutual struct {
	UserID int    `json:"user_id"`
	Name   string `json:"name"`
	Email  string `json:"email"`
}


func HandleMutuals(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

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
	query := `
    SELECT u.user_id, u.name, u.email
    FROM user_relationships ur1
    JOIN user_relationships ur2
      ON ur1.followed_id = ur2.follower_id AND ur1.follower_id = ur2.followed_id
    JOIN users u
      ON ur1.followed_id = u.user_id
    WHERE ur1.follower_id = ? AND ur1.status = 'accepted' AND ur2.status = 'accepted';
`

	rows, err := DB.Query(query, userID)
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	for rows.Next() {
		var userID int
		var name, email string
		if err := rows.Scan(&userID, &name, &email); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("User ID: %d, Name: %s, Email: %s\n", userID, name, email)
	}
}



	// Assume userID is passed as a query parameter
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	query := `
		SELECT u.user_id, u.name, u.email
		FROM user_relationships ur1
		JOIN user_relationships ur2
		  ON ur1.followed_id = ur2.follower_id AND ur1.follower_id = ur2.followed_id
		JOIN users u
		  ON ur1.followed_id = u.user_id
		WHERE ur1.follower_id = ? AND ur1.status = 'accepted' AND ur2.status = 'accepted';
	`

	rows, err := db.Query(query, userID)
	if err != nil {
		http.Error(w, "Query execution failed", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	// Slice to hold the results
	var users []User

	for rows.Next() {
		var user User
		if err := rows.Scan(&user.UserID, &user.Name, &user.Email); err != nil {
			http.Error(w, "Error scanning rows", http.StatusInternalServerError)
			return
		}
		users = append(users, user)
	}

	// Convert the slice to JSON
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, "Error encoding JSON", http.StatusInternalServerError)
		return
	}
}

func main() {
	http.HandleFunc("/mutual-followers", getMutualFollowersHandler)
	fmt.Println("Server is running on http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
