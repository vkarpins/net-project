package helpers

import (
	"fmt"
	"social-network/database"
	"social-network/structs"
	"time"

	"github.com/gofrs/uuid"
)

func CreateSession(userId int) structs.Session {
	token, err := uuid.NewV4()
	if err != nil {
		return structs.Session{}
	}
	session := structs.Session{
		UserId:       userId,
		SessionToken: token.String(),
		Expiration:   time.Now().Add(24 * time.Hour),
	}
	err = database.InsertSessionToken(session)
	if err != nil {
		fmt.Println("Error inserting sessiontoken to database", err)
	}
	return session
}
