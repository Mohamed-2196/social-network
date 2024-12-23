package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
)

type Message struct {
	Username string `json:"username"`
	Content  string `json:"content"`
}

var broadcast = make(chan Message)

func TestHandler(w http.ResponseWriter, r *http.Request) {
	fmt.Println("Do you reach")
	// Parse the incoming message from the HTTP request body
	var msg Message
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
