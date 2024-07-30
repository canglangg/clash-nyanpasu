import { useLockFn } from "ahooks";
import useDebounceFn from "ahooks/lib/useDebounceFn";
import { AnimatePresence, motion } from "framer-motion";
import {
  CSSProperties,
  ReactNode,
  useEffect,
  useLayoutEffect,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { getSystem, useClickPosition } from "@/hooks";
import { cn } from "@/utils";
import LoadingButton from "@mui/lab/LoadingButton";
import { Button, Divider } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import * as Portal from "@radix-ui/react-portal";

const OS = getSystem();

export interface BaseDialogProps {
  title: ReactNode;
  open: boolean;
  close?: string;
  ok?: string;
  disabledOk?: boolean;
  contentStyle?: CSSProperties;
  children?: ReactNode;
  loading?: boolean;
  full?: boolean;
  onOk?: () => void | Promise<void>;
  onClose?: () => void;
  divider?: boolean;
}

export const BaseDialog = ({
  title,
  open,
  close,
  onClose,
  children,
  contentStyle,
  disabledOk,
  loading,
  full,
  onOk,
  ok,
  divider,
}: BaseDialogProps) => {
  const { t } = useTranslation();

  const { palette } = useTheme();

  const [mounted, setMounted] = useState(false);

  const [offset, setOffset] = useState({
    x: 0,
    y: 0,
  });

  const [okLoading, setOkLoading] = useState(false);

  const { run: runMounted, cancel: cancelMounted } = useDebounceFn(
    () => setMounted(false),
    { wait: 300 },
  );

  const clickPosition = useClickPosition();

  useLayoutEffect(() => {
    if (open) {
      setOffset({
        x: clickPosition?.x ?? 0,
        y: clickPosition?.y ?? 0,
      });
    }
  }, [open]);

  const handleClose = () => {
    if (onClose) {
      onClose();
      runMounted();
    }
  };

  const handleOk = useLockFn(async () => {
    if (!onOk) return;

    if (onOk.constructor.name === "AsyncFunction") {
      try {
        setOkLoading(true);

        await onOk();
      } finally {
        setOkLoading(false);
      }
    } else {
      onOk();
    }
  });

  useEffect(() => {
    if (open) {
      setMounted(true);
      cancelMounted();
    }
  }, [open]);

  return (
    <AnimatePresence initial={false}>
      {mounted && (
        <Portal.Root className="fixed left-0 top-0 z-50 h-dvh w-full">
          {!full && (
            <motion.div
              className="absolute inset-0 z-50 backdrop-blur-xl"
              style={{
                backgroundColor: alpha(palette.primary[palette.mode], 0.1),
              }}
              animate={open ? "open" : "closed"}
              initial={{ opacity: 0 }}
              variants={{
                open: { opacity: 1 },
                closed: { opacity: 0 },
              }}
              onClick={handleClose}
            />
          )}

          <motion.div
            className={cn(
              "absolute left-[50%] top-[50%] z-50",
              full ? "h-dvh w-full" : "min-w-96 rounded-3xl shadow",
              palette.mode === "dark"
                ? "text-white shadow-zinc-900"
                : "text-black",
            )}
            style={{
              backgroundColor: palette.background.default,
            }}
            animate={open ? "open" : "closed"}
            initial={{
              opacity: 0.3,
              scale: 0,
              x: offset.x - window.innerWidth / 2,
              y: offset.y - window.innerHeight / 2,
              translateX: "-50%",
              translateY: "-50%",
            }}
            variants={{
              open: {
                opacity: 1,
                scale: 1,
                x: 0,
                y: 0,
              },
              closed: {
                opacity: 0.3,
                scale: 0,
                x: offset.x - window.innerWidth / 2,
                y: offset.y - window.innerHeight / 2,
              },
            }}
            transition={{
              type: "spring",
              bounce: 0,
              duration: 0.35,
            }}
          >
            <div
              className={cn(
                "text-xl",
                !full ? "m-4" : OS === "macos" ? "ml-20 p-3" : "m-2 ml-6",
              )}
            >
              {title}
            </div>

            {divider && <Divider />}

            <div
              className={cn(
                "relative overflow-y-auto overflow-x-hidden p-4",
                full && "h-full px-6",
              )}
              style={{
                maxHeight: full ? "calc(100vh - 100px)" : "calc(100vh - 200px)",
                ...contentStyle,
              }}
            >
              {children}
            </div>

            {divider && <Divider />}

            <div className={cn("m-2 flex justify-end gap-2", full && "mx-6")}>
              {onClose && (
                <Button variant="outlined" onClick={handleClose}>
                  {close || t("Close")}
                </Button>
              )}

              {onOk && (
                <LoadingButton
                  disabled={loading || disabledOk}
                  loading={okLoading || loading}
                  variant="contained"
                  onClick={handleOk}
                >
                  {ok || t("Ok")}
                </LoadingButton>
              )}
            </div>
          </motion.div>
        </Portal.Root>
      )}
    </AnimatePresence>
  );
};
