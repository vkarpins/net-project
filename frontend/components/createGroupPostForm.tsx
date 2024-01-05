import { useState, ChangeEvent } from "react";
import { UserAvatar } from "./chatHelpers";
import s from './createPostForm.module.css';
import { UserInfo, GroupPostData } from '@/types/types';

interface CreatePostProps {
    userInfo: UserInfo
    groupId: number | null;
    setPostInGroup: React.Dispatch<React.SetStateAction<GroupPostData[]>>;
    cancelPostCreation: () => void;
}

export function CreateGroupPost({ userInfo, groupId, setPostInGroup, cancelPostCreation }: CreatePostProps) {
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postPhoto, setPostPhoto] = useState(''); 
    const [profilePicture, setProfilePicture] = useState('');
    const [isPostContainerVisible, setIsPostContainerVisible] = useState(true);
    const [checkGroupId, setCheckGroupId] = useState<number | null>(groupId);


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
                    setPostPhoto(e.target.result as string);
                }
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        
        if (postTitle.trim() === '' || postContent.trim() === '') {
            alert('Title and content are required.');
            return;
        }
        try {
            const response = await fetch('/api/createPost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: postTitle,
                    content: postContent,
                    photo: postPhoto,
                    privacy: "private",
                    profilePicture: profilePicture,
                    groupId: checkGroupId,
                }),
            });

            if (response.ok) {
                setIsPostContainerVisible(false);

                const newPost: GroupPostData = await response.json();
                setPostInGroup(prevPosts => [newPost, ...prevPosts]);
                setPostTitle('');
                setPostContent('');
                setPostPhoto('');
                setProfilePicture('');
                setCheckGroupId(null);
                cancelPostCreation();

            } else {
                console.error('Failed to create post: ', await response.text());
            }
        } catch (error) {
            console.error('An error occurred while creating the post:', error);
        }
    };

    return (
        <div className={`${s.postContainer} ${isPostContainerVisible ? '' : s.postContainerHidden}`}>
            <div className={s.postLeftField}>
                <a href="/profile"><div className={s.postAvatar}><UserAvatar avatarUrl={userInfo.avatar} /></div></a>
            </div>
            <div className={s.postRightField}>
                <div className={s.postPrivacySubmit}>
                    <div className={s.privacyField}>
                        <label htmlFor="private" className={s.buttons}>
                            <input
                                type="radio"
                                id="private"
                                name="visibility"
                                value="private"
                            />
                            private
                        </label>
                    </div>
                    <button onClick={handleSubmit} className={s.submit}>Submit</button>
                </div>
                <div className={s.postTitleUpload}>
                    <input
                        className={s.postTitle}
                        type="text"
                        placeholder="Add post title"
                        value={postTitle}
                        onChange={(e) => setPostTitle(e.target.value)}
                    />
                    <input
                        type="file"
                        id="fileInput"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleFileChange}
                    />
                    <label className={s.uploadImage} htmlFor="fileInput">upload img</label>
                </div>
                <div className={s.postContentImage}>
                    <textarea
                        placeholder="Add post content"
                        className={s.contentField}
                        value={postContent}
                        onChange={(e) => setPostContent(e.target.value)}
                    ></textarea>
                    <div className={s.imageField}>
                        {postPhoto && (
                            <img src={postPhoto}/>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

