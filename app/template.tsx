/** Re-mounts on navigation, giving every page a short rise-in transition. */
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="animate-rise">{children}</div>;
}
