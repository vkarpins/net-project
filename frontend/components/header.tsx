import React, { useState } from 'react';
import useLogout from '@/lib/logout';
import Link from 'next/link';
import Image from 'next/image';
import s from './header.module.css';
import { UserAvatar } from "./chatHelpers";
import { SearchBar } from './searchBar';
import { UserInfo } from '@/types/types';
import { NotificationComponent } from './notification';
import router from 'next/router';


interface HeaderProps {
    userInfo: UserInfo
    token: string;
    setErrorMessage: (message: string) => void;
}

const Header: React.FC<HeaderProps> = ({ userInfo, token, setErrorMessage }) => {
    const [isPopupOpen, setPopupOpen] = useState(false);
    const handleLogout = useLogout();

    const onLogoutClick = async () => {
        await handleLogout();
    };

    const handleAvatarClick = () => {
        setPopupOpen(!isPopupOpen);
    };

    const handleNotificationClick = async(chatId: number) => {
        router.push(`/chat?chatId=${chatId}`);
    }

    return (
        <header>
            <nav className={s.navBar}>
                <div className={s.refreshButton}>
                    <a href="/mainPage">Social Network</a>
                </div>
                <div className={s.searchContainer}>
                    <SearchBar/>
                </div>
                <div>
                    <NotificationComponent token={token} onNotificationClick={handleNotificationClick} setErrorMessage={setErrorMessage} />
                </div>
                <button className={s.avatar} onClick={handleAvatarClick}><UserAvatar avatarUrl={userInfo.avatar} /></button>
            </nav>

            {isPopupOpen && (
                <div className={s.popup}>
                    <>
                        <div className={s.profileButton}>
                            <button>
                                <Link href="/profile">Profile</Link>
                            </button>
                            <Image priority src="/images/profile_icon.svg" className={s.profileIcon} height={18} width={16} alt="icon" />
                        </div>

                        <div className={s.chatButton}>
                            <button>
                                <Link href={'/chat'}>Chat</Link>
                            </button>
                            <Image priority src="/images/chat_icon.svg" className={s.chatIcon} height={18} width={16} alt="icon" />
                        </div>

                        <div className={s.logoutButton}>
                            <button onClick={onLogoutClick}>Logout</button>
                            <Image priority src="/images/logout_icon.svg" className={s.logoutIcon} height={18} width={16} alt="icon" />
                        </div>
                    </>
                </div>
            )}
        </header>
    );
};

export default Header;