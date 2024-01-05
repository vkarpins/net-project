export const fetchData = async (url: string, method: 'GET' | 'POST' | 'PUT' | 'DELETE', headers: Record<string, string>) => {
    const response = await fetch(url, {
        method: method,
        headers: headers,
    });
    if (response.status == 401) {
        throw new Error('Unautorized');
    }
    if (!response.ok) {
        const errorMessage = await response.text()
        throw new Error(`Failed to fetch data. ${errorMessage}`);
    }
    return await response.json();
};