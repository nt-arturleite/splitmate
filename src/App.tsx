import { useState } from "react";
import type { Group } from "./types";
import GroupList from "./components/GroupList";
import GroupDetail from "./components/GroupDetail";
import Login from "./components/Login";

export default function App() {
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const handleLogin = (newToken: string) => {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setSelectedGroup(null);
  };

  if (!token) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1
            className="text-xl font-bold text-teal tracking-tight cursor-pointer"
            onClick={() => setSelectedGroup(null)}
          >
            SplitMate
          </h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-teal transition-colors"
          >
            Logout
          </button>
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
