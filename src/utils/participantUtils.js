export const getAge = (birthDate) => {
    if (!birthDate) return '-';
    return Math.floor((Date.now() - new Date(birthDate).getTime()) / (1000 * 60 * 60 * 24 * 365.25)) + ' ans';
};
