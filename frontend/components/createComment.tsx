import { useState, ChangeEvent } from "react";
import s from './comment.module.css';
import { PostData, CommentData } from "@/types/types";
import Comment from "@/components/comment";

interface CommentProps {
    postId: number;
    userAvatar: string;
    comments: CommentData[];
    setPosts: React.Dispatch<React.SetStateAction<PostData[]>>
}

export function CreateComment({ postId, userAvatar, comments, setPosts }: CommentProps) {
    const [commentContent, setCommentContent] = useState('');
    const [commentPhoto, setCommentPhoto] = useState('');
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            if (file.size > 1048576) {
                alert('File size should not exceed 1MB');
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                if (e.target && e.target.result) {
                    setCommentPhoto(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (commentContent.trim() === '') {
            alert('Content is required.');
            return;
        }
        try {
            const response = await fetch('/api/createComment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    postId: postId,
                    content: commentContent,
                    photo: commentPhoto,
                    profilePicture: userAvatar,
                }),
            });

            if (response.ok) {
                const newCommentInPost: PostData = await response.json();
                setPosts(prevPosts => {
                    const postIndex = prevPosts.findIndex(post => post.id === newCommentInPost.id);
                    if (postIndex !== -1) {
                        return prevPosts.map((post, index) => index === postIndex ? newCommentInPost : post);
                    } else {
                        return [newCommentInPost, ...prevPosts];
                    }
                });
                setCommentContent('');
                setCommentPhoto('');

            } else {
                console.error('Failed to create comment: ', await response.text());
            }
        } catch (error) {
            console.error('An error occurred while creating the comment:', error);
        }
    };

    return (
        <div className={s.commentRightField}>
            <div className={s.commentsEnterFields}>

                <input
                    className={s.addCommentField}
                    type="text"
                    placeholder="Add your comment"
                    value={commentContent}
                    onChange={(e) => setCommentContent(e.target.value)}
                />

                <div className={s.uploadImage} style={{ backgroundImage: `url(${commentPhoto})` }}>
                    <input
                        type="file"
                        id="fileInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <label htmlFor="fileInput" className={s.pointer}>img</label>
                </div>
                
                <button onClick={handleSubmit} className={s.submit}>Submit</button>

            </div>

            <div className={s.comments}>
                {comments.length > 0 && (
                    <div>{comments.map((comment) => (
                        <Comment key={comment.id} {...comment} />
                    ))}
                    </div>
                )}
            </div>
        </div>
    )
}

