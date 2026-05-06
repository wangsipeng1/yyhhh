import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Trash2,
  Check,
  PenTool,
  Circle,
  ArrowUpRight,
  Type,
  Bold,
  MousePointer2,
  Image as ImageIcon,
  CornerDownRight,
  Milestone,
  Palette,
  FileImage,
  Square,
  Disc,
  Lock,
  Unlock,
  Download,
} from "lucide-react";
import {
  Stage,
  Layer,
  Line,
  Arrow,
  Circle as KonvaCircle,
  Text as KonvaText,
  Image as KonvaImage,
  Label,
  Tag,
} from "react-konva";
import { v4 as uuidv4 } from "uuid";
import { toPng } from "html-to-image";
import { useAppStore } from "../lib/store";
import { FONTS, COLORS, BG_PRESETS, SIZES, cn } from "../lib/utils";
import useImage from "use-image";
import { NoteBackground } from "../types";

type DrawMode =
  | "select"
  | "pen"
  | "arrow"
  | "arrow_curved"
  | "circle"
  | "text"
  | "text_rect"
  | "text_round"
  | "image";

interface ShapeElement {
  id: string;
  type: "pen" | "arrow" | "circle" | "text" | "image";
  arrowType?: "straight" | "curved";
  bgType?: "none" | "rect" | "round";
  points?: number[];
  x?: number;
  y?: number;
  radius?: number;
  text?: string;
  src?: string;
  color: string;
  fontSize: number;
  fontFamily: string;
  isBold: boolean;
}

// Custom Image Component for Konva
const CanvasImage = ({
  shape,
  onSelect,
}: {
  shape: ShapeElement;
  onSelect: () => void;
}) => {
  const [img] = useImage(shape.src || "");
  if (!img) return null;
  // Basic sizing to fit reasonable constraints
  let width = img.width;
  let height = img.height;
  const maxW = 300;
  if (width > maxW) {
    height = height * (maxW / width);
    width = maxW;
  }
  return (
    <KonvaImage
      x={shape.x}
      y={shape.y}
      image={img}
      width={width}
      height={height}
      onClick={onSelect}
      onTap={onSelect}
    />
  );
};

export const CanvasView: React.FC = () => {
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
  const [elements, setElements] = useState<ShapeElement[]>([]);
  const [background, setBackground] = useState<NoteBackground | undefined>();
  const [showBgMenu, setShowBgMenu] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);

  // Tools state
  const [mode, setMode] = useState<DrawMode>("pen");
  const [color, setColor] = useState(COLORS[0].value);
  const [fontFamily, setFontFamily] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState(20);
  const [isBold, setIsBold] = useState(false);

  // Drawing state
  const isDrawing = useRef(false);
  const currentElementId = useRef<string | null>(null);

  // Text input state
  const [textInput, setTextInput] = useState<{
    id: string;
    x: number;
    y: number;
    val: string;
    mode: DrawMode;
  } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Canvas size
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight - 150,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingNote && existingNote.content) {
      setTitle(existingNote.title);
      setBackground(existingNote.background);
      try {
        setElements(JSON.parse(existingNote.content));
      } catch (e) {
        console.error("Failed to parse canvas data", e);
      }
    }
  }, [existingNote]);

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight,
        });
      }
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fix textarea focus when activated
  useEffect(() => {
    if (textInput && textareaRef.current) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
        const len = textareaRef.current?.value.length || 0;
        textareaRef.current?.setSelectionRange(len, len);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [textInput?.id]);

  const handleSave = () => {
    const content = JSON.stringify(elements);
    if (isNew) {
      addNote({
        title: title || "未命名画板",
        content,
        groupId: initialGroupId,
        type: "drawing",
        background,
        isLocked: initIsLocked,
      });
    } else if (id) {
      updateNote(id, { title: title || "未命名画板", content, background });
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

  const handleMouseDown = (e: any) => {
    if (mode === "select" || textInput) return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    isDrawing.current = true;
    const newId = uuidv4();
    currentElementId.current = newId;

    if (mode === "text" || mode === "text_rect" || mode === "text_round") {
      isDrawing.current = false;
      const bgType =
        mode === "text_rect"
          ? "rect"
          : mode === "text_round"
            ? "round"
            : "none";
      const newEl: ShapeElement = {
        id: newId,
        type: "text",
        x: pos.x,
        y: pos.y,
        text: "",
        bgType,
        color,
        fontSize,
        fontFamily,
        isBold,
      };
      setElements([...elements, newEl]);
      setTextInput({ id: newId, x: pos.x, y: pos.y, val: "", mode: mode });
      setMode("select");
      return;
    }

    if (mode === "image") {
      isDrawing.current = false;
      const url = window.prompt(
        "由于浏览器安全限制，暂不支持直接上传本地文件。\n请输入网络图片URL:",
      );
      if (url) {
        setElements([
          ...elements,
          {
            id: newId,
            type: "image",
            x: pos.x,
            y: pos.y,
            src: url,
            color,
            fontSize,
            fontFamily,
            isBold,
          },
        ]);
      }
      setMode("select");
      return;
    }

    const newElement: ShapeElement = {
      id: newId,
      type:
        mode === "arrow_curved" || mode === "arrow" ? "arrow" : (mode as any),
      arrowType:
        mode === "arrow_curved"
          ? "curved"
          : mode === "arrow"
            ? "straight"
            : undefined,
      points: [pos.x, pos.y],
      x: pos.x,
      y: pos.y,
      radius: 0,
      color,
      fontSize,
      fontFamily,
      isBold,
    };

    setElements([...elements, newElement]);
  };

  const handleMouseMove = (e: any) => {
    if (!isDrawing.current || mode === "select" || mode.startsWith("text"))
      return;

    const stage = e.target.getStage();
    const pos = stage.getPointerPosition();
    if (!pos) return;

    setElements((prev) =>
      prev.map((el) => {
        if (el.id === currentElementId.current) {
          if (mode === "pen") {
            return { ...el, points: [...(el.points || []), pos.x, pos.y] };
          }
          if (mode === "arrow" || mode === "arrow_curved") {
            return {
              ...el,
              points: [el.points![0], el.points![1], pos.x, pos.y],
            };
          }
          if (mode === "circle") {
            const dx = pos.x - el.x!;
            const dy = pos.y - el.y!;
            const radius = Math.sqrt(dx * dx + dy * dy);
            return { ...el, radius };
          }
        }
        return el;
      }),
    );
  };

  const handleMouseUp = () => {
    isDrawing.current = false;
    currentElementId.current = null;
  };

  const finishTextEditing = () => {
    if (textInput) {
      if (!textInput.val.trim()) {
        setElements((prev) => prev.filter((el) => el.id !== textInput.id));
      } else {
        setElements((prev) =>
          prev.map((el) =>
            el.id === textInput.id ? { ...el, text: textInput.val } : el,
          ),
        );
      }
      setTextInput(null);
    }
  };

  const handleDelete = () => {
    if (id && !isNew) {
      deleteNote(id);
    }
    navigate(-1);
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
          placeholder="画板标题"
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
            title="保存到手机主屏幕"
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

      {/* Toolbar / Bottom Nav */}
      <div className="bg-[#fefce8] border-b border-[#fde68a] p-2 overflow-x-auto flex flex-col gap-2 shadow-[0_4px_10px_rgba(251,191,36,0.1)] z-10 w-full shrink-0">
        {/* Style configs */}
        <div className="flex gap-4 px-2 min-w-max pb-2 border-b border-[#fde68a]">
          <select
            className="text-xs font-medium bg-transparent border-none outline-none text-[#92400e] cursor-pointer hover:underline"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.name}
              </option>
            ))}
          </select>
          <select
            className="text-xs font-medium bg-transparent border-none outline-none text-[#92400e] cursor-pointer hover:underline"
            value={fontSize.toString()}
            onChange={(e) => setFontSize(parseInt(e.target.value))}
          >
            {SIZES.map((s) => (
              <option key={s.value} value={parseInt(s.value)}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setIsBold(!isBold)}
            className={cn(
              "p-1.5 rounded-md transition-colors",
              isBold
                ? "bg-[#fef3c7] text-[#d97706]"
                : "text-[#92400e] hover:bg-[#fef3c7]",
            )}
          >
            <Bold size={16} />
          </button>
          <div className="w-[1px] h-6 bg-[#fde68a] mx-1 self-center" />
          <div className="flex items-center gap-2">
            {COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => setColor(c.value)}
                className={cn(
                  "w-6 h-6 rounded-full border-2 transition-transform shadow-sm",
                  color === c.value
                    ? "ring-2 ring-offset-2 ring-[#d97706] scale-110"
                    : "ring-transparent hover:scale-105 border-transparent",
                )}
                style={{ backgroundColor: c.value }}
              />
            ))}
          </div>
        </div>

        {/* Drawing Tools */}
        <div className="flex justify-start px-2 pt-1 min-w-max gap-1">
          {[
            { id: "select", icon: MousePointer2, label: "选择" },
            { id: "pen", icon: PenTool, label: "画笔" },
            { id: "arrow", icon: ArrowUpRight, label: "直线箭头" },
            { id: "arrow_curved", icon: CornerDownRight, label: "曲线箭头" },
            { id: "circle", icon: Circle, label: "圆圈" },
            { id: "text", icon: Type, label: "纯文本" },
            { id: "text_rect", icon: Square, label: "方框文本" },
            { id: "text_round", icon: Disc, label: "圆饼文本" },
            { id: "image", icon: ImageIcon, label: "图片" },
          ].map((tool) => (
            <button
              key={tool.id}
              onClick={() => {
                setMode(tool.id as DrawMode);
                finishTextEditing();
              }}
              className={cn(
                "p-2 rounded-lg flex flex-col items-center min-w-[56px] transition-colors gap-1",
                mode === tool.id
                  ? "bg-[#fef3c7] text-[#d97706] border border-[#fde68a] shadow-inner"
                  : "text-[#92400e] hover:bg-[#fef3c7]",
              )}
            >
              <tool.icon size={18} />
              <span className="text-[10px] font-medium">{tool.label}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => {
              if (window.confirm("确定清空画板吗？")) {
                setElements([]);
              }
            }}
            className="p-2 rounded-lg flex flex-col items-center min-w-[56px] gap-1 text-[#b45309] hover:bg-[#fee2e2] transition-colors ml-auto border border-transparent"
          >
            <Trash2 size={18} />
            <span className="text-[10px] font-medium">清空</span>
          </button>
        </div>
      </div>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4">
          <div className="bg-[#fffbeb] rounded-2xl max-w-sm w-full p-6 relative shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setShowDesktopGuide(false)} className="absolute top-4 right-4 text-[#92400e] hover:bg-[#fde68a] p-1 rounded-full transition-colors"><X size={20}/></button>
            <h3 className="text-xl font-bold text-[#78350f] mb-4">保存到手机主屏幕</h3>
            <p className="text-[#92400e] text-sm mb-4 leading-relaxed">想要在手机桌面直接点击便签进入此画板？</p>
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

      {/* Canvas Area */}
      <div
        className="flex-1 relative overflow-hidden touch-none mix-blend-multiply"
        ref={containerRef}
      >
        <Stage
          width={dimensions.width}
          height={dimensions.height}
          onMouseDown={handleMouseDown}
          onMousemove={handleMouseMove}
          onMouseup={handleMouseUp}
          onTouchStart={(e) => {
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos) handleMouseDown(e);
          }}
          onTouchMove={(e) => {
            const pos = e.target.getStage()?.getPointerPosition();
            if (pos) handleMouseMove(e);
          }}
          onTouchEnd={handleMouseUp}
        >
          <Layer>
            {elements.map((el) => {
              if (el.type === "pen" && el.points) {
                return (
                  <Line
                    key={el.id}
                    points={el.points}
                    stroke={el.color}
                    strokeWidth={el.fontSize / 5}
                    tension={0.5}
                    lineCap="round"
                    lineJoin="round"
                  />
                );
              }
              if (el.type === "arrow" && el.points) {
                if (el.arrowType === "curved") {
                  const [x1, y1, x2, y2] = el.points;
                  const dx = x2 - x1;
                  const dy = y2 - y1;
                  // create a control point for a quadratic curve
                  const cx = x1 + dx / 2 - dy / 4;
                  const cy = y1 + dy / 2 + dx / 4;
                  return (
                    <Arrow
                      key={el.id}
                      points={[x1, y1, cx, cy, x2, y2]}
                      tension={0.5}
                      stroke={el.color}
                      fill={el.color}
                      strokeWidth={el.fontSize / 5}
                      pointerLength={10}
                      pointerWidth={10}
                    />
                  );
                }
                return (
                  <Arrow
                    key={el.id}
                    points={el.points}
                    stroke={el.color}
                    fill={el.color}
                    strokeWidth={el.fontSize / 5}
                    pointerLength={10}
                    pointerWidth={10}
                  />
                );
              }
              if (el.type === "circle" && el.x && el.y) {
                return (
                  <KonvaCircle
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    radius={el.radius || 0}
                    stroke={el.color}
                    strokeWidth={el.fontSize / 5}
                  />
                );
              }
              if (el.type === "text" && el.x && el.y) {
                if (textInput && textInput.id === el.id) return null;

                const handleEdit = () => {
                  if (mode === "select" || mode.startsWith("text")) {
                    const nextMode =
                      el.bgType === "rect"
                        ? "text_rect"
                        : el.bgType === "round"
                          ? "text_round"
                          : "text";
                    setTextInput({
                      id: el.id,
                      x: el.x!,
                      y: el.y!,
                      val: el.text || "",
                      mode: nextMode,
                    });
                    setMode(nextMode);
                  }
                };

                if (el.bgType === "rect" || el.bgType === "round") {
                  return (
                    <Label
                      key={el.id}
                      x={el.x}
                      y={el.y}
                      onClick={handleEdit}
                      onTap={handleEdit}
                    >
                      <Tag
                        fill={el.bgType === "rect" ? "#fde68a" : "#fef3c7"}
                        stroke={el.color}
                        strokeWidth={2}
                        cornerRadius={
                          el.bgType === "rect" ? 4 : el.fontSize * 1.5
                        }
                        lineJoin="round"
                      />
                      <KonvaText
                        text={el.text || ""}
                        fill={el.color}
                        fontSize={el.fontSize}
                        fontFamily={el.fontFamily}
                        fontStyle={el.isBold ? "bold" : "normal"}
                        padding={el.fontSize / 1.5}
                      />
                    </Label>
                  );
                }

                return (
                  <KonvaText
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    text={el.text || ""}
                    fill={el.color}
                    fontSize={el.fontSize}
                    fontFamily={el.fontFamily}
                    fontStyle={el.isBold ? "bold" : "normal"}
                    onClick={handleEdit}
                    onTap={handleEdit}
                  />
                );
              }
              if (el.type === "image" && el.src) {
                return (
                  <CanvasImage key={el.id} shape={el} onSelect={() => {}} />
                );
              }
              return null;
            })}
          </Layer>
        </Stage>

        {/* Text Input Overlay */}
        {textInput && (
          <textarea
            ref={textareaRef}
            autoFocus
            placeholder="在此输入文本..."
            value={textInput.val}
            onChange={(e) =>
              setTextInput({ ...textInput, val: e.target.value })
            }
            onBlur={finishTextEditing}
            className={cn(
              "absolute bg-transparent outline-none resize-none m-0 focus:ring-0 placeholder-black/30",
              textInput.mode === "text_rect"
                ? "border-2 border-dashed bg-[#fde68a]/50 border-orange-400 p-2 rounded"
                : textInput.mode === "text_round"
                  ? "border-2 border-dashed bg-[#fef3c7]/50 border-orange-400 p-4 rounded-full"
                  : "border-dashed border-2 border-orange-400 p-1 rounded-sm",
            )}
            style={{
              top: textInput.y,
              left: textInput.x,
              color: color,
              fontSize: fontSize,
              fontFamily: fontFamily,
              fontWeight: isBold ? "bold" : "normal",
              lineHeight: 1.2,
              whiteSpace: "pre-wrap",
              wordWrap: "break-word",
              width: Math.max(160, textInput.val.length * fontSize * 0.8),
              minHeight:
                textInput.mode === "text_round" ? fontSize * 4 : fontSize * 2,
              zIndex: 50,
            }}
          />
        )}
      </div>
    </div>
  );
};
