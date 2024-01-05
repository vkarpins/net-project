package structs

import "time"

type TokenSource int

const (
	TokenFromHeader TokenSource = iota
	TokenFromURL
)

type User struct {
	Id          int    `json:"id"`
	FirstName   string `json:"firstName"`
	LastName    string `json:"lastName"`
	Email       string `json:"email,omitempty"`
	Password    string `json:"password,omitempty"`
	DateOfBirth string `json:"dateOfBirth,omitempty"`
	Nickname    string `json:"nickname,omitempty"`
	Avatar      string `json:"avatar,omitempty"`
	AboutMe     string `json:"aboutMe,omitempty"`
	IsPrivate   bool   `json:"isPrivate"`
	UserGroups  []int  `json:"userGroups,omitempty"`
}

type RegistrationRequest struct {
	FirstName   string  `json:"firstName"`
	LastName    string  `json:"lastName"`
	Email       string  `json:"email"`
	Password    string  `json:"password"`
	DateOfBirth string  `json:"dateOfBirth"`
	Nickname    *string `json:"nickname"`
	Avatar      *string `json:"avatar,omitempty"`
	AboutMe     *string `json:"aboutMe,omitempty"`
}

type Session struct {
	UserId       int
	SessionToken string
	Expiration   time.Time
}

type LoginResponse struct {
	UserId     int       `json:"userId"`
	NickName   string    `json:"nickname"`
	Email      string    `json:"email"`
	SessionId  string    `json:"sessionId"`
	Expiration time.Time `json:"expiration"`
}

type Post struct {
	Id             int       `json:"id"`
	UserId         int       `json:"userId"`
	Privacy        string    `json:"privacy"`
	Title          string    `json:"title"`
	Content        string    `json:"content"`
	Photo          string    `json:"photo,omitempty"`
	ProfilePicture string    `json:"profilePicture"`
	Comments       []Comment `json:"comments"`
}

type Comment struct {
	Id             int    `json:"id"`
	PostId         int    `json:"postId"`
	UserId         int    `json:"userId"`
	CreatorName    string `json:"creatorName"`
	ProfilePicture string `json:"profilePicture"`
	Content        string `json:"content"`
	Photo          string `json:"photo,omitempty"`
}
type Group struct {
	Id          int    `json:"id"`
	CreatorId   int    `json:"creatorId"`
	Name        string `json:"groupName"`
	Description string `json:"groupDescription"`
	Members     []int  `json:"members"`
}

type GroupPost struct {
	Id             int            `json:"id"`
	UserId         int            `json:"userId"`
	Title          string         `json:"title"`
	Content        string         `json:"content"`
	Photo          string         `json:"photo,omitempty"`
	ProfilePicture string         `json:"profilePicture"`
	GroupId        int            `json:"groupId"`
	Comments       []GroupComment `json:"comments"`
}

type GroupComment struct {
	Id             int    `json:"id"`
	PostId         int    `json:"postId"`
	GroupId        int    `json:"groupId"`
	UserId         int    `json:"userId"`
	CreatorName    string `json:"creatorName"`
	ProfilePicture string `json:"profilePicture"`
	Content        string `json:"content"`
	Photo          string `json:"photo,omitempty"`
}

type ChatMessage struct {
	Id            int       `json:"id,omitempty"`
	SenderId      int       `json:"senderId,omitempty"`
	Content       string    `json:"content,omitempty"`
	CreatedAt     time.Time `json:"createdAt,omitempty"`
	PrivateChatId int       `json:"privateChatId,omitempty"`
	GroupChatId   int       `json:"groupChatId,omitempty"`
	Avatar        string    `json:"avatar"`
}

type PrivateChat struct {
	Id            int    `json:"id"`
	User1Id       int    `json:"user1Id"`
	User2Id       int    `json:"user2Id"`
	User1FullName string `json:"user1FullName"`
	User2FullName string `json:"user2FullName"`
	User1Avatar   string `json:"user1Avatar"`
	User2Avatar   string `json:"user2Avatar"`
	LastMessage   ChatMessage
}

type GroupChat struct {
	GroupId     int    `json:"groupId"`
	GroupName   string `json:"groupName"`
	Members     []User `json:"members"`
	LastMessage ChatMessage
}

type DisplayChat struct {
	ChatId      int    `json:"chatId"`
	Type        string `json:"type"`
	PrivateChat *PrivateChat
	GroupChat   *GroupChat
}

type ProfileDTO struct {
	UserInfo            User
	UserPosts           []Post
	UserGroups          []Group
	FollowRequestStatus string `json:"followRequestStatus,omitempty"`
}

type UpdateProfilePrivacyRequest struct {
	UserId    int  `json:"userId"`
	IsPrivate bool `json:"isPrivate"`
}

type Event struct {
	Id           int      `json:"id"`
	GroupId      int      `json:"groupId"`
	CreatorId    int      `json:"creatorId"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Time         string   `json:"time"`
	Options      []string `json:"options"`
	ChosenOption string   `json:"chosenOption"`
}

type EventOption struct {
	UserId  int    `json:"userId"`
	EventId int    `json:"eventId"`
	Option  string `json:"option"`
}

type Notification struct {
	Id          int    `json:"id"`
	RequesterId int    `json:"requesterId"`
	ReceiverId  int    `json:"receiverId"`
	GroupId     int    `json:"groupId,omitempty"`
	FirstName   string `json:"firstName,omitempty"`
	LastName    string `json:"lastName,omitempty"`
	Content     string `json:"content"`
	Type        string `json:"type"`   // e.g., "join_request"
	Status      string `json:"status"` // e.g., "pending", "accepted", "declined"
}

type CombinedNotifications struct {
	UserNotifications  []Notification `json:"userNotifications"`
	GroupNotifications []Notification `json:"groupNotifications"`
}
type OfflineNotification struct {
	UserId        int
	Notifications []Notification
}
type JoinRequest struct {
	RequesterId int `json:"requesterId"`
	GroupId     int `json:"groupId"`
}

type ErrorResponse struct {
	Status  string `json:"status"`
	Message string `json:"message"`
}

type InviteUsers struct {
	UsersId []int `json:"usersId"`
	GroupId int   `json:"groupId"`
}
