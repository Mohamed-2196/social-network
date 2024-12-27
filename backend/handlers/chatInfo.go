package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
)

type UserInfo struct {
	FirstName string `json:"first_name"`
	LastName  string `json:"last_name"`
	Nickname  string `json:"nickname"`
	Image     string `json:"image"` // Pointer to handle null values
}

func GetChatInfo(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	userID := r.URL.Query().Get("receiver_id")
	if userID == "" {
		http.Error(w, "Missing userid parameter", http.StatusBadRequest)
		return
	}
	fmt.Println("got the userid", userID)
	var info UserInfo
	query := "SELECT first_name , last_name , nickname , image FROM users WHERE user_id = ?"
	err := DB.QueryRow(query, userID).Scan(&info.FirstName, &info.LastName, &info.Nickname, &info.Image)
	if err != nil {
		if err == sql.ErrNoRows {
			http.Error(w, "User not found", http.StatusNotFound)
		} else {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
		}
		fmt.Println("Database query error:", err)
		return
	}

	json.NewEncoder(w).Encode(info)
}
