type LegacyQueryBuilder = {
  data: null;
  delete: (..._args: unknown[]) => LegacyQueryBuilder;
  eq: (..._args: unknown[]) => LegacyQueryBuilder;
  error: Error;
  gte: (..._args: unknown[]) => LegacyQueryBuilder;
  ilike: (..._args: unknown[]) => LegacyQueryBuilder;
  in: (..._args: unknown[]) => LegacyQueryBuilder;
  insert: (..._args: unknown[]) => LegacyQueryBuilder;
  is: (..._args: unknown[]) => LegacyQueryBuilder;
  limit: (..._args: unknown[]) => LegacyQueryBuilder;
  lte: (..._args: unknown[]) => LegacyQueryBuilder;
  match: (..._args: unknown[]) => LegacyQueryBuilder;
  maybeSingle: <T = Record<string, unknown>>(..._args: unknown[]) => {
    data: T | null;
    error: Error;
  };
  neq: (..._args: unknown[]) => LegacyQueryBuilder;
  not: (..._args: unknown[]) => LegacyQueryBuilder;
  or: (..._args: unknown[]) => LegacyQueryBuilder;
  order: (..._args: unknown[]) => LegacyQueryBuilder;
  range: (..._args: unknown[]) => LegacyQueryBuilder;
  select: (..._args: unknown[]) => LegacyQueryBuilder;
  single: <T = Record<string, unknown>>(..._args: unknown[]) => {
    data: T | null;
    error: Error;
  };
  update: (..._args: unknown[]) => LegacyQueryBuilder;
};

const disabledError = new Error(
  "Legacy data source is disabled. Use the active PHP/MySQL admin endpoints instead.",
);

const legacyQueryBuilder: LegacyQueryBuilder = {
  data: null,
  delete: () => legacyQueryBuilder,
  eq: () => legacyQueryBuilder,
  error: disabledError,
  gte: () => legacyQueryBuilder,
  ilike: () => legacyQueryBuilder,
  in: () => legacyQueryBuilder,
  insert: () => legacyQueryBuilder,
  is: () => legacyQueryBuilder,
  limit: () => legacyQueryBuilder,
  lte: () => legacyQueryBuilder,
  match: () => legacyQueryBuilder,
  maybeSingle: () => ({
    data: null,
    error: disabledError,
  }),
  neq: () => legacyQueryBuilder,
  not: () => legacyQueryBuilder,
  or: () => legacyQueryBuilder,
  order: () => legacyQueryBuilder,
  range: () => legacyQueryBuilder,
  select: () => legacyQueryBuilder,
  single: () => ({
    data: null,
    error: disabledError,
  }),
  update: () => legacyQueryBuilder,
};

export function createAdminSupabaseClient() {
  return {
    from: (...args: unknown[]) => {
      void args;

      return legacyQueryBuilder;
    },
    rpc: async (...args: unknown[]) => {
      void args;

      return {
        data: null,
        error: disabledError,
      };
    },
  };
}
