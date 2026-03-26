/* eslint-disable */

  import { z, ZodType } from 'zod/v4';
  import { processResponseBody, uniqueItems } from './util';

  /**
   * Zod only supports string enums at the moment. A previous issue was opened
   * and closed as stale but it provided a hint on how to implement it.
   *
   * @see https://github.com/colinhacks/zod/issues/1118
   * TODO: PR an update for zod to support other native enum types
   */
  const IntEnum = <T extends readonly number[]>(values: T) => 
      z.number().refine((v) => values.includes(v)) as ZodType<T[number]>;

  /** Helper to ensure booleans provided as strings end up with the correct value */
  const SafeBoolean = z.preprocess(v => v === "false" ? false : v, z.coerce.boolean())
  
export const DailyMileageRow = z.preprocess(processResponseBody,z.object({"day": z.string(),
"miles": z.number(),
}))

/**
* Error information from a response.
 */
export const Error = z.preprocess(processResponseBody,z.object({"errorCode": z.string().optional(),
"message": z.string(),
"requestId": z.string(),
}))

export const FromDateMileageResponse = z.preprocess(processResponseBody,z.object({"miles": z.number(),
}))

export const HealthResponse = z.preprocess(processResponseBody,z.object({"status": z.string(),
}))

export const WeeklyMileageRow = z.preprocess(processResponseBody,z.object({"miles": z.number(),
"week": z.string(),
}))

export const HealthCheckParams = z.preprocess(processResponseBody, z.object({
  path: z.object({
  }),
  query: z.object({
  }),
}))

export const DailyMileageParams = z.preprocess(processResponseBody, z.object({
  path: z.object({
  }),
  query: z.object({
  }),
}))

export const MileageFromDateParams = z.preprocess(processResponseBody, z.object({
  path: z.object({
  }),
  query: z.object({
  date: z.string(),
  }),
}))

export const WeeklyMileageParams = z.preprocess(processResponseBody, z.object({
  path: z.object({
  }),
  query: z.object({
  }),
}))

