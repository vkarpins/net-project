package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
	"strconv"
)

func ChatDisplayHandler(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}
	userInfo, err := database.GetUserById(userId)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	displayPrivateChats, err := database.GetPrivateChats(userId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	displayGroupChats, err := database.GetGroupChats(userId)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}
	allChats := append(displayPrivateChats, displayGroupChats...)

	response := struct {
		Chats    []structs.DisplayChat `json:"chats"`
		UserInfo structs.User          `json:"userInfo"`
	}{
		Chats:    allChats,
		UserInfo: *userInfo,
	}

	chatsJson, err := json.Marshal(response)
	if err != nil {
		http.Error(w, "Internal Server Error", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(chatsJson)
}

func MessageHandler(w http.ResponseWriter, r *http.Request) {
	_, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	chatIdStr := r.URL.Query().Get("chatId")
	chatType := r.URL.Query().Get("chatType")
	chatId, err := strconv.Atoi(chatIdStr)
	if err != nil {
		http.Error(w, "Invalid chat ID", http.StatusBadRequest)
		return
	}

	messages, err := database.GetMessagesForUser(chatId, chatType)
	if err != nil {
		http.Error(w, "Failed to fetch messages", http.StatusInternalServerError)
		return
	}

	jsonMessages, err := json.Marshal(messages)
	if err != nil {
		http.Error(w, "Failed to parse messages", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write(jsonMessages)
}
