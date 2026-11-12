/**
 * Project-wide constants derived from the course rules (قواعد پروژه).
 */

/** Phase 1 data scope starts at 1402/01/01 (Solar Hijri) = 2023-03-21. */
export const DATA_START_DATE = '2023-03-21';

/** Backend cap for GET /daily-history `limit` — enough for ~4 years of trading days. */
export const DAILY_HISTORY_MAX_LIMIT = 1000;

/** Acceptance target from the rules: tick/daily coverage ≥ 98% of traded days. */
export const COVERAGE_TARGET_PCT = 98;
