// "/" opens the dashboard directly. There's no public landing page for now,
// so installed copies that still launch at "/" (iOS keeps the start URL from
// when the app was added) skip a redirect and work offline from the cache.
export { default } from "./home/page";
