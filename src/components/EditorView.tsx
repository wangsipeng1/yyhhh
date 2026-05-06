import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Check,
  Image as ImageIcon,
  Bold,
  Type,
  Palette,
  FileImage,
  Lock,
  Unlock,
  Download,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import FontFamily from "@tiptap/extension-font-family";
import { Image as ImageExtension } from "@tiptap/extension-image";
import { toPng } from "html-to-image";
import { useAppStore } from "../lib/store";
import { FONTS, COLORS, BG_PRESETS, SIZES, cn } from "../lib/utils";
import { FontSize } from "../lib/FontSizeExtension";
import { NoteBackground } from "../types";

interface BaseProps {
  type: "text";
}

export const EditorView: React.FC = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { notes, addNote, updateNote, deleteNote, toggleNoteLock } =
    useAppStore();

  const isNew = id === "new";
  const existingNote = !isNew ? notes.find((n) => n.id === id) : undefined;
  const initialGroupId = searchParams.get("groupId") || "none";
  const initIsLocked = searchParams.get("isLocked") === "true";

  const [title, setTitle] = useState("");
  const [background, setBackground] = useState<NoteBackground | undefined>();
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      ImageExtension,
      FontSize,
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "tiptap min-h-max pb-32 px-4 py-4 w-full text-base sm:text-lg focus:outline-none max-w-none text-[#78350f]",
      },
    },
  });

  useEffect(() => {
    if (existingNote && editor) {
      setTitle(existingNote.title);
      setBackground(existingNote.background);
      editor.commands.setContent(existingNote.content);
    }
  }, [existingNote, editor]);

  const handleSave = () => {
    if (!editor) return;
    const content = editor.getHTML();

    if (isNew) {
      addNote({
        title: title || "未命名",
        content,
        groupId: initialGroupId,
        type: "text",
        background,
        isLocked: initIsLocked,
      });
    } else if (id) {
      updateNote(id, { title: title || "未命名", content, background });
    }
    navigate(-1);
  };

  const handleDelete = () => {
    if (id && !isNew) {
      deleteNote(id);
    }
    navigate(-1);
  };

  const handleToggleLock = () => {
    if (id && !isNew) {
      toggleNoteLock(id);
    }
  };

  const handleDesktopExport = () => {
    setShowDesktopGuide(true);
  };

  const addImage = () => {
    const url = window.prompt(
      "由于浏览器安全限制，暂不支持直接上传本地文件（仅限于当前预览环境）。\n请输入图片URL URL:",
    );
    if (url && editor) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const setBgColor = (color: string) => {
    setBackground({ type: "color", value: color });
    setShowBgMenu(false);
  };

  const setBgImage = () => {
    const url = window.prompt("请输入背景图片URL:");
    if (url) {
      setBackground({ type: "image", value: url });
    }
    setShowBgMenu(false);
  };

  if (!editor) return null;

  const bgStyle =
    background?.type === "color"
      ? { backgroundColor: background.value }
      : background?.type === "image"
        ? {
            backgroundImage: `url(${background.value})`,
            backgroundSize: "cover",
            backgroundAttachment: "fixed",
            backgroundPosition: "center",
          }
        : { backgroundColor: "#fffbeb" };

  return (
    <div className="flex flex-col h-[100dvh]" style={bgStyle}>
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-[#fde68a] bg-white/80 backdrop-blur-md h-16 shrink-0 relative z-20">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 text-[#78350f] rounded-full hover:bg-[#fef3c7]"
        >
          <ArrowLeft size={24} />
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="笔记标题"
          className="flex-1 min-w-0 bg-transparent text-3xl font-serif italic text-[#78350f] focus:outline-none px-4 placeholder:text-[#d4d4d8]"
        />
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setShowBgMenu(!showBgMenu)}
            className="p-2 text-[#b45309] rounded-full hover:bg-[#fef3c7] relative"
            title="页面背景"
          >
            <Palette size={20} />
          </button>

          {showBgMenu && (
            <div className="absolute top-full right-10 mt-2 bg-white rounded-xl shadow-xl border border-[#fde68a] p-3 w-48 animate-in fade-in zoom-in-95">
              <div className="text-xs font-bold text-[#b45309] mb-2">
                背景颜色
              </div>
              <div className="flex flex-col gap-2 mb-3">
                {BG_PRESETS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setBgColor(c.value)}
                    className="flex items-center gap-3 p-1.5 rounded hover:bg-[#fef3c7]"
                    title={c.name}
                  >
                    <div
                      className="w-5 h-5 rounded-full border border-black/10"
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="text-sm text-[#78350f]">{c.name}</span>
                  </button>
                ))}
              </div>
              <div className="text-xs font-bold text-[#b45309] mb-2 border-t border-[#fde68a] pt-2">
                背景图片
              </div>
              <button
                onClick={setBgImage}
                className="flex items-center gap-2 text-sm text-[#78350f] hover:text-[#d97706] w-full p-1 rounded hover:bg-[#fef3c7]"
              >
                <FileImage size={16} /> 从网络URL选取...
              </button>
            </div>
          )}

          <button
            onClick={handleDesktopExport}
            className="p-2 text-[#b45309] hover:bg-[#fef3c7] rounded-full"
            title="保存到手机桌面"
          >
            <Download size={20} />
          </button>

          {!isNew && (
            <button
              onClick={handleToggleLock}
              className="p-2 text-[#b45309] hover:bg-[#fef3c7] rounded-full"
              title={existingNote?.isLocked ? "移出密码区" : "移入密码区"}
            >
              {existingNote?.isLocked ? (
                <Unlock size={20} />
              ) : (
                <Lock size={20} />
              )}
            </button>
          )}

          {!isNew && (
            <button
              onClick={handleDelete}
              className="p-2 text-[#78350f] hover:text-red-500 rounded-full hover:bg-[#fee2e2]"
              title="删除"
            >
              <Trash2 size={20} />
            </button>
          )}
          <button
            onClick={handleSave}
            className="p-2 text-[#b45309] rounded-full hover:bg-[#fef3c7]"
          >
            <Check size={24} />
          </button>
        </div>
      </header>

      {/* Editor Body */}
      <div className="flex-1 overflow-y-auto relative z-0 mix-blend-multiply bg-transparent">
        <div className="min-h-full bg-white/40 ">
          <EditorContent editor={editor} />
        </div>
      </div>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#fffbeb] rounded-2xl max-w-sm w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowDesktopGuide(false)} className="absolute top-4 right-4 text-[#92400e] hover:bg-[#fde68a] p-1 rounded-full transition-colors"><X size={20}/></button>
            <h3 className="text-xl font-bold text-[#78350f] mb-4">保存到手机桌面</h3>
            <p className="text-[#92400e] text-sm mb-4 leading-relaxed">想要在手机桌面直接点击便签进入当前笔记？</p>
            <div className="bg-[#fef3c7] rounded-lg p-4 mb-5 text-sm text-[#78350f] space-y-4 shadow-inner border border-[#fde68a]">
              <div>
                <strong className="block mb-1 text-[#b45309] text-base">🍎 苹果 Safari：</strong>
                点击底部导航栏中部的 <b>分享</b> 按钮，滑动找到并选择 <strong>“添加到主屏幕”</strong>。
              </div>
              <div className="border-t border-[#fde68a] pt-3">
                <strong className="block mb-1 text-[#b45309] text-base">🤖 安卓 Chrome/Edge：</strong>
                点击右上角的 <b>⋮ 菜单</b> 按钮，选择 <strong>“添加到主屏幕”</strong> 即可。
              </div>
            </div>
            <button onClick={() => setShowDesktopGuide(false)} className="w-full py-3 bg-[#d97706] hover:bg-[#b45309] text-white rounded-lg font-bold shadow-md transition-colors">我知道了</button>
          </div>
        </div>
      )}

      {/* Toolbar / Bottom Nav */}
      <div className="bg-[#fefce8] border-t border-[#fde68a] p-2 overflow-x-auto flex flex-col gap-2 shadow-[0_-4px_10px_rgba(251,191,36,0.1)] z-10 w-full shrink-0">
        {/* Style configurations row */}
        <div className="flex gap-4 px-2 min-w-max pb-2 border-b border-[#fde68a]">
          {/* Font Family selector */}
          <select
            className="text-xs font-medium bg-transparent border-none outline-none text-[#92400e] cursor-pointer hover:underline"
            onChange={(e) =>
              editor.chain().focus().setFontFamily(e.target.value).run()
            }
            value={editor.getAttributes("textStyle").fontFamily || ""}
          >
            <option value="">默认字体</option>
            {FONTS.map((f) => (
              <option
                key={f.value}
                value={f.value}
                style={{ fontFamily: f.value }}
              >
                {f.name}
              </option>
            ))}
          </select>

          {/* Font Size selector */}
          <select
            className="text-xs font-medium bg-transparent border-none outline-none text-[#92400e] cursor-pointer hover:underline"
            onChange={(e) =>
              editor.chain().focus().setFontSize(e.target.value).run()
            }
            value={editor.getAttributes("textStyle").fontSize || ""}
          >
            <option value="">默认大小</option>
            {SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.name} ({s.value})
              </option>
            ))}
          </select>
        </div>

        {/* Quick Tools Row */}
        <div className="flex gap-2 min-w-max px-2 pt-1 items-center">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-2 rounded transition-colors",
              editor.isActive("bold")
                ? "bg-[#fef3c7] text-[#d97706] font-black pointer-events-none"
                : "text-lg px-2 hover:bg-[#fef3c7] text-[#92400e]",
            )}
          >
            <Bold size={20} />
          </button>

          <div className="w-[1px] h-6 bg-[#fde68a] mx-1" />

          {COLORS.map((c) => (
            <button
              key={c.value}
              onClick={() => editor.chain().focus().setColor(c.value).run()}
              className={cn(
                "w-8 h-8 rounded-full border-2 transition-transform shadow-sm",
                editor.isActive("textStyle", { color: c.value })
                  ? "ring-2 ring-offset-2 ring-[#d97706] scale-110"
                  : "ring-transparent hover:scale-105 border-transparent",
              )}
              style={{ backgroundColor: c.value }}
              title={c.name}
            />
          ))}

          <div className="w-[1px] h-6 bg-[#fde68a] mx-1" />

          <button
            onClick={addImage}
            className="p-2 rounded text-lg hover:bg-[#fef3c7] text-[#92400e] transition-colors"
            title="插入网络图片"
          >
            <ImageIcon size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};
