package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
	"strconv"

	"github.com/gorilla/mux"
)

func CreateComment(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var newComment = structs.Comment{UserId: userId}
	err := json.NewDecoder(r.Body).Decode(&newComment)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if newComment.Content == "" {
		http.Error(w, "Please provide a comment", http.StatusBadRequest)
		return
	}

	UserInfo, err := database.GetUserMainInfo(userId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if UserInfo.Nickname == "" {
		newComment.CreatorName = UserInfo.FirstName + " " + UserInfo.LastName
	} else {
		newComment.CreatorName = UserInfo.Nickname
	}
	newComment.ProfilePicture = UserInfo.Avatar
	vars := mux.Vars(r)
	postId, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	newComment.PostId = postId

	comment, err := database.InsertComment(newComment)
	if err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(comment); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func CreateCommentInGroup(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var newCommentInGroup = structs.GroupComment{UserId: userId}
	err := json.NewDecoder(r.Body).Decode(&newCommentInGroup)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	if newCommentInGroup.Content == "" {
		http.Error(w, "Please provide a comment", http.StatusBadRequest)
		return
	}

	UserInfo, err := database.GetUserMainInfo(userId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if UserInfo.Nickname == "" {
		newCommentInGroup.CreatorName = UserInfo.FirstName + " " + UserInfo.LastName
	} else {
		newCommentInGroup.CreatorName = UserInfo.Nickname
	}
	newCommentInGroup.ProfilePicture = UserInfo.Avatar

	vars := mux.Vars(r)
	postId, err := strconv.Atoi(vars["postId"])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	groupId, err := strconv.Atoi(vars["groupId"])
	if err != nil {
		http.Error(w, "Invalid post ID", http.StatusBadRequest)
		return
	}
	newCommentInGroup.PostId = postId
	newCommentInGroup.GroupId = groupId

	isMember, err := database.CheckUserIfMemberOfGroup(userId, groupId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if !isMember {
		http.Error(w, "You aren't a member of this group", http.StatusBadRequest)
		return
	}

	commentInGroup, err := database.InsertGroupComment(newCommentInGroup)
	if err != nil {
		http.Error(w, "Failed to create comment", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(commentInGroup); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}