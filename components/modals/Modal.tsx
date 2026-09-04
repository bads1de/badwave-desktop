import React from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { IoMdClose } from "react-icons/io";

interface ModalProps {
  isOpen: boolean;
  onChange: (open: boolean) => void;
  title: string;
  description: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onChange,
  title,
  description,
  disabled,
  children,
}) => {
  return (
    <Dialog.Root open={isOpen} defaultOpen={isOpen} onOpenChange={onChange}>
      <Dialog.Portal>
        <Dialog.Overlay
          className="
            fixed inset-0 z-40 
            bg-[#0a0a0f]/90
            backdrop-blur-sm
            data-[state=open]:animate-in 
            data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0 
            data-[state=open]:fade-in-0
            duration-300
          "
        >
          {/* オーバーレイ用スキャンライン */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[length:100%_4px] bg-[linear-gradient(rgba(255,255,255,0)_50%,rgba(0,0,0,0.5)_50%)]" />
        </Dialog.Overlay>
        <Dialog.Content
          className="
            fixed left-[50%] top-[50%] z-50 
            w-full max-w-[90vw] md:max-w-[800px] lg:max-w-[1000px]
            translate-x-[-50%] translate-y-[-50%] 
            bg-[#0a0a0f]
            p-8 md:p-10
            shadow-[0_0_50px_rgba(0,0,0,0.9),0_0_20px_rgba(var(--theme-500),0.1)]
            duration-500 
            data-[state=open]:animate-in 
            data-[state=closed]:animate-out 
            data-[state=closed]:fade-out-0 
            data-[state=open]:fade-in-0 
            data-[state=closed]:zoom-out-95 
            data-[state=open]:zoom-in-95 
            data-[state=closed]:slide-out-to-left-1/2 
            data-[state=closed]:slide-out-to-top-[48%] 
            data-[state=open]:slide-in-from-left-1/2 
            data-[state=open]:slide-in-from-top-[48%] 
            rounded-none
            border border-theme-500/20
            overflow-y-auto
            custom-scrollbar
            max-h-[90vh]
            font-mono
          "
        >
          {/* HUD装飾パーツ */}
          <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-theme-500/40 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-theme-500/40 pointer-events-none" />
          <div className="absolute top-0 right-0 w-12 h-12 border-t border-r border-theme-500/10 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-12 h-12 border-b border-l border-theme-500/10 pointer-events-none" />

          <div className="flex flex-col space-y-4 mb-8 relative">
            <div className="flex items-center gap-2 text-[8px] text-theme-500/40 tracking-[0.5em] uppercase mb-2">
              <span className="w-1.5 h-1.5 bg-theme-500/60 rounded-full animate-pulse" />
              [ SYSTEM_DIALOG_PROMPT ]
            </div>
            <Dialog.Title
              className="
              text-3xl md:text-5xl 
              font-black
              uppercase
              tracking-tight 
              text-white
              text-center
              drop-shadow-[0_0_15px_rgba(var(--theme-500),0.7)]
              cyber-glitch
            "
            >
              {title}
            </Dialog.Title>
            <Dialog.Description
              className="
              text-xs md:text-sm
              text-theme-500/60
              text-center
              max-w-2xl
              mx-auto
              uppercase
              tracking-widest
              border-y border-theme-500/10
              py-2
            "
            >
              // {description}
            </Dialog.Description>
          </div>
          <div className="relative z-10">{children}</div>
          <Dialog.Close asChild disabled={disabled}>
            <button
              className="
                absolute right-6 top-6
                rounded-none
                p-2
                opacity-40
                bg-transparent
                border border-theme-500/20
                transition-all
                duration-300
                hover:opacity-100
                hover:bg-theme-500/10
                hover:border-theme-500/60
                hover:scale-110
                focus:outline-none
                disabled:pointer-events-none
                z-20
              "
              aria-label="Close"
            >
              <IoMdClose className="h-5 w-5 text-theme-500" />
            </button>
          </Dialog.Close>

          {/* 背景装飾グリッド */}
          <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[length:30px_30px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default Modal;
