import React, { useState } from "react";
import { useNavigate, useParams, useOutletContext } from "react-router-dom";
import {
  Menu,
  Plus,
  FileText,
  PenTool,
  Trash2,
  RotateCcw,
  Lock as LockIcon,
  Unlock as UnlockIcon,
} from "lucide-react";
import { useAppStore } from "../lib/store";
import { Note } from "../types";
import { LockScreen } from "./LockScreen";

export const NoteList: React.FC<{ isTrash?: boolean; isLocked?: boolean }> = ({
  isTrash = false,
  isLocked = false,
}) => {
  const {
    notes,
    groups,
    permanentDeleteNote,
    restoreNote,
    emptyTrash,
    isUnlocked,
  } = useAppStore();
  const { groupId } = useParams();
  const navigate = useNavigate();
  const { openSidebar } = useOutletContext<{ openSidebar: () => void }>();
  const [showFabMenu, setShowFabMenu] = useState(false);

  // If trying to view locked notes but app is not unlocked
  if (isLocked && !isUnlocked) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-[#fefce8]">
        <LockScreen onClose={() => navigate("/")} />
      </div>
    );
  }

  // Filter notes based on view
  const filteredNotes = notes.filter((n) => {
    if (isTrash) return n.inTrash;
    if (n.inTrash) return false;
    if (isLocked) return n.isLocked === true;
    if (n.isLocked) return false;
    if (groupId) return n.groupId === groupId;
    return true;
  });

  const groupName = groupId
    ? groups.find((g) => g.id === groupId)?.name || "未命名分组"
    : "全部笔记";
  const pageTitle = isLocked ? "密码区" : isTrash ? "回收站" : groupName;

  const formatDate = (ts: number) =>
    new Date(ts).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  // Extract pure text for preview if it's HTML
  const getPreview = (note: Note) => {
    if (note.type === "drawing") return "[涂鸦画布]";
    const doc = new DOMParser().parseFromString(note.content, "text/html");
    return doc.body.textContent || "空白笔记...";
  };

  return (
    <div className="flex flex-col h-full bg-[#fefce8] border-r border-[#fde68a] relative">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-[#fffbeb] border-b border-[#fde68a]">
        <div className="flex items-center gap-3">
          <button
            onClick={openSidebar}
            className="p-2 -ml-2 text-[#78350f] md:hidden hover:bg-[#fef3c7] rounded-full"
          >
            <Menu size={24} />
          </button>
          <div className="flex items-center gap-2">
            {isLocked && <LockIcon size={20} className="text-[#b45309]" />}
            <h1 className="text-xl font-bold text-[#78350f]">{pageTitle}</h1>
          </div>
        </div>
        {isTrash && filteredNotes.length > 0 && (
          <button
            onClick={emptyTrash}
            className="text-[#b45309] font-medium text-sm px-3 py-1.5 hover:bg-[#fef3c7] border border-[#fde68a] rounded-full"
          >
            清空
          </button>
        )}
      </header>

      {/* List */}
      <div className="flex-1 overflow-y-auto content-start">
        {filteredNotes.length === 0 ? (
          <div className="text-center text-[#92400e] opacity-60 mt-20">
            这里空空如也
          </div>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() =>
                !isTrash &&
                navigate(
                  `/${note.type === "text" ? "note" : "canvas"}/${note.id}`,
                )
              }
              className={`bg-[#fffbeb] border-b border-[#fde68a]/50 p-4 transition-all ${isTrash ? "" : "cursor-pointer hover:bg-[#fefce8] border-l-4 border-l-transparent hover:border-l-[#d97706]"}`}
            >
              <div className="flex gap-2 justify-between items-start mb-2">
                <h3 className="font-bold text-sm mb-1 text-[#78350f] truncate flex-1 leading-tight">
                  {note.title || "无标题"}
                </h3>
              </div>
              <p className="text-xs text-[#92400e] opacity-80 line-clamp-1 mb-2">
                {getPreview(note)}
              </p>
              <div className="flex justify-between items-center text-[10px] text-[#92400e] opacity-60 block mt-2">
                <span>{formatDate(note.createdAt)}</span>

                {isTrash && (
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        restoreNote(note.id);
                      }}
                      className="p-1.5 hover:bg-[#fef3c7] hover:text-[#b45309] rounded"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        permanentDeleteNote(note.id);
                      }}
                      className="p-1.5 hover:bg-[#fee2e2] text-red-600 rounded"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* FAB - Create Note */}
      {!isTrash && (
        <div className="absolute right-6 bottom-6 z-10 flex flex-col items-end gap-3">
          {showFabMenu && (
            <div className="flex flex-col gap-3 mb-2 animate-in fade-in slide-in-from-bottom-4">
              <button
                onClick={() =>
                  navigate(
                    `/note/new?isLocked=${isLocked ? "true" : "false"}${groupId ? `&groupId=${groupId}` : ""}`,
                  )
                }
                className="flex items-center gap-2 bg-[#fffbeb] px-4 py-2.5 rounded-full shadow-lg border border-[#fde68a] text-[#78350f] hover:text-[#b45309] hover:bg-[#fef3c7]"
              >
                <span className="font-medium whitespace-nowrap">文本记录</span>
                <div className="bg-[#fef3c7] p-2 rounded-full">
                  <FileText size={18} className="text-[#b45309]" />
                </div>
              </button>
              <button
                onClick={() =>
                  navigate(
                    `/canvas/new?isLocked=${isLocked ? "true" : "false"}${groupId ? `&groupId=${groupId}` : ""}`,
                  )
                }
                className="flex items-center gap-2 bg-[#fffbeb] px-4 py-2.5 rounded-full shadow-lg border border-[#fde68a] text-[#78350f] hover:text-[#d97706] hover:bg-[#fef3c7]"
              >
                <span className="font-medium whitespace-nowrap">画图/白板</span>
                <div className="bg-[#fef3c7] p-2 rounded-full">
                  <PenTool size={18} className="text-[#d97706]" />
                </div>
              </button>
            </div>
          )}
          <button
            onClick={() => setShowFabMenu(!showFabMenu)}
            className={`w-14 h-14 rounded-full flex items-center justify-center text-[#fffbeb] shadow-[0_4px_14px_0_rgba(251,191,36,0.39)] transition-transform ${showFabMenu ? "bg-[#92400e] rotate-45 shadow-none" : "bg-[#d97706] hover:bg-[#b45309]"}`}
          >
            <Plus size={28} />
          </button>
        </div>
      )}
    </div>
  );
};
