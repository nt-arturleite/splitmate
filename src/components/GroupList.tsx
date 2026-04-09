import { useEffect, useState } from "react";
import type { Group } from "../types";
import { getGroups, createGroup } from "../api";

interface GroupListProps {
  onSelectGroup: (group: Group) => void;
}

export default function GroupList({ onSelectGroup }: GroupListProps) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [membersInput, setMembersInput] = useState("");

  useEffect(() => {
    getGroups().then(setGroups);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const members = membersInput
      .split(",")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!name.trim() || members.length === 0) return;

    const group = await createGroup(name.trim(), members);
    setGroups((prev) => [...prev, group]);
    setName("");
    setMembersInput("");
    setShowForm(false);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Your Groups</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-teal hover:bg-teal-dark text-white font-semibold px-5 py-2.5 rounded-lg transition-colors cursor-pointer"
        >
          {showForm ? "Cancel" : "+ New Group"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Create a Group
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Group name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Weekend Trip"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Members (comma-separated)
              </label>
              <input
                type="text"
                value={membersInput}
                onChange={(e) => setMembersInput(e.target.value)}
                placeholder="e.g. Ana, Bruno, Carlos"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-teal/40 focus:border-teal"
              />
            </div>
            <button
              type="submit"
              className="bg-teal hover:bg-teal-dark text-white font-semibold px-6 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              Create Group
            </button>
          </div>
        </form>
      )}

      {groups.length === 0 ? (
        <p className="text-gray-500 text-center py-12">
          No groups yet. Create one to get started!
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => (
            <button
              key={group.id}
              onClick={() => onSelectGroup(group)}
              className="bg-white border border-gray-200 rounded-xl p-6 text-left hover:border-teal hover:shadow-md transition-all cursor-pointer group"
            >
              <h3 className="text-lg font-semibold text-gray-900 group-hover:text-teal transition-colors">
                {group.name}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {group.members.length} member
                {group.members.length !== 1 && "s"}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
