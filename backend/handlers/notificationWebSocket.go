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

var notificationClients = make(map[int]*websocket.Conn)

func WebSocketHandler(w http.ResponseWriter, r *http.Request) {
	userId, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromURL)
	if !isAuthenticated {
		return
	}

	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %s\n", err)
		return
	}
	defer func() {
		conn.Close()
		delete(notificationClients, userId)
	}()

	if existingConn, ok := notificationClients[userId]; ok {
		existingConn.Close()
	}

	notificationClients[userId] = conn

	// Handle offline notifications if any
	offlineNotifications, err := database.GetOfflineGroupJoinRequestNotifications(userId)
	if err != nil {
		log.Println("Error fetching offline notifications:", err)
	} else {
		for _, notification := range offlineNotifications {
			sendNotificationViaWebSocket(notification)
		}
	}

	database.ClearOfflineGroupJoinRequestNotifications(userId)

	for {
		_, message, err := conn.ReadMessage()
		if err != nil {
			// Remove the WebSocket connection for the user when there is an error (e.g., user logs out)
			//log.Printf("WebSocket error: %s\n", err)
			break
		}
		processWebSocketMessage(userId, message)
	}
}

func sendNotification(userId int, notification structs.Notification) {
	if conn := getWebSocketConnection(userId); conn != nil {
		var err error
		if notification.Type == "follow_request" {
			notification, err = database.InsertUserNotification(notification)
			if err != nil {
				log.Println("Error inserting notification into database:", err)
				return
			}
		} else {
			notification, err = database.InsertGroupNotificaton(notification)
			if err != nil {
				log.Println("Error inserting notification into database:", err)
				return
			}
		}
		// notification.Status = "read"

		// User is online, send notification directly
		sendNotificationViaWebSocket(notification)
	} else {
		// User is offline, store notification in the database with "unread" status
		// notification.Status = "unread"
		if notification.Type == "follow_request" {
			_, err := database.InsertUserNotification(notification)
			if err != nil {
				log.Println("Error inserting notification into database:", err)
				return
			}
		} else {
			_, err := database.InsertGroupNotificaton(notification)
			if err != nil {
				log.Println("Error inserting notification into database:", err)
				return
			}
		}
	}
}

func processWebSocketMessage(ownerId int, message []byte) {
	var notification structs.Notification
	err := json.Unmarshal(message, &notification)
	if err != nil {
		log.Printf("Error decoding WebSocket message: %s\n", err)
		return
	}

	// Check if the connection is still open
	if conn := getWebSocketConnection(ownerId); conn != nil {
		switch notification.Type {
		case "join_request":
			processJoinRequestNotification(ownerId, notification)
		case "follow-request":
			processFollowRequestNotification(ownerId, notification)
		default:
			log.Printf("Unknown notification type: %s\n", notification.Type)
		}
	}
}

func processFollowRequestNotification(ownerId int, notification structs.Notification) {
	if notification.ReceiverId != ownerId {
		log.Printf("Invalid recipient for follow request notification")
		return
	}

	switch notification.Status {
	case "pending":
		log.Printf("Received follow request from user %d\n", notification.RequesterId)
		responseNotification := structs.Notification{
			RequesterId: notification.RequesterId,
			ReceiverId:  notification.ReceiverId,
			Content:     fmt.Sprintf("You have a new follow request from user %d", notification.RequesterId),
			Type:        "follow_request",
			Status:      "pending",
		}

		sendNotificationViaWebSocket(responseNotification)

	case "accepted":
		log.Printf("Follow request from user %d accepted\n", notification.RequesterId)

	case "declined":
		log.Printf("Follow request from user %d declined\n", notification.RequesterId)

	default:
		log.Printf("Unknown follow request status: %s\n", notification.Status)
	}
}

func processJoinRequestNotification(ownerId int, notification structs.Notification) {
	// Check if the owner is the intended recipient of the join request
	if notification.ReceiverId != ownerId {
		log.Printf("Invalid recipient for join request notification")
		return
	}

	// Process the join request based on its status
	switch notification.Status {
	case "pending":
		// Notify the group owner that there's a pending join request
		log.Printf("Received join request from user %d for group %d\n", notification.RequesterId, notification.GroupId)

		// Send a notification back to the user who sent the join request
		responseNotification := structs.Notification{
			RequesterId: ownerId,
			ReceiverId:  notification.RequesterId,
			GroupId:     notification.GroupId,
			Content:     "mystirious content",
			Type:        "join_request_response",
			Status:      "pending",
		}

		sendNotificationViaWebSocket(responseNotification)

	case "accepted":
		// Handle the case when the join request is accepted
		log.Printf("Join request from user %d accepted for group %d\n", notification.RequesterId, notification.GroupId)
	case "declined":
		// Handle the case when the join request is declined
		log.Printf("Join request from user %d declined for group %d\n", notification.RequesterId, notification.GroupId)
	default:
		log.Printf("Unknown join request status: %s\n", notification.Status)
	}
}

func sendNotificationViaWebSocket(notification structs.Notification) {
	notificationJSON, err := json.Marshal(notification)
	if err != nil {
		log.Println("Error encoding notification JSON:", err)
		return
	}
	recipientConn := getWebSocketConnection(notification.ReceiverId)
	if recipientConn == nil {
		log.Println("Recipient WebSocket connection not found")
		return
	}

	err = recipientConn.WriteMessage(websocket.TextMessage, notificationJSON)
	if err != nil {
		log.Println("Error sending notification:", err)
	}
}

func getWebSocketConnection(userID int) *websocket.Conn {
	return notificationClients[userID]
}
