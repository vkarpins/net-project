package database

import (
	"database/sql"
	"errors"
	"fmt"
	"log"
	"social-network/structs"
	"strconv"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/sqlite3"
	_ "github.com/golang-migrate/migrate/v4/source/file"

	_ "github.com/mattn/go-sqlite3"
)

var DB *sql.DB

func InitDB() {
	var err error
	absDBPath := "database/data.db"
	DB, err = sql.Open("sqlite3", absDBPath)
	if err != nil {
		log.Fatal(err)
	}

	migrationsDir := "file://database/migrations"

	m, err := migrate.New(migrationsDir, "sqlite3://"+absDBPath)
	if err != nil {
		log.Fatalf("migration initialization failed: %v", err)
	}

	if err := m.Up(); err != nil && err != migrate.ErrNoChange {
		log.Fatalf("migration failed: %v", err)
	} else if err == migrate.ErrNoChange {
		log.Println("No migrations to apply.")
	}
}

func InsertUser(firstName, lastName, email string, dateOfBirth string, nickname, avatar, aboutMe *string, isPrivate bool, hashedPassword []byte) error {
	stmt, err := DB.Prepare(`
        INSERT INTO users (first_name, last_name, date_of_birth, nickname, avatar, about_me, email, is_private, password)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
	if err != nil {
		return err
	}
	defer stmt.Close()

	// Handle optional fields
	var nick, av, about string
	if nickname != nil {
		nick = *nickname
	}
	if avatar != nil {
		av = *avatar
	}
	if aboutMe != nil {
		about = *aboutMe
	}

	_, err = stmt.Exec(firstName, lastName, dateOfBirth, nick, av, about, email, isPrivate, hashedPassword)
	if err != nil {
		return err
	}

	return nil
}

func InsertSessionToken(session structs.Session) error {
	stmt, err := DB.Prepare(`
		INSERT INTO sessions (user_id, session_token, expiration) 
		VALUES (?, ?, ?)
	`)
	if err != nil {
		return err
	}
	defer stmt.Close()

	_, err = stmt.Exec(session.UserId, session.SessionToken, session.Expiration)
	if err != nil {
		return err
	}

	return nil
}

func InsertComment(comment structs.Comment) (structs.Post, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO comments (post_id, user_id, user_avatar, creator_name, content, photo)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.Post{}, err
	}
	defer stmt.Close()

	_, err = stmt.Exec(comment.PostId, comment.UserId, comment.ProfilePicture, comment.CreatorName, comment.Content, comment.Photo)
	if err != nil {
		return structs.Post{}, err
	}

	var updatedPost structs.Post
	err = DB.QueryRow(`
		SELECT * FROM posts
		WHERE id = ?
	`, comment.PostId).Scan(&updatedPost.Id, &updatedPost.UserId, &updatedPost.ProfilePicture, &updatedPost.Title, &updatedPost.Content, &updatedPost.Photo, &updatedPost.Privacy)
	if err != nil {
		return structs.Post{}, err
	}
	updatedPost.Comments, err = ReadAllComments(comment.PostId)
	if err != nil {
		return structs.Post{}, err
	}

	return updatedPost, nil
}

func ReadAllComments(postId int) ([]structs.Comment, error) {
	comments := make([]structs.Comment, 0)
	rows, err := DB.Query(`
		SELECT *
		FROM comments
		WHERE post_id = ?
		ORDER BY id DESC
	`, postId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var comment structs.Comment
		err := rows.Scan(&comment.Id, &comment.PostId, &comment.UserId, &comment.ProfilePicture, &comment.CreatorName, &comment.Content, &comment.Photo)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	if len(comments) == 0 {
		return comments, nil
	}

	return comments, nil
}

func InsertChatMessage(chatMessage structs.ChatMessage) (structs.ChatMessage, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO chat_messages (sender_id, content, private_chat_id, group_chat_id)
		VALUES (?, ?, ?, ?)
	`)
	if err != nil {
		return structs.ChatMessage{}, err
	}
	defer stmt.Close()

	respFromDb, err2 := stmt.Exec(chatMessage.SenderId, chatMessage.Content, chatMessage.PrivateChatId, chatMessage.GroupChatId)
	if err2 != nil {
		return structs.ChatMessage{}, err2
	}

	id, _ := respFromDb.LastInsertId()
	chatMessage.Id = int(id)
	chatMessage.CreatedAt = time.Now()

	return chatMessage, nil
}

func CheckEmailIfExists(email string) (bool, error) {
	var count int
	err := DB.QueryRow(`
        SELECT COUNT(*) FROM users WHERE email = ?
    `, email).Scan(&count)
	if err != nil {
		return false, err
	}

	return count > 0, nil
}

func UpdateAvatar(userId int, avatarURL string) error {
	_, err := DB.Exec(`
		UPDATE users SET avatar = ? WHERE id = ?
	`, avatarURL, userId)
	if err != nil {
		return err
	}

	return nil
}

func GetUserIdAndAuthStatus(sessionToken string) (int, bool) {
	var (
		userId     int
		expiration time.Time
	)

	err := DB.QueryRow(`
		SELECT user_id, expiration FROM sessions WHERE session_token = ?
	`, sessionToken).Scan(&userId, &expiration)

	if err == sql.ErrNoRows || err != nil {
		return 0, false
	}

	if time.Now().After(expiration) {
		return 0, false
	}

	return userId, true
}

func GetUserByEmail(email string) (*structs.User, error) {
	var user structs.User
	err := DB.QueryRow(`
		SELECT * FROM users WHERE email = ?
	`, email).Scan(&user.Id, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.DateOfBirth, &user.Nickname, &user.Avatar, &user.AboutMe, &user.IsPrivate)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}

	return &user, nil
}

func GetUserNameById(userId int) (string, error) {
	var firstName, lastName string
	err := DB.QueryRow(`
        SELECT first_name, last_name FROM users WHERE id = ?
    `, userId).Scan(&firstName, &lastName)
	if err == sql.ErrNoRows {
		return "", nil
	} else if err != nil {
		return "", err
	}
	return firstName + " " + lastName, nil
}

func GetUserById(userId int) (*structs.User, error) {
	var user structs.User
	err := DB.QueryRow(`
		SELECT * FROM users WHERE ID = ?
	`, userId).Scan(&user.Id, &user.FirstName, &user.LastName, &user.Email, &user.Password, &user.DateOfBirth, &user.Nickname, &user.Avatar, &user.AboutMe, &user.IsPrivate)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	return &user, nil
}

func GetUserMainInfo(userId int) (*structs.User, error) {
	var user structs.User
	err := DB.QueryRow(`
		SELECT id, first_name, last_name, nickname, avatar, is_private FROM users WHERE id = ?
	`, userId).Scan(&user.Id, &user.FirstName, &user.LastName, &user.Nickname, &user.Avatar, &user.IsPrivate)
	if err == sql.ErrNoRows {
		return nil, nil
	} else if err != nil {
		return nil, err
	}
	rows, err := DB.Query(`
		SELECT group_id FROM group_members WHERE requester_id = ?
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []int
	for rows.Next() {
		var group int
		err := rows.Scan(&group)
		if err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}
	user.UserGroups = groups
	return &user, nil
}

func DeleteSessionToken(sessionToken string) error {
	_, err := DB.Exec(`
		DELETE FROM sessions 
		WHERE session_token = ?
	`, sessionToken)
	if err != nil {
		return err
	}

	return nil
}

func DeleteUserFromSessions(userId int) error {
	_, err := DB.Exec(`
		DELETE FROM sessions 
		WHERE user_id = ?
	`, userId)
	if err != nil {
		return err
	}

	return nil
}

func ReadAllPosts(userID int) ([]structs.Post, error) {
	posts := make([]structs.Post, 0)
	postedIDs := make(map[int]bool)
	rows, err := DB.Query(`
		SELECT p.id, p.user_id, p.user_avatar, p.title, p.content, p.photo, p.privacy
		FROM posts p
		LEFT JOIN user_following uf ON (p.user_id = uf.following_id OR p.user_id = uf.follower_id) AND uf.follower_id = ?
		WHERE (
			p.privacy = 'public' OR 
			(p.privacy = 'private' AND (uf.follower_id = ? OR p.user_id = ?)) OR 
			p.user_id = ? OR
			(p.privacy NOT LIKE 'private' AND p.privacy NOT LIKE 'public'))
		ORDER BY id DESC
	`, userID, userID, userID, "%"+strconv.Itoa(userID)+"%")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post structs.Post
		err := rows.Scan(&post.Id, &post.UserId, &post.ProfilePicture, &post.Title, &post.Content, &post.Photo, &post.Privacy)
		if err != nil {
			return nil, err
		}
		if _, exists := postedIDs[post.Id]; !exists {
			if post.UserId != userID {
				if post.Privacy != "public" && post.Privacy != "private" {
					chosenUsers := strings.Split(post.Privacy, ",")
					found := false
					for _, user := range chosenUsers {
						if user == strconv.Itoa(userID) {
							found = true
							break
						}
					}
					if !found {
						continue
					}
				}
			}
			if post.Privacy != "public" && post.Privacy != "private" {
				post.Privacy = "private"
			}
			post.Comments, err = ReadAllComments(post.Id)
			if err != nil {
				return nil, err
			}
			posts = append(posts, post)
			postedIDs[post.Id] = true
		}
	}
	if len(posts) == 0 {
		return posts, nil
	}
	return posts, nil
}

func GetPostsByUserId(userId int) ([]structs.Post, error) {
	posts := make([]structs.Post, 0)
	rows, err := DB.Query(`
		SELECT id, user_id, user_avatar, title, content, photo, privacy 
		FROM posts
		WHERE user_id = ?
		ORDER BY id DESC
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var post structs.Post
		err := rows.Scan(&post.Id, &post.UserId, &post.ProfilePicture, &post.Title, &post.Content, &post.Photo, &post.Privacy)
		if err == sql.ErrNoRows {
			return []structs.Post{}, nil
		} else if err != nil {
			return nil, err
		}
		post.Comments, err = ReadAllComments(post.Id)
		if err != nil {
			return nil, err
		}
		if post.Privacy != "public" && post.Privacy != "private" {
			post.Privacy = "private"
		}
		posts = append(posts, post)
	}
	return posts, nil
}

func GetGroupByUserId(userId int) ([]structs.Group, error) {
	groups := make([]structs.Group, 0)
	rows, err := DB.Query(`
		SELECT g.id, g.name, g.description, g.creator_id
		FROM groups g
		JOIN group_members gm ON g.id = gm.group_id
		WHERE gm.requester_id = ?
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var group structs.Group
		if err := rows.Scan(&group.Id, &group.Name, &group.Description, &group.CreatorId); err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}
	return groups, nil
}

func AddPost(post structs.Post) (structs.Post, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO posts (user_id, user_avatar, title, content, photo, privacy) 
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.Post{}, err
	}
	defer stmt.Close()

	respFromDb, err := stmt.Exec(post.UserId, post.ProfilePicture, post.Title, post.Content, post.Photo, post.Privacy)
	if err != nil {
		return structs.Post{}, err
	}

	id, err := respFromDb.LastInsertId()
	if err != nil {
		return structs.Post{}, err
	}

	var retrievedPost structs.Post
	err = DB.QueryRow(`
		SELECT * FROM posts
		WHERE id = ?
	`, id).Scan(&retrievedPost.Id, &retrievedPost.UserId, &retrievedPost.ProfilePicture, &retrievedPost.Title, &retrievedPost.Content, &retrievedPost.Photo, &retrievedPost.Privacy)
	if err != nil {
		return structs.Post{}, err
	}
	retrievedPost.Comments, err = ReadAllComments(post.Id)
	if err != nil {
		return structs.Post{}, err
	}
	if !(retrievedPost.Privacy == "public" || retrievedPost.Privacy == "private") {
		retrievedPost.Privacy = "private"
	}

	return retrievedPost, nil
}

func ReadAllGroups() ([]structs.Group, error) {
	groups := make([]structs.Group, 0)
	rows, err := DB.Query(`
		SELECT id, name, description, creator_id
		FROM groups
		ORDER BY id DESC
	`)
	if err != nil {
		return nil, fmt.Errorf("error querying the database: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var group structs.Group
		if err := rows.Scan(&group.Id, &group.Name, &group.Description, &group.CreatorId); err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		membRows, err := DB.Query(`
			SELECT requester_id
			FROM group_members
			WHERE group_id = ?
		`, group.Id)
		if err != nil {
			return nil, fmt.Errorf("error querying the database: %v", err)
		}
		defer rows.Close()
		var members []int
		for membRows.Next() {
			var member int
			if err := membRows.Scan(&member); err != nil {
				return nil, fmt.Errorf("error scanning row: %v", err)
			}
			members = append(members, member)
			group.Members = members
		}
		groups = append(groups, group)
	}

	if len(groups) == 0 {
		return groups, nil
	}

	return groups, nil
}

func ReadGroup(groupId int) (*structs.Group, error) {
	var group structs.Group
	err := DB.QueryRow(`
		SELECT id, name, description, creator_id
		FROM groups
		WHERE id = ?
	`, groupId).Scan(&group.Id, &group.Name, &group.Description, &group.CreatorId)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("no group found for ID: %d", groupId)
	} else if err != nil {
		return nil, fmt.Errorf("error fetching group details: %v", err)
	}

	rows, err := DB.Query(`
		SELECT requester_id
		FROM group_members
		WHERE group_id = ?
	`, groupId)
	if err != nil {
		return nil, fmt.Errorf("error querying the database: %v", err)
	}
	defer rows.Close()

	var members []int
	for rows.Next() {
		var member int
		if err := rows.Scan(&member); err != nil {
			return nil, fmt.Errorf("error scanning row: %v", err)
		}
		members = append(members, member)
	}
	if len(members) == 0 {
		return &group, nil
	}
	group.Members = members
	return &group, nil
}

func AddGroup(group structs.Group) (structs.Group, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO groups (name, description, creator_id) 
		VALUES (?, ?, ?)
	`)
	if err != nil {
		return structs.Group{}, fmt.Errorf("error preparing SQL statement: %v", err)
	}
	defer stmt.Close()

	result, err := stmt.Exec(group.Name, group.Description, group.CreatorId)
	if err != nil {
		return structs.Group{}, fmt.Errorf("error executing SQL statement: %v", err)
	}

	lastInsertID, err := result.LastInsertId()
	if err != nil {
		return structs.Group{}, fmt.Errorf("error getting last inserted ID: %v", err)
	}

	// Pass the lastInsertID to AddUserToGroup function
	if err := AddUserToGroup(group.CreatorId, int(lastInsertID)); err != nil {
		return structs.Group{}, fmt.Errorf("error adding user to group: %v", err)
	}

	var retrievedGroup structs.Group
	err = DB.QueryRow(`
		SELECT * FROM groups
		WHERE id = ?
	`, lastInsertID).Scan(&retrievedGroup.Id, &retrievedGroup.Name, &retrievedGroup.Description, &retrievedGroup.CreatorId)
	if err != nil {
		return structs.Group{}, err
	}
	return retrievedGroup, nil
}
func GetGroupOwner(groupID int) (int, error) {
	var ownerID int
	err := DB.QueryRow(`
		SELECT creator_id FROM groups
		WHERE id = ?
	`, groupID).Scan(&ownerID)
	if err != nil {
		return 0, fmt.Errorf("error getting group owner: %v", err)
	}
	return ownerID, nil
}

func GetJoinRequestStatus(requesterID, groupId int) (string, error) {
	var status string
	err := DB.QueryRow(`
		SELECT status FROM join_requests
		WHERE requester_id = ? AND group_id = ?
	`, requesterID, groupId).Scan(&status)
	if err != nil {
		if err == sql.ErrNoRows {
			return "", nil // No rows found, indicating no join request
		}
		return "", fmt.Errorf("database error: %v", err)
	}
	return status, nil
}

// InsertJoinRequest inserts a new join request
func InsertJoinRequest(requesterID, groupID int) error {
	stmt, err := DB.Prepare(`
        INSERT INTO join_requests (requester_id, group_id, status) 
        VALUES (?, ?, ?)
    `)
	if err != nil {
		return fmt.Errorf("error preparing SQL statement: %v", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(requesterID, groupID, "pending")
	if err != nil {
		return fmt.Errorf("error executing SQL statement: %v", err)
	}
	return nil
}

// RespondToJoinRequest updates the status of a join request
func RespondToJoinRequest(requesterID, groupID int, status, reqType string) error {
	_, err := DB.Exec(`
		UPDATE join_requests
		SET status = ?
		WHERE requester_id = ? AND group_id = ?
	`, status, requesterID, groupID)
	if err != nil {
		return fmt.Errorf("error updating join request status: %v", err)
	}
	if reqType == "join_request" {
		_, err = DB.Exec(`
		UPDATE group_notifications
		SET status = ?
		WHERE sender_id = ? AND group_id = ?
	`, status, requesterID, groupID)
	}
	if reqType == "invite_group_request" {
		_, err = DB.Exec(`
		UPDATE group_notifications
		SET status = ?
		WHERE receiver_id = ? AND group_id = ?
	`, status, requesterID, groupID)
	}
	if err != nil {
		return fmt.Errorf("error updating notification status: %v", err)
	}

	return nil
}

func AddUserToGroup(requesterID int, groupId int) error {
	stmt, err := DB.Prepare(`
        INSERT INTO group_members (group_id, requester_id) 
        VALUES (?, ?)
    `)
	if err != nil {
		return fmt.Errorf("failed to prepare statement: %v", err)
	}
	defer stmt.Close()

	result, err := stmt.Exec(groupId, requesterID)
	if err != nil {
		return fmt.Errorf("failed to execute statement: %v", err)
	}

	rowsAffected, _ := result.RowsAffected()
	fmt.Printf("Rows affected: %d\n", rowsAffected)

	return nil
}

func DeleteUserFromGroup(requesterID int, groupId int) error {
	_, err := DB.Exec(`
		DELETE FROM group_members 
		WHERE group_id = ? AND requester_id = ?
	`, groupId, requesterID)
	if err != nil {
		return err
	}
	_, err = DB.Exec(`
		DELETE FROM join_requests
		WHERE group_id = ? AND requester_id = ?
	`, groupId, requesterID)
	if err != nil {
		return err
	}
	return nil
}

func CheckUserIfMemberOfGroup(requesterID int, groupId int) (bool, error) {
	var count int
	err := DB.QueryRow(`
        SELECT COUNT(*) FROM group_members
		WHERE group_id = ? AND requester_id = ?
    `, groupId, requesterID).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("database error: %v", err)
	}

	return count > 0, nil
}

func ReadAllGroupPosts(groupId int) ([]structs.GroupPost, error) {
	posts := make([]structs.GroupPost, 0)
	rows, err := DB.Query(`
		SELECT id, group_id, user_id, user_avatar, title, content, photo
		FROM group_posts
		WHERE group_id = ?
		ORDER BY id DESC
	`, groupId)
	if err != nil {
		return nil, fmt.Errorf("error querying group posts: %v", err)
	}
	defer rows.Close()

	for rows.Next() {
		var post structs.GroupPost
		err := rows.Scan(&post.Id, &post.GroupId, &post.UserId, &post.ProfilePicture, &post.Title, &post.Content, &post.Photo)
		if err != nil {
			return nil, fmt.Errorf("error scanning group post rows: %v", err)
		}
		post.Comments, err = ReadAllGroupComments(post.Id, groupId)
		if err != nil {
			return nil, err
		}
		posts = append(posts, post)
	}
	if len(posts) == 0 {
		return posts, nil
	}

	return posts, nil
}

func AddGroupPost(post structs.GroupPost) (structs.GroupPost, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO group_posts (group_id, user_id, user_avatar, title, content, photo) 
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.GroupPost{}, err
	}
	defer stmt.Close()

	respFromDb, err := stmt.Exec(post.GroupId, post.UserId, post.ProfilePicture, post.Title, post.Content, post.Photo)
	if err != nil {
		return structs.GroupPost{}, err
	}

	id, err := respFromDb.LastInsertId()
	if err != nil {
		return structs.GroupPost{}, err
	}

	var retrievedPost structs.GroupPost
	err = DB.QueryRow(`
		SELECT * FROM group_posts
		WHERE id = ?
	`, id).Scan(&retrievedPost.Id, &retrievedPost.GroupId, &retrievedPost.UserId, &retrievedPost.ProfilePicture, &retrievedPost.Title, &retrievedPost.Content, &retrievedPost.Photo)
	if err != nil {
		return structs.GroupPost{}, err
	}
	retrievedPost.Comments, err = ReadAllGroupComments(retrievedPost.Id, retrievedPost.GroupId)
	if err != nil {
		return structs.GroupPost{}, err
	}

	return retrievedPost, nil
}

func InsertGroupComment(comment structs.GroupComment) (structs.GroupPost, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO group_comments (post_id, user_id, user_avatar, group_id, creator_name, content, photo)
		VALUES (?, ?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.GroupPost{}, err
	}
	defer stmt.Close()

	_, err = stmt.Exec(comment.PostId, comment.UserId, comment.ProfilePicture, comment.GroupId, comment.CreatorName, comment.Content, comment.Photo)
	if err != nil {
		return structs.GroupPost{}, err
	}

	var updatedGroupPost structs.GroupPost
	err = DB.QueryRow(`
		SELECT * FROM group_posts
		WHERE id = ? AND group_id = ?
	`, comment.PostId, comment.GroupId).Scan(&updatedGroupPost.Id, &updatedGroupPost.UserId, &updatedGroupPost.GroupId, &updatedGroupPost.ProfilePicture, &updatedGroupPost.Title, &updatedGroupPost.Content, &updatedGroupPost.Photo)
	if err != nil {
		return structs.GroupPost{}, err
	}
	updatedGroupPost.Comments, err = ReadAllGroupComments(comment.PostId, comment.GroupId)
	if err != nil {
		return structs.GroupPost{}, err
	}

	return updatedGroupPost, nil
}

func ReadAllGroupComments(postId, groupId int) ([]structs.GroupComment, error) {
	comments := make([]structs.GroupComment, 0)
	rows, err := DB.Query(`
		SELECT *
		FROM group_comments
		WHERE post_id = ? AND group_id = ?
		ORDER BY id DESC
	`, postId, groupId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var comment structs.GroupComment
		err := rows.Scan(&comment.Id, &comment.UserId, &comment.PostId, &comment.GroupId, &comment.ProfilePicture, &comment.CreatorName, &comment.Content, &comment.Photo)
		if err != nil {
			return nil, err
		}
		comments = append(comments, comment)
	}
	if len(comments) == 0 {
		return comments, nil
	}

	return comments, nil
}

func ReadAllGroupEvents(userId, groupId int) ([]structs.Event, error) {
	events := make([]structs.Event, 0)
	rows, err := DB.Query(`
		SELECT id, group_id, creator_id, name, description, time, options
		FROM group_events
		WHERE group_id = ?
		ORDER BY id DESC
	`, groupId)
	if err != nil {
		return nil, fmt.Errorf("error querying database: %v", err)
	}
	defer rows.Close()

	var options string
	for rows.Next() {
		var event structs.Event
		err := rows.Scan(&event.Id, &event.GroupId, &event.CreatorId, &event.Name, &event.Description, &event.Time, &options)
		if err != nil {
			return nil, fmt.Errorf("error scanning rows: %v", err)
		}
		event.Options = strings.Split(options, ",")
		event.ChosenOption = ReadChosenOptions(userId, event.Id)
		events = append(events, event)
	}
	if len(events) == 0 {
		return events, nil
	}
	return events, nil
}

func ReadChosenOptions(userId, eventId int) string {
	var chosenOption string
	err := DB.QueryRow(`
		SELECT option FROM group_event_choice
		WHERE user_id = ? AND event_id = ?
	`, userId, eventId).Scan(&chosenOption)
	if err != nil {
		return ""
	}
	return chosenOption
}

func AddGroupEvent(event structs.Event) (structs.Event, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO group_events (group_id, creator_id, name, description, time, options) 
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.Event{}, fmt.Errorf("error preparing SQL statement: %v", err)
	}
	defer stmt.Close()

	optionsString := strings.Join(event.Options, ",")

	respFromDb, err := stmt.Exec(event.GroupId, event.CreatorId, event.Name, event.Description, event.Time, optionsString)
	if err != nil {
		return structs.Event{}, fmt.Errorf("error executing SQL statement: %v", err)
	}

	id, err := respFromDb.LastInsertId()
	if err != nil {
		return structs.Event{}, err
	}

	var retrievedEvent structs.Event
	var options string
	err = DB.QueryRow(`
		SELECT * FROM group_events
		WHERE id = ?
	`, id).Scan(&retrievedEvent.Id, &retrievedEvent.GroupId, &retrievedEvent.CreatorId, &retrievedEvent.Name, &retrievedEvent.Description, &retrievedEvent.Time, &options)
	if err != nil {
		return structs.Event{}, err
	}
	retrievedEvent.Options = strings.Split(options, ",")
	return retrievedEvent, nil
}

func AddEventOptionChoice(eventOption structs.EventOption) error {
	stmt, err := DB.Prepare(`
		INSERT INTO group_event_choice (user_id, event_id, option) 
		VALUES (?, ?, ?)
	`)
	if err != nil {
		return fmt.Errorf("error preparing SQL statement: %v", err)
	}
	defer stmt.Close()

	_, err = stmt.Exec(eventOption.UserId, eventOption.EventId, eventOption.Option)
	if err != nil {
		return fmt.Errorf("error executing SQL statement: %v", err)
	}

	return nil
}

func GetUserIdByPrivateChatId(privateChatId int) (int, int, error) {
	var (
		user1Id int
		user2Id int
	)
	err := DB.QueryRow(`
		SELECT user1_id, user2_id FROM private_chat
		WHERE id = ?
	`, privateChatId).Scan(&user1Id, &user2Id)

	if err != nil {
		if err == sql.ErrNoRows {
			return 0, 0, nil
		}
		return 0, 0, err
	}

	return user1Id, user2Id, nil
}

func GetUserIdByGroupChatId(groupChatId int) ([]int, error) {
	rows, err := DB.Query(`
		SELECT requester_id FROM group_members
		WHERE group_id = ?
	`, groupChatId)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var userIds []int
	for rows.Next() {
		var userId int
		if err := rows.Scan(&userId); err != nil {
			return nil, err
		}
		userIds = append(userIds, userId)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return userIds, nil
}

func IsProfilePublic(userId int) (bool, error) {
	user, err := GetUserById(userId)
	if err != nil {
		return false, err
	}

	if user == nil {
		return false, nil
	}
	return !user.IsPrivate, nil
}

func CheckGroupNameIfExists(name string) (bool, error) {
	var count int
	err := DB.QueryRow(`
        SELECT COUNT(*) FROM groups WHERE name = ?
    `, name).Scan(&count)
	if err != nil {
		return false, fmt.Errorf("database error: %v", err)
	}

	return count > 0, nil
}

// FOLLOWING
func InsertFollowRequestAccepted(requesterId, recipientId int, notificationType, content string) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}
	_, err = tx.Exec(`
        INSERT INTO notifications (user_id, sender_id, type, content, status)
        VALUES (?, ?, ?, ?, 'accepted')
    `, requesterId, recipientId, notificationType, content)
	if err != nil {
		tx.Rollback()
		return err
	}

	err = InsertFollowRelation(tx, requesterId, recipientId)
	if err != nil {
		tx.Rollback() // rollback if error
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

func InsertFollowRelation(tx *sql.Tx, requesterId, recipientId int) error {
	_, err := tx.Exec(`
		INSERT INTO user_following (follower_id, following_id)
		VALUES (?, ?)
	`, requesterId, recipientId)
	if err != nil {
		return err
	}

	return nil
}

func FetchFollowRequests(recipientId int) ([]structs.Notification, error) {
	var requests []structs.Notification

	rows, err := DB.Query(`
        SELECT notifications.id, notifications.user_id, notifications.sender_id, users.first_name, users.last_name, notifications.status, notifications.content, notifications.type
        FROM notifications
        JOIN users ON users.id = notifications.sender_id
        WHERE notifications.user_id = ? AND notifications.type = 'follow_request' AND notifications.status = 'pending'
    `, recipientId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var req structs.Notification
		if err := rows.Scan(&req.Id, &req.ReceiverId, &req.RequesterId, &req.FirstName, &req.LastName, &req.Status, &req.Content, &req.Type); err != nil {
			return nil, err
		}
		requests = append(requests, req)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return requests, nil
}

func IsLoggedInUserFollowing(loggedInUserId, otherUserId int) (bool, error) {
	var exists int
	err := DB.QueryRow(`
		SELECT EXISTS(SELECT 1 FROM user_following WHERE follower_id = ? AND following_id = ?)
	`, loggedInUserId, otherUserId).Scan(&exists)

	if err != nil {
		return false, err
	}

	return exists == 1, nil
}

func GetFollowRequestStatus(requesterId, receiverId int) (string, error) {
	var status string
	err := DB.QueryRow(`
        SELECT status FROM notifications WHERE sender_id = ? AND user_id = ?
    `, requesterId, receiverId).Scan(&status)
	if err == sql.ErrNoRows {
		return "not_found", nil
	} else if err != nil {
		return "", err
	}
	return status, nil
}

func RespondToFollowRequest(requesterId, receiverId int, status string) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
        UPDATE notifications
        SET status = ?
        WHERE sender_id = ? AND user_id = ? AND status = 'pending'
    `, status, requesterId, receiverId)
	if err != nil {
		tx.Rollback()
		return err
	}

	if status == "accepted" {
		err = InsertFollowRelation(tx, requesterId, receiverId)
		if err != nil {
			tx.Rollback()
			return err
		}
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

func GetUserFollowing(loggedInUserId int) ([]structs.User, error) {
	var users []structs.User

	rows, err := DB.Query(`
		SELECT users.id, users.first_name, users.last_name, users.avatar FROM users 
		JOIN user_following ON users.id = user_following.following_id
		WHERE user_following.follower_id = ?
	`, loggedInUserId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user structs.User
		if err := rows.Scan(&user.Id, &user.FirstName, &user.LastName, &user.Avatar); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func GetUserFollowers(loggedInUserId int) ([]structs.User, error) {
	var users []structs.User

	rows, err := DB.Query(`
        SELECT users.id, users.first_name, users.last_name, users.avatar FROM users 
        JOIN user_following ON users.id = user_following.follower_id
        WHERE user_following.following_id = ?
    `, loggedInUserId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var user structs.User
		if err := rows.Scan(&user.Id, &user.FirstName, &user.LastName, &user.Avatar); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	return users, nil
}

func UpdateProfilePrivacy(userId int, isPrivate bool) error {
	_, err := DB.Exec(`
        UPDATE users SET is_private = ? WHERE id = ?
    `, isPrivate, userId)

	if err != nil {
		return errors.New("failed to update profile privacy setting")
	}

	return nil
}

func DeleteFollowRequest(requesterId, recipientId int) error {
	tx, err := DB.Begin()
	if err != nil {
		return err
	}

	_, err = tx.Exec(`
	        DELETE FROM notifications
	        WHERE sender_id = ? AND user_id = ?
	    `, requesterId, recipientId)
	if err != nil {
		tx.Rollback() // Rollback in case of error
		return err
	}

	err = DeleteFromFollowing(tx, requesterId, recipientId)
	if err != nil {
		tx.Rollback() // rollback if error
		return err
	}

	err = tx.Commit()
	if err != nil {
		return err
	}

	return nil
}

func DeleteFromFollowing(tx *sql.Tx, requesterId, recipientId int) error {
	_, err := tx.Exec(`
        DELETE FROM user_following
        WHERE (follower_id = ? AND following_id = ?) OR (following_id = ? AND follower_id = ?)
    `, requesterId, recipientId, recipientId, requesterId)
	if err != nil {
		tx.Rollback()
		return err
	}

	return nil
}

// CHATS
func CreateOrGetPrivateChat(user1Id, user2Id int) (*structs.PrivateChat, error) {
	var chat structs.PrivateChat
	err := DB.QueryRow(`
        SELECT id, user1_id, user2_id FROM private_chat 
        WHERE (user1_id = ? AND user2_id = ?) OR (user1_id = ? AND user2_id = ?)`,
		user1Id, user2Id, user2Id, user1Id).Scan(&chat.Id, &chat.User1Id, &chat.User2Id)

	if err == sql.ErrNoRows {
		// Chat does not exist, create it
		_, err = DB.Exec(`INSERT INTO private_chat (user1_id, user2_id) VALUES (?, ?)`, user1Id, user2Id)
		if err != nil {
			return nil, err
		}
		err = DB.QueryRow(`SELECT last_insert_rowid()`).Scan(&chat.Id)
		if err != nil {
			return nil, err
		}
		chat.User1Id = user1Id
		chat.User2Id = user2Id
	} else if err != nil {
		return nil, err
	}

	return &chat, nil
}

func GetPrivateChats(userId int) ([]structs.DisplayChat, error) {
	var displayChats []structs.DisplayChat

	rows, err := DB.Query(`
		SELECT 
			pc.id AS chat_id, 
			pc.user1_id, 
			pc.user2_id, 
			(u1.first_name || ' ' || u1.last_name) AS user1_fullname, 
			(u2.first_name || ' ' || u2.last_name) AS user2_fullname,
			u1.avatar AS user1_avatar,
			u2.avatar AS user2_avatar,
			cm.content AS last_message_content,
			cm.created_at AS last_message_created_at
		FROM 
			private_chat pc
		JOIN 
			users u1 ON u1.id = pc.user1_id 
		JOIN 
			users u2 ON u2.id = pc.user2_id 
		LEFT JOIN 
			chat_messages cm ON cm.id = (
				SELECT MAX(id) FROM chat_messages WHERE private_chat_id = pc.id
			)
		WHERE 
			pc.user1_id = ? OR pc.user2_id = ?
	`, userId, userId)

	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var displayChat structs.DisplayChat
		var privateChat structs.PrivateChat
		var lastMessageContent sql.NullString
		var lastMessageCreatedAt sql.NullTime

		err := rows.Scan(&displayChat.ChatId, &privateChat.User1Id, &privateChat.User2Id, &privateChat.User1FullName, &privateChat.User2FullName, &privateChat.User1Avatar, &privateChat.User2Avatar, &lastMessageContent, &lastMessageCreatedAt)
		if err != nil {
			return nil, err
		}
		if lastMessageContent.Valid && lastMessageCreatedAt.Valid {
			privateChat.LastMessage.Content = lastMessageContent.String
			privateChat.LastMessage.CreatedAt = lastMessageCreatedAt.Time
		}

		displayChat.Type = "private"
		displayChat.PrivateChat = &privateChat
		displayChats = append(displayChats, displayChat)
	}

	return displayChats, nil
}

func GetGroupChats(userId int) ([]structs.DisplayChat, error) {
	var displayChats []structs.DisplayChat

	rows, err := DB.Query(`
		SELECT 
			gm.group_id,
			g.name AS group_name,
			cm.content AS last_message_content,
			cm.created_at AS last_message_created_at
		FROM 
			group_members gm
		JOIN 
			groups g ON g.id = gm.group_id
		LEFT JOIN 
			chat_messages cm ON cm.id = (
				SELECT MAX(id) FROM chat_messages WHERE group_chat_id = gm.group_id
			)
		WHERE 
			gm.requester_id = ?
		`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var groupId int
		var groupName string
		var lastMessageContent sql.NullString
		var lastMessageCreatedAt sql.NullTime
		err := rows.Scan(&groupId, &groupName, &lastMessageContent, &lastMessageCreatedAt)
		if err != nil {
			return nil, err
		}

		memberRows, err := DB.Query(`
            SELECT 
                u.id,
                u.first_name,
                u.last_name
            FROM 
                users u
            JOIN 
                group_members gm ON gm.requester_id = u.id
            WHERE 
                gm.group_id = ?
        `, groupId)
		if err != nil {
			return nil, err
		}
		defer memberRows.Close()

		var members []structs.User
		for memberRows.Next() {
			var member structs.User
			if err := memberRows.Scan(&member.Id, &member.FirstName, &member.LastName); err != nil {
				return nil, err
			}
			members = append(members, member)
		}

		var groupChat structs.GroupChat
		groupChat.GroupId = groupId
		groupChat.GroupName = groupName
		groupChat.Members = members
		if lastMessageContent.Valid && lastMessageCreatedAt.Valid {
			groupChat.LastMessage.Content = lastMessageContent.String
			groupChat.LastMessage.CreatedAt = lastMessageCreatedAt.Time
		}

		var displayChat structs.DisplayChat
		displayChat.Type = "group"
		displayChat.GroupChat = &groupChat
		displayChat.ChatId = groupId
		displayChats = append(displayChats, displayChat)
	}

	return displayChats, nil
}

func GetMessagesForUser(chatId int, chatType string) ([]structs.ChatMessage, error) {
	var messages []structs.ChatMessage

	var query string
	if chatType == "private" {
		query = `
			SELECT m.id, m.sender_id, m.content, m.created_at, m.private_chat_id, u.avatar
			FROM chat_messages m
			INNER JOIN users u ON m.sender_id = u.id
			WHERE m.private_chat_id = ?
		`
	} else if chatType == "group" {
		query = `
			SELECT m.id, m.sender_id, m.content, m.created_at, m.group_chat_id, u.avatar
			FROM chat_messages m
			INNER JOIN users u ON m.sender_id = u.id
			WHERE m.group_chat_id = ?
		`
	} else {
		return nil, errors.New("invalid chat type")
	}

	rows, err := DB.Query(query, chatId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var message structs.ChatMessage
		if chatType == "private" {
			if err := rows.Scan(&message.Id, &message.SenderId, &message.Content, &message.CreatedAt, &message.PrivateChatId, &message.Avatar); err != nil {
				return nil, err
			}
		} else if chatType == "group" {
			if err := rows.Scan(&message.Id, &message.SenderId, &message.Content, &message.CreatedAt, &message.GroupChatId, &message.Avatar); err != nil {
				return nil, err
			}
		}
		messages = append(messages, message)
	}

	return messages, nil
}

// SEARCH

func SearchUsers(query string, loggedInUserId int) ([]structs.User, error) {
	query = strings.ToLower(query)
	searchQuery := query + "%"

	rows, err := DB.Query(`
		SELECT id, first_name, last_name, email, nickname, avatar
		FROM users
		WHERE (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(nickname) LIKE ?)
		AND id != ?
	`, searchQuery, searchQuery, searchQuery, loggedInUserId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []structs.User
	for rows.Next() {
		var user structs.User
		if err := rows.Scan(&user.Id, &user.FirstName, &user.LastName, &user.Email, &user.Nickname, &user.Avatar); err != nil {
			return nil, err
		}
		users = append(users, user)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return users, nil
}

func SearchFollowers(query string, loggedInUserId int) ([]structs.User, error) {
	query = strings.ToLower(query)
	searchQuery := query + "%"
	rows, err := DB.Query(`
		SELECT id, first_name, last_name, email, nickname, avatar
		FROM users u
		JOIN user_following uf ON u.id = uf.following_id OR u.id = uf.follower_id
		WHERE (LOWER(first_name) LIKE ? OR LOWER(last_name) LIKE ? OR LOWER(nickname) LIKE ?)
		AND id != ? AND uf.following_id = ?
	`, searchQuery, searchQuery, searchQuery, loggedInUserId, loggedInUserId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var users []structs.User
	for rows.Next() {
		var user structs.User
		if err := rows.Scan(&user.Id, &user.FirstName, &user.LastName, &user.Email, &user.Nickname, &user.Avatar); err != nil {
			return nil, err
		}
		users = append(users, user)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}
	return users, nil
}

func SearchGroup(query string) ([]structs.Group, error) {
	query = strings.ToLower(query)
	searchQuery := query + "%"

	rows, err := DB.Query(`
		SELECT id, name
		FROM groups
		WHERE LOWER(name) LIKE ?
	`, searchQuery)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var groups []structs.Group
	for rows.Next() {
		var group structs.Group
		if err := rows.Scan(&group.Id, &group.Name); err != nil {
			return nil, err
		}
		groups = append(groups, group)
	}

	if err := rows.Err(); err != nil {
		return nil, err
	}

	return groups, nil
}

// NOTIFICATIONS
func InsertUserNotification(notification structs.Notification) (structs.Notification, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO notifications (user_id, sender_id, type, content, status)
		VALUES (?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.Notification{}, err
	}
	defer stmt.Close()

	respFromDb, err2 := stmt.Exec(notification.ReceiverId, notification.RequesterId, notification.Type, notification.Content, notification.Status)
	if err2 != nil {
		return structs.Notification{}, err2
	}

	id, _ := respFromDb.LastInsertId()
	notification.Id = int(id)

	return notification, nil
}

// retrieves offline group join request notifications for a user.
func GetOfflineGroupJoinRequestNotifications(userId int) ([]structs.Notification, error) {
	rows, err := DB.Query(`
        SELECT id, receiver_id, sender_id, group_id, type, content, status
        FROM group_notifications
        WHERE receiver_id = ? AND type = 'join_request' AND status = 'unread'
    `, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var notifications []structs.Notification
	for rows.Next() {
		var notif structs.Notification
		if err := rows.Scan(&notif.Id, &notif.ReceiverId, &notif.RequesterId, &notif.GroupId, &notif.Type, &notif.Content, &notif.Status); err != nil {
			return nil, err
		}
		notifications = append(notifications, notif)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

// clears offline group join request notifications for a user.
func ClearOfflineGroupJoinRequestNotifications(userId int) error {
	_, err := DB.Exec(`
        UPDATE group_notifications SET status = 'read'
        WHERE receiver_id = ? AND type = 'join_request' AND status = 'unread'
    `, userId)
	return err
}

func GetGroupNotifications(userId int) ([]structs.Notification, error) {
	var notifications []structs.Notification

	rows, err := DB.Query(`
		SELECT *
		FROM group_notifications
		WHERE receiver_id = ?
		ORDER BY id DESC
	`, userId)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var notif structs.Notification
		if err := rows.Scan(&notif.Id, &notif.RequesterId, &notif.ReceiverId, &notif.GroupId, &notif.Content, &notif.Type, &notif.Status); err != nil {
			return nil, err
		}
		notifications = append(notifications, notif)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	return notifications, nil
}

func InsertGroupNotificaton(notification structs.Notification) (structs.Notification, error) {
	stmt, err := DB.Prepare(`
		INSERT INTO group_notifications (receiver_id, sender_id, group_id, content, type, status)
		VALUES (?, ?, ?, ?, ?, ?)
	`)
	if err != nil {
		return structs.Notification{}, err
	}
	defer stmt.Close()

	respFromDb, err2 := stmt.Exec(notification.ReceiverId, notification.RequesterId, notification.GroupId, notification.Content, notification.Type, notification.Status)
	if err2 != nil {
		return structs.Notification{}, err2
	}

	id, _ := respFromDb.LastInsertId()
	notification.Id = int(id)

	return notification, nil
}
