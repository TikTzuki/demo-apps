import {describe, expect, it} from "vitest";
import {buildPolicyExamples} from "./examples";
import {DEFAULT_POLICY} from "./compute";
import {formatDuration} from "./time";

describe("buildPolicyExamples", () => {
    it("describes the default policy correctly", () => {
        const [normal, evening, night] = buildPolicyExamples(DEFAULT_POLICY);

        expect(normal).toMatchObject({shift: "08:00 → 18:00", regularMinutes: 480, otMinutes: 0});
        expect(evening).toMatchObject({shift: "08:00 → 22:00", regularMinutes: 480, otMinutes: 240});

        // Goes home at 18:30, returns 22:00 and works to 02:00. The night leg
        // stops at midnight, so 30min + 2h — not the 4h30 of the old rules.
        expect(night.shift).toBe("08:00 → 18:30, quay lại 22:00 → 02:00");
        expect(night.otMinutes).toBe(150);
    });

    it("never mentions a separate night-overtime figure", () => {
        const keys = Object.keys(buildPolicyExamples(DEFAULT_POLICY)[0]);
        expect(keys).toEqual(["shift", "regularMinutes", "otMinutes"]);
    });

    it("follows the policy when the thresholds move", () => {
        const [, evening] = buildPolicyExamples({...DEFAULT_POLICY, otStartTime: "17:00"});
        // OT now starts an hour earlier, so the same evening earns an hour more.
        expect(evening.otMinutes).toBe(300);
    });

    it("follows the cutoff: a 05:00 day lets the night leg run longer", () => {
        const [, , night] = buildPolicyExamples({...DEFAULT_POLICY, dayCutoffHour: 5});
        // With the old 05:00 cutoff the 22:00 → 02:00 leg counts in full again.
        expect(night.otMinutes).toBe(30 + 240);
        expect(formatDuration(night.otMinutes)).toBe("4h30");
    });
});
