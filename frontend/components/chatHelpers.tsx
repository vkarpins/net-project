import { FC } from 'react';
import Image from 'next/image';
import s from './header.module.css';
import c from "./displayFollow.module.css";
import { Chat, ChatType, ChatMessage, GroupChat } from '@/types/types';
export { UserAvatar, ChatName, SortChats, GetSenderName, RenderEmoji };

interface UserAvatarProps {
    avatarUrl?: string;
    altText?: string;
}
interface ChatNameProps {
    chat: Chat;
    handleChatSelection?: (chat: Chat) => void;
    loggedInUserId: number;
}

const UserAvatar: FC<UserAvatarProps & { onClick?: () => void }> = ({ avatarUrl, altText = 'User avatar', onClick }) => {
    return (
        <div onClick={onClick}>
            {avatarUrl ? (
                <img src={avatarUrl} alt={altText} width={200} height={200} className={s.avatarGeneral} />
            ) : (
                <Image src="/images/default_avatar.png" alt={altText} width={200} height={200} />
            )}
        </div>
    );
};

const ChatName: FC<ChatNameProps> = ({ chat, handleChatSelection, loggedInUserId }) => {
    let otherUserAvatar = "";
    let otherUserFullName = "";
    if (chat.type === 'private' && chat.PrivateChat) {
        const isUser1 = chat.PrivateChat.user1Id === loggedInUserId;
        otherUserFullName = isUser1 ? chat.PrivateChat.user2FullName : chat.PrivateChat.user1FullName;
        otherUserAvatar = isUser1 ? chat.PrivateChat.user2Avatar : chat.PrivateChat.user1Avatar;
    }

    return (
        <div onClick={() => handleChatSelection && handleChatSelection(chat)}>
            {chat.type === 'private' && chat.PrivateChat && (
                <div className={c.resultNameAvatarContainer}>
                    {<div className={c.resultAvatar}><UserAvatar avatarUrl={otherUserAvatar} /> </div> }
                    <div className={c.resultName}>{otherUserFullName}</div>
                </div>
            )}
            {chat.type === 'group' && chat.GroupChat && (
                <div className={c.resultNameAvatarContainer}>
                    <Image src="/images/default_group_avatar.svg" alt={"Group Avatar"} width={50} height={50} />
                    <div className={c.resultName}>{chat.GroupChat.groupName}</div>
                </div>
            )}
        </div>
    );
};

const SortChats = (chats: Chat[]): Chat[] => {
    if (!chats) {
        return [];
    }
    return chats.sort((a, b) => {
        const lastMessageA = a.type === ChatType.Private ? a.PrivateChat?.LastMessage : a.GroupChat?.LastMessage;
        const lastMessageB = b.type === ChatType.Private ? b.PrivateChat?.LastMessage : b.GroupChat?.LastMessage;

        const dateA = new Date(lastMessageA?.createdAt ?? 0).getTime();
        const dateB = new Date(lastMessageB?.createdAt ?? 0).getTime();

        return dateB - dateA;
    });
}

const GetSenderName = (message: ChatMessage, selectedChat: Chat | null, chats: Chat[]) => {
    if (selectedChat?.type === ChatType.Group) {
        const selectedGroupChat = chats.find(chat => chat.chatId === selectedChat.chatId && chat.type === ChatType.Group) as GroupChat;

        if (selectedGroupChat && selectedGroupChat.GroupChat && selectedGroupChat.GroupChat.members) {
            const sender = selectedGroupChat.GroupChat.members.find(member => member.id === message.senderId);
            return `${sender?.firstName} ${sender?.lastName}`;
        }
    }
    return null;
}

const RenderEmoji = (content: string): React.ReactNode => {
    const emojiRegex = /(:\)|:\(|<3|\*:)/g;
    const emojiMap: Record<string, React.ReactNode> = {
        ':)': '😊',
        ':(': '😢',
        '<3': '❤️',
        '*:': '⭐',
    };

    return content.split(emojiRegex).map((part, index) => {
        return emojiMap[part] ? (
            <span key={index} style={{ marginRight: '4px' }}>
                {emojiMap[part]}
            </span>
        ) : (
            <span key={index}>{part}</span>
        );
    });
};
