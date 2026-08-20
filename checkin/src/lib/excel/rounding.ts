/**
 * Payroll rounding: the smallest unit anybody is paid in is half an hour.
 *
 * Thresholds, applied to the remainder of each hour:
 *   < 15 phút        -> 0
 *   15 to < 45 phút  -> 0.5
 *   >= 45 phút       -> 1
 *
 * Which is simply "to the nearest half hour". Done in integer arithmetic rather
 * than Math.round on a quotient, so a value sitting exactly on a boundary can
 * never fall the wrong way through floating point.
 */
export function roundToHalfHour(minutes: number): number {
    if (minutes <= 0) return 0;
    return Math.floor((minutes + 15) / 30) / 2;
}
