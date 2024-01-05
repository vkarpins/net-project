export const joinLeaveGroup = async (groupId: number, userId: number, session: string, isJoin: boolean) => {
    const action = isJoin ? 'join' : 'leave';
    const fetchInfo = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': session,
        },
        body: JSON.stringify({
            groupId: groupId,
            userId: userId,
        }),
    }
    let response: any;
    switch (action) {
        case 'join': response = await fetch('/api/joinGroup', fetchInfo);
            break;
        case 'leave': response = await fetch('/api/leaveGroup', fetchInfo);
            break;
    }

    if (response.ok) {
        return response.json();
    } else {
        throw new Error(`Failed to ${action} group: ${await response.text()}`);
    }
};