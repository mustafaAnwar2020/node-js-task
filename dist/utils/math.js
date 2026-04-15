export function average(numbers, fallback = 0) {
    if (numbers.length === 0)
        return fallback;
    return numbers.reduce((acc, value) => acc + value, 0) / numbers.length;
}
export function median(numbers, fallback = 0) {
    if (numbers.length === 0)
        return fallback;
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
        return (sorted[mid - 1] + sorted[mid]) / 2;
    }
    return sorted[mid];
}
export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}
