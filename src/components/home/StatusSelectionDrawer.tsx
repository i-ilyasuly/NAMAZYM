import React from 'react';
import { useTranslation } from "react-i18next";
import { User, Users2, Clock, Ban, Flower2, Minus } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "../ui/drawer";
import { PrayerStatus } from "../../store";

interface StatusSelectionDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  drawerStep: "status" | "context";
  setDrawerStep: (step: "status" | "context") => void;
  tempStatus: PrayerStatus | null;
  setTempStatus: (status: PrayerStatus | null) => void;
  tempContext: string[];
  setTempContext: (context: string[]) => void;
  prayers: any[];
  selectedPrayer: string | null;
  gender: string | null;
  contexts: any[];
  handleStatusUpdate: () => void;
}

export const StatusSelectionDrawer: React.FC<StatusSelectionDrawerProps> = ({
  isOpen,
  onOpenChange,
  drawerStep,
  setDrawerStep,
  tempStatus,
  setTempStatus,
  tempContext,
  setTempContext,
  prayers,
  selectedPrayer,
  gender,
  contexts,
  handleStatusUpdate
}) => {
  const { t } = useTranslation();

  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <div className="mx-auto w-full max-w-md p-6 overflow-y-auto custom-scrollbar">
          <DrawerHeader className="px-0 pt-0">
            <DrawerTitle className="text-2xl font-black tracking-tight text-center uppercase">
              {drawerStep === "status"
                ? prayers.find((p) => p.id === selectedPrayer)?.name
                : t("context")}
            </DrawerTitle>
          </DrawerHeader>

          {drawerStep === "status" ? (
            <>
              <div className="flex flex-col bg-card rounded-2xl border border-muted/40 overflow-hidden shadow-sm">
                <button
                  className={cn(
                    "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                    tempStatus === "prayed"
                      ? "bg-muted/50"
                      : "hover:bg-muted/30",
                  )}
                  onClick={() => setTempStatus("prayed")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        tempStatus === "prayed"
                          ? (gender === "female" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600" : "bg-blue-100 dark:bg-blue-900/30 text-blue-600")
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      <User className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {t("status_prayed")}
                    </span>
                  </div>
                  {tempStatus === "prayed" && (
                    <div className={cn("w-2 h-2 rounded-full", gender === "female" ? "bg-emerald-500" : "bg-blue-500")} />
                  )}
                </button>
                {gender === "male" && (
                  <button
                    className={cn(
                      "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                      tempStatus === "congregation"
                        ? "bg-muted/50"
                        : "hover:bg-muted/30",
                    )}
                    onClick={() => setTempStatus("congregation")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          tempStatus === "congregation"
                            ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                        )}
                      >
                        <Users2 className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("status_congregation")}
                      </span>
                    </div>
                    {tempStatus === "congregation" && (
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    )}
                  </button>
                )}
                <button
                  className={cn(
                    "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                    tempStatus === "delayed"
                      ? "bg-muted/50"
                      : "hover:bg-muted/30",
                  )}
                  onClick={() => setTempStatus("delayed")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        tempStatus === "delayed"
                          ? "bg-rose-100 dark:bg-rose-900/30 text-rose-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {t("status_delayed")}
                    </span>
                  </div>
                  {tempStatus === "delayed" && (
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                  )}
                </button>
                <button
                  className={cn(
                    "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                    tempStatus === "missed"
                      ? "bg-muted/50"
                      : "hover:bg-muted/30",
                  )}
                  onClick={() => setTempStatus("missed")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        tempStatus === "missed"
                          ? "bg-zinc-900 dark:bg-zinc-950 text-zinc-100 border border-zinc-800"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      <Ban className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {t("status_missed")}
                    </span>
                  </div>
                  {tempStatus === "missed" && (
                    <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                  )}
                </button>
                {gender === "female" && (
                  <button
                    className={cn(
                      "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                      tempStatus === "menstruation"
                        ? "bg-muted/50"
                        : "hover:bg-muted/30",
                    )}
                    onClick={() => setTempStatus("menstruation")}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                          tempStatus === "menstruation"
                            ? "bg-pink-100 dark:bg-pink-900/30 text-pink-600"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                        )}
                      >
                        <Flower2 className="w-5 h-5" />
                      </div>
                      <span className="text-sm font-medium">
                        {t("status_menstruation")}
                      </span>
                    </div>
                    {tempStatus === "menstruation" && (
                      <div className="w-2 h-2 rounded-full bg-pink-500" />
                    )}
                  </button>
                )}
                <button
                  className={cn(
                    "flex items-center justify-between p-4 border-b last:border-0 transition-colors",
                    tempStatus === "none"
                      ? "bg-muted/50"
                      : "hover:bg-muted/30",
                  )}
                  onClick={() => setTempStatus("none")}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        tempStatus === "none"
                          ? "bg-slate-200 dark:bg-slate-700 text-slate-600"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400",
                      )}
                    >
                      <Minus className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-medium">
                      {t("status_none")}
                    </span>
                  </div>
                  {tempStatus === "none" && (
                    <div className="w-2 h-2 rounded-full bg-slate-500" />
                  )}
                </button>
              </div>

              <div className="mt-6">
                <Button
                  className="w-full"
                  onClick={() => {
                    if (
                      tempStatus === "none" ||
                      tempStatus === "menstruation"
                    ) {
                      handleStatusUpdate();
                    } else {
                      setDrawerStep("context");
                    }
                  }}
                >
                  {tempStatus === "none" || tempStatus === "menstruation"
                    ? t("save")
                    : t("next")}
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 text-center">
                    {t("select_context")}
                  </h3>
                  <p className="text-[10px] text-muted-foreground/40 text-center uppercase tracking-tighter">
                    {t("optional_context")}
                  </p>
                </div>
                <div className="grid grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                  {contexts.map((ctx) => {
                    const isSelected = tempContext.includes(ctx.id);
                    const Icon = ctx.icon;
                    return (
                      <button
                        key={ctx.id}
                        onClick={() => {
                          if (isSelected) {
                            setTempContext(tempContext.filter((id) => id !== ctx.id));
                          } else if (tempContext.length < 5) {
                            setTempContext([...tempContext, ctx.id]);
                          }
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 gap-2 group relative overflow-hidden",
                          isSelected
                            ? "bg-primary border-primary shadow-md shadow-primary/20 scale-[1.02]"
                            : "bg-card border-muted/40 hover:border-muted-foreground/20 hover:bg-muted/30"
                        )}
                      >
                        <Icon
                          className={cn(
                            "w-5 h-5 transition-colors",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                          )}
                        />
                        <span
                          className={cn(
                            "text-[9px] font-bold uppercase tracking-tighter text-center leading-none",
                            isSelected ? "text-primary-foreground" : "text-muted-foreground/60"
                          )}
                        >
                          {ctx.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setDrawerStep("status")}
                >
                  {t("back")}
                </Button>
                <Button className="flex-1" onClick={handleStatusUpdate}>
                  {t("save")}
                </Button>
              </div>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
