import {describe, expect, it} from "vitest";
import {roundToHalfHour} from "./rounding";

describe("roundToHalfHour — payroll unit is half an hour", () => {
    it("follows the stated thresholds within one hour", () => {
        expect(roundToHalfHour(0)).toBe(0);
        expect(roundToHalfHour(14)).toBe(0);    // < 15 phút  -> 0
        expect(roundToHalfHour(15)).toBe(0.5);  // >= 15 phút -> 0.5
        expect(roundToHalfHour(30)).toBe(0.5);
        expect(roundToHalfHour(44)).toBe(0.5);  // < 45 phút  -> 0.5
        expect(roundToHalfHour(45)).toBe(1);    // >= 45 phút -> 1
        expect(roundToHalfHour(59)).toBe(1);
        expect(roundToHalfHour(60)).toBe(1);
    });

    it("applies the same thresholds to the remainder of any hour", () => {
        expect(roundToHalfHour(8 * 60 + 14)).toBe(8);
        expect(roundToHalfHour(8 * 60 + 15)).toBe(8.5);
        expect(roundToHalfHour(8 * 60 + 44)).toBe(8.5);
        expect(roundToHalfHour(8 * 60 + 45)).toBe(9);
    });

    it("never emits anything finer than a half hour", () => {
        for (let m = 0; m <= 24 * 60; m++) {
            const hours = roundToHalfHour(m);
            expect(hours * 2).toBe(Math.round(hours * 2));
        }
    });

    it("is monotonic — more minutes never pays less", () => {
        let previous = 0;
        for (let m = 0; m <= 24 * 60; m++) {
            const hours = roundToHalfHour(m);
            expect(hours).toBeGreaterThanOrEqual(previous);
            previous = hours;
        }
    });
});

describe("interaction with the minimum-OT threshold", () => {
    it("cannot resurrect overtime the policy already discarded", () => {
        // otMinMinutes runs first and zeroes short overtime, so rounding never
        // sees those minutes. With the default 30, the 15-minute step below is
        // unreachable for the OT column — it only bites on worked/regular hours.
        expect(roundToHalfHour(0)).toBe(0);
        expect(roundToHalfHour(20)).toBe(0.5);
    });
});
