import React, { useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import {
  Folder,
  Trash2,
  Plus,
  Edit2,
  Check,
  X,
  FileText,
  Lock,
} from "lucide-react";
import { useAppStore } from "../lib/store";
import { cn } from "../lib/utils";

export const Sidebar: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { groups, addGroup, updateGroup, deleteGroup } = useAppStore();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const handleNav = (path: string) => {
    navigate(path);
    onClose();
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      updateGroup(id, editName.trim());
    }
    setEditingGroupId(null);
  };

  const saveNewGroup = () => {
    if (newGroupName.trim()) {
      addGroup(newGroupName.trim());
    }
    setNewGroupName("");
    setIsAddingGroup(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#fef3c7] border-r border-[#fde68a]">
      <div className="p-4 border-b border-[#fde68a] flex items-center justify-between">
        <h2 className="text-xl font-serif italic font-bold text-[#b45309]">
          随心记
        </h2>
        <button
          onClick={onClose}
          className="p-2 md:hidden text-[#78350f] rounded-full hover:bg-[#fde68a]"
        >
          <X size={20} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-3 mb-2 flex flex-col gap-1">
          <button
            onClick={() => handleNav("/")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
              pathname === "/"
                ? "bg-[#fffbeb] border border-[#fde68a] text-[#78350f] font-medium shadow-sm"
                : "text-sm text-[#78350f] opacity-80 hover:bg-[#fde68a]",
            )}
          >
            <FileText size={20} />
            全部笔记
          </button>

          <button
            onClick={() => handleNav("/locked")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
              pathname === "/locked"
                ? "bg-[#fffbeb] border border-[#fde68a] text-[#78350f] font-medium shadow-sm"
                : "text-sm text-[#78350f] opacity-80 hover:bg-[#fde68a]",
            )}
          >
            <Lock size={20} />
            密码区
          </button>
        </div>

        <div className="px-4 py-2 mt-4 text-[10px] uppercase tracking-widest text-[#92400e] font-bold flex justify-between items-center opacity-80">
          <span>分组 (Groups)</span>
          <button
            onClick={() => setIsAddingGroup(true)}
            className="p-1 hover:bg-[#fde68a] rounded text-[#92400e]"
          >
            <Plus size={16} />
          </button>
        </div>

        <div className="px-3 space-y-1">
          {groups.map((group) => (
            <div key={group.id} className="flex items-center group/item">
              {editingGroupId === group.id ? (
                <div className="flex items-center flex-1 gap-2 px-3 py-1.5 border border-[#fbbf24] rounded-lg bg-[#fffbeb] my-1 shadow-sm">
                  <input
                    autoFocus
                    className="flex-1 min-w-0 outline-none bg-transparent text-[#78350f]"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveEdit(group.id)}
                  />
                  <button
                    onClick={() => saveEdit(group.id)}
                    className="text-[#65a30d]"
                  >
                    <Check size={16} />
                  </button>
                </div>
              ) : (
                <div className="flex items-center flex-1 relative">
                  <button
                    onClick={() => handleNav(`/group/${group.id}`)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                      pathname === `/group/${group.id}`
                        ? "bg-[#fffbeb] border border-[#fde68a] text-[#78350f] font-medium shadow-sm"
                        : "text-sm text-[#78350f] opacity-80 hover:bg-[#fde68a]",
                    )}
                  >
                    <Folder size={18} />
                    <span className="truncate flex-1">{group.name}</span>
                  </button>
                  <div className="absolute right-2 opacity-0 group-hover/item:opacity-100 flex items-center bg-[#fef3c7]/90 rounded-md p-1 backdrop-blur-sm">
                    <button
                      onClick={() => {
                        setEditingGroupId(group.id);
                        setEditName(group.name);
                      }}
                      className="p-1 text-[#92400e] hover:text-[#b45309]"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => deleteGroup(group.id)}
                      className="p-1 text-[#92400e] hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {isAddingGroup && (
            <div className="flex items-center gap-2 px-3 py-1.5 border border-[#fbbf24] rounded-lg bg-[#fffbeb] my-1 ml-3 shadow-sm">
              <input
                autoFocus
                className="flex-1 min-w-0 outline-none bg-transparent text-[#78350f]"
                placeholder="新分组名称..."
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveNewGroup()}
              />
              <button onClick={saveNewGroup} className="text-[#65a30d]">
                <Check size={16} />
              </button>
              <button
                onClick={() => setIsAddingGroup(false)}
                className="text-[#92400e]"
              >
                <X size={16} />
              </button>
            </div>
          )}
        </div>

        <div className="px-3 mt-6">
          <button
            onClick={() => handleNav("/trash")}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
              pathname === "/trash"
                ? "bg-[#fffbeb] border border-[#fde68a] text-[#b45309] font-medium shadow-sm"
                : "text-sm text-[#78350f] opacity-80 hover:bg-[#fde68a]",
            )}
          >
            <Trash2 size={20} />
            回收站 (Trash)
          </button>
        </div>
      </div>
    </div>
  );
};
