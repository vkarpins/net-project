package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"

	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

var messageWebsocketClients = make(map[int]*websocket.Conn)

func MessageWebSocketHandler(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromURL)
	if !isAuthenticated {
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Print("upgrade failed: ", err)
		return
	}
	defer conn.Close()

	messageWebsocketClients[userId] = conn

	for {
		_, p, err := conn.ReadMessage()
		if err != nil {
			delete(messageWebsocketClients, userId)
			break
		}

		var chatMessage structs.ChatMessage
		if err := json.Unmarshal(p, &chatMessage); err != nil {
			fmt.Println("Error parsing received message:", err)
			continue
		}
		chatMessage.SenderId = userId

		message, _ := database.InsertChatMessage(chatMessage)

		sendMessageToUsers(message)
	}
}

func sendMessageToUsers(chatMessage structs.ChatMessage) {
	message, err := json.Marshal(chatMessage)
	if err != nil {
		fmt.Println("Error marshalling chat message:", err)
		return
	}

	if chatMessage.PrivateChatId != 0 {
		user1Id, user2Id, err := database.GetUserIdByPrivateChatId(chatMessage.PrivateChatId)
		if err != nil {
			fmt.Println("Error getting user IDs for private chat:", err)
			return
		}

		sendPrivateMessageToUser(user1Id, message)
		sendPrivateMessageToUser(user2Id, message)

	} else if chatMessage.GroupChatId != 0 {
		userIds, err := database.GetUserIdByGroupChatId(chatMessage.GroupChatId)
		if err != nil {
			fmt.Println("Error getting user IDs for group chat:", err)
			return
		}

		for _, userId := range userIds {
			sendPrivateMessageToUser(userId, message)
		}
	}
}

func sendPrivateMessageToUser(userId int, message []byte) {
	client, exists := messageWebsocketClients[userId]
	if exists {
		if err := client.WriteMessage(websocket.TextMessage, message); err != nil {
			fmt.Println("Error sending message to client:", err)
			delete(messageWebsocketClients, userId)
		}
	}
}
