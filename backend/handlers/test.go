package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Messagewww struct {
	Username string `json:"username"`
	Content  string `json:"content"`
}

var broadcast = make(chan Messagewww)

func TestHandler(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	fmt.Println("Do you reach")

	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var msg Messagewww
	err := json.NewDecoder(r.Body).Decode(&msg)
	if err != nil {
		http.Error(w, "Invalid message format", http.StatusBadRequest)
		return
	}

	fmt.Println(msg)
	broadcast <- msg

	// Respond to the sender
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Message received"))
}
