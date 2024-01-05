import { withSessionSsr } from '@/lib/withSession';
import { CreatePost } from '@/components/createPostForm';
import { useState } from 'react';
import { UserAvatar } from '@/components/chatHelpers';
import { handlePrivacyToggle } from '@/components/profilePrivacy';
import { FollowersComponent, FollowingComponent, GetFollowerData } from '@/components/displayFollow';
import { LoggedInUserProfileProps, PostData, Followers, Following } from '@/types/types';
import Header from '@/components/header';
import s from './profile.module.css';
import Footer from '@/components/footer';
import Post from '@/components/post';
import ErrorWindow from "@/components/errorWindow";
import Link from 'next/link';
import Image from 'next/image';


export default function LoggedInUserProfilePage({ userPosts, userGroups, loggedInUser, token }: LoggedInUserProfileProps) {
    const [posts, setPosts] = useState<PostData[]>(userPosts);
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isPrivate, setIsPrivate] = useState(loggedInUser.isPrivate);
    const [followers, setFollowers] = useState<Followers[]>([]);
    const [following, setFollowing] = useState<Following[]>([]);
    const [display, setDisplay] = useState<'followers' | 'following' | 'groups' | 'follow-request' | null>(null);
    const [showPrivacyOptions, setShowPrivacyOptions] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const date = new Date(loggedInUser.dateOfBirth);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear();
    const formattedDate = `${month}.${day}.${year}`;

    const updatePrivacy = async (isPrivate: boolean) => {
        try {
            const newPrivacyStatus = await handlePrivacyToggle(loggedInUser.id, isPrivate);
            setIsPrivate(newPrivacyStatus.isPrivate);
            setShowPrivacyOptions(false);
        } catch (error) {
            console.log(error);
        }
    };

    const fetchFollowers = async () => {
        try {
            const data = await GetFollowerData(loggedInUser.id, 'followers');
            setFollowers(data);
            setIsCreatingPost(false);
            setDisplay('followers');
        } catch (error) {
            console.error(error);
        }
    };

    const fetchFollowing = async () => {
        try {
            const data = await GetFollowerData(loggedInUser.id, 'following');
            setFollowing(data);
            setIsCreatingPost(false);
            setDisplay('following');
        } catch (error) {
            console.error(error);
        }
    };

    const fetchGroups = () => {
        setDisplay('groups');
    };

    const togglePostCreation = () => {
        setIsCreatingPost(!isCreatingPost);
        setDisplay(null);
    };

    return (
        <div className={s.mainContainer}>

            {errorMessage != "" && (
                <ErrorWindow
                    errorMessage={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}

            <Header userInfo={loggedInUser} token={token} setErrorMessage={setErrorMessage} />

            <div className={s.navigationTab}>
                <div className={s.createPostProfile}>
                    <button className={s.profileCreatePostBut} onClick={togglePostCreation}>Create Post</button>
                    <h2 className={s.profileHeader}>
                        {display === 'followers' ? 'Followers' : display === 'following' ? 'Following' : display === 'groups' ? 'My Groups' : 'My Posts'}
                    </h2>
                </div>

                <h2>My Profile</h2>
            </div>

            <div className={s.mainGrid}>

                <div className={s.postsField}>

                    {isCreatingPost && (
                        <CreatePost setPosts={setPosts} cancelPostCreation={togglePostCreation} userInfo={loggedInUser} />
                    )}

                    {display === 'followers' ? (
                        <FollowersComponent followers={followers} loggedInUserId={loggedInUser.id} />
                    ) : display === 'following' ? (
                        <FollowingComponent following={following} loggedInUserId={loggedInUser.id} />
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
                                <p>No groups yet</p>
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

                </div>

                <div className={s.infoFiled}>

                    <div className={s.userInfo}>

                        <div className={s.nameAvatarPrivacy}>

                            <div className={s.nickname}>{loggedInUser.nickname}</div>
                            <div className={s.avatarProfile}><UserAvatar avatarUrl={loggedInUser.avatar} /></div>

                            <div className={s.privacy}>
                                <button
                                    className={s.privacyChangeBut}
                                    onClick={() => setShowPrivacyOptions(!showPrivacyOptions)}
                                >
                                    {isPrivate ? 'private account' : 'public account'}
                                </button>

                                {showPrivacyOptions && (
                                    <div className={s.privacyOptions}>
                                        <p className={s.selectDesc}>Select your privacy setting:</p>

                                        <div className={s.accountOptions}>
                                            <button onClick={() => updatePrivacy(true)} className={s.privacyChangeBut}>private account</button>
                                            <button onClick={() => updatePrivacy(false)} className={s.privacyChangeBut}>public account</button>
                                        </div>
                                    </div>
                                )}
                            </div>

                        </div>

                        <div className={s.nameDateBio}>

                            <div className={s.name}>{loggedInUser.firstName + ' ' + loggedInUser.lastName}</div>
                            <div>{formattedDate}</div>
                            <div>{loggedInUser.email}</div>
                            <p className={s.biographyDesc}>About me:</p>
                            <div className={s.aboutMeText}>{loggedInUser.aboutMe || 'Nothing here, bud :('}</div>

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

            <Footer />

        </div>
    );
}

export const getServerSideProps = withSessionSsr(
    async function getServersideProps({ req }) {
        try {
            const sessionToken = req.session.sessionToken || '';
            const response = await fetch(`http://localhost:8080/profile/me`, {
                method: 'GET',
                headers: {
                    'Authorization': sessionToken,
                },
            });

            if (!response.ok) throw new Error('Failed to fetch profile');
            const profileData = await response.json();
            return {
                props: {
                    loggedInUser: profileData.UserInfo,
                    userPosts: profileData.UserPosts,
                    userGroups: profileData.UserGroups,
                    token: sessionToken,
                },
            };
        } catch (err) {
            console.log(err);

            return {
                redirect: {
                    destination: '/',
                    statusCode: 307,
                },
            };
        }
    }
);

