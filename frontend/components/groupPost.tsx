import { GroupPostData } from "@/types/types";
import s from './groupPage.module.css';
import Image from 'next/image';
import { UserAvatar } from "./chatHelpers";
import { CreateGroupComment } from "./createGroupComment";
import { useState } from 'react';

interface GroupPostProps extends GroupPostData {
    setPostsInGroup: React.Dispatch<React.SetStateAction<GroupPostData[]>>;
}
export default function GroupPost({ id, userId, groupId, title, content, photo, profilePicture, comments, setPostsInGroup }: GroupPostProps) {
    const [IsCommentsVisible, setIsCommentsVisible] = useState<{ [postId: number]: boolean }>({});
    const showComments = (postId: number) => {
        setIsCommentsVisible((prevVisibility) => ({
            ...prevVisibility,
            [postId]: !prevVisibility[postId],
        }));
    };
    return (
        <>
            <div key={id} className={s.postContainer}>
                <div className={s.postLeftField}>
                    <a href={`/profile/${userId}`}><div className={s.postAvatar}><UserAvatar avatarUrl={profilePicture} /></div></a>
                    <Image
                        priority
                        src="/images/comment_icon.svg"
                        className={s.commentIcon}
                        height={18}
                        width={16}
                        alt="icon"
                        onClick={() => showComments(id)}
                    />
                </div>

                {IsCommentsVisible[id] ? (
                    <div className={s.commentsContainer}>
                        <CreateGroupComment groupId={groupId} postId={id} userAvatar={profilePicture} comments={comments} setPosts={setPostsInGroup} />
                    </div>
                ) : (
                    <div className={s.postRightField}>
                        <div className={s.postTitleContainer}>
                            <div className={s.postPrivacy}>private</div>
                            <div className={s.postTitle}>{title}</div>
                        </div>

                        <div className={s.postContentContainer}>
                            {photo && (
                                <img
                                    src={`${photo}`}
                                    alt="Post"
                                    className={s.postPhoto}
                                />
                            )}
                            <div className={s.postContent}>{content}</div>
                        </div>
                    </div>
                )}
            </div>
        </>
    )
}