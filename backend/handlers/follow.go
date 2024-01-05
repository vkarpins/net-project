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

func FollowingHandler(w http.ResponseWriter, r *http.Request) {
	userId, _ := helpers.DifBetweenLoggedInUserAndOtherUser(r, w)

	following, err := database.GetUserFollowing(userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(following)
}

func FollowersHandler(w http.ResponseWriter, r *http.Request) {
	userId, _ := helpers.DifBetweenLoggedInUserAndOtherUser(r, w)

	followers, err := database.GetUserFollowers(userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(followers)
}

func IsFollowingHandler(w http.ResponseWriter, r *http.Request) {
	loggedInUserId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	otherUserId, err := helpers.GetUserIdFromRequest(r)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	isFollowing, err := database.IsLoggedInUserFollowing(loggedInUserId, otherUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"isFollowing": isFollowing})
}

func FetchFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	loggedInUserId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	request, err := database.FetchFollowRequests(loggedInUserId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(request)
}

func RequestHandler(w http.ResponseWriter, r *http.Request) {
	requesterId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var request structs.Notification
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	if requesterId == request.ReceiverId {
		http.Error(w, "Cannot follow yourself", http.StatusBadRequest)
		return
	}

	// Check if the recipient's profile is public
	isPublic, err := database.IsProfilePublic(request.ReceiverId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	var response struct {
		Status string              `json:"status"`
		Chat   structs.DisplayChat `json:"chat,omitempty"`
	}

	// If the recipient's profile is public, automatically accept the follow request
	if isPublic {
		err = database.InsertFollowRequestAccepted(requesterId, request.ReceiverId, request.Type, request.Content)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}
		privateChat, err := database.CreateOrGetPrivateChat(requesterId, request.ReceiverId)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		response.Status = "accepted"
		response.Chat = structs.DisplayChat{
			ChatId:      privateChat.Id,
			Type:        "private",
			PrivateChat: privateChat,
		}
	} else {
		// If the recipient's profile is private, insert the follow request as pending
		// Check if there is an existing follow request
		status, err := database.GetFollowRequestStatus(requesterId, request.ReceiverId)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		if status == "pending" {
			http.Error(w, "Follow request already sent", http.StatusBadRequest)
			return
		}

		follower, _ := database.GetUserById(requesterId)

		notification := structs.Notification{
			RequesterId: requesterId,
			FirstName:   follower.FirstName,
			LastName:    follower.LastName,
			ReceiverId:  request.ReceiverId,
			Content:     "New follow request from",
			Type:        "follow_request",
			Status:      "pending",
		}
		database.InsertUserNotification(notification)
		sendNotificationViaWebSocket(notification)

		privateChat, err := database.CreateOrGetPrivateChat(requesterId, request.ReceiverId)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		response.Status = "pending"
		response.Chat = structs.DisplayChat{
			ChatId:      privateChat.Id,
			Type:        "private",
			PrivateChat: privateChat,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

func AcceptFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	recipientId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var request structs.Notification
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	status, err := database.GetFollowRequestStatus(request.RequesterId, recipientId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if status != "pending" {
		http.Error(w, "Invalid or already responded follow request", http.StatusBadRequest)
		return
	}

	err = database.RespondToFollowRequest(request.RequesterId, recipientId, "accepted")
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := struct {
		Message string `json:"message"`
	}{
		Message: "Follow request accepted",
	}

	// Add logic to send a notification to the requester
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
	}
}

func DeclineFollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	recipientId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var request structs.Notification
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	status, err := database.GetFollowRequestStatus(request.RequesterId, recipientId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	if status != "pending" {
		http.Error(w, "Invalid or already responded follow request", http.StatusBadRequest)
		return
	}

	err = database.RespondToFollowRequest(request.RequesterId, recipientId, "decline")
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	err = database.DeleteFollowRequest(request.RequesterId, recipientId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	response := struct {
		Message string `json:"message"`
	}{
		Message: "Follow request declined",
	}

	// Add logic to send a notification to the requester
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, "Failed to encode JSON response", http.StatusInternalServerError)
	}
}

func UnfollowRequestHandler(w http.ResponseWriter, r *http.Request) {
	requesterId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	vars := mux.Vars(r)
	receiverIdStr := vars["userId"]
	receiverId, err := strconv.Atoi(receiverIdStr)
	if err != nil {
		http.Error(w, "Invalid user ID", http.StatusBadRequest)
		return
	}

	// Delete the follow request from the SQL table
	err = database.DeleteFollowRequest(requesterId, receiverId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": true,
		"message": "Unfollowed successfully",
	})
}

func FollowRequestStatusHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	requesterId, _ := strconv.Atoi(vars["requesterId"])
	recipientId, _ := strconv.Atoi(vars["recipientId"])

	status, err := database.GetFollowRequestStatus(requesterId, recipientId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": status})
}
