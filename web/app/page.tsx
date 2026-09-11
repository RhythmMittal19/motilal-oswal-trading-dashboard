import { Dashboard } from "@/components/Dashboard";

/**
 * A Server Component: it ships no JavaScript of its own. Dashboard is marked
 * "use client" because it needs useState and a polling timer, both of which
 * only exist in the browser.
 */
export default function Page() {
  return <Dashboard />;
}
