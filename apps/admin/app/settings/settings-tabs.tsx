"use client";

import { useState } from "react";
import { PagesClient } from "../pages/pages-client";
import { SettingsClient } from "./settings-client";

type SettingsTab = "settings" | "pages";

const tabs: { id: SettingsTab; label: string }[] = [
  { id: "settings", label: "Pengaturan" },
  { id: "pages", label: "Halaman" },
];

export function SettingsTabs({ initialTab = "settings" }: { initialTab?: SettingsTab }) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);

  return (
    <div className="grid gap-6 py-6">
      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            onClick={() => setTab(item.id)}
            className={`h-10 rounded-md px-4 text-sm font-bold ${tab === item.id ? "bg-slate-950 text-white" : "border border-slate-300 bg-white text-slate-700"}`}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "settings" ? <SettingsClient /> : <PagesClient compact detailBasePath="/settings/pages" />}
    </div>
  );
}
