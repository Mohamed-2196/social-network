package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

type Group struct {
	GroupName  string   `json:"groupTitle"`
	GroupDesc  string   `json:"groupDescription"`
	Users      []string `json:"users"`
	Visibility string   `json:"visibility"`
}

func HandleGroup(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var group Group
	var privacy bool

	err := json.NewDecoder(r.Body).Decode(&group)
	if err != nil {
		http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
		fmt.Println("Error decoding JSON:", err)
		return
	}

	fmt.Println("Group Title:", group.GroupName)
	fmt.Println("Group Description:", group.GroupDesc)
	fmt.Println("Users:", group.Users)
	fmt.Println("Privacy:", group.Visibility)

	if group.Visibility == "public" {
		privacy = false
	} else {
		privacy = true
	}

	_, err = DB.Exec("INSERT INTO groups (name, description, created_at, type) VALUES (?, ?, ?, ?)",
		group.GroupName, group.GroupDesc, time.Now(), privacy)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		fmt.Println(err)

		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Group created successfully"})
}
