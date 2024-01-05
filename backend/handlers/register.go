package handlers

import (
	"net/http"
	"social-network/database"
	"social-network/helpers"
	"social-network/structs"

	"golang.org/x/crypto/bcrypt"
)

func RegisterHandler(w http.ResponseWriter, r *http.Request) {
	var request structs.RegistrationRequest
	err := helpers.DecodeJSONBody(r, &request)
	if err != nil {
		http.Error(w, "Bad request, error 400", http.StatusBadRequest)
		return
	}
	if request.FirstName == "" || request.LastName == "" || request.Email == "" || request.Password == "" ||
		request.DateOfBirth == "" {
		http.Error(w, "All fields are required, error 400", http.StatusBadRequest)
		return
	}
	if !helpers.IsValidEmail(request.Email) {
		http.Error(w, "Invalid email format, error 400", http.StatusBadRequest)
		return
	}
	exists, err := database.CheckEmailIfExists(request.Email)
	if err != nil {
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	if exists {
		http.Error(w, "Email is already taken", http.StatusBadRequest)
		return
	}
	if len(request.DateOfBirth) != 10 {
		http.Error(w, "Invalid date of birth format, error 400", http.StatusBadRequest)
		return
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(request.Password), bcrypt.DefaultCost)
	if err != nil {
		http.Error(w, "Internal server error, error 500", http.StatusInternalServerError)
		return
	}
	//dateOfBirth := request.DateOfBirth
	isPrivate := false
	err = database.InsertUser(request.FirstName, request.LastName, request.Email, request.DateOfBirth, request.Nickname, request.Avatar, request.AboutMe, isPrivate, hashedPassword)
	if err != nil {
		http.Error(w, "Internal server error, , error 500", http.StatusInternalServerError)
		return
	}
}
