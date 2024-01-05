package main

import (
	"fmt"
	"log"
	"net/http"
	"social-network/database"
	"social-network/handlers"

	"github.com/gorilla/mux"
	_ "github.com/mattn/go-sqlite3"
)

func main() {

	database.InitDB()

	r := mux.NewRouter()

	r.HandleFunc("/register", handlers.RegisterHandler).Methods("POST")
	r.HandleFunc("/login", handlers.LoginHandler).Methods("POST")
	r.HandleFunc("/user/info", handlers.ReadUserInfo).Methods("GET")
	r.HandleFunc("/post/{id}/comment/create", handlers.CreateComment).Methods("POST")
	r.HandleFunc("/profile/me", handlers.LoggedInUserProfileHandler).Methods("GET")
	r.HandleFunc("/profile/{id}", handlers.OtherUserProfileHandler).Methods("GET")
	r.HandleFunc("/logout", handlers.LogoutHandler)
	r.HandleFunc("/post/create", handlers.CreatePost).Methods("POST")
	r.HandleFunc("/post/get", handlers.ReadPosts).Methods("GET")
	r.HandleFunc("/message-websocket", handlers.MessageWebSocketHandler)
	r.HandleFunc("/chat-display", handlers.ChatDisplayHandler).Methods("GET")
	r.HandleFunc("/message-display", handlers.MessageHandler).Methods("GET")
	r.HandleFunc("/search", handlers.SearchUsersHandler).Methods("GET")
	r.HandleFunc("/search/followers", handlers.SearchFollowersHandler).Methods("GET")
	r.HandleFunc("/notification", handlers.WebSocketHandler)
	r.HandleFunc("/notifications/get", handlers.NotificationHandler).Methods("GET")

	//GROUPS
	r.HandleFunc("/group/create", handlers.CreateGroup).Methods("POST")
	r.HandleFunc("/group/get", handlers.ReadAllGroups).Methods("GET")
	r.HandleFunc("/group/{id}/get", handlers.GroupHandler).Methods("GET")
	r.HandleFunc("/group/{id}/post/create", handlers.CreateGroupPost).Methods("POST")
	r.HandleFunc("/group/{id}/post/get", handlers.ReadGroupPosts).Methods("GET")
	r.HandleFunc("/group/{groupId}/post/{postId}/comment/create", handlers.CreateCommentInGroup).Methods("POST")
	r.HandleFunc("/group/{id}/event/create", handlers.CreateGroupEvent).Methods("POST")
	r.HandleFunc("/group/{id}/event/get", handlers.ReadGroupEvents).Methods("GET")
	r.HandleFunc("/group/{id}/event/choice", handlers.SelectEventOption).Methods("POST")
	r.HandleFunc("/group/{id}/invite", handlers.InviteUsers).Methods("POST")
	r.HandleFunc("/group/{id}/invite/accept", handlers.AcceptInvitation).Methods("POST")
	r.HandleFunc("/group/{id}/invite/decline", handlers.DeclineInvitation).Methods("POST")
	r.HandleFunc("/group/{id}/join", handlers.SendJoinRequest).Methods("POST")
	r.HandleFunc("/group/{id}/leave", handlers.LeaveGroup).Methods("POST")
	r.HandleFunc("/group/{id}/join/accept", handlers.AcceptJoinRequest).Methods("POST")
	r.HandleFunc("/group/{id}/join/decline", handlers.DeclineJoinRequest).Methods("POST")

	//FOLLOW
	r.HandleFunc("/profile/me/requests", handlers.FetchFollowRequestHandler).Methods("GET")
	r.HandleFunc("/profile/{id}/following", handlers.FollowingHandler).Methods("GET")
	r.HandleFunc("/profile/{id}/followers", handlers.FollowersHandler).Methods("GET")
	r.HandleFunc("/is-following/{id}", handlers.IsFollowingHandler).Methods("GET")
	r.HandleFunc("/follow/status/{requesterId}/{recipientId}", handlers.FollowRequestStatusHandler).Methods("GET")
	r.HandleFunc("/follow/request", handlers.RequestHandler).Methods("POST")
	r.HandleFunc("/follow/accept-follow-request", handlers.AcceptFollowRequestHandler).Methods("POST")
	r.HandleFunc("/follow/decline-follow-request", handlers.DeclineFollowRequestHandler).Methods("POST")
	r.HandleFunc("/profile/privacy", handlers.UpdateProfilePrivacyHandler).Methods("PATCH")
	r.HandleFunc("/follow/unfollow/{userId}", handlers.UnfollowRequestHandler).Methods("DELETE")

	fs := http.FileServer(http.Dir("static/images"))
	r.PathPrefix("/static/images/").Handler(http.StripPrefix("/static/images/", fs))

	http.Handle("/", r)

	fmt.Printf("Open http://localhost:8080\nUse Ctrl+C to close the server\n")
	log.Fatal(http.ListenAndServe(":8080", nil))
}
