package helpers

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"regexp"
	"social-network/database"
	"social-network/structs"
	"strconv"

	"github.com/gorilla/mux"
)

func DecodeJSONBody(r *http.Request, v interface{}) error {
	defer r.Body.Close()
	if err := json.NewDecoder(r.Body).Decode(v); err != nil {
		fmt.Println(err)
		return err
	}
	return nil
}

func IsValidEmail(email string) bool {
	pattern := `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`
	regex := regexp.MustCompile(pattern)
	return regex.MatchString(email)
}

func AuthenticateUserAndGetId(w http.ResponseWriter, r *http.Request, tokenSource structs.TokenSource) (int, bool) {
	var sessionToken string

	if tokenSource == structs.TokenFromHeader {
		sessionToken = r.Header.Get("Authorization")
	} else if tokenSource == structs.TokenFromURL {
		sessionToken = r.URL.Query().Get("authorization")
	}

	userId, isAuthenticated := database.GetUserIdAndAuthStatus(sessionToken)
	if !isAuthenticated {
		http.Error(w, "Unauthorized 401", http.StatusUnauthorized)
		return 0, false
	}

	return userId, true
}

func GetUserIdFromRequest(r *http.Request) (int, error) {
	vars := mux.Vars(r)
	userIdFromURL := vars["id"]

	var userId int

	if userIdFromURL == "" {
		return 0, errors.New("no user ID in the URL")
	}

	userId, err := strconv.Atoi(userIdFromURL)
	if err != nil {
		return 0, fmt.Errorf("invalid user ID: %w", err)
	}

	return userId, nil
}

func DifBetweenLoggedInUserAndOtherUser(r *http.Request, w http.ResponseWriter) (int, bool) {
	userId, err := GetUserIdFromRequest(r)
	if err != nil {
		// If the user ID is not in the URL, authenticate and get the logged-in user's ID
		userId, isAuthenticated := AuthenticateUserAndGetId(w, r, structs.TokenFromHeader)
		if !isAuthenticated {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return 0, false
		}
		return userId, true
	}

	return userId, false
}

func ReturnMessageJSON(w http.ResponseWriter, message string, httpCode int, status string) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(httpCode)
    json.NewEncoder(w).Encode(structs.ErrorResponse{
        Status:  status,
        Message: message,
    })
}