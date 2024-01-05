import { SearchResult, UserSearch } from "@/types/types";
import { ChangeEvent, useEffect, useState } from "react";
import { UserAvatar } from "./chatHelpers";
import s from '../pages/group/group.module.css';
import Image from 'next/image';

interface ChooseUsersProps {
    handleChooseUsers: () => void;
    selectedUsers: UserSearch[];
    onSelectedUsersChange: (users: UserSearch[]) => void;
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

export const ChooseUsers = ({ handleChooseUsers, selectedUsers, onSelectedUsersChange }: ChooseUsersProps) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);
    const [selectedOptions, setSelectedOptions] = useState<UserSearch[]>(selectedUsers);

    useEffect(() => {
        setSelectedOptions(selectedUsers);
    }, [selectedUsers]);

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
        console.log(selectedOptions)
        onSelectedUsersChange(selectedOptions);
        handleChooseUsers()

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
                </div>
            )}
            <button className={s.inviteSubmitBut} onClick={handleSubmit}>choose</button>
        </div>
    )
}