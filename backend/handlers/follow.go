package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
)

type UserSummary struct {
	UserID    int    `json:"user_id"`
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Image     string `json:"image"`
	Private   bool   `json:"private"`   // New field for privacy
	Following bool   `json:"following"` // New field for follow status
	Status string `json:"status"` // New field for
}

func GetFollowersHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		fmt.Println(err)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id

	targetUserIDStr := r.URL.Query().Get("userid")
	var targetUserID int
	if targetUserIDStr != "" {
		targetUserID, err = strconv.Atoi(targetUserIDStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
	} else {
		targetUserID = requesterID
	}

	var followers []UserSummary

	if targetUserID != requesterID {
		var isPrivate bool
		privacyQuery := `SELECT private FROM users WHERE user_id = $1`
		err = DB.QueryRow(privacyQuery, targetUserID).Scan(&isPrivate)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		if !isPrivate {
			query := `
            SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image,
                   EXISTS(SELECT 1 FROM user_relationships ur 
                           WHERE ur.follower_id = $1 AND ur.followed_id = u.user_id AND ur.status = 'accepted') AS following
            FROM user_relationships ur
            JOIN users u ON ur.follower_id = u.user_id
            WHERE ur.followed_id = $2 AND ur.status = 'accepted'`

			rows, err := DB.Query(query, requesterID, targetUserID)
			if err != nil {
				http.Error(w, "Error fetching followers", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			for rows.Next() {
				var follower UserSummary
				if err := rows.Scan(&follower.UserID, &follower.FirstName, &follower.LastName, &follower.Nickname, &follower.Image, &follower.Following); err != nil {
					http.Error(w, "Error scanning followers", http.StatusInternalServerError)
					return
				}
				follower.Private = isPrivate
				if follower.UserID == requesterID {
					follower.Following = true
				}
				if !follower.Following {
					// Check for pending follow request
					pendingQuery := `
                    SELECT status FROM user_relationships 
                    WHERE follower_id = $1 AND followed_id = $2 AND status = 'pending'`
					var status string
					err = DB.QueryRow(pendingQuery, requesterID, follower.UserID).Scan(&status)
					if err == nil {
						follower.Status = "pending"
					} else {
						follower.Status = "not following"
					}
				} else {
					follower.Status = "accepted"
				}

				followers = append(followers, follower)
			}
		} else {
			var isFollowing bool
			followingQuery := `
            SELECT EXISTS(SELECT 1 FROM user_relationships 
                          WHERE follower_id = $1 AND followed_id = $2 AND status = 'accepted')`

			err = DB.QueryRow(followingQuery, requesterID, targetUserID).Scan(&isFollowing)
			if err != nil {
				http.Error(w, "Error checking follow status", http.StatusInternalServerError)
				return
			}

			if isFollowing {
				query := `
                SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image
                FROM user_relationships ur
                JOIN users u ON ur.follower_id = u.user_id
                WHERE ur.followed_id = $1 AND ur.status = 'accepted'`

				rows, err := DB.Query(query, targetUserID)
				if err != nil {
					http.Error(w, "Error fetching followers", http.StatusInternalServerError)
					return
				}
				defer rows.Close()

				for rows.Next() {
					var follower UserSummary
					if err := rows.Scan(&follower.UserID, &follower.FirstName, &follower.LastName, &follower.Nickname, &follower.Image); err != nil {
						http.Error(w, "Error scanning followers", http.StatusInternalServerError)
						return
					}
					follower.Private = isPrivate;
					if follower.UserID == requesterID {
						follower.Following = true
					}
					// Check for pending follow request
					pendingQuery := `
                    SELECT status FROM user_relationships 
                    WHERE follower_id = $1 AND followed_id = $2 AND status = 'pending'`
					var status string
					err = DB.QueryRow(pendingQuery, requesterID, follower.UserID).Scan(&status)
					if err == nil {
						follower.Status = "pending"
					} else {
						follower.Status = "not following"
					}

					followers = append(followers, follower)
				}
			}
		}
	} else {
		query := `
        SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image,
               private,
               EXISTS(SELECT 1 FROM user_relationships ur 
                       WHERE ur.follower_id = $1 AND ur.followed_id = u.user_id AND ur.status = 'accepted') AS following
        FROM user_relationships ur
        JOIN users u ON ur.follower_id = u.user_id
        WHERE ur.followed_id = $1 AND ur.status = 'accepted'`

		rows, err := DB.Query(query, targetUserID)
		if err != nil {
			http.Error(w, "Error fetching followers", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var follower UserSummary
			if err := rows.Scan(&follower.UserID, &follower.FirstName, &follower.LastName, &follower.Nickname, &follower.Image, &follower.Private, &follower.Following); err != nil {
				http.Error(w, "Error scanning followers", http.StatusInternalServerError)
				return
			}

			if !follower.Following {
				// Check for pending follow request
				pendingQuery := `
                SELECT status FROM user_relationships 
                WHERE follower_id = $1 AND followed_id = $2 AND status = 'pending'`
				var status string
				err = DB.QueryRow(pendingQuery, requesterID, follower.UserID).Scan(&status)
				if err == nil {
					follower.Status = "pending"
				} else {
					follower.Status = "not following"
				}
			} else {
				follower.Status = "accepted"
			}

			followers = append(followers, follower)
		}
	}

	response := map[string]interface{}{
		"status":    "success",
		"followers": followers,
	}

	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func GetFollowingHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	cookie, err := r.Cookie("session_token")
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	session := sessions[cookie.Value]
	requesterID := session.id

	// Get the user ID from query parameters, if provided
	targetUserIDStr := r.URL.Query().Get("userid")
	var targetUserID int
	if targetUserIDStr != "" {
		targetUserID, err = strconv.Atoi(targetUserIDStr)
		if err != nil {
			http.Error(w, "Invalid user ID", http.StatusBadRequest)
			return
		}
	} else {
		// No specific user requested, use the requester ID
		targetUserID = requesterID
	}

	var following []UserSummary

	// Skip privacy check if the target user is the same as the requester
	if targetUserID != requesterID {
		// Check the privacy of the target user
		var isPrivate bool
		privacyQuery := `SELECT private FROM users WHERE user_id = $1`
		err = DB.QueryRow(privacyQuery, targetUserID).Scan(&isPrivate)
		if err != nil {
			http.Error(w, "User not found", http.StatusNotFound)
			return
		}

		// If the account is public, fetch the following users
		if !isPrivate {
			query := `
            SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image,
                   EXISTS(SELECT 1 FROM user_relationships ur 
                           WHERE ur.follower_id = $1 AND ur.followed_id = u.user_id AND ur.status = 'accepted') AS following
            FROM user_relationships ur
            JOIN users u ON ur.followed_id = u.user_id
            WHERE ur.follower_id = $2 AND ur.status = 'accepted'`

			rows, err := DB.Query(query, requesterID, targetUserID)
			if err != nil {
				http.Error(w, "Error fetching following", http.StatusInternalServerError)
				return
			}
			defer rows.Close()

			for rows.Next() {
				var user UserSummary
				if err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName, &user.Nickname, &user.Image, &user.Following); err != nil {
					http.Error(w, "Error scanning following users", http.StatusInternalServerError)
					return
				}
				if user.UserID == requesterID {
					user.Following = true
				}
				user.Private = isPrivate // Include privacy status
				following = append(following, user)
			}
		} else {
			// If the account is private, check if the requester is following the target user
			var isFollowing bool
			followingQuery := `
            SELECT EXISTS(SELECT 1 FROM user_relationships 
                          WHERE follower_id = $1 AND followed_id = $2 AND status = 'accepted')`

			err = DB.QueryRow(followingQuery, requesterID, targetUserID).Scan(&isFollowing)
			if err != nil {
				http.Error(w, "Error checking follow status", http.StatusInternalServerError)
				return
			}

			// If following, fetch the following users
			if isFollowing {
				query := `
                SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image
                FROM user_relationships ur
                JOIN users u ON ur.followed_id = u.user_id
                WHERE ur.follower_id = $1 AND ur.status = 'accepted'`

				rows, err := DB.Query(query, targetUserID)
				if err != nil {
					http.Error(w, "Error fetching following", http.StatusInternalServerError)
					return
				}
				defer rows.Close()

				for rows.Next() {
					var user UserSummary
					if err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName, &user.Nickname, &user.Image); err != nil {
						http.Error(w, "Error scanning following users", http.StatusInternalServerError)
						return
					}
					if user.UserID == requesterID {
						user.Following = true
					}
					user.Private = isPrivate // Include privacy status
					following = append(following, user)
				}
			}
		}
	} else {
		// If the target user is the same as the requester, fetch following directly
		query := `
        SELECT u.user_id, u.first_name, u.last_name, u.nickname, u.image,
               private,
               EXISTS(SELECT 1 FROM user_relationships ur 
                       WHERE ur.follower_id = $1 AND ur.followed_id = u.user_id AND ur.status = 'accepted') AS following
        FROM user_relationships ur
        JOIN users u ON ur.followed_id = u.user_id
        WHERE ur.follower_id = $1 AND ur.status = 'accepted'`

		rows, err := DB.Query(query, targetUserID)
		if err != nil {
			http.Error(w, "Error fetching following", http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		for rows.Next() {
			var user UserSummary
			if err := rows.Scan(&user.UserID, &user.FirstName, &user.LastName, &user.Nickname, &user.Image, &user.Private, &user.Following); err != nil {
				http.Error(w, "Error scanning following users", http.StatusInternalServerError)
				return
			}
			if user.UserID == requesterID {
				user.Following = true
			}
			following = append(following, user)
		}
	}

	response := map[string]interface{}{
		"status":    "success",
		"following": following,
	}

	// Encode the response
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}