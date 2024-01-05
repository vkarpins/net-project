import Footer from "@/components/footer";
import { fetchData } from "@/lib/api"
import { withSessionSsr } from "@/lib/withSession";
import { GroupEventData, GroupPageProps, GroupPostData } from "@/types/types";
import s from './group.module.css'
import { useState } from 'react';
import GroupInfo from "@/components/groupInfo";
import GroupPost from "@/components/groupPost";
import GroupEvent from "@/components/groupEvent";
import Header from "@/components/header";
import { CreateGroupPost } from "@/components/createGroupPostForm";
import { joinLeaveGroup } from "../../components/groupJoiningAndLeaving";
import { CreateGroupEvent } from "@/components/createEventForm";
import { InviteUser } from "@/components/inviteUser";
import ErrorWindow from "@/components/errorWindow";
import Link from "next/link";


export default function GroupPage({ groupInfo, groupPosts, groupEvents, userInfo, session }: GroupPageProps) {
    const [postsInGroup, setPostsInGroup] = useState<GroupPostData[]>(groupPosts);
    const [eventsInGroup, setEventsInGroup] = useState<GroupEventData[]>(groupEvents);
    const [isCreatingPost, setIsCreatingPost] = useState(false);
    const [isCreatingEvent, setIsCreatingEvent] = useState(false);
    const [isInviteUserOpen, setIsInviteUserOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    
    const isUserMember = userInfo.userGroups?.includes(groupInfo.id) ?? false;
    const showCreatePost = () => {
        setIsCreatingPost((prevIsCreatingPost) => !prevIsCreatingPost);
    };
    const showCreateEvent = () => {
        setIsCreatingEvent((prevIsCreatingEvent) => !prevIsCreatingEvent);
    };
    const handleFollowToggle = async () => {
        try {
            const response = await joinLeaveGroup(groupInfo.id, userInfo.id, session, !isUserMember);
            setErrorMessage(response.message)

        } catch (error) {
            console.error('Error during follow/unfollow:', error);
        }
    };
    const handleInviteUser = () => {
        setIsInviteUserOpen(!isInviteUserOpen);
    };
    return (
        <div className={s.mainContainer}>
            {errorMessage != "" && (
                <ErrorWindow
                    errorMessage={errorMessage}
                    onClose={() => setErrorMessage("")}
                />
            )}
            <Header userInfo={userInfo} token={session} setErrorMessage={setErrorMessage}/>
            {isUserMember ? (
                <>
                    <div className={s.navigationTab}>
                        <div className={s.createPostGroupname}>
                            <button className={s.groupCreatePostBut} onClick={showCreatePost}>Create Post</button>
                            <h2 className={s.groupProfileHeader}>{groupInfo.groupName}'s Posts</h2>
                        </div>

                        <h2>{groupInfo.groupName}'s Profile</h2>
                    </div>

                    <div className={s.mainGrid}>

                        <div className={s.postsField}>

                            {isCreatingPost && (
                                <CreateGroupPost groupId={groupInfo.id} setPostInGroup={setPostsInGroup} cancelPostCreation={showCreatePost} userInfo={userInfo} />
                            )}
                            {postsInGroup.length > 0 ? (
                                [...postsInGroup].map((post) => (
                                    <GroupPost key={post.id} {...post} setPostsInGroup={setPostsInGroup} />
                                ))
                            ) : (
                                <div className={s.noPostsWrapper}>
                                    <h2 className={s.noPosts}>No posts yet</h2>
                                </div>
                            )}
                        </div>

                        <div>
                            <div>
                                <GroupInfo userInfo={userInfo} {...groupInfo} onFollowToggle={handleFollowToggle} />
                            </div>

                            <div className={s.inviteAndChatBut}>
                                {isInviteUserOpen && (
                                    <div className={s.popup}>
                                        <InviteUser groupId={groupInfo.id} setErrorMessage={setErrorMessage} handleInviteUser={handleInviteUser}/>
                                    </div>
                                )}
                                <button className={s.inviteBut} onClick={handleInviteUser}>Invite users</button>
                                <button className={s.chatBut}><Link href={'/chat'}>Open Chats</Link></button>
                            </div>

                            <div className={s.groupEventContainer}>
                                <button className={s.createEvent} onClick={showCreateEvent}>create event</button>
                                <div className={s.eventTitle}>Events</div>
                            </div>

                            <div className={s.eventsField}>

                                {isCreatingEvent && (
                                    <CreateGroupEvent groupId={groupInfo.id} setEvents={setEventsInGroup} cancelEventCreation={showCreateEvent} />
                                )}
                                {eventsInGroup.length > 0 ? (
                                    eventsInGroup.map((event) => (
                                        <GroupEvent key={event.id} {...event} />
                                    ))
                                ) : (
                                    <div className={s.noPostsWrapper}>
                                        <h2 className={s.noPosts}>No events yet</h2>
                                    </div>
                                )
                                }
                            </div>

                        </div>

                    </div>
                </>
            ) : (
                <div className={s.unFollowgroupInfoContainer}>
                    <GroupInfo userInfo={userInfo} {...groupInfo} onFollowToggle={handleFollowToggle} />
                </div>
            )
            }
            <Footer />
        </div >
    );
}

export const getServerSideProps = withSessionSsr(
    async function getServerSideProps({ req, params }) {
        try {
            const groupId = params?.id;
            const session = req.session.sessionToken
            if (!req.session.userId) {
                return {
                    redirect: {
                        destination: '/',
                        permanent: false,
                    },
                };
            }
            const userInfo = await fetchData(`http://localhost:8080/user/info`, 'GET', {
                'Authorization': session || '',
            });
            const groupInfo = await fetchData(`http://localhost:8080/group/${groupId}/get`, 'GET', {
                'Authorization': session || '',
            });
            try {
                const groupPosts = await fetchData(`http://localhost:8080/group/${groupId}/post/get`, 'GET', {
                    'Authorization': session || '',
                });
                const groupEvents = await fetchData(`http://localhost:8080/group/${groupId}/event/get`, 'GET', {
                    'Authorization': session || '',
                });

                return {
                    props: {
                        session,
                        userInfo,
                        groupInfo,
                        groupPosts,
                        groupEvents,
                    },
                };
            } catch (postError) {

                return {
                    props: {
                        userInfo,
                        groupInfo,
                        groupPosts: [],
                        groupEvents: [],
                    },
                };
            }
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