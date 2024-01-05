package handlers

import (
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"
)

func LogoutHandler(w http.ResponseWriter, r *http.Request) {
	sessionToken := r.Header.Get("Authorization")
	_, isAuthenticated := helpers.AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
	if !isAuthenticated {
		return
	}

	err := database.DeleteSessionToken(sessionToken)
	if err != nil {
		http.Error(w, "Failed to logout, error 500", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
