import { useState } from "react";
import type { Group } from "./types";
import GroupList from "./components/GroupList";
import GroupDetail from "./components/GroupDetail";

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4">
          <h1
            className="text-xl font-bold text-teal tracking-tight cursor-pointer"
            onClick={() => setSelectedGroup(null)}
          >
            SplitMate
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        {selectedGroup ? (
          <GroupDetail
            group={selectedGroup}
            onBack={() => setSelectedGroup(null)}
          />
        ) : (
          <GroupList onSelectGroup={setSelectedGroup} />
        )}
      </main>
    </div>
  );
}
