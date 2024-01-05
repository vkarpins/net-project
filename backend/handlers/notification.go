package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
)

func NotificationHandler(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	userNotifications, err := database.FetchFollowRequests(userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groupNotifications, err := database.GetGroupNotifications(userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	combinedNotifications := structs.CombinedNotifications{
		UserNotifications:  userNotifications,
		GroupNotifications: groupNotifications,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(combinedNotifications); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}
