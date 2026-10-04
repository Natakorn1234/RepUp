import { House, History, ChartNoAxesCombined, Settings2 } from "lucide-react";
export type Tab = "Today" | "History" | "Progress" | "Settings";
export default function BottomNav({
  tab,
  onChange,
}: {
  tab: Tab;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {(
        [
          [House, "Today"],
          [History, "History"],
          [ChartNoAxesCombined, "Progress"],
          [Settings2, "Settings"],
        ] as const
      ).map(([Icon, name]) => (
        <button
          key={name}
          className={tab === name ? "selected" : ""}
          onClick={() => onChange(name)}
        >
          <Icon size={21} />
          <span>{name}</span>
          {tab === name && <i />}
        </button>
      ))}
    </nav>
  );
}
