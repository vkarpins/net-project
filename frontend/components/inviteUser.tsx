import { SearchResult, UserSearch } from "@/types/types";
import { ChangeEvent, useState } from "react";
import { UserAvatar } from "./chatHelpers";
import s from '../pages/group/group.module.css';
import Image from 'next/image';

interface InviteUsersProps {
    groupId: number;
    setErrorMessage: (message: string) => void;
    handleInviteUser: () => void;
}


const fetchSearch = async (query: string) => {
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&endpoint=search/followers`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });
        if (!response.ok) {
            const errorMessage = await response.text();
            throw new Error(`Failed to search. ${errorMessage}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error occurred while searching', error);
    }
}

export const InviteUser = ({ groupId, setErrorMessage, handleInviteUser }: InviteUsersProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<UserSearch[]>([]);

    const shouldDisplayUser = (user: UserSearch) => {
        return !selectedOptions.some((selectedUser) => selectedUser.id === user.id);
    };

    const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value
        setQuery(query);

        if (query) {
            const fetchedResults = await fetchSearch(query);
            setResults(fetchedResults);
        } else {
            setResults(null);
        }
    }

    const handleChecking = (user: UserSearch) => {
        setSelectedOptions(prevSelectedOptions => {
            const index = prevSelectedOptions.findIndex((selectedUser) => selectedUser.id === user.id);
            if (index !== -1) {
                return [...prevSelectedOptions.slice(0, index), ...prevSelectedOptions.slice(index + 1)];
            } else {
                return [...prevSelectedOptions, user];
            }
        });
    }

    const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
        event.preventDefault();
        handleInviteUser()
        try {
            const response = await fetch('/api/inviteUsers', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    usersId: selectedOptions.map((user) => user.id),
                    groupId: groupId
                }),
            });
            interface PromiseResProps {
                message: string;
                status: string;
            };
            response.json().then((result: PromiseResProps) => {
                setErrorMessage(result.message)
            })
            if (!response.ok) {
                console.error('Failed to invite users: ', await response.text());
            }
        } catch (error) {
            console.error('An error occurred while inviting users:', error);
        }
    };


    return (
        <div className={s.searchResults}>
            <div className={s.searchBarContainer}>
                <Image priority src="/images/search.svg" className={s.searchIcon} height={18} width={16} alt="icon" />
                <input
                    type="text"
                    placeholder="Search for users"
                    className={s.searchBar}
                    value={query}
                    onChange={handleSearchChange}
                />
            </div>
            {results && (results.users?.length > 0) && (
                <div className={s.resultItem}>
                    {results.users
                        .filter(shouldDisplayUser)
                        .map((user) => (
                            <div key={user.id} className={s.resultNameAvatarContainer}>
                                <div className={s.resultAvatar}><UserAvatar avatarUrl={user.avatar} /> </div>
                                <div className={s.resultName}>{user.firstName} {user.lastName} </div>
                                <label htmlFor={`${user.id}`} className={s.radioButtonLabel}>
                                    <input
                                        type="checkbox"
                                        id={`${user.id}`}
                                        value={`${user.id}`}
                                        onChange={() => handleChecking(user)}
                                        checked={selectedOptions.some(selectedUser => selectedUser.id === user.id)}
                                    /><span className={s.customRadio}></span>
                                </label>
                            </div>
                        ))}
                </div>
            )}
            {selectedOptions && (selectedOptions.length > 0) && (
                <div className={s.resultItem}>
                    {selectedOptions.map((user) => (
                        <div key={user.id} className={s.resultNameAvatarContainer}>
                            <div className={s.resultAvatar}><UserAvatar avatarUrl={user.avatar} /> </div>
                            <div className={s.resultName}>{user.firstName} {user.lastName} </div>
                            <label htmlFor={`${user.id}`} className={s.radioButtonLabel}>
                                <input
                                    type="checkbox"
                                    id={`${user.id}`}
                                    value={`${user.id}`}
                                    onChange={() => handleChecking(user)}
                                    checked={selectedOptions.some(selectedUser => selectedUser.id === user.id)}
                                /><span className={s.customRadio}></span>
                            </label>
                        </div>
                    ))}
                    <button className={s.inviteSubmitBut} onClick={handleSubmit}>Invite</button>
                </div>
            )}
        </div>
    )
}