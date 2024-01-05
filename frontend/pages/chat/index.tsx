import { ChatName, UserAvatar, SortChats, GetSenderName, RenderEmoji } from '@/components/chatHelpers';
import Header from '@/components/header';
import { withSessionSsr } from '@/lib/withSession';
import { MessageWebSocketProps, ChatMessage, Chat, ChatType } from '@/types/types';
import { useRef, useState } from 'react';
import { useEffect } from 'react';
import s from './chat.module.css'
import Footer from '@/components/footer';
import ErrorWindow from '@/components/errorWindow';

export default function MessageWebSocket({ userId, token, chatsData, userInfo }: MessageWebSocketProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState<string>('');
    const [chats, setChats] = useState<Chat[]>(chatsData);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
    const messageWebsocket = new WebSocket(`ws://localhost:8080/message-websocket?authorization=${token}`);
    const [errorMessage, setErrorMessage] = useState("");

    const messageContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (messageContainerRef.current) {
            messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (chatsData.length > 0) {
            const firstChat = chatsData[0];
            handleChatSelection(firstChat);
        }
    }, [chatsData]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSendMessage();
        }
    };

    messageWebsocket.onmessage = (event) => {
        const message: ChatMessage = JSON.parse(event.data);
        if (
            (selectedChat?.chatId === message.groupChatId &&
                selectedChat?.type === ChatType.Group) ||
            (selectedChat?.chatId === message.privateChatId &&
                selectedChat?.type === ChatType.Private)
        ) setMessages((prevMessages) => [...prevMessages, message]);
        setChats((prevChats) => {
            const updatedChats = prevChats.map(chat => {
                if ((chat.chatId === message.groupChatId && chat.type === ChatType.Group) ||
                    (chat.chatId === message.privateChatId && chat.type === ChatType.Private)) {
                    if (chat.type === ChatType.Private) chat.PrivateChat.LastMessage = message;
                    else chat.GroupChat.LastMessage = message;
                }
                return chat;
            });

            return SortChats(updatedChats);
        });
    };

    messageWebsocket.onerror = (event) => {
        console.error(`WebSocket Error:`, event);
    };

    const handleSendMessage = () => {
        if (newMessage.trim() !== '' && messageWebsocket.readyState === WebSocket.OPEN) {
            const messageData = {
                content: newMessage,
                privateChatId: selectedChat?.type === ChatType.Private ? selectedChat.chatId : null,
                groupChatId: selectedChat?.type === ChatType.Group ? selectedChat.chatId : null,
            };
            
            messageWebsocket.send(JSON.stringify(messageData));
            setChats((prevChats) => {
                const tempMessage: ChatMessage = {
                    id: -1, //Temp id
                    senderId: userId,
                    content: newMessage,
                    createdAt: new Date().toISOString(),
                    avatar: '',
                };

                const updatedChats = prevChats.map(chat => {
                    if (chat.chatId === selectedChat?.chatId) {
                        if (chat.type === ChatType.Private) chat.PrivateChat.LastMessage = tempMessage;
                        else chat.GroupChat.LastMessage = tempMessage;
                    }
                    return chat;
                });

                return SortChats(updatedChats);
            });
            setNewMessage(''); // Clear the message input after sending
        }
    };

    const handleChatSelection = async (selectedChat: Chat) => {
        setSelectedChat(selectedChat);
        setMessages([]);
        try {
            const messageResponse = await fetch(`/api/fetchMessages?chatId=${selectedChat.chatId}&chatType=${selectedChat.type}`);

            if (!messageResponse.ok) throw new Error('Failed to fetch messages');

            const newMessageData = await messageResponse.json();
            setMessages(newMessageData ?? []);

        } catch (error) {
            console.error(error);
        }
    };

    let otherUserAvatar = "";
    if (selectedChat?.type === 'private' && selectedChat?.PrivateChat) {
        const isUser1 = selectedChat.PrivateChat.user1Id === userId;
        otherUserAvatar = isUser1 ? selectedChat.PrivateChat.user2Avatar : selectedChat.PrivateChat.user1Avatar;
    }

    return (
        <div className={s.mainContainer}>

            {errorMessage != "" && (
                <ErrorWindow
                    errorMessage={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}
            <Header userInfo={userInfo} token={token} setErrorMessage={setErrorMessage} />

            <div className={s.headerContainer}>
                <h1 className={s.headerName}>Chats</h1>
            </div>

            <div className={s.mainField}>

                <div className={s.chatsNames}>

                    <h1 className={s.chatName1}>All Chats</h1>

                    <div className={s.chatsScroller}>

                        {chatsData.length > 0 ? (
                            chats.map((chat, index) => (
                                <ChatName
                                    key={index}
                                    chat={chat}
                                    handleChatSelection={() => handleChatSelection(chat)}
                                    loggedInUserId={userId}
                                />
                            ))
                        ) : (
                            <div className={s.noChats}>
                                <p className={s.nothing}>No chats yet</p>
                            </div>
                        )}
                    </div>

                </div>

                <div className={s.messagesFiled}>

                    {messages.length > 0 ? (
                        <div>
                            <div className={s.descContainer}>
                                <div className={s.chatName2}>{selectedChat && <ChatName chat={selectedChat} loggedInUserId={userId} />}</div>
                            </div>

                            <div className={s.messageContainer} ref={messageContainerRef}>
                                {messages.map((message) => (
                                    <div key={message.id} className={`${s.messageBox} ${message.senderId === userId ? s.sentMessage : s.receivedMessage}`}>
                                        {message.senderId !== userId && <div className={s.avatar}><UserAvatar avatarUrl={message.avatar} /></div>}
                                        <div className={s.messsageText}>
                                            {message.senderId !== userId && selectedChat?.type === ChatType.Group && <span>{GetSenderName(message, selectedChat, chats)}: </span>}
                                            <p>
                                                {RenderEmoji(message.content)}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className={s.descContainer}>
                                <div className="font-bold">{selectedChat && <ChatName chat={selectedChat} loggedInUserId={userId} />}</div>
                            </div>

                            <div className={s.nothingWrapper}>
                                <p className={s.nothing}>No messages yet</p>
                            </div>
                        </div>
                    )}

                    <div className={s.sendContainer}>
                        <input
                            type='text'
                            className={s.sendMesPlace}
                            placeholder='Write your message here'
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                            onKeyDown={handleKeyPress}
                        />
                        <button onClick={handleSendMessage} className={s.sendBut}>Send</button>
                    </div>

                </div>

            </div>

            <Footer />

        </div>
    );
}

export const getServerSideProps = withSessionSsr(
    async function getServersideProps({ req }) {
        try {
            const sessionToken = req.session.sessionToken || '';
            const userId = req.session.userId || '';
            const chatResponse = await fetch('http://localhost:8080/chat-display', {
                method: 'GET',
                headers: {
                    'Authorization': sessionToken,
                },
            });
            if (!chatResponse.ok) throw new Error('Failed to fetch chats');
            const responseData = await chatResponse.json();
            let chatsData: Chat[] = responseData.chats;
            const userInfo = responseData.userInfo;

            chatsData = SortChats(chatsData);

            return {
                props: {
                    token: sessionToken,
                    userId: userId,
                    chatsData: chatsData,
                    userInfo: userInfo,
                },
            };
        } catch (error) {
            console.log(error);

            return {
                redirect: {
                    destination: '/',
                    statusCode: 307,
                },
            };
        }
    }
);
