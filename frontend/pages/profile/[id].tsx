import { withSessionSsr } from "@/lib/withSession";
import { OtherUserProfileProps, PostData, Followers, Following, GroupInfoData } from '@/types/types';
import { UserAvatar } from "@/components/chatHelpers";
import { useEffect, useState } from "react";
import { GetFollowerData, FollowersComponent, FollowingComponent, HandleFollow } from "@/components/displayFollow";
import Header from "@/components/header";
import Post from "@/components/post";
import Link from "next/link";
import Footer from "@/components/footer";
import UserInfoSection from "@/components/profileUserInfo";
import s from './profile.module.css';
import ErrorWindow from "@/components/errorWindow";
import Image from "next/image";

const OtherUserProfile = ({ userInfo, userPosts, userGroups, profileUserId, loggedInUserInfo, isFollowing, followStatus, token }: OtherUserProfileProps) => {
    const [posts, setPosts] = useState<PostData[]>(userPosts);
    const [followers, setFollowers] = useState<Followers[]>([]);
    const [following, setFollowing] = useState<Following[]>([]);
    const [display, setDisplay] = useState<'followers' | 'following' | 'groups' | null>(null);
    const [isFollow, setIsFollowing] = useState(isFollowing);
    const [isPrivate] = useState(userInfo.isPrivate);
    const [followRequestStatus, setFollowRequestStatus] = useState(followStatus);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        setIsFollowing(isFollowing);
        setFollowRequestStatus(followStatus);
    }, [isFollowing, followStatus]);

    const date = new Date(userInfo.dateOfBirth);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${month}.${day}.${year}`;

    const fetchFollowers = async () => {
        try {
            const data = await GetFollowerData(profileUserId, 'followers');
            setFollowers(data);
            setDisplay('followers');
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFollowing = async () => {
        try {
            const data = await GetFollowerData(profileUserId, 'following');
            setFollowing(data);
            setDisplay('following');
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGroups = () => {
        setDisplay('groups');
    };

    const handleFollowAction = async (action: 'follow' | 'unfollow') => {
        try {
            if (isPrivate && action === 'follow') {
                const response = await HandleFollow('follow', profileUserId);
                if (response?.status === 'pending') {
                    setFollowRequestStatus('Request Sent');
                }
                console.log("Follow response:", response);
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
        <div className={s.mainContainer}>

            {errorMessage != "" && (
                <ErrorWindow
                    errorMessage={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}
            <Header userInfo={loggedInUserInfo} token={token} setErrorMessage={setErrorMessage} />

            {(!isPrivate || isFollow) && (
                <div className={s.navigationTab}>
                    <div className={s.createPostProfile}>
                        <h2 className={s.profileHeader}>
                            {display === 'followers' ? `${userInfo.firstName}'s Followers` : display === 'following' ? `${userInfo.firstName}'s Following` : display === 'groups' ? `${userInfo.firstName}'s Groups` : `${userInfo.firstName}'s Posts`}
                        </h2>
                    </div>

                    <h2>{userInfo.firstName}'s Profile</h2>
                </div>
            )}

            {(!isPrivate || isFollow) ? (
                <div className={s.mainGrid}>

                    <div className={s.postsField}>

                        <>
                            {display === 'followers' ? (
                                <FollowersComponent followers={followers} loggedInUserId={loggedInUserInfo.id} />
                            ) : display === 'following' ? (
                                <FollowingComponent following={following} loggedInUserId={loggedInUserInfo.id} userInfo={userInfo} />
                            ) : display === 'groups' ? (
                                <div className={s.mainGroupContainer}>
                                    {userGroups && userGroups.length > 0 ? (
                                        userGroups.map((group, index) => (
                                            <Link href={`/group/${group.id}`} key={index}>
                                                <div className={s.resultNameAvatarContainer}>
                                                    <div className={s.resultAvatar}>
                                                        <Image src="/images/default_group_avatar.svg" alt={"Group Avatar"} width={62} height={62} />
                                                    </div>
                                                    <div className={s.resultName}>
                                                        {group.groupName}
                                                    </div>
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        <h2>No groups yet</h2>
                                    )}
                                </div>
                            ) : (
                                posts.length > 0 ? (
                                    posts.map((post, index) => (
                                        <div key={index}>
                                            <Post key={post.id} {...post} setPosts={setPosts} />
                                        </div>
                                    ))
                                ) : (
                                    <div className={s.noPostsWrapper}>
                                        <h2 className={s.noPosts}>No posts yet</h2>
                                    </div>
                                )
                            )}
                        </>

                    </div>

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
                                <div>{formattedDate}</div>
                                <div>{userInfo.email}</div>
                                <p className={s.biographyDesc}>About me:</p>
                                <div>{userInfo.aboutMe || 'Nothing here, bud :('}</div>

                            </div>

                        </div>

                        <div className={s.followingButns}>

                            <button onClick={fetchFollowers} className={s.but}>Followers</button>
                            <button onClick={fetchFollowing} className={s.but}>Following</button>
                            <button onClick={fetchGroups} className={s.but}>Groups</button>

                        </div>

                        <div className={s.postsChat}>
                            <button className={s.showPosts} onClick={() => window.location.reload()}>Show Posts</button>
                            <button className={s.openChat}><Link href={'/chat'}>Open Chats</Link></button>
                        </div>

                    </div>

                </div>
            ) : (
                <div className={s.unfollowedPrivateUser}>
                    <UserInfoSection userInfo={userInfo} userPosts={userPosts} profileUserId={profileUserId} loggedInUserInfo={loggedInUserInfo} isFollowing={isFollowing} followStatus={followStatus} token={token} />
                </div>
            )}

            <Footer />

        </div>
    );
};
export default OtherUserProfile;

export const getServerSideProps = withSessionSsr(
    async function getServersideProps({ req, params }) {
        const profileUserId = params?.id;
        const loggedInUserId = req.session.userId || '';
        const sessionToken = req.session.sessionToken || '';
        try {
            const method = 'GET';
            const headers = { 'Authorization': sessionToken };

            const response = await fetch(`http://localhost:8080/profile/${profileUserId}`, {
                method,
                headers,
            });

            if (!response.ok) {
                const errorMessage = await response.text();
                throw new Error(`Failed to fetch profile. ${errorMessage}`);
            }
            const profileData = await response.json();

            let isFollowing = false;
            const isFollowingResponse = await fetch(`http://localhost:8080/is-following/${profileUserId}`, {
                method: method,
                headers: headers,
            });
            if (isFollowingResponse.ok) {
                const followingData = await isFollowingResponse.json();
                isFollowing = followingData.isFollowing;
            }

            let followRequestStatus = 'follow';
            if (profileData.UserInfo.isPrivate && !isFollowing) {
                const followStatusResponse = await fetch(`http://localhost:8080/follow/status/${loggedInUserId}/${profileUserId}`, {
                    method: method,
                    headers: headers,
                });
                if (followStatusResponse.ok) {
                    const statusData = await followStatusResponse.json();
                    if (['pending', 'accepted'].includes(statusData.status)) {
                        followRequestStatus = statusData.status;
                    }
                }
            }

            const loggedInUserResponse = await fetch(`http://localhost:8080/profile/me`, {
                method,
                headers,
            });
            const loggedInUserData = await loggedInUserResponse.json();

            return {
                props: {
                    profileUserId,
                    loggedInUserInfo: loggedInUserData.UserInfo,
                    token: sessionToken,
                    userInfo: profileData.UserInfo,
                    userPosts: profileData.UserPosts,
                    userGroups: profileData.UserGroups,
                    isFollowing,
                    followStatus: followRequestStatus,
                },
            };
        } catch (error) {
            console.error(error);
            return {
                redirect: {
                    destination: '/',
                    statusCode: 307,
                },
            };
        }
    }
);