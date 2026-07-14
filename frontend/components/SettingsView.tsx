"use client";

export function SettingsView() {
  return (
    <div className="flex h-full flex-1 flex-col px-6 py-8 sm:px-12">
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <div className="mt-6 max-w-lg space-y-4">
        {[
          { label: "Theme", value: "Dark" },
          { label: "AI Model", value: "Groq — llama-3.3-70b-versatile" },
          { label: "Voice", value: "Disabled" },
          { label: "Memory", value: "Enabled" }
        ].map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between rounded-xl border border-white/8 bg-white/5 px-4 py-3"
          >
            <span className="text-sm text-white/70">{row.label}</span>
            <span className="text-sm text-white/45">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
