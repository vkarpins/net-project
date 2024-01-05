import { PostData, UserInfo, UserSearch } from "@/types/types";
import { useState, ChangeEvent } from "react";
import { UserAvatar } from "./chatHelpers";
import s from './createPostForm.module.css';
import { ChooseUsers } from "./chooseUser";

interface CreatePostProps {
    userInfo: UserInfo
    setPosts: React.Dispatch<React.SetStateAction<PostData[]>>;
    cancelPostCreation: () => void;
}

export function CreatePost({ setPosts, cancelPostCreation, userInfo }: CreatePostProps) {
    const [postTitle, setPostTitle] = useState('');
    const [postContent, setPostContent] = useState('');
    const [postPhoto, setPostPhoto] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [postPrivacy, setPostPrivacy] = useState('');
    const [visibility, setVisibility] = useState<string>('private');
    const [isPostContainerVisible, setIsPostContainerVisible] = useState(true);
    const [isChooseUsersOpen, setIsChooseUsersOpen] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<UserSearch[]>([]);

    const handleVisibilityChange = (event: ChangeEvent<HTMLInputElement>) => {
        setVisibility(event.target.value);
    };
    const handleChooseUsers = () => {
        setIsChooseUsersOpen(!isChooseUsersOpen);
    };
    const handleSelectedUsersChange = (users: UserSearch[]) => {
        setSelectedUsers(users);
    };

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
            let selectedPrivacy: string
            let showPrivacy: string
            if (visibility == "choose_users") {
                selectedPrivacy = (selectedUsers.map((user) => user.id)).join()
                showPrivacy = "private"
            } else {
                selectedPrivacy = visibility;
                showPrivacy = visibility
            }
            console.log(selectedPrivacy)
            const response = await fetch('/api/createPost', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    title: postTitle,
                    content: postContent,
                    photo: postPhoto,
                    privacy: selectedPrivacy,
                    profilePicture: profilePicture,
                }),
            });

            if (response.ok) {
                setIsPostContainerVisible(false);

                const newPost: PostData = await response.json();
                setPosts(prevPosts => [newPost, ...prevPosts]);

                setPostTitle('');
                setPostContent('');
                setPostPhoto('');
                setProfilePicture('');
                setPostPrivacy(showPrivacy);
                setSelectedUsers([])
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
                        <label htmlFor="private" className={`${s.buttons} ${visibility === 'private' ? s.selected : ''}`}>
                            <input
                                type="radio"
                                id="private"
                                name="visibility"
                                value="private"
                                checked={visibility === 'private'}
                                onChange={handleVisibilityChange}
                            />
                            private
                        </label>

                        <label htmlFor="public" className={`${s.buttons} ${visibility === 'public' ? s.selected : ''}`}>
                            <input
                                type="radio"
                                id="public"
                                name="visibility"
                                value="public"
                                checked={visibility === 'public'}
                                onChange={handleVisibilityChange}
                            />
                            public
                        </label>

                        {isChooseUsersOpen && (
                            <div className={s.popup}>
                                <ChooseUsers handleChooseUsers={handleChooseUsers} selectedUsers={selectedUsers} onSelectedUsersChange={handleSelectedUsersChange} />
                            </div>
                        )}
                        <label htmlFor="choose_users" className={`${s.buttons} ${visibility === 'choose_users' ? s.selected : ''}`}>
                            <input
                                type="radio"
                                id="choose_users"
                                name="visibility"
                                value="choose_users"
                                checked={visibility === 'choose_users'}
                                onChange={handleVisibilityChange}
                                onClick={handleChooseUsers}
                            />
                            choose users
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
                            <img src={postPhoto} />
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

