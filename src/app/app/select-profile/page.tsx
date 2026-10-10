"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";

interface KidProfile {
  id: string;
  displayName: string;
  avatar: string | null;
  ageBand: string;
}

const AVATAR_OPTIONS = ["🚀", "🎨", "🦖", "🌟", "🐬", "🦉", "🦁", "🦊", "🔬", "🤖"];

export default function SelectProfilePage() {
  const router = useRouter();
  const [kids, setKids] = useState<KidProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [householdName, setHouseholdName] = useState("");

  // New kid modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newKidName, setNewKidName] = useState("");
  const [newAgeBand, setNewAgeBand] = useState("8-11");
  const [newAvatar, setNewAvatar] = useState("🚀");
  const [modalLoading, setModalLoading] = useState(false);

  // Edit kid modal state
  const [editingKid, setEditingKid] = useState<KidProfile | null>(null);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.push("/sign-in");
        return;
      }
      const data = await res.json();
      setHouseholdName(data.household.name);
      setKids(data.household.kidProfiles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const selectKid = async (kidId: string) => {
    try {
      await fetch("/api/kids/select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kidProfileId: kidId }),
      });
      router.push("/app");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKidName.trim()) return;
    setModalLoading(true);

    try {
      const res = await fetch("/api/kids", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: newKidName.trim(),
          ageBand: newAgeBand,
          avatar: newAvatar,
        }),
      });

      if (res.ok) {
        setShowAddModal(false);
        setNewKidName("");
        await fetchProfiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateKid = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingKid) return;
    setModalLoading(true);

    try {
      const res = await fetch(`/api/kids/${editingKid.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: editingKid.displayName,
          ageBand: editingKid.ageBand,
          avatar: editingKid.avatar,
        }),
      });

      if (res.ok) {
        setEditingKid(null);
        await fetchProfiles();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleDeleteKid = async (kidId: string) => {
    if (!confirm("Are you sure you want to remove this profile?")) return;

    try {
      const res = await fetch(`/api/kids/${kidId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEditingKid(null);
        await fetchProfiles();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[720px] mx-auto px-6 py-24 text-center">
        <p className="text-base font-bold text-[#6b8494]">Loading profiles...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[800px] mx-auto px-6 py-16">
      <div className="text-center mb-12">
        <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#1fa7e1] to-[#63c5f1] text-white inline-flex items-center justify-center font-black text-base shadow-md shadow-[#1fa7e1]/30 mb-4">
          0→1
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#0f3a52] tracking-tight">
          Who&apos;s learning today?
        </h1>
        <p className="text-base font-bold text-[#6b8494] mt-2">
          {householdName || "Household Profiles"}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
        {kids.map((kid) => (
          <div
            key={kid.id}
            className="group relative bg-white rounded-[24px] p-6 text-center border-2 border-[#0f3a52]/10 hover:border-[#1fa7e1] hover:shadow-xl transition-all cursor-pointer flex flex-col items-center justify-between"
            onClick={() => selectKid(kid.id)}
          >
            <div className="w-24 h-24 rounded-full bg-[#eff8ff] flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform shadow-inner">
              {kid.avatar || "🌟"}
            </div>

            <div>
              <h3 className="text-lg font-black text-[#0f3a52] group-hover:text-[#1fa7e1] transition-colors">
                {kid.displayName}
              </h3>
              <span className="inline-block px-3 py-1 bg-[#eff8ff] text-[#1fa7e1] text-xs font-black rounded-full mt-1.5">
                Ages {kid.ageBand}
              </span>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingKid(kid);
              }}
              className="mt-4 text-xs font-bold text-[#6b8494] hover:text-[#0f3a52] px-3 py-1 rounded-full hover:bg-slate-100 transition-colors"
            >
              Edit profile ✏️
            </button>
          </div>
        ))}

        {/* Add Child Card */}
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white/60 hover:bg-white rounded-[24px] p-6 text-center border-2 border-dashed border-[#0f3a52]/20 hover:border-[#1fa7e1] transition-all flex flex-col items-center justify-center min-h-[220px] group cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-[#eff8ff] group-hover:bg-[#1fa7e1] text-[#1fa7e1] group-hover:text-white flex items-center justify-center text-3xl font-black mb-3 transition-colors">
            +
          </div>
          <span className="text-sm font-black text-[#0f3a52] group-hover:text-[#1fa7e1]">
            Add a child
          </span>
          <span className="text-xs font-bold text-[#6b8494] mt-1">
            Unlimited family profiles
          </span>
        </button>
      </div>

      <div className="mt-12 text-center">
        <Link
          href="/app/parent"
          className="inline-flex items-center gap-2 text-sm font-black text-[#6b8494] hover:text-[#0f3a52] px-5 py-2.5 rounded-full hover:bg-white/80 transition-colors border border-transparent hover:border-[#0f3a52]/10"
        >
          ⚙️ Parent Dashboard & Settings
        </Link>
      </div>

      {/* Add Kid Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[#0f3a52]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-[440px] w-full p-8 shadow-2xl border border-[#0f3a52]/10">
            <h2 className="text-2xl font-black text-[#0f3a52] mb-1">
              Add a Child Profile
            </h2>
            <p className="text-xs font-bold text-[#6b8494] mb-6">
              Kids explore independently with their own progress and recommendations.
            </p>

            <form onSubmit={handleAddKid} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={newKidName}
                  onChange={(e) => setNewKidName(e.target.value)}
                  placeholder="e.g. Maya"
                  className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Age Band
                </label>
                <select
                  value={newAgeBand}
                  onChange={(e) => setNewAgeBand(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] bg-white"
                >
                  <option value="5-8">Ages 5–8 (Early Explorer)</option>
                  <option value="8-11">Ages 8–11 (Curious Adventurer)</option>
                  <option value="11-15">Ages 11–15 (Deep Thinker)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Choose Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setNewAvatar(emoji)}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        newAvatar === emoji
                          ? "bg-[#1fa7e1] text-white scale-110 shadow-md"
                          : "bg-[#eff8ff] hover:bg-slate-200"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 rounded-full border border-[#0f3a52]/15 font-black text-xs text-[#6b8494] hover:text-[#0f3a52]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3 rounded-full bg-[#1fa7e1] text-white font-black text-xs hover:bg-[#0d7fb0] shadow-md disabled:opacity-60"
                >
                  {modalLoading ? "Saving..." : "Create Profile"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Kid Modal */}
      {editingKid && (
        <div className="fixed inset-0 bg-[#0f3a52]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[28px] max-w-[440px] w-full p-8 shadow-2xl border border-[#0f3a52]/10">
            <h2 className="text-2xl font-black text-[#0f3a52] mb-1">
              Edit {editingKid.displayName}&apos;s Profile
            </h2>
            <p className="text-xs font-bold text-[#6b8494] mb-6">
              Update name, age band, or avatar.
            </p>

            <form onSubmit={handleUpdateKid} className="space-y-4">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Display Name
                </label>
                <input
                  type="text"
                  required
                  value={editingKid.displayName}
                  onChange={(e) =>
                    setEditingKid({ ...editingKid, displayName: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1]"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Age Band
                </label>
                <select
                  value={editingKid.ageBand}
                  onChange={(e) =>
                    setEditingKid({ ...editingKid, ageBand: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl border border-[#0f3a52]/15 text-[#0f3a52] font-semibold text-sm focus:outline-none focus:border-[#1fa7e1] bg-white"
                >
                  <option value="5-8">Ages 5–8 (Early Explorer)</option>
                  <option value="8-11">Ages 8–11 (Curious Adventurer)</option>
                  <option value="11-15">Ages 11–15 (Deep Thinker)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#0f3a52] mb-1.5">
                  Choose Avatar
                </label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() =>
                        setEditingKid({ ...editingKid, avatar: emoji })
                      }
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        editingKid.avatar === emoji
                          ? "bg-[#1fa7e1] text-white scale-110 shadow-md"
                          : "bg-[#eff8ff] hover:bg-slate-200"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => handleDeleteKid(editingKid.id)}
                  className="py-3 px-4 rounded-full bg-red-50 text-red-600 font-black text-xs hover:bg-red-100"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => setEditingKid(null)}
                  className="flex-1 py-3 rounded-full border border-[#0f3a52]/15 font-black text-xs text-[#6b8494] hover:text-[#0f3a52]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-3 rounded-full bg-[#1fa7e1] text-white font-black text-xs hover:bg-[#0d7fb0] shadow-md disabled:opacity-60"
                >
                  {modalLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
