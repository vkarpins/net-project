package handlers

import (
	"encoding/json"
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"

	"golang.org/x/crypto/bcrypt"
)

func LoginHandler(w http.ResponseWriter, r *http.Request) {
	var requestData struct {
		LoginEmail    string `json:"loginEmail"`
		LoginPassword string `json:"loginPassword"`
	}

	err := json.NewDecoder(r.Body).Decode(&requestData)
	if err != nil {
		http.Error(w, "Bad request", http.StatusBadRequest)
		return
	}

	user, err := database.GetUserByEmail(requestData.LoginEmail)
	if err != nil {
		http.Error(w, "Can't get email from server error", http.StatusInternalServerError)
		return
	}

	if user == nil {
		http.Error(w, "Invalid email or password", http.StatusUnauthorized)
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(requestData.LoginPassword))
	if err != nil {
		http.Error(w, "Invalid password", http.StatusUnauthorized)
		return
	}

	err = database.DeleteUserFromSessions(user.Id)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}

	session := helpers.CreateSession(user.Id)

	response := structs.LoginResponse{
		UserId:     user.Id,
		Email:      user.Email,
		NickName:   user.Nickname,
		SessionId:  session.SessionToken,
		Expiration: session.Expiration,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
