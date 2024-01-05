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

func CreateGroupEvent(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var eventInfo structs.Event
	err := json.NewDecoder(r.Body).Decode(&eventInfo)

	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}
	if eventInfo.Name == "" || eventInfo.Description == "" {
		http.Error(w, "Add event name and description", http.StatusBadRequest)
		return
	}

	vars := mux.Vars(r)
	groupId, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "Invalid group ID", http.StatusBadRequest)
		return
	}
	eventInfo.GroupId = groupId
	eventInfo.CreatorId = userId

	group, err := database.ReadGroup(groupId)
	if err != nil {
		http.Error(w, "Group does not exist", http.StatusBadRequest)
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

	events, err := database.AddGroupEvent(eventInfo)
	if err != nil {
		http.Error(w, "Failed to create event", http.StatusInternalServerError)
		return
	}

	for _, user := range group.Members {
		notification := structs.Notification{
			RequesterId: userId,
			ReceiverId:  user,
			GroupId:     groupId,
			Content:     "Event was created in the group '" + group.Name + "'",
			Type:        "event",
			Status:      "",
		}
		sendNotification(user, notification)
	}
	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(events); err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
	}
}

func ReadGroupEvents(w http.ResponseWriter, r *http.Request) {
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
		helpers.ReturnMessageJSON(w, "You aren't a member of this group", http.StatusBadRequest, "error")
		return
	}

	groupEvents, err := database.ReadAllGroupEvents(userId, groupId)
	if err != nil {
		http.Error(w, fmt.Sprintf("Failed to retrieve group events: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(groupEvents)
}

func SelectEventOption(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	var eventOption structs.EventOption
	err := json.NewDecoder(r.Body).Decode(&eventOption)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	eventOption.UserId = userId
	err = database.AddEventOptionChoice(eventOption)
	if err != nil {
		http.Error(w, "Failed to save event choice", http.StatusInternalServerError)
		return
	}
	helpers.ReturnMessageJSON(w, "Event choice has been successfully saved!", http.StatusOK, "success")
}
