import { CommentData, GroupCommentData } from "@/types/types";
import s from './comment.module.css';
import { UserAvatar } from "./chatHelpers";

type CommentProps = CommentData | GroupCommentData;

const Comment: React.FC<CommentProps> = ({ id, userId, creatorName, content, photo, profilePicture }) => {
    return (
        <div key={id} className={s.commentContainer}>

            <div className={s.rightCom}>
                <a href={`/profile/${userId}`}>
                    <div className={s.commentPostedAvatar}><UserAvatar avatarUrl={profilePicture} /></div>
                </a>
            </div>

            <div className={s.LeftCom}>
                <div className={s.creator}>{creatorName}</div>


                <div className={s.commentPostedContentContainer}>
                    {photo && (
                        <img
                            src={`${photo}`}
                            alt="Comment"
                            className={s.commentPostedPhoto}
                        />
                    )}

                    <div className={s.commentPostedContent}>{content}</div>
                </div>

            </div>

        </div>
    );
};

export default Comment;