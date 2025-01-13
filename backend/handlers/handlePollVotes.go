package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
)

type ReceivedVote struct {
	UserID   int    `json:"user_id"`
	OptionID string `json:"option_id"`
	PollID   int    `json:"poll_id"`
}

type ExistingVote struct {
	ID       int
	UserID   int
	OptionID int
}

func HandlePolVotes(w http.ResponseWriter, r *http.Request) {
	enableCORS(w, r)
	w.Header().Set("Content-Type", "application/json")

	userID, err := getUserIDFromSession(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	PollID, err := getPollIDFromRequest(r)
	if err != nil {
		http.Error(w, "pollID is not avalible", http.StatusBadRequest)
	}

	var vote ReceivedVote
	err = json.NewDecoder(r.Body).Decode(&vote)
	if err != nil {
		http.Error(w, "Invalid JSON data", http.StatusBadRequest)
		return
	}
	optionID, err := strconv.Atoi(vote.OptionID)
	if err != nil {
		http.Error(w, "error converting the optionid to an int", http.StatusInternalServerError)
	}

	existingVote, err := findExistingVote(userID, PollID)
	if err != nil {
		http.Error(w, "error checking for existing vote", http.StatusInternalServerError)
	}

	if existingVote != nil {
		err := deleteVote(existingVote.ID) // Proceed to delete the old vote
		if err != nil {
			http.Error(w, "Error deleting old vote", http.StatusInternalServerError)
			return
		}
	}

	vote.PollID = PollID
	vote.UserID = userID
	groupID, err := getGroupIDFromPollID(PollID)
	if err != nil {
		fmt.Println("Error:", err)
	} else {
		fmt.Printf("Group ID for Poll ID %d: %d\n", PollID, groupID)
	}

	newMessage, err := savePollVote(userID, optionID, groupID, PollID)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	// Create the message to send to clients
	messageToClient := MessageToClient{
		Type:          "update_poll",
		MessageClient: newMessage,
	}

	members, err := getGroupMembers(groupID)
	if err != nil {
		http.Error(w, "Error fetching group members", http.StatusInternalServerError)
		return
	}

	// Send the message to all connected clients
	for _, user := range members {
		if len(clients[user.UserID]) > 0 {
			for _, client := range clients[user.UserID] {
				// Send the structured message to the connected client
				err := client.WriteJSON(messageToClient)
				if err != nil {
					log.Printf("Error sending message to user %d: %v", user.UserID, err)
				}
			}
		}
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "VOTE IS SENT"})
}

func getPollIDFromRequest(r *http.Request) (int, error) {
	pollIDStr := r.PathValue("pollID")

	return strconv.Atoi(pollIDStr)
}

func savePollVote(userID int, optionID int, groupID int, pollID int) (GroupMessage, error) {
	query := `INSERT INTO option_vote (created_by, option_id) VALUES(?, ?)`
	_, err := DB.Exec(query, userID, optionID)
	if err != nil {
		return GroupMessage{}, fmt.Errorf("failed to save poll in messages: %w", err)
	}

	query2 := `SELECT 
        gm.sender_id, 
        gm.group_id, 
        gm.content, 
        gm.created_at, 
        u.nickname AS name,  -- Use nickname as Name
        u.image AS author_image,  -- Use image as AuthorImage
        ge.event_id AS Poll_id,  -- Ensure PollID maps correctly
        ge.title AS poll_title, 
        ge.description AS poll_description, 
        eo.option_id,
        eo.content,
        COALESCE(COUNT(v.vote_id), 0) AS votes_count
    FROM 
        group_messages gm
    JOIN 
        group_event ge ON gm.group_post_id = ge.event_id 
    JOIN 
        users u ON ge.created_by = u.user_id  
    LEFT JOIN 
        event_option eo ON ge.event_id = eo.event_id  
    LEFT JOIN 
        option_vote v ON eo.option_id = v.option_id  
    WHERE 
        gm.group_id = ? AND ge.event_id = ?  
    GROUP BY 
        gm.sender_id, 
        gm.group_id, 
        gm.content, 
        gm.created_at, 
        u.nickname, 
        u.image, 
        ge.event_id, 
        ge.title, 
        ge.description, 
        eo.option_id, 
        eo.content`

	rows, err := DB.Query(query2, groupID, pollID)
	if err != nil {
		return GroupMessage{}, err
	}
	defer rows.Close()

	var groupMessage GroupMessage

	for rows.Next() {
		var po PollOption

		err = rows.Scan(
			&groupMessage.SenderID,
			&groupMessage.GroupID,
			&groupMessage.Content,
			&groupMessage.CreatedAt,
			&groupMessage.Name,
			&groupMessage.AuthorImage,
			&groupMessage.PollID,
			&groupMessage.PollTitle,
			&groupMessage.PollDescription,
			&po.OptionID,
			&po.Content,
			&po.VotesCount,
		)
		if err != nil {
			return GroupMessage{}, err
		}

		groupMessage.PollOptions = append(groupMessage.PollOptions, po)
	}

	if err = rows.Err(); err != nil {
		return GroupMessage{}, err
	}

	return groupMessage, nil
}

func findExistingVote(userID int, PollID int) (*ExistingVote, error) {
	var vote ExistingVote
	query := `
        SELECT v.vote_id, v.created_by, v.option_id 
        FROM option_vote v 
        JOIN event_option o ON v.option_id = o.option_id 
        WHERE v.created_by = ? AND o.event_id = ?
    `
	err := DB.QueryRow(query, userID, PollID).Scan(&vote.ID, &vote.UserID, &vote.OptionID)

	if err != nil {
		if err == sql.ErrNoRows {
			// No existing vote found
			return nil, nil
		}
		log.Printf("Error querying for existing vote: %v\n", err)
		return nil, err
	}
	return &vote, nil
}

func deleteVote(voteID int) error {
	query := `DELETE FROM option_vote WHERE vote_id = ?`

	result, err := DB.Exec(query, voteID)
	if err != nil {
		return err
	}

	// Check if any rows were affected
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return err
	}
	if rowsAffected == 0 {
		return sql.ErrNoRows // No rows were found to delete
	}

	return nil
}
func getGroupIDFromPollID(pollID int) (int, error) {
	query := `SELECT 
    gm.group_id
   FROM 
    group_event ge
    JOIN 
    group_messages gm ON ge.event_id = gm.group_post_id
    WHERE 
    ge.event_id = ?`

	var groupID int
	err := DB.QueryRow(query, pollID).Scan(&groupID)
	if err != nil {
		if err == sql.ErrNoRows {
			return 0, fmt.Errorf("no group found for poll ID %d", pollID)
		}
		return 0, fmt.Errorf("error querying group ID: %w", err)
	}

	return groupID, nil
}
