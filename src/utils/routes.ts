/** Central route builders so links stay consistent across pages. */
const enc = (s: string) => encodeURIComponent(s);

export const routes = {
  dashboard: '/',
  instruments: '/instruments',
  search: (q?: string) => (q ? `/search?q=${enc(q)}` : '/search'),
  underlying: (symbol: string) => `/underlyings/${enc(symbol)}`,
  option: (symbol: string) => `/options/${enc(symbol)}`,
  optionChain: (symbol?: string) => (symbol ? `/option-chain/${enc(symbol)}` : '/option-chain'),
  dataQuality: '/data-quality',
};
