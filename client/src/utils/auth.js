/**
 * Safe utility for reading user information from localStorage.
 * Prevents crashes caused by malformed JSON or null values.
 */
export const getSafeUser = () => {
    try {
        const userStr = localStorage.getItem('userInfo');
        if (!userStr) return null;

        // Anti-corruption check
        if (userStr === "[object Object]" || userStr.trim() === "") {
            localStorage.removeItem('userInfo');
            return null;
        }

        const user = JSON.parse(userStr);
        return (user && typeof user === 'object') ? user : null;
    } catch (err) {
        console.error("Auth Utility Error: Corrupt userInfo cleared.");
        localStorage.removeItem('userInfo');
        return null;
    }
};

export const getAuthToken = () => {
    const user = getSafeUser();
    return user?.token || null;
};
