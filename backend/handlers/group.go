package handlers

import (
	"fmt"
	"net/http"
	"sync"

	"github.com/gorilla/websocket"
)

var (
	clients = make(map[string][]*websocket.Conn)
	mu      sync.Mutex
)

func HandleGroupChat(w http.ResponseWriter, r *http.Request) {
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

	// TEMP USERNAME BEFORE COOKIES GET IMPLEMENTED
	name1 := "Yousif"
	name2 := "Mohammed"

	mu.Lock()
	if clients[name1] == nil {
		clients[name1] = []*websocket.Conn{}
	}
	clients[name1] = append(clients[name1], conn)
	mu.Unlock()

	mu.Lock()
	if clients[name2] == nil {
		clients[name2] = []*websocket.Conn{}
	}
	clients[name2] = append(clients[name2], conn)
	mu.Unlock()

	defer func() {
		mu.Lock()
		delete(clients, name1)
		mu.Unlock()
	}()

	defer func() {
		mu.Lock()
		delete(clients, name2)
		mu.Unlock()
	}()

	fmt.Println(clients)

	//Stimluate Reading
	for {

	}
}
