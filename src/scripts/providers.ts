const form = document.querySelector<HTMLFormElement>('#provider-form')!;
const providerField = form.querySelector<HTMLSelectElement>('[name=provider]')!;
const keyField = form.querySelector<HTMLInputElement>('[name=apiKey]')!;
const modelField = form.querySelector<HTMLInputElement>('[name=model]')!;
const urlField = form.querySelector<HTMLInputElement>('[name=baseUrl]')!;
const fields = document.querySelector<HTMLFieldSetElement>('#provider-fields')!;
const tokenInput = document.querySelector<HTMLInputElement>('#operator-token')!;
const testButton = document.querySelector<HTMLButtonElement>('#test-provider')!;
const formStatus = document.querySelector<HTMLElement>('#form-status')!;
const catalog = document.querySelector<HTMLSelectElement>('#model-catalog')!;
const catalogLabel = document.querySelector<HTMLElement>('#model-catalog-label')!;
const discovery = document.querySelector<HTMLElement>('#provider-discovery')!;
const providerSearch = document.querySelector<HTMLInputElement>('#provider-search')!;
const providerCount = document.querySelector<HTMLElement>('#provider-count')!;
const providerList = document.querySelector<HTMLUListElement>('#router-providers')!;
const catalogNote = document.querySelector<HTMLElement>('#catalog-note')!;
const savedGroups = [...document.querySelectorAll<HTMLElement>('.provider-actions')];
const endpoints: Record<string, string> = { openai: 'https://api.openai.com/v1', anthropic: 'https://api.anthropic.com/v1', deepseek: 'https://api.deepseek.com/v1', openrouter: 'https://openrouter.ai/api/v1' };
const setStatus = (el: HTMLElement | null, state: string, text: string) => { if (el) { el.dataset.state = state; el.textContent = text; } };
const requestHeaders = (body: boolean) => ({ ...(body ? { 'content-type': 'application/json' } : {}), ...(tokenInput.value ? { 'x-admin-token': tokenInput.value } : {}) });
const post = (url: string, body?: unknown, signal?: AbortSignal) => fetch(url, { method: 'POST', headers: requestHeaders(body !== undefined), body: body !== undefined ? JSON.stringify(body) : undefined, signal });
const errorOf = async (response: Response) => String((await response.json().catch(() => ({}))).error ?? 'Please try again.').slice(0, 200);
let generation = 0;
let controller: AbortController | undefined;
let pendingStatus: HTMLElement | null = null;
let routerProviders: { name: string; slug: string }[] = [];

const filterProviders = () => {
  const term = providerSearch.value.trim().toLocaleLowerCase();
  const visible = routerProviders.filter((item) => `${item.name} ${item.slug}`.toLocaleLowerCase().includes(term));
  providerList.replaceChildren(...visible.map((item) => Object.assign(document.createElement('li'), { textContent: item.name })));
  providerCount.textContent = visible.length ? `${visible.length} of ${routerProviders.length} providers` : 'No providers match. Try another name.';
};
providerSearch.addEventListener('input', filterProviders);

const clearCatalog = () => {
  generation += 1; controller?.abort(); controller = undefined;
  if (pendingStatus) setStatus(pendingStatus, '', 'Test cancelled. Test again with the current settings.');
  pendingStatus = null;
  testButton.disabled = false;
  catalog.replaceChildren(new Option('Choose a reported model…', '')); catalog.hidden = true; catalogLabel.hidden = true;
  discovery.hidden = true; routerProviders = []; providerList.replaceChildren(); providerSearch.value = '';
  catalogNote.hidden = false;
  catalogNote.textContent = providerField.value === 'openrouter' ? 'Test your OpenRouter key to load available providers and models.' : 'Test your connection to load this provider’s model catalogue.';
  setStatus(formStatus, '', '');
};
const selectProvider = () => {
  clearCatalog();
  const saved = savedGroups.find((group) => group.dataset.provider === providerField.value);
  keyField.value = ''; modelField.value = saved?.dataset.model ?? ''; urlField.value = saved?.dataset.endpoint ?? '';
  urlField.placeholder = endpoints[providerField.value];
  document.querySelector('#p-key-hint')!.textContent = saved?.dataset.hasKey === 'true' ? 'Leave blank to keep the encrypted key already saved for this provider.' : 'Use a provider API key. A ChatGPT or Claude subscription does not include API access.';
};
providerField.addEventListener('change', selectProvider);
[keyField, urlField].forEach((field) => field.addEventListener('input', clearCatalog));
tokenInput.addEventListener('input', clearCatalog);
catalog.addEventListener('change', () => { if (catalog.value) modelField.value = catalog.value; });
selectProvider();

const renderCatalog = (payload: { models: unknown; providers?: unknown; catalogWarning?: unknown }, provider: string) => {
  if (!Array.isArray(payload.models) || payload.models.some((id) => typeof id !== 'string')) throw new Error('The provider returned an invalid model catalogue.');
  const models = payload.models as string[];
  catalog.replaceChildren(new Option('Choose a reported model…', ''), ...models.map((id) => new Option(id, id)));
  catalog.hidden = models.length === 0; catalogLabel.hidden = models.length === 0;
  if (models.includes(modelField.value)) catalog.value = modelField.value;
  catalogNote.hidden = false;
  catalogNote.textContent = `${models.length} model${models.length === 1 ? '' : 's'} reported. ${models.length ? 'Choose from the model list, or enter an identifier.' : 'You can still enter a model identifier manually.'}`;
  if (provider === 'openrouter' && Array.isArray(payload.providers)) {
    routerProviders = payload.providers.filter((item): item is { name: string; slug: string } => item && typeof item.name === 'string' && typeof item.slug === 'string');
    discovery.hidden = routerProviders.length === 0;
    providerSearch.value = ''; filterProviders();
  }
  if (typeof payload.catalogWarning === 'string') catalogNote.textContent = payload.catalogWarning;
  setStatus(formStatus, 'ok', 'Connection verified. Select a model, then save your provider.');
};

const testConnection = async (provider: string, body?: unknown, result: HTMLElement | null = formStatus) => {
  clearCatalog();
  const current = generation;
  controller = new AbortController(); testButton.disabled = true; pendingStatus = result;
  setStatus(result, '', 'Checking API access and requesting the catalogue…');
  try {
    const response = await post(`/api/providers/${provider}/test`, body, controller.signal);
    if (!response.ok) throw new Error(await errorOf(response));
    const payload = await response.json();
    if (current !== generation) return;
    renderCatalog(payload, provider);
    if (result !== formStatus) setStatus(result, 'ok', `Connection verified. ${payload.models.length} models reported; catalogue shown above.`);
  } catch (error) {
    if (current === generation) {
      const message = error instanceof Error && error.name !== 'TypeError' ? error.message : 'Network error. Check your connection and try again.';
      setStatus(result, 'error', `Connection failed: ${message}`);
      if (message.includes('Admin authentication')) document.querySelector<HTMLDetailsElement>('.provider-access')!.open = true;
      catalogNote.textContent = 'The catalogue could not be loaded. Check your credentials and test again.';
    }
  } finally { if (current === generation) { testButton.disabled = false; controller = undefined; pendingStatus = null; } }
};
testButton.addEventListener('click', () => testConnection(providerField.value, { apiKey: keyField.value, baseUrl: urlField.value }));

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const body = { provider: providerField.value, apiKey: keyField.value.trim(), model: modelField.value.trim(), baseUrl: urlField.value.trim(), enabled: true };
  if (!keyField.value.trim() && !savedGroups.some((group) => group.dataset.provider === providerField.value && group.dataset.hasKey === 'true')) { setStatus(formStatus, 'error', 'Enter an API key before saving this provider.'); keyField.focus(); return; }
  if (!modelField.value.trim()) { setStatus(formStatus, 'error', 'Choose or enter a model before saving.'); modelField.focus(); return; }
  clearCatalog(); fields.disabled = true; setStatus(formStatus, '', 'Saving your provider…');
  try {
    const response = await post('/api/providers', body);
    if (response.ok) { keyField.value = ''; location.reload(); return; }
    setStatus(formStatus, 'error', `Not saved: ${await errorOf(response)}`);
  } catch { setStatus(formStatus, 'error', 'Network error. Your provider was not saved. Try again.'); }
  fields.disabled = false;
});

savedGroups.forEach((group) => {
  const { provider, name } = group.dataset;
  const result = group.parentElement!.querySelector<HTMLElement>('.provider-result');
  group.addEventListener('click', async (event) => {
    const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button[data-action]');
    if (!button || fields.disabled) return;
    const action = button.dataset.action;
    if (action === 'edit' || action === 'test') {
      providerField.value = provider!; selectProvider();
      if (action === 'edit') { form.scrollIntoView({ block: 'center', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); providerField.focus({ preventScroll: true }); return; }
      button.disabled = true; await testConnection(provider!, undefined, result); button.disabled = false; return;
    }
    if (action === 'remove' && !confirm(`Remove ${name} and its encrypted key? This cannot be undone.`)) return;
    button.disabled = true;
    try {
      const response = action === 'remove' ? await fetch(`/api/providers/${provider}`, { method: 'DELETE', headers: requestHeaders(false) }) : await post('/api/providers', { provider, enabled: button.dataset.enabled !== 'true' });
      if (response.ok) { location.reload(); return; }
      setStatus(result, 'error', `Failed: ${await errorOf(response)}`);
    } catch { setStatus(result, 'error', 'Network error. Nothing was changed.'); }
    button.disabled = false;
  });
});
