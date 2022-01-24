const getOrThrow = (key: string): string => {
    const value = process.env[key];
    if (!value) {
        throw new Error(`Missing environment variable ${key}`);
    }
    return value;
};

export default {
    port: parseInt(getOrThrow('PORT')),
};
