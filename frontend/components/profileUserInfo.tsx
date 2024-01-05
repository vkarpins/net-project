import React from 'react';
import { OtherUserProfileProps, PostData, Followers, Following  } from '@/types/types';
import { useEffect, useState } from "react";
import { HandleFollow } from "@/components/displayFollow";
import { UserAvatar } from "@/components/chatHelpers";
import s from './profileUserInfo.module.css';

const UserInfoSection: React.FC<OtherUserProfileProps> = ({ userInfo, userPosts, profileUserId, loggedInUserInfo, isFollowing, followStatus, token }) => {
    const [isFollow, setIsFollowing] = useState(isFollowing);
    const [isPrivate, setIsPrivate] = useState(userInfo.isPrivate);
    const [followRequestStatus, setFollowRequestStatus] = useState(followStatus);

    useEffect(() => {
        setIsFollowing(isFollowing);
        setFollowRequestStatus(followStatus);
    }, [isFollowing, followStatus]);

    const handleFollowAction = async (action: 'follow' | 'unfollow') => {
        try {
            if (isPrivate && action === 'follow') {
                const response = await HandleFollow('follow', profileUserId);
                if (response?.status === 'pending') {
                    setFollowRequestStatus('Request Sent');
                }
            } else if (!isPrivate && action === 'follow') {
                await HandleFollow('follow', profileUserId);
                setIsFollowing(true);
                setFollowRequestStatus('unfollow');
            } else if (action === 'unfollow') {
                await HandleFollow(action, profileUserId);
                setIsFollowing(false);
                setFollowRequestStatus('follow');
            }
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <div className={s.infoFiled}>

            <div className={s.userInfo}>

                <div className={s.nameAvatarPrivacy}>

                    <div className={s.followUserName}>

                        <div className={s.followBut}>
                            {loggedInUserInfo.id !== profileUserId && (
                                isFollow ? (
                                    <button onClick={() => handleFollowAction('unfollow')}>unfollow</button>
                                ) : (
                                    <button onClick={() => handleFollowAction('follow')}>{followRequestStatus}</button>
                                )
                            )}
                        </div>

                        <div className={s.nickname}>{userInfo.nickname}</div>
                    </div>

                    <div className={s.avatarProfile}><UserAvatar avatarUrl={userInfo.avatar} /></div>

                    <div className={s.privacy}>
                        <div className={s.privacyChangeBut}>
                            {userInfo.isPrivate ? 'private account' : 'public account'}
                        </div>
                    </div>

                </div>

                <div className={s.nameDateBio}>

                    <div className={s.name}>{userInfo.firstName + ' ' + userInfo.lastName}</div>
                    <div>{userInfo.dateOfBirth}</div>
                    <div>{userInfo.email}</div>
                    <p className={s.biographyDesc}>About me:</p>
                    <div className={s.aboutMeText}>{userInfo.aboutMe || 'Nothing here, bud :('}</div>

                </div>

            </div>

        </div>
    );
};

export default UserInfoSection;
