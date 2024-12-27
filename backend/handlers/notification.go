package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

// PendingFollowsCountHandler counts the number of pending follows for the logged-in user.
func notificationnumber(w http.ResponseWriter, r *http.Request) {
    enableCORS(w, r) // Enable CORS for this endpoint

    // Get the user ID from the session token stored in the cookie
    c, err := r.Cookie("session_token")
    if err != nil {
        if err == http.ErrNoCookie {
            http.Error(w, "No active session", http.StatusUnauthorized)
            return
        }
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    sessionToken := c.Value
    session, ok := sessions[sessionToken]
    if !ok {
        http.Error(w, "Invalid session", http.StatusUnauthorized)
        return
    }

    userID := session.id

    // SQL query to count unread notifications
    countQuery := `
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = $1
    `
    var count int
    err = DB.QueryRow(countQuery, userID).Scan(&count)
    if err != nil {
        http.Error(w, "Database error", http.StatusInternalServerError)
        fmt.Println(err)
        return
    }

    // SQL query to get all users for the search bar
    userQuery := `
        SELECT user_id, first_name, last_name, image 
        FROM users
    `
    
    rows, err := DB.Query(userQuery)
    if err != nil {
        http.Error(w, "Database error", http.StatusInternalServerError)
        fmt.Println(err)
        return
    }
    defer rows.Close()

    var users []struct {
        ID        string `json:"id"`
        FirstName string `json:"first_name"`
        LastName  string `json:"last_name"`
        Avatar    string `json:"avatar"`
    }

    for rows.Next() {
        var user struct {
            ID        string `json:"id"`
            FirstName string `json:"first_name"`
            LastName  string `json:"last_name"`
            Avatar    string `json:"avatar"`
        }
        if err := rows.Scan(&user.ID, &user.FirstName, &user.LastName, &user.Avatar); err != nil {
            http.Error(w, "Database error", http.StatusInternalServerError)
            fmt.Println(err)
            return
        }
        users = append(users, user)
    }

    // Prepare the response data
    response := map[string]interface{}{
        "count": count,
        "users": users, // Include all users for the search bar
    }

    // Send the response
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(response)
}

func getNotifications(w http.ResponseWriter, r *http.Request) {
    enableCORS(w,r) // Enable CORS for this endpoint

    // Get the user ID from the session token stored in the cookie
    c, err := r.Cookie("session_token")
    if err != nil {
        if err == http.ErrNoCookie {
            http.Error(w, "No active session", http.StatusUnauthorized)
            return
        }
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    sessionToken := c.Value
    session, ok := sessions[sessionToken]
    if !ok {
        http.Error(w, "Invalid session", http.StatusUnauthorized)
        return
    }

    userID := session.id

    // SQL query to get notifications for the user
	query := `
    SELECT id, type, content, created_at, hidden_info, COALESCE(sender_id, 0) 
    FROM notifications 
    WHERE user_id = $1 
    ORDER BY created_at DESC
`
    rows, err := DB.Query(query, userID)
    if err != nil {
        http.Error(w, "Database error", http.StatusInternalServerError)
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
        SenderID   int    `json:"sender_id"` // Change to string for UUID
    }

    // Prepare a slice to hold notifications
    notifications := []Notification{}

    // Iterate through the result set
    for rows.Next() {
        var notification Notification
        if err := rows.Scan(&notification.ID, &notification.Type, &notification.Content, &notification.CreatedAt, &notification.HiddenInfo, &notification.SenderID); err != nil {
            http.Error(w, "Error scanning notifications", http.StatusInternalServerError)
            return
        }
        notifications = append(notifications, notification)
    }

    // Check for any errors from iterating over rows
    if err := rows.Err(); err != nil {
        http.Error(w, "Error retrieving notifications", http.StatusInternalServerError)
        return
    }

    // Send the response
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(notifications)
}

func manageNotification(w http.ResponseWriter, r *http.Request) {
    enableCORS(w,r) // Enable CORS for this endpoint

    // Get the user ID from the session token stored in the cookie
    c, err := r.Cookie("session_token")
    if err != nil {
        if err == http.ErrNoCookie {
            http.Error(w, "No active session", http.StatusUnauthorized)
            return
        }
        http.Error(w, err.Error(), http.StatusBadRequest)
        return
    }
    sessionToken := c.Value
    session, ok := sessions[sessionToken]
    if !ok {
        http.Error(w, "Invalid session", http.StatusUnauthorized)
        return
    }

    userID := session.id

    // Parse the request body (assuming JSON)
    var request struct {
        Action string `json:"action"`
        ID     int    `json:"id"`
    }

    if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
        http.Error(w, "Invalid request", http.StatusBadRequest)
        fmt.Println(err)
        return
    }

    // Validate the action
    if request.Action != "accept" && request.Action != "reject" && request.Action != "delete" {
        http.Error(w, "Invalid action", http.StatusBadRequest)
        fmt.Println(err)

        return
    }

    // Check the notification's details
    var notificationType string
    var senderID int // To hold the sender_id from the notification
    queryCheck := `
        SELECT type, sender_id FROM notifications 
        WHERE id = $1 AND user_id = $2
    `
    err = DB.QueryRow(queryCheck, request.ID, userID).Scan(&notificationType, &senderID)
    if err != nil {
        http.Error(w, "Notification not found or access denied", http.StatusNotFound)
        return
    }

    // Process the notification based on its type
    switch notificationType {
	case "followRequest":
        if request.Action == "accept" {
            // Update the status of the follow request to accepted
            _, err = DB.Exec("UPDATE user_relationships SET status = 'accepted' WHERE follower_id = $1 AND followed_id = $2", senderID, userID)
            if err != nil {
                http.Error(w, "Error updating user relationships", http.StatusInternalServerError)
                return
            }
            // Delete the notification after acceptance
            _, err = DB.Exec("DELETE FROM notifications WHERE id = $1", request.ID)
            if err != nil {
                http.Error(w, "Error deleting notification", http.StatusInternalServerError)
                return
            }
        } else if request.Action == "reject" {
            // Delete the notification after rejection
            _, err = DB.Exec("DELETE FROM notifications WHERE id = $1", request.ID)
            if err != nil {
                http.Error(w, "Error deleting notification", http.StatusInternalServerError)
                return
            }
            _, err = DB.Exec("DELETE FROM user_relationships WHERE follower_id = $1 AND followed_id = $2", senderID, userID)
            if err != nil {
                http.Error(w, "Error deleting notification", http.StatusInternalServerError)
                return
            }
        }
        countQuery := `
        SELECT COUNT(*) 
        FROM notifications 
        WHERE user_id = $1
    `
	var count int
	err = DB.QueryRow(countQuery, userID).Scan(&count)
	if err != nil {
		http.Error(w, "Database error", http.StatusInternalServerError)
		fmt.Println(err)
		return
	}

	if len(clients[userID]) > 0 {
		for _, client := range clients[userID] {
			sendNotificationCount(client, count)
            Sendupdatednotification(client, userID)
		}
	}
    case "someOtherType":
        // Implement logic for other notification types as needed
        // ...

    default:
        http.Error(w, "Unsupported notification type", http.StatusBadRequest)
        return
    }

    // Send a success response
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]string{"message": "Notification processed successfully"})
}