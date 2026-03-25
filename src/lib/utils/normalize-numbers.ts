
export const num = (x: any, d = 0) => {
    const n = Number(x);
    return Number.isFinite(n) ? n : d;
}
