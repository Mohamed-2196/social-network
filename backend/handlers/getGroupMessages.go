package handlers

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
)

type Vote struct {
	VoteID    int `json:"vote_id"`
	CreatedBy int `json:"created_by"`
	OptionID  int `json:"option_id"`
}
type PollOption struct {
	PollID   int    `json:"poll_id"`
	OptionID int    `json:"option_id"`
	Content  string `json:"content"`
	Votes    []Vote `json:"votes"`
}

func HandleGetGroupMessage(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

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

	vars := mux.Vars(r)
	groupIDStr := vars["groupid"]

	// Convert groupid to an integer
	groupID, err := strconv.Atoi(groupIDStr)
	if err != nil {
		http.Error(w, "Invalid groupid", http.StatusBadRequest)
		return
	}

	userID := session.id
	var membershipCount int
	membershipQuery := `SELECT COUNT(*) FROM group_membership WHERE group_id = ? AND user_id = ? AND status = 'accepted'`
	err = DB.QueryRow(membershipQuery, groupID, userID).Scan(&membershipCount)
	if err != nil {
		log.Println("Error checking group membership:", err)
		http.Error(w, "Error checking group membership", http.StatusInternalServerError)
		return
	}

	if membershipCount == 0 {
		http.Error(w, "User is not a member of the group", http.StatusForbidden)
		return
	}

	var groupInfo groupChat
	groupQuery := `SELECT group_id, title, description, admin_id FROM groups WHERE group_id = ?;`
	var adminUserID int
	err = DB.QueryRow(groupQuery, groupID).Scan(&groupInfo.GroupID, &groupInfo.Name, &groupInfo.Description, &adminUserID)
	if err != nil {
		log.Println("Error fetching group info:", err)
		http.Error(w, "Group not found", http.StatusNotFound)
		return
	}

	// Fetch accepted members
	memberQuery := `SELECT user_id FROM group_membership WHERE group_id = ? AND status = 'accepted';`
	rows, err := DB.Query(memberQuery, groupID)
	if err != nil {
		log.Println("Error fetching group members:", err)
		http.Error(w, "Error fetching group members", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var members []Member
	for rows.Next() {
		var member Member
		err := rows.Scan(&member.UserID)
		if err != nil {
			log.Println("Error scanning member:", err)
			http.Error(w, "Error processing members", http.StatusInternalServerError)
			return
		}
		member.Admin = (member.UserID == adminUserID)
		members = append(members, member)
	}

	// Fetch group messages with user info (nickname and image)
	messageQuery := `
		SELECT gm.sender_id, gm.content, gm.created_at, u.nickname, u.image , gm.group_post_id
		FROM group_messages gm
		JOIN users u ON gm.sender_id = u.user_id
		WHERE gm.group_id = ?;
	`
	rows, err = DB.Query(messageQuery, groupID)
	if err != nil {
		log.Println("Error executing message query:", err)
		http.Error(w, "Error fetching group messages", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	var groupMessages []GroupMessage
	for rows.Next() {
		var groupMessage GroupMessage
		var pollID sql.NullInt64 // Handle null post_id + change the name in db
		err := rows.Scan(&groupMessage.SenderID, &groupMessage.Content, &groupMessage.CreatedAt, &groupMessage.Name, &groupMessage.AuthorImage, &pollID)
		if err != nil {
			log.Println("Error scanning message:", err)
			http.Error(w, "Error processing messages", http.StatusInternalServerError)
			return
		}

		if pollID.Valid {
			pollQuery := `SELECT title , description FROM group_event WHERE event_id = ?`
			//add options here
			err := DB.QueryRow(pollQuery, pollID.Int64).Scan(&groupMessage.PollTitle, &groupMessage.PollDescription)
			if err != nil {
				log.Println("Error fetching poll data:", err)
				http.Error(w, "Error fetching poll data", http.StatusInternalServerError)
				return
			}

			optionQuery := `SELECT option_id , content FROM event_option WHERE event_id = ?`
			optionrow, err := DB.Query(optionQuery, pollID.Int64)
			if err != nil {
				log.Println("Error fetching poll data:", err)
				http.Error(w, "Error fetching poll data", http.StatusInternalServerError)
				return
			}
			defer optionrow.Close()
			var pollOptions []PollOption

			for optionrow.Next() {
				var option PollOption
				err := optionrow.Scan(&option.OptionID, &option.Content)
				if err != nil {
					http.Error(w, "Error fetching options", http.StatusInternalServerError)
				}
				pollOptions = append(pollOptions, option)
			}
			if err := optionrow.Err(); err != nil {
				log.Println("Error after iterating poll options:", err)
			}

			groupMessage.PollID = int(pollID.Int64)
			groupMessage.PollOptions = pollOptions
		}
		groupMessages = append(groupMessages, groupMessage)
	}

	if err := rows.Err(); err != nil {
		log.Println("Error after iterating messages:", err)
		http.Error(w, "Error processing messages", http.StatusInternalServerError)
		return
	}

	// Set response header and encode group messages
	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(groupMessages)
	if err != nil {
		log.Println("Error encoding GroupMessage:", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
}
