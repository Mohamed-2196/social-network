package handlers

import (
	"encoding/json"
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
	enableCORS(w, r)

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
	senderID := session.id
	mu.Lock()
	if clients[senderID] == nil {
		clients[senderID] = []*websocket.Conn{}
	}
	clients[senderID] = append(clients[senderID], conn)
	mu.Unlock()

	defer func() {
		mu.Lock()
		clients[senderID] = removeConnection(clients[senderID], conn)
		if len(clients[senderID]) == 0 {
			delete(clients, senderID)
		}
		mu.Unlock()
	}()

	for {
		_, rawMsg, err := conn.ReadMessage()
		if err != nil {
			fmt.Println("Error reading message:", err)
			break
		}

		var msg Message
		err = json.Unmarshal(rawMsg, &msg)
		if err != nil {
			fmt.Println("Error unmarshaling message:", err)
			continue
		}

		msg.SenderID = senderID // Set the sender ID from the session

		err = saveMessage(&msg)
		if err != nil {
			fmt.Println("Error saving message:", err)
			continue
		}

		// Send the message back to the sender
		err = conn.WriteJSON(msg)
		if err != nil {
			fmt.Println("Error sending message back to sender:", err)
		}

		sendMessageToRecipient(&msg)
	}
}

func saveMessage(msg *Message) error {
	query := `
		INSERT INTO messages (sender_id, receiver_id, content)
		VALUES ($1, $2, $3)
		RETURNING message_id, created_at
	`
	err := DB.QueryRow(query, msg.SenderID, msg.ReceiverID, msg.Content).Scan(&msg.MessageID, &msg.CreatedAt)
	return err
}

func sendMessageToRecipient(msg *Message) {
	mu.Lock()
	defer mu.Unlock()

	recipientConns := clients[msg.ReceiverID]
	for _, conn := range recipientConns {
		err := conn.WriteJSON(msg)
		if err != nil {
			fmt.Println("Error sending message to recipient:", err)
		}
	}
}

func removeConnection(conns []*websocket.Conn, conn *websocket.Conn) []*websocket.Conn {
	for i, c := range conns {
		if c == conn {
			return append(conns[:i], conns[i+1:]...)
		}
	}
	return conns
}
