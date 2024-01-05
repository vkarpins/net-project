package handlers

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
	"strconv"
	"strings"

	"github.com/gorilla/mux"
)

func CreateGroup(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var creationGroupInfo structs.Group
	err := json.NewDecoder(r.Body).Decode(&creationGroupInfo)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
	}
	if creationGroupInfo.Name == "" || creationGroupInfo.Description == "" {
		http.Error(w, "Add group name and description", http.StatusBadRequest)
		return
	}

	exists, err := database.CheckGroupNameIfExists(creationGroupInfo.Name)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if exists {
		helpers.ReturnMessageJSON(w, "Group name is already taken", http.StatusBadRequest, "error")
		return
	}

	creationGroupInfo.CreatorId = userId

	groups, err := database.AddGroup(creationGroupInfo)
	if err != nil {
		http.Error(w, "Failed to create group", http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(groups); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
}

func ReadAllGroups(w http.ResponseWriter, r *http.Request) {
	_, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	groups, err := database.ReadAllGroups()
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groups)
}

func GroupHandler(w http.ResponseWriter, r *http.Request) {
	_, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	vars := mux.Vars(r)
	groupId, _ := strconv.Atoi(vars["id"])

	group, err := database.ReadGroup(groupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch group details: %v", err), http.StatusInternalServerError)
		return
	}
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(group)
}

func SendJoinRequest(w http.ResponseWriter, r *http.Request) {
	requesterID, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	UserInfo, err := database.GetUserMainInfo(requesterID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	creatorName := ""
	if UserInfo.Nickname == "" {
		creatorName = UserInfo.FirstName + " " + UserInfo.LastName
	} else {
		creatorName = UserInfo.Nickname
	}

	groupID, err := ExtractGroupId(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error extracting group ID: %v", err), http.StatusBadRequest)
		return
	}

	// Check if the group exists
	group, err := database.ReadGroup(groupID)
	if err != nil {
		http.Error(w, "Group does not exist", http.StatusBadRequest)
		return
	}

	// Check if the requester is already a member of the group
	isMember, err := database.CheckUserIfMemberOfGroup(requesterID, groupID)
	if err != nil {
		http.Error(w, "Internal server error, can't check CheckUserIfMemberOfGroup", http.StatusInternalServerError)
		return
	}
	if isMember {
		http.Error(w, "You're already a member of this group", http.StatusBadRequest)
		return
	}

	// Get the owner of the group
	groupOwnerID, err := database.GetGroupOwner(groupID)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error getting group owner: %v", err), http.StatusInternalServerError)
		return
	}

	// Check if a join request already exists
	existingStatus, err := database.GetJoinRequestStatus(requesterID, groupID)
	if err != nil {
		http.Error(w, "Internal server error, GetJoinRequestStatus", http.StatusInternalServerError)
		return
	}

	if existingStatus == "pending" {
		helpers.ReturnMessageJSON(w, "Join request is already sent", http.StatusBadRequest, "error")
		return
	} else if existingStatus == "declined" {
		helpers.ReturnMessageJSON(w, "Your request has already been declined", http.StatusBadRequest, "error")
		return
	}

	// Create a new join request only if the group exists
	err = database.InsertJoinRequest(requesterID, groupID)
	if err != nil {
		helpers.ReturnMessageJSON(w, err.Error(), http.StatusBadRequest, "error")
		return
	}

	// Send a notification to the group owner
	notification := structs.Notification{
		RequesterId: requesterID,
		ReceiverId:  groupOwnerID,
		GroupId:     groupID,
		Content:     creatorName + " requested to join your group '" + group.Name + "'",
		Type:        "join_request",
		Status:      "pending",
	}

	// Send the notification via WebSocket
	sendNotification(groupOwnerID, notification)
	helpers.ReturnMessageJSON(w, "Join request is sent successfully!", http.StatusOK, "success")
}

func ExtractGroupId(r *http.Request) (int, error) {
	vars := mux.Vars(r)
	fmt.Println("Raw URL:", r.URL.String()) // Print the raw URL
	fmt.Println("Vars:", vars)              // Print the extracted parameters

	groupIdStr, ok := vars["id"]
	if !ok {
		return 0, errors.New("group ID not found in URL parameters")
	}

	groupId, err := strconv.Atoi(groupIdStr)
	if err != nil {
		return 0, fmt.Errorf("error converting group ID to integer: %v", err)
	}

	return groupId, nil
}

func AcceptJoinRequest(w http.ResponseWriter, r *http.Request) {
	groupOwnerId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	groupId, err := ExtractGroupId(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error extracting group ID: %v", err), http.StatusBadRequest)
		return
	}

	// Check if the user is the owner of the group
	group, err := database.ReadGroup(groupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch group details: %v", err), http.StatusInternalServerError)
		return
	}

	if group.CreatorId != groupOwnerId {
		http.Error(w, "You are not the owner of this group", http.StatusForbidden)
		return
	}

	var request structs.JoinRequest
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	// Update the status of the join request to "accepted"
	err = database.RespondToJoinRequest(request.RequesterId, groupId, "accepted", "join_request")
	if err != nil {
		helpers.ReturnMessageJSON(w, err.Error(), http.StatusBadRequest, "error")
		return
	}

	// Add the user to the group members
	err = database.AddUserToGroup(request.RequesterId, groupId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Send a notification to the user who sent the join request
	notification := structs.Notification{
		RequesterId: groupOwnerId,
		ReceiverId:  request.RequesterId,
		GroupId:     groupId,
		Content:     "You joined " + group.Name + " group",
		Type:        "join_request",
		Status:      "accepted",
	}

	// Send the notification via WebSocket
	sendNotification(request.RequesterId, notification)
	helpers.ReturnMessageJSON(w, "Join request is accepted", http.StatusOK, "success")

	log.Printf("Join request is accepted - RequesterID: %d, GroupID: %d", request.RequesterId, groupId)
}

func DeclineJoinRequest(w http.ResponseWriter, r *http.Request) {
	groupOwnerId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	groupId, err := ExtractGroupId(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error extracting group ID: %v", err), http.StatusBadRequest)
		return
	}

	// Check if the user is the owner of the group
	group, err := database.ReadGroup(groupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch group details: %v", err), http.StatusInternalServerError)
		return
	}

	if group.CreatorId != groupOwnerId {
		helpers.ReturnMessageJSON(w, "You are not the owner of this group", http.StatusForbidden, "error")
		return
	}

	var request structs.JoinRequest
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	// Update the status of the join request to "declined"
	err = database.RespondToJoinRequest(request.RequesterId, groupId, "declined", "join_request")

	if err != nil {
		helpers.ReturnMessageJSON(w, err.Error(), http.StatusBadRequest, "error")
		return
	}

	// Send a notification to the user who sent the join request
	notification := structs.Notification{
		RequesterId: groupOwnerId,
		ReceiverId:  request.RequesterId,
		GroupId:     groupId,
		Content:     "Owner " + group.Name + " group reject your request",
		Type:        "join_request",
		Status:      "declined",
	}

	// Send the notification via WebSocket
	sendNotification(request.RequesterId, notification)
	helpers.ReturnMessageJSON(w, "Join request is declined", http.StatusOK, "success")
}

func LeaveGroup(w http.ResponseWriter, r *http.Request) {
	requesterId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	groupId, err := ExtractGroupId(r)
	if err != nil {
		http.Error(w, fmt.Sprintf("Error extracting group ID: %v", err), http.StatusBadRequest)
		return
	}

	// Check if the requester is a member of the group
	isMember, err := database.CheckUserIfMemberOfGroup(requesterId, groupId)
	if err != nil {
		http.Error(w, "Internal server error, can't check CheckUserIfMemberOfGroup", http.StatusInternalServerError)
		return
	}

	if isMember {
		err = database.DeleteUserFromGroup(requesterId, groupId)
		if err != nil {
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		helpers.ReturnMessageJSON(w, "You have left the group", http.StatusOK, "success")
	}
}

func InviteUsers(w http.ResponseWriter, r *http.Request) {
	requesterID, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}
	var request structs.InviteUsers
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	group, err := database.ReadGroup(request.GroupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch group details: %v", err), http.StatusInternalServerError)
		return
	}
	// Check if the requester is a member of the group
	isMember, err := database.CheckUserIfMemberOfGroup(requesterID, request.GroupId)
	if err != nil {
		http.Error(w, "Internal server error, can't check CheckUserIfMemberOfGroup", http.StatusInternalServerError)
		return
	}
	if !isMember {
		helpers.ReturnMessageJSON(w, "You aren't a member of this group", http.StatusBadRequest, "error")
		return
	}

	errorResponse := make(map[int]string)
	alreadyMember := []int{}
	for _, user := range request.UsersId {
		isMember, err := database.CheckUserIfMemberOfGroup(user, request.GroupId)
		if err != nil {
			http.Error(w, "Internal server error, can't check CheckUserIfMemberOfGroup", http.StatusInternalServerError)
			continue
		}
		if isMember {
			alreadyMember = append(alreadyMember, user)
		}
		if !isMember {
			existingStatus, err := database.GetJoinRequestStatus(user, request.GroupId)
			if err != nil {
				http.Error(w, "Internal server error, GetJoinRequestStatus", http.StatusInternalServerError)
				return
			}
			if existingStatus == "pending" {
				errorResponse[user] = " has already been invited to the group or has requested to join. "
			} else if existingStatus == "declined" {
				errorResponse[user] = " declined invitation to the group or the owner declined the request to join for this user. "
			} else {
				err = database.InsertJoinRequest(user, request.GroupId)
				if err != nil {
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					continue
				}
				// Send a notification to the group owner
				notification := structs.Notification{
					RequesterId: requesterID,
					ReceiverId:  user,
					GroupId:     request.GroupId,
					Content:     "You were invited to the group '" + group.Name + "'",
					Type:        "invite_group_request",
					Status:      "pending",
				}
				// Send the notification via WebSocket
				sendNotification(user, notification)
			}
		}

	}

	if len(errorResponse) == 0 && len(alreadyMember) == 0 {
		helpers.ReturnMessageJSON(w, "Group invitation sent successfully", http.StatusOK, "success")
	} else {
		responseString := ""
		for user, issue := range errorResponse {
			UserInfo, err := database.GetUserMainInfo(user)
			if err != nil {
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				continue
			}
			responseString = responseString + UserInfo.FirstName + " " + UserInfo.LastName + issue
		}
		if len(alreadyMember) != 0 {
			responseArray := []string{}
			for _, user := range alreadyMember {
				UserInfo, err := database.GetUserMainInfo(user)
				if err != nil {
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					continue
				}
				responseArray = append(responseArray, UserInfo.FirstName+" "+UserInfo.LastName)
			}
			responseString = responseString + " " + strings.Join(responseArray, ", ") + " already member(s) of this group."
		}
		helpers.ReturnMessageJSON(w, responseString, http.StatusOK, "success")
	}
}

func AcceptInvitation(w http.ResponseWriter, r *http.Request) {
	userID, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	UserInfo, err := database.GetUserMainInfo(userID)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	creatorName := ""
	if UserInfo.Nickname == "" {
		creatorName = UserInfo.FirstName + " " + UserInfo.LastName
	} else {
		creatorName = UserInfo.Nickname
	}

	var request structs.JoinRequest
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	// Check if the user is the owner of the group
	group, err := database.ReadGroup(request.GroupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to fetch group details: %v", err), http.StatusInternalServerError)
		return
	}
	// Update the status of the join request to "accepted"
	err = database.RespondToJoinRequest(userID, request.GroupId, "accepted", "invite_group_request")
	if err != nil {
		helpers.ReturnMessageJSON(w, err.Error(), http.StatusBadRequest, "error")
		return
	}

	// Add the user to the group members
	err = database.AddUserToGroup(userID, request.GroupId)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	// Send a notification to the user who sent the join request
	notification := structs.Notification{
		ReceiverId: group.CreatorId,
		GroupId:    request.GroupId,
		Content:    creatorName + " joined your " + group.Name + " group",
		Type:       "invite_group_request",
		Status:     "accepted",
	}

	// Send the notification via WebSocket
	sendNotification(request.RequesterId, notification)
	helpers.ReturnMessageJSON(w, "Join request is accepted", http.StatusOK, "success")
}

func DeclineInvitation(w http.ResponseWriter, r *http.Request) {
	userID, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var request structs.JoinRequest
	if err := helpers.DecodeJSONBody(r, &request); err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}

	// Update the status of the join request to "accepted"
	err := database.RespondToJoinRequest(userID, request.GroupId, "declined", "invite_group_request")
	if err != nil {
		helpers.ReturnMessageJSON(w, err.Error(), http.StatusBadRequest, "error")
		return
	}

	helpers.ReturnMessageJSON(w, "Join request is declined", http.StatusOK, "success")
}
