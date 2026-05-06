import React, { useState, useRef, useEffect } from "react";
import { useAppStore } from "../lib/store";
import {
  Lock,
  Unlock,
  KeyRound,
  ArrowRight,
  ShieldCheck,
  X,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useNavigate } from "react-router-dom";

export const LockScreen: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const { hasLockSetup, setupLock, unlockApp } = useAppStore();
  const [mode, setMode] = useState<"pin" | "gesture">("pin");
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const navigate = useNavigate();

  const handlePinAction = () => {
    if (pin.length < 4) {
      setError(true);
      setTimeout(() => setError(false), 500);
      return;
    }

    if (hasLockSetup) {
      if (unlockApp(pin)) {
        onClose?.();
      } else {
        setError(true);
        setPin("");
        setTimeout(() => setError(false), 500);
      }
    } else {
      setupLock(pin);
      onClose?.();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#fffbeb] flex flex-col items-center justify-center p-4">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[#92400e] hover:bg-[#fde68a] rounded-full"
        >
          <X size={24} />
        </button>
      )}

      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-[#fde68a] rounded-full flex items-center justify-center mx-auto mb-4 text-[#b45309]">
          {hasLockSetup ? <Lock size={40} /> : <ShieldCheck size={40} />}
        </div>
        <h2 className="text-2xl font-bold text-[#78350f]">
          {hasLockSetup ? "输入密码解锁" : "设置安全密码"}
        </h2>
        <p className="text-[#92400e] opacity-80 mt-2 text-sm">
          {hasLockSetup
            ? "您的私密笔记已加密保护"
            : "设置密码后，私密笔记将离开系统存储进入加密状态"}
        </p>
      </div>

      <div className="flex bg-[#fde68a] p-1 rounded-lg mb-8">
        <button
          onClick={() => {
            setMode("pin");
            setPin("");
            setError(false);
          }}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-bold transition-colors",
            mode === "pin"
              ? "bg-[#fffbeb] text-[#78350f] shadow-sm"
              : "text-[#92400e] hover:bg-[#fde68a]",
          )}
        >
          数字密码
        </button>
        <button
          onClick={() => {
            setMode("gesture");
            setPin("");
            setError(false);
          }}
          className={cn(
            "px-6 py-2 rounded-md text-sm font-bold transition-colors",
            mode === "gesture"
              ? "bg-[#fffbeb] text-[#78350f] shadow-sm"
              : "text-[#92400e] hover:bg-[#fde68a]",
          )}
        >
          手势密码
        </button>
      </div>

      <div className="w-full max-w-sm">
        {mode === "pin" && (
          <div className="flex gap-3 justify-center mb-12">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={cn(
                  "w-12 h-16 rounded-lg border-2 flex items-center justify-center text-3xl font-bold transition-all",
                  pin.length > i
                    ? "border-[#b45309] text-[#78350f] bg-[#fef3c7]"
                    : "border-[#fde68a] text-transparent",
                  error && pin.length <= i && "border-red-400 animate-shake",
                )}
              >
                {pin[i] ? "*" : ""}
              </div>
            ))}
          </div>
        )}

        {mode === "gesture" && (
          <div className="mb-8">
            <GesturePad
              onChange={(val) => {
                if (hasLockSetup) {
                  if (unlockApp(val)) {
                    onClose?.();
                  } else {
                    setError(true);
                    setTimeout(() => setError(false), 500);
                  }
                } else {
                  setupLock(val);
                  onClose?.();
                }
              }}
              error={error}
            />
          </div>
        )}

        {mode === "pin" && (
          <div className="grid grid-cols-3 gap-4 max-w-[280px] mx-auto">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, "C", 0, "OK"].map((key) => (
              <button
                key={key}
                onClick={() => {
                  if (key === "C") {
                    setPin("");
                    setError(false);
                  } else if (key === "OK") {
                    handlePinAction();
                  } else if (pin.length < 4) {
                    setPin((prev) => {
                      const updated = prev + key;
                      if (updated.length === 4) {
                        setTimeout(() => {
                          if (hasLockSetup) {
                            if (unlockApp(updated)) {
                              onClose?.();
                            } else {
                              setError(true);
                              setPin("");
                              setTimeout(() => setError(false), 500);
                            }
                          } else {
                            setupLock(updated);
                            onClose?.();
                          }
                        }, 100);
                      }
                      return updated;
                    });
                  }
                }}
                className={cn(
                  "h-16 rounded-full flex items-center justify-center text-2xl font-semibold transition-colors",
                  typeof key === "number"
                    ? "bg-[#fef3c7] text-[#78350f] hover:bg-[#fde68a] active:bg-[#fbbf24]"
                    : key === "OK"
                      ? "bg-[#d97706] text-white hover:bg-[#b45309] text-xl"
                      : "text-[#92400e] text-xl hover:bg-[#fef3c7]",
                )}
              >
                {key}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const GesturePad: React.FC<{
  onChange: (pattern: string) => void;
  error: boolean;
}> = ({ onChange, error }) => {
  const [pattern, setPattern] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouch = (e: any) => {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.hasAttribute("data-index")) {
      const idx = parseInt(element.getAttribute("data-index")!);
      if (!pattern.includes(idx)) {
        setPattern((prev) => [...prev, idx]);
      }
    }
  };

  const handleEnd = () => {
    if (pattern.length > 3) {
      onChange(pattern.join("-"));
    }
    setTimeout(() => setPattern([]), 300);
  };

  return (
    <div
      className="w-72 h-72 mx-auto relative touch-none"
      ref={containerRef}
      onPointerDown={handleTouch}
      onPointerMove={(e) => {
        if (e.buttons > 0 || e.pointerType === "touch") handleTouch(e);
      }}
      onPointerUp={handleEnd}
      onPointerCancel={handleEnd}
      onPointerLeave={handleEnd}
    >
      <div className="grid grid-cols-3 gap-8 h-full">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => {
          const isActive = pattern.includes(i);
          return (
            <div
              key={i}
              className="flex items-center justify-center pointer-events-none"
            >
              <div
                data-index={i}
                className={cn(
                  "w-12 h-12 rounded-full border-4 transition-all pointer-events-auto",
                  isActive
                    ? "border-[#d97706] bg-[#fef3c7] scale-110"
                    : "border-[#fde68a] bg-transparent",
                  error && "border-red-400 bg-red-50",
                )}
              >
                {isActive && (
                  <div className="w-4 h-4 rounded-full bg-[#d97706] m-auto mt-3" />
                )}
              </div>
            </div>
          );
        })}
      </div>
      {/* SVG lines could be added here to connect the dots based on bounding rechs, but skipping for simplicity */}
    </div>
  );
};
