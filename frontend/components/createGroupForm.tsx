import { useState } from "react";
import s from './createGroupForm.module.css';
import { GroupInfoData } from "@/types/types";

interface CreateGroupProps {
    setErrorMessage:  (message: string) => void;
    setGroups: React.Dispatch<React.SetStateAction<GroupInfoData[]>>;
    cancelGroupCreation: () => void;
}

export function CreateGroup({ setGroups, cancelGroupCreation, setErrorMessage }: CreateGroupProps) {
    const [groupTitle, setGroupTitle] = useState('');
    const [groupContent, setGroupContent] = useState('');
    const [isGroupContainerVisible, setIsGroupContainerVisible] = useState(true);


    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();

        if (groupTitle.trim() === '' || groupContent.trim() === '') {
            alert('Title and content are required.');
            return;
        }

        try {
            // debugger
            const response = await fetch('/api/createGroup', {
                
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    groupName: groupTitle,
                    groupDescription: groupContent,
                }),
            });
            
            if (response.ok) {
                setIsGroupContainerVisible(false);

                const newGroup: GroupInfoData = await response.json();
                setGroups(prevGroups => [newGroup, ...prevGroups]);

                setGroupTitle('');
                setGroupContent('');
                cancelGroupCreation();

            } else {
                interface PromiseResProps {
                    message: string;
                    status: string;
                };
                response.json().then((result: PromiseResProps) => {
                    setErrorMessage(result.message)
                })
                // console.error('Failed to create group: ', await response.text());
            }
        } catch (error) {
            console.error('An error occurred while creating the group:', error);
        }
    };

    return (
        <div className={`${s.groupFormContainer} ${isGroupContainerVisible ? '' : s.groupContainerHidden}`}>

            <div className={s.groupTitleSubmit}>
                <input
                    className={s.groupTitle}
                    type="text"
                    placeholder="Add groupname"
                    value={groupTitle}
                    onChange={(e) => setGroupTitle(e.target.value)}
                />

                <button onClick={handleSubmit} className={s.submit}>Submit</button>
            </div>


            <textarea
                placeholder="Add description"
                className={s.contentField}
                value={groupContent}
                onChange={(e) => setGroupContent(e.target.value)}
            ></textarea>


        </div>
    )
}

