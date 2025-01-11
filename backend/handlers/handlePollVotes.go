package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
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
		fmt.Println("gotcha more than one", existingVote.ID)
		err := deleteVote(existingVote.ID) // Proceed to delete the old vote
		if err != nil {
			http.Error(w, "Error deleting old vote", http.StatusInternalServerError)
			return
		}
	}

	vote.PollID = PollID
	vote.UserID = userID
	savePollVote(userID, optionID )

	fmt.Println("vote issss heeerrrree")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "VOTE IS SENT"})
}

func getPollIDFromRequest(r *http.Request) (int, error) {
	vars := mux.Vars(r)
	pollIDStr := vars["pollID"]
	return strconv.Atoi(pollIDStr)
}

func savePollVote(userID int, OptionID int) {
	query := `INSERT INTO option_vote (created_by , option_id) VALUES(?,?)`
	_, err := DB.Exec(query, userID, OptionID)
	if err != nil {
		fmt.Errorf("failed to save poll in messages: %w", err)
		return
	}

}

func findExistingVote(userID int , PollID int) (*ExistingVote, error) {
	var vote ExistingVote
	query := `
        SELECT v.vote_id, v.created_by, v.option_id 
        FROM option_vote v 
        JOIN event_option o ON v.option_id = o.option_id 
        WHERE v.created_by = ? AND o.event_id = ?
    `
	// Execute the query
	err := DB.QueryRow(query, userID, PollID).Scan(&vote.ID, &vote.UserID, &vote.OptionID)

	// Check for errors
	if err != nil {
		if err == sql.ErrNoRows {
			// No existing vote found
			return nil, nil
		}
		// Log the error and return it
		log.Printf("Error querying for existing vote: %v\n", err)
		return nil, err
	}

	// Return the found vote
	return &vote, nil
}

func deleteVote(voteID int) error {
	query := `DELETE FROM option_vote WHERE vote_id = ?`
    
    // Execute the query
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
