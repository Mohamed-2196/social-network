package handlers

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	clients = make(map[int][]*websocket.Conn)
	mu      sync.Mutex
)

func Ws(w http.ResponseWriter, r *http.Request) {
	var upgrader = websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			return true
		},
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Error upgrading connection:", err)
		return
	}
	defer conn.Close()

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


	session := sessions[sessionToken]
	id:= session.id
	mu.Lock()
	if clients[id] == nil {
		clients[id] = []*websocket.Conn{}
	}
	clients[id] = append(clients[id], conn)
	mu.Unlock()


	defer func() {
		mu.Lock()
		delete(clients, id)
		mu.Unlock()
	}()

	fmt.Println(clients)

	//Stimluate Reading
	for {

	}
}