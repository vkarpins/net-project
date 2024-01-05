import { SearchResult } from "@/types/types";
import { ChangeEvent, useState } from "react";
import { UserAvatar } from "./chatHelpers";
import Link from "next/link";
import s from './header.module.css';
import Image from 'next/image';

const fetchSearch = async (query: string) => {
    try {
        const response = await fetch(`/api/search?query=${encodeURIComponent(query)}&endpoint=search`, {
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

export const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult | null>(null);

    const handleSearchChange = async (event: ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value
        setQuery(query);

        if (query) {
            const fetchedResults = await fetchSearch(event.target.value);
            setResults(fetchedResults);
        } else {
            setResults(null);
        }
    }

    return (
        <div className={s.searchBarContainer}>
          <input
            type="text"
            placeholder="Search for users or groups"
            className={s.searchBar}
            value={query}
            onChange={handleSearchChange}
          />
          <Image priority src="/images/search.svg" className={s.searchIcon} height={18} width={16} alt="icon" />
          {results && (
            <div className={s.searchResults}>
              {results.users?.length > 0 || results.groups?.length > 0 ? (
                // Display search results
                <>
                  {results.users?.map((user) => (
                    <div key={user.id} className={s.resultItem}>
                      <Link href={`/profile/${user.id}`}>
                        <div className={s.resultNameAvatarContainer}>
                          <div className={s.resultAvatar}><UserAvatar avatarUrl={user.avatar} /> </div>
                          <div className={s.resultName}>{user.firstName} {user.lastName} </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                  {results.groups?.map((group, index) => (
                    <div key={index} className={s.resultItem}>
                      <Link href={`/group/${group.id}`}>
                        <div className={s.resultNameAvatarContainer}>
                          <div className={s.resultAvatar}><Image src="/images/default_group_avatar.svg" alt={"Group Avatar"} width={100} height={100} /></div>
                          <div className={s.resultName}>{group.groupName}</div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </>
              ) : (
                <div className={s.resultNothing}>Nothing was found :(</div>
              )}
            </div>
          )}
        </div>
      );
}