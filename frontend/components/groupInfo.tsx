import { GroupInfoData, UserInfo } from "@/types/types";
import s from './groupPage.module.css';

interface GroupInfoProps extends GroupInfoData {
    userInfo: UserInfo;
    onFollowToggle: (groupId: number) => void;
}

export default function GroupInfo({ id, creatorId, groupName, groupDescription, userInfo, onFollowToggle }: GroupInfoProps) {
    const isUserMember = userInfo.userGroups?.includes(id) ?? false;

    const handleFollowToggle = (event: React.MouseEvent) => {
        event.preventDefault();
        onFollowToggle(id);

    };
    return (
        <div className={s.groupWrapper}>
            <div className={s.groupContainer} >
                <div className={s.groupTitleFollow}>
                    <div className={s.groupTitleContainer}>
                        {creatorId != userInfo.id && (
                            <div className={s.groupFollow} onClick={handleFollowToggle}>
                                {isUserMember ? 'unfollow' : 'follow'}
                            </div>
                        )}
                        <div className={s.groupTitle}>{groupName}</div>
                    </div>
                    <p className={s.groupDescriptionText}>Description:</p>
                    <div className={s.groupDescription}>{groupDescription}</div>
                </div>
            </div>
        </div>
    )
}