export const getAge = (birthDate) => {
    if (!birthDate) return '-';
    const b = new Date(birthDate);
    if (isNaN(b.getTime())) return '-';
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a + ' ans';
};
