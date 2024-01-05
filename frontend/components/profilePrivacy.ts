export { handlePrivacyToggle };

const handlePrivacyToggle = async (userId: number, isPrivate: boolean) => {
    try {
        const response = await fetch('/api/updatePrivacy', {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                UserId: userId,
                IsPrivate: isPrivate,
            }),
        });
        if (!response.ok) {
            throw new Error('Failed to update profile privacy');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error(error);
        throw error; 
    }
}