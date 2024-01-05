package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
)

func LoggedInUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	loggedInUserId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	loggedInUser, err := database.GetUserById(loggedInUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if loggedInUser == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	posts, err := database.GetPostsByUserId(loggedInUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groups, err := database.GetGroupByUserId(loggedInUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	profileData := structs.ProfileDTO{
		UserInfo:  *loggedInUser,
		UserPosts: posts,
		UserGroups: groups,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(profileData); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}

func OtherUserProfileHandler(w http.ResponseWriter, r *http.Request) {
	otherUserId, _ := helpers.GetUserIdFromRequest(r)

	otherUser, err := database.GetUserById(otherUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if otherUser == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	posts, err := database.GetPostsByUserId(otherUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	groups, err := database.GetGroupByUserId(otherUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	profileData := structs.ProfileDTO{
		UserInfo:  *otherUser,
		UserPosts: posts,
		UserGroups: groups,
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(profileData); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}

func UpdateProfilePrivacyHandler(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	// Get the target user ID from the request body
	var updateRequest structs.UpdateProfilePrivacyRequest
	if err := helpers.DecodeJSONBody(r, &updateRequest); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	// Check if the authenticated user is trying to update their own privacy setting
	if userId != updateRequest.UserId {
		http.Error(w, "Unauthorized: You can only update your own privacy setting", http.StatusUnauthorized)
		return
	}

	// Update the privacy setting
	err := database.UpdateProfilePrivacy(updateRequest.UserId, updateRequest.IsPrivate)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	response := structs.UpdateProfilePrivacyRequest{
		UserId:    userId,
		IsPrivate: updateRequest.IsPrivate,
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}
