import {
  FollowRequestsProps,
  FollowersProps,
  FollowingProps,
} from '@/types/types';
import Link from 'next/link';
import { FC, useState } from 'react';
import s from './displayFollow.module.css';
import { UserAvatar } from './chatHelpers';

export {
  GetFollowData as GetFollowerData,
  FollowersComponent,
  FollowingComponent,
  HandleFollow,
  FollowRequestsComponent,
};

async function GetFollowData(userId: number, type: 'followers' | 'following') {
  try {
    const response = await fetch(
      `/api/fetchFollow?action=fetch&type=${type}&userId=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(
        `Failed to fetch followers and following. ${errorMessage}`
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function HandleFollow(action: 'follow' | 'unfollow', userId: number) {
  let method = action === 'unfollow' ? 'DELETE' : 'POST';
  let body = { receiverId: userId };

  try {
    const response = await fetch(`/api/fetchFollow?action=${action}&userId=${userId}`, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: method !== 'DELETE' ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to follow. ${errorMessage}`);
    }
    const data = await response.json();
    console.log('handlwfollow', data)
    return data;
  } catch (error) {
    console.error(error);
  }
}

async function HandleAcceptAndDeclineRequest(
  action: 'accept' | 'decline',
  requesterId: number,
) {
  try {
    const response = await fetch(
      `/api/acceptAndDeclineRequests?action=${action}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ requesterId: requesterId }),
      }
    );

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to follow. ${errorMessage}`);
    }
    const data = await response.json();
    console.log('data', data)
    return data;
  } catch (error) {
    console.error(error);
  }
}

const FollowersComponent: FC<FollowersProps> = ({
  followers,
  loggedInUserId,
}) => {
  return (
    <div className={s.mainContainer}>
      {followers?.length > 0 ? (
        followers.map((follower) => (
          <div key={follower.id} className={s.resultItem}>
            {follower.id === loggedInUserId ? (
              <Link href='/profile'>
                <div className={s.resultNameAvatarContainer}>
                  <div className={s.resultAvatar}>
                    <UserAvatar avatarUrl={follower.avatar} />{' '}
                  </div>
                  <div className={s.resultName}>
                    {follower.firstName} {follower.lastName}{' '}
                  </div>
                </div>
              </Link>
            ) : (
              <Link href={`/profile/${follower.id}`}>
                <div className={s.resultNameAvatarContainer}>
                  <div className={s.resultAvatar}>
                    <UserAvatar avatarUrl={follower.avatar} />{' '}
                  </div>
                  <div className={s.resultName}>
                    {follower.firstName} {follower.lastName}{' '}
                  </div>
                </div>
              </Link>
            )}
          </div>
        ))
      ) : (
        <div className={s.noFollowWrapper}>
          <p className={s.noFollow}>No followers</p>
        </div>
      )}
    </div>
  );
};

const FollowingComponent: FC<FollowingProps> = ({
  following,
  loggedInUserId,
}) => {
  return (
    <div className={s.mainContainer}>
      {following?.length > 0 ? (
        following.map((follow) => (
          <div key={follow.id} className={s.resultItem}>
            {follow.id === loggedInUserId ? (
              <Link href='/profile'>
                <div className={s.resultNameAvatarContainer}>
                  <div className={s.resultAvatar}>
                    <UserAvatar avatarUrl={follow.avatar} />{' '}
                  </div>
                  <div className={s.resultName}>
                    {follow.firstName} {follow.lastName}{' '}
                  </div>
                </div>
              </Link>
            ) : (
              <Link href={`/profile/${follow.id}`}>
                <div className={s.resultNameAvatarContainer}>
                  <div className={s.resultAvatar}>
                    <UserAvatar avatarUrl={follow.avatar} />{' '}
                  </div>
                  <div className={s.resultName}>
                    {follow.firstName} {follow.lastName}{' '}
                  </div>
                </div>
              </Link>
            )}
          </div>
        ))
      ) : (
        <div className={s.noFollowWrapper}>
          <p className={s.noFollow}>No followings</p>
        </div>
      )}
    </div>
  );
};

const FollowRequestsComponent: FC<FollowRequestsProps> = ({ requests }) => {
  const [requestStatuses, setRequestStatuses] = useState<{
    [key: number]: string;
  }>({});

  const handleRequestAction = async (
    action: 'accept' | 'decline',
    requesterId: number,
  ) => {
    try {
      await HandleAcceptAndDeclineRequest(action, requesterId);
      setRequestStatuses((prevStatuses) => ({
        ...prevStatuses,
        [requesterId]: action === 'accept' ? 'accepted' : 'declined',
      }));
    } catch (error) {
      console.error('Error handling follow request:', error);
    }
  };
  return (
    <div>
      {requests.map((request) => (
        <div className={s.resultNameAvatarContainer} key={request.id}>
          <p className={s.resultName}>
            <span>
              {request.firstName} {request.lastName}
            </span>{' '}
            wants to follow you
          </p>
          {requestStatuses[request.requesterId] === 'accepted' && (
            <p className={s.resultName}>
              Great, you have accepted the follow request!
            </p>
          )}
          {requestStatuses[request.requesterId] === 'declined' && (
            <p className={s.resultName}>
              You have declined the follow request.
            </p>
          )}
          {requestStatuses[request.requesterId] === undefined && (
            <div className={s.buttonContainer}>
              <button
                className={s.acceptBut}
                onClick={() =>
                  handleRequestAction('accept', request.requesterId )
                }
              >
                accept
              </button>
              <button
                className={s.declineBut}
                onClick={() =>
                  handleRequestAction('decline', request.requesterId)
                }
              >
                decline
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
