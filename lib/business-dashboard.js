export const BUSINESS_DASHBOARD_LIMIT = 5;
export const BUSINESS_DASHBOARD_TIMEOUT_MS = 12000;

export const BUSINESS_DASHBOARD_SECTIONS = {
  jobs: { table: 'jobs', ownerColumn: 'posted_by', countFilters: [{ column: 'status', value: 'open' }], itemFilters: [{ column: 'status', value: 'open' }], select: 'id, title, status, created_at' },
  proposals: { table: 'proposals', ownerColumn: 'job_owner_id', countFilters: [], itemFilters: [], select: 'id, job_id, status, created_at, jobs(title)' },
  contracts: { table: 'contracts', ownerColumn: 'business_id', countFilters: [{ column: 'status', value: 'active' }], itemFilters: [{ column: 'status', value: 'active' }], select: 'id, job_id, title, status, due_date, created_at' },
  payments: { table: 'payments', ownerColumn: 'business_id', countFilters: [], itemFilters: [], select: 'id, contract_id, status, payment_date, created_at, contracts(title)' },
};

function requireClient(client) {
  if (!client) throw new Error('The business dashboard is unavailable because Supabase is not configured.');
  return client;
}

function sectionConfig(section) {
  const config = BUSINESS_DASHBOARD_SECTIONS[section];
  if (!config) throw new Error('Unknown business dashboard section.');
  return config;
}

function applyFilters(query, filters) {
  return filters.reduce((current, filter) => current.eq(filter.column, filter.value), query);
}

function throwIfError(error, fallbackMessage) {
  if (error) throw new Error(error.message || fallbackMessage);
}

export async function withBusinessDashboardTimeout(operation, fallbackMessage) {
  const controller = new AbortController();
  let timeout;
  const timedOut = new Promise((_, reject) => {
    timeout = setTimeout(() => {
      controller.abort();
      reject(new Error(`${fallbackMessage} Please try again.`));
    }, BUSINESS_DASHBOARD_TIMEOUT_MS);
  });

  try {
    return await Promise.race([operation(controller.signal), timedOut]);
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchBusinessDashboardCount(client, userId, section) {
  const supabase = requireClient(client);
  const config = sectionConfig(section);
  const { count, error } = await withBusinessDashboardTimeout((signal) => {
    let query = supabase.from(config.table).select('id', { count: 'exact', head: true }).eq(config.ownerColumn, userId);
    query = applyFilters(query, config.countFilters);
    return query.abortSignal(signal);
  }, `Loading ${section} timed out.`);

  throwIfError(error, `Unable to load ${section}.`);
  return count ?? 0;
}

export async function fetchBusinessDashboardItems(client, userId, section) {
  const supabase = requireClient(client);
  const config = sectionConfig(section);
  const { data, error } = await withBusinessDashboardTimeout((signal) => {
    let query = supabase.from(config.table).select(config.select).eq(config.ownerColumn, userId);
    query = applyFilters(query, config.itemFilters);
    return query.order('created_at', { ascending: false }).order('id', { ascending: false }).limit(BUSINESS_DASHBOARD_LIMIT).abortSignal(signal);
  }, `Loading ${section} timed out.`);

  throwIfError(error, `Unable to load ${section}.`);
  return Array.isArray(data) ? data.slice(0, BUSINESS_DASHBOARD_LIMIT) : [];
}
