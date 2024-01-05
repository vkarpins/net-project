package handlers

import (
	"encoding/json"
	"fmt"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
	"strconv"

	"github.com/gorilla/mux"
)

func CreatePost(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var creationPostInfo structs.Post
	err := json.NewDecoder(r.Body).Decode(&creationPostInfo)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if creationPostInfo.Title == "" || creationPostInfo.Content == "" {
		http.Error(w, "Please provide a title and content", http.StatusBadRequest)
		return
	}

	UserInfo, err := database.GetUserById(userId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	creationPostInfo.UserId = userId
	creationPostInfo.ProfilePicture = UserInfo.Avatar

	posts, err := database.AddPost(creationPostInfo)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func ReadPosts(w http.ResponseWriter, r *http.Request) {
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

	posts, err := database.ReadAllPosts(loggedInUserId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(posts)

}

func CreateGroupPost(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var postInfo structs.GroupPost
	err := json.NewDecoder(r.Body).Decode(&postInfo)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
	}
	if postInfo.Title == "" || postInfo.Content == "" {
		http.Error(w, "Please provide a title and content", http.StatusBadRequest)
		return
	}

	UserInfo, err := database.GetUserById(userId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}

	vars := mux.Vars(r)
	groupId, _ := strconv.Atoi(vars["id"])
	postInfo.GroupId = groupId
	postInfo.UserId = userId
	postInfo.ProfilePicture = UserInfo.Avatar

	isMember, err := database.CheckUserIfMemberOfGroup(userId, groupId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You aren't a member of this group", http.StatusBadRequest)
		return
	}

	posts, err := database.AddGroupPost(postInfo)
	if err != nil {
		http.Error(w, "Failed to create group post", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(posts); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func ReadGroupPosts(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}
	vars := mux.Vars(r)
	groupId, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}

	isMember, err := database.CheckUserIfMemberOfGroup(userId, groupId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You aren't a member of this group", http.StatusBadRequest)
		return
	}

	groupPosts, err := database.ReadAllGroupPosts(groupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to retrieve group posts: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groupPosts)
}

func ReadUserInfo(w http.ResponseWriter, r *http.Request) {
	loggedInUserId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}
	loggedInUser, err := database.GetUserMainInfo(loggedInUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
	if loggedInUser == nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(loggedInUser); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
		return
	}
}
