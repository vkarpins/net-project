package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
)

type SearchResults struct {
	Users  []structs.User  `json:"users"`
	Groups []structs.Group `json:"groups"`
}

func SearchUsersHandler(w http.ResponseWriter, r *http.Request) {
	loggedInUserId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}
	query := r.URL.Query().Get("query")

	// user search for first-, lastname, nickname
	users, err := database.SearchUsers(query, loggedInUserId)
	if err != nil {
		log.Printf("Error searching users: %v", err)
		http.Error(w, "Error searching users", http.StatusInternalServerError)
		return
	}

	// group search
	groups, err := database.SearchGroup(query)
	if err != nil {
		log.Printf("Error searching groups: %v", err)
		http.Error(w, "Error searching groups", http.StatusInternalServerError)
		return
	}

	results := SearchResults{Users: users, Groups: groups}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}

func SearchFollowersHandler(w http.ResponseWriter, r *http.Request) {
	loggedInUserId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}
	query := r.URL.Query().Get("query")

	// user search for first-, lastname, nickname
	users, err := database.SearchFollowers(query, loggedInUserId)
	if err != nil {
		log.Printf("Error searching users: %v", err)
		http.Error(w, "Error searching users", http.StatusInternalServerError)
		return
	}
	results := SearchResults{Users: users}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(results)
}