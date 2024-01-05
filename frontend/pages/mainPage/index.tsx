import Header from "@/components/header";
import Footer from "@/components/footer";
import { withSessionSsr } from "@/lib/withSession";
import { useState, useEffect } from 'react';
import { MainPageProps, PostData, GroupInfoData } from "@/types/types";
import { CreatePost } from '@/components/createPostForm';
import { CreateGroup } from "@/components/createGroupForm";
import s from './main.module.css'
import { fetchData } from "@/lib/api";
import Link from "next/link";
import GroupInfo from "@/components/groupInfo";
import { joinLeaveGroup } from "@/components/groupJoiningAndLeaving";
import Post from "@/components/post";
import ErrorWindow from "@/components/errorWindow";

export default function MainPage({ userInfo, userPosts, userGroups, sessionToken, loggedInUser }: MainPageProps) {
    const [posts, setPosts] = useState<PostData[]>(userPosts || []);
    const [groups, setGroups] = useState<GroupInfoData[]>(userGroups);
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isCreatingGroup, setIsCreatingGroup] = useState(false);
    const [isSliderPostsVisible, setSliderPostsVisible] = useState(true);
    const [isSliderGroupsVisible, setSliderGroupsVisible] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    useEffect(() => {
        if (isSliderGroupsVisible) {
            setIsCreatingPost(false);
        }

        if (!isSliderGroupsVisible) {
            setIsCreatingGroup(false);
        }
    }, [isSliderGroupsVisible]);

    const handleFollowToggle = async (group: GroupInfoData) => {
        try {
            const response = await joinLeaveGroup(group.id, userInfo.id, sessionToken, !userInfo.userGroups?.includes(group.id) ?? false);
            setErrorMessage(response.message)

        } catch (error) {
            console.error('Error during follow/unfollow:', error);
        }
    };

    const showCreatePost = () => {
        if (isSliderGroupsVisible) {
            setSliderGroupsVisible(false);
        }
        setIsCreatingPost((prevIsCreatingPost) => !prevIsCreatingPost);
    };

    const showCreateGroup = () => {
        if (!isSliderGroupsVisible) {
            setSliderGroupsVisible(true);
        }
        setIsCreatingGroup((prevIsCreatingGroup) => !prevIsCreatingGroup);
    };

    return (
        <div className={s.mainContainer}>
            {errorMessage != "" && (
                <ErrorWindow
                    errorMessage={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}
            <Header userInfo={userInfo} token={sessionToken} setErrorMessage={setErrorMessage} />

            <main>
                <div className={s.changeBar}>
                    <button
                        className={`${s.changeBarPosts} ${isSliderPostsVisible ? s.active : ''}`}
                        onClick={() => {
                            setSliderPostsVisible(true);
                            setSliderGroupsVisible(false);
                        }}
                    >
                        Posts
                        <div
                            className={s.sliderPosts}
                            style={{ backgroundColor: isSliderPostsVisible ? 'black' : 'transparent' }}
                        ></div>
                    </button>

                    <button
                        className={`${s.changeBarGroups} ${isSliderGroupsVisible ? s.active : ''}`}
                        onClick={() => {
                            setSliderPostsVisible(false);
                            setSliderGroupsVisible(true);
                        }}
                    >
                        Groups
                        <div
                            className={s.sliderGroups}
                            style={{ backgroundColor: isSliderGroupsVisible ? 'black' : 'transparent' }}
                        ></div>
                    </button>
                </div>

                <div className={s.mainGrid}>
                    <div className={s.createBar}>
                        <button className={s.createBarPost} onClick={() => {
                            showCreatePost();
                            setSliderPostsVisible(true);
                            setSliderGroupsVisible(false);
                        }}>Create Post</button>
                        <button className={s.createBarGroup} onClick={() => {
                            showCreateGroup();
                            setSliderPostsVisible(false);
                            setSliderGroupsVisible(true);
                        }}>Create Group</button>
                    </div>

                    <div className={s.postsField}>

                        {isCreatingPost && (
                            <CreatePost setPosts={setPosts} cancelPostCreation={showCreatePost} userInfo={userInfo} />
                        )}

                        {isCreatingGroup && (
                            <CreateGroup setGroups={setGroups} cancelGroupCreation={showCreateGroup}  setErrorMessage={setErrorMessage}/>
                        )}

                        {isSliderGroupsVisible && (
                            <>
                                {groups.length > 0 ? (
                                    [...groups].map((group) => (
                                        <Link key={group.id} href={`/group/${group.id}`}>
                                            <GroupInfo userInfo={userInfo} {...group} onFollowToggle={() => handleFollowToggle(group)} />
                                        </Link>
                                    ))
                                ) : (
                                    <div className={s.noPostsWrapper}>
                                        <h2 className={s.noPosts}>No groups yet</h2>
                                    </div>
                                )}
                            </>
                        )}
                        {!isSliderGroupsVisible && (
                            <>
                                {posts.length > 0 ? (
                                    [...posts].map((post) => (
                                        <Post key={post.id} {...post} setPosts={setPosts} loggedInUserId={loggedInUser} />
                                    ))
                                ) : (
                                    <div className={s.noPostsWrapper}>
                                        <h2 className={s.noPosts}>No posts yet</h2>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                    <div className={s.grid3}></div>
                </div>
            </main>

            <Footer />

        </div>
    );
}

export const getServerSideProps = withSessionSsr(
    async function getServerSideProps({ req }) {
        try {
            const userId = req.session.userId || '';
            const sessionToken = req.session.sessionToken || '';

            if (!req.session.userId) {
                return {
                    redirect: {
                        destination: '/',
                        permanent: false,
                    },
                };
            }
            const userInfo = await fetchData(`http://localhost:8080/user/info`, 'GET', {
                'Authorization': sessionToken || '',
            });
            const userPosts = await fetchData('http://localhost:8080/post/get', 'GET', {
                'Authorization': sessionToken,
            });
            const userGroups = await fetchData('http://localhost:8080/group/get', 'GET', {
                'Authorization': sessionToken,
            });

            return {
                props: {
                    sessionToken,
                    loggedInUser: userId,
                    userPosts: userPosts,
                    userInfo: userInfo,
                    userGroups: userGroups,
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