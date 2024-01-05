import { PostData } from "@/types/types";
import s from './groupPage.module.css';
import Image from 'next/image';
import { UserAvatar } from "./chatHelpers";
import { CreateComment } from "@/components/createComment";
import { useState } from 'react';

interface PostProps extends PostData {
    setPosts: React.Dispatch<React.SetStateAction<PostData[]>>;
}
export default function Post({ id, userId, title, content, photo, privacy, profilePicture, comments, setPosts, loggedInUserId }: PostProps) {
    const [IsCommentsVisible, setIsCommentsVisible] = useState<{ [postId: number]: boolean }>({});
    const profileLink = userId === loggedInUserId ? "/profile" : `/profile/${userId}`;

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
                    <a href={profileLink}>
                        <div className={s.postAvatar}><UserAvatar avatarUrl={profilePicture} /></div>
                    </a>
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
                        <CreateComment postId={id} userAvatar={profilePicture} comments={comments} setPosts={setPosts} />
                    </div>
                ) : (
                    <div className={s.postRightField}>
                        <div className={s.postTitleContainer}>
                            <div className={s.postPrivacy}>{privacy}</div>
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