
export type { UserSearch, GroupSearch, SearchResult, MainPageProps, PostData, CommentData, GroupPageProps, GroupInfoData, GroupPostData, GroupCommentData, GroupEventData, UserInfo, LoggedInUserProfileProps, OtherUserProfileProps, ChatMessage, MessageWebSocketProps, PrivateChat, GroupChat, Chat, Followers, Following, FollowersProps, FollowingProps, FollowRequest, FollowRequestsProps };

//Profile
interface UserInfo {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    dateOfBirth: string;
    nickname: string;
    avatar: string;
    aboutMe: string;
    isPrivate: boolean;
    userGroups: number[];
}

interface LoggedInUserProfileProps {
    userPosts: PostData[];
    userGroups?: GroupInfoData[];
    loggedInUser: UserInfo;
    token: string;
}

interface OtherUserProfileProps {
    userInfo: UserInfo;
    userPosts: PostData[];
    userGroups?: GroupInfoData[];
    profileUserId: number;
    loggedInUserInfo: UserInfo;
    isFollowing: boolean;
    followStatus: string;
    token: string;
}

//Main
interface MainPageProps {
    userGroups: GroupInfoData[];
    userPosts: PostData[];
    userInfo: UserInfo;
    loggedInUser: number;
    sessionToken: string;
    expiration: string;
    email: string;
}

interface PostData {
    id: number;
    userId: number;
    title: string;
    content: string;
    photo: string;
    privacy: string;
    profilePicture: string;
    comments: CommentData[];
    loggedInUserId: number;
}

interface CommentData {
    id: number;
    userId: number;
    creatorName: string;
    postId: number;
    content: string;
    photo: string;
    profilePicture: string;
}

//Chats
interface ChatMessage {
    id: number;
    senderId: number;
    content: string;
    createdAt: string;
    avatar: string;
    privateChatId?: number;
    groupChatId?: number;
}

interface MessageWebSocketProps {
    userId: number;
    token: string;
    chatsData: Chat[];
    userInfo: UserInfo;
}

interface PrivateChat {
    chatId: number;
    type: ChatType.Private;
    PrivateChat: {
        user1Id: number;
        user2Id: number;
        user1FullName: string;
        user2FullName: string;
        user1Avatar: string;
        user2Avatar: string;
        LastMessage: ChatMessage;
    };
    GroupChat: null;
}

interface GroupChat {
    chatId: number;
    type: ChatType.Group;
    GroupChat: {
        groupId: number;
        groupName: string;
        members: Array<{
            id: number;
            firstName: string;
            lastName: string;
        }>;
        LastMessage: ChatMessage;
    };
    PrivateChat: null;
}

type Chat = PrivateChat | GroupChat;

export enum ChatType {
    Private = 'private',
    Group = 'group',
}

//Following
interface Followers {
    id: number;
    firstName: string;
    lastName: string; 
    avatar: string;
}

interface Following {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string;
}

interface FollowRequest {
    id: number;
    requesterId: number;
    firstName: string;
    lastName: string;
    type: string;
}

interface FollowRequestsProps {
    requests: FollowRequest[];
}

interface FollowersProps {
    followers: Followers[];
    loggedInUserId: number;
    userInfo?: UserInfo;
}

interface FollowingProps {
    following: Following[];
    loggedInUserId: number;
    userInfo?: UserInfo;
}

//Groups
interface GroupInfoData {
    id: number;
    creatorId: number;
    groupName: string;
    groupDescription: string;
}

interface GroupPostData {
    id: number;
    userId: number;
    title: string;
    content: string;
    photo: string;
    profilePicture: string;
    groupId: number | null ;
    comments: GroupCommentData[]
}

interface GroupCommentData {
    id: number;
    userId: number;
    creatorName: string;
    postId: number;
    groupId: number;
    content: string;
    photo: string;
    profilePicture: string;
}

interface GroupEventData {
    id: number;
    groupId: number;
    creatorId: number;
    name: string;
    description: string;
    time: string;
    options: string[];
    chosenOption: string;
}

interface GroupPageProps {
    groupInfo: GroupInfoData;
    groupPosts: GroupPostData[];
    groupEvents: GroupEventData[];
    userInfo: UserInfo;
    session: string;
}

//Notification
export interface NotificationData {
    id: number;
    requesterId: number;
    receiverId: number;
    groupId?: number;
    content: string;
    type: string;
    status: string;
}

//Search
interface UserSearch {
    id: number;
    firstName: string;
    lastName: string;
    avatar: string;
    link: string;
}

interface GroupSearch {
    id: number;
    groupName: string;
    avatar: string;
    link: string;
}

interface SearchResult {
    users: UserSearch[];
    groups: GroupSearch[];
}

