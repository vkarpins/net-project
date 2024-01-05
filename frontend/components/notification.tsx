import { FollowRequest, NotificationData } from '@/types/types';
import { FC, useCallback, useEffect, useState } from 'react';
import s from './header.module.css';
import Image from 'next/image';
import { FollowRequestsComponent } from './displayFollow';

type NotificationCallback = (notification: NotificationData) => void;
interface NotificationProps {
  token: string;
  onNotificationClick: (chatId: number) => void;
  setErrorMessage: (message: string) => void;
}

const useNotificationWebSocket = (
  token: string,
  receivedNotification: NotificationCallback
) => {
  useEffect(() => {
    const webSocket = new WebSocket(
      `ws://localhost:8080/notification?authorization=${token}`
    );
    console.log('notification websocket created');
    webSocket.onmessage = (event) => {
      const notification: NotificationData = JSON.parse(event.data);
      console.log('notification websocket message received:', notification);
      receivedNotification(notification);
    };

    webSocket.onerror = (event) => {
      console.error(`notification websocket Error:`, event);
    };

    webSocket.onclose = () => {
      console.log('notification websocket Disconnected');
    };
  }, [token, receivedNotification]);
};

export default useNotificationWebSocket;

export const NotificationComponent: FC<NotificationProps> = ({
  token,
  setErrorMessage,
}) => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  const [isNotificationPopupOpen, setNotificationPopupOpen] = useState(false);
  const [clickedNotificationId, setClickedNotificationId] = useState<number[]>(
    []
  );
  const [followRequests, setFollowRequests] = useState<FollowRequest[]>([]);

  const handleNewNotification = useCallback(
    (notification: NotificationData | FollowRequest) => {
      switch (notification.type) {
        case 'follow_request':
          setFollowRequests((prevFollowRequests) => {
            const updatedFollowRequests = [notification as FollowRequest, ...prevFollowRequests];
            return updatedFollowRequests;
          });
          break;
        default:
          setNotifications((prevNotifications) => {
            const updatedNotifications = [notification as NotificationData, ...prevNotifications];
            return updatedNotifications;
          });
      }
    },
    []
  );
  useNotificationWebSocket(token, handleNewNotification);

  useEffect(() => {
    const fetchNotifications = async () => {
      const fetchedNotifications = await FetchNotifications();
      setNotifications(fetchedNotifications.groupNotifications || []);
      setFollowRequests(fetchedNotifications.userNotifications || []);
    };

    fetchNotifications();
  }, []);

  const handleNotificationIconClick = () => {
    setNotificationPopupOpen(!isNotificationPopupOpen);
  };

  const handleAcceptDeclineClick = async (
    notification: NotificationData,
    action: string
  ) => {
    try {
      const fetchInfo = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requesterId: notification.requesterId,
          groupId: notification.groupId,
          type: notification.type,
        }),
      };
      let response: any;
      switch (action) {
        case 'accept':
          response = await fetch('/api/acceptGroupRequest', fetchInfo);
          break;
        case 'decline':
          response = await fetch('/api/declineGroupRequest', fetchInfo);
          break;
      }
      interface PromiseResProps {
        message: string;
        status: string;
      }
      response.json().then((result: PromiseResProps) => {
        if (result.status == 'error') {
          setErrorMessage(result.message);
        }
        if (result.status == 'success') {
          setClickedNotificationId((prevIds) => {
            if (!prevIds.includes(notification.id)) {
              return [...prevIds, notification.id];
            }
            return prevIds;
          });
        }
      });
    } catch (error) {
      console.error(error);
    }
  };

  const areNotificationsEmpty =
    notifications.length === 0 && followRequests.length === 0;

  return (
    <div className={s.notifContainer}>
      <Image
        priority
        src='/images/icon_notification.svg'
        className={s.notificIcon}
        height={18}
        width={16}
        alt='icon'
        onClick={handleNotificationIconClick}
      />
      {isNotificationPopupOpen && (
        <div className={s.notifContainer}>
          <div className={s.notifResultComponent}>
            <>
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={s.resultNameAvatarContainer}
                >
                  <div className={s.resultName}>{notification.content}</div>
                  {['invite_group_request', 'join_request'].includes(
                    notification.type
                  ) &&
                    notification.status === 'pending' &&
                    !clickedNotificationId.includes(notification.id) && (
                      <div className={s.buttonContainer}>
                        <button
                          className={s.acceptBut}
                          onClick={() =>
                            handleAcceptDeclineClick(notification, 'accept')
                          }
                        >
                          accept
                        </button>
                        <button
                          className={s.declineBut}
                          onClick={() =>
                            handleAcceptDeclineClick(notification, 'decline')
                          }
                        >
                          decline
                        </button>
                      </div>
                    )}
                </div>
              ))}
              {followRequests.length > 0 && (
                <FollowRequestsComponent requests={followRequests} />
              )}
            </>
            {areNotificationsEmpty && (
              <div className={s.noNotification}>No notifications</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

async function FetchNotifications(): Promise<{
  userNotifications: FollowRequest[] | null;
  groupNotifications: NotificationData[] | null;
}> {
  try {
    const response = await fetch(`/api/notification`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error(error);
    return { userNotifications: null, groupNotifications: null };
  }
}
