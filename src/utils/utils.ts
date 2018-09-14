export default {
    range: function (val, min, max): number {
        return Math.min(Math.max(val, min), max);
    }
}