import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getAge } from '../utils/participantUtils';

describe('participantUtils', () => {
    describe('getAge', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('should return "-" if no birthDate is provided', () => {
            expect(getAge(null)).toBe('-');
        });

        it('should calculate the correct age', () => {
            // Mock date to 2026-03-07 to be sure we crossed the 10th anniversary
            const date = new Date(2026, 2, 7);
            vi.setSystemTime(date);

            expect(getAge('2016-03-06')).toContain('10 ans');
            expect(getAge('2015-03-06')).toContain('11 ans');
        });
    });
});
