"use client";

import React, { useState } from "react";
import { cn } from "cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCircleInfo, faTrophy } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { ExCounterModal } from "@/app/_components/ExCounterModal";

const Header: React.FC = () => {
  const [isExOpen, setIsExOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-slate-900 shadow-md">
        <div
          className={cn(
            "mx-auto max-w-7xl px-4 py-3 sm:px-6",
            "flex items-center justify-between gap-2",
            "font-bold text-white"
          )}
        >
          <Link
            href="/"
            className="flex items-center gap-2 text-base transition hover:text-amber-400 sm:text-xl"
          >
            <FontAwesomeIcon icon={faFire} className="text-amber-400" />
            <span className="truncate">Monster Strike Calendar</span>
          </Link>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setIsExOpen(true)}
              className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-3 py-2 text-xs font-extrabold text-slate-950 shadow transition hover:bg-amber-400 active:scale-95 sm:px-4 sm:text-sm"
            >
              <FontAwesomeIcon icon={faTrophy} />
              <span>EXカウンター</span>
            </button>

            <Link
              href="/about"
              className="flex items-center gap-1.5 rounded-xl bg-slate-800 px-3 py-2 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white sm:text-sm"
            >
              <FontAwesomeIcon icon={faCircleInfo} />
              <span className="hidden sm:inline">About</span>
            </Link>
          </div>
        </div>
      </header>

      <ExCounterModal isOpen={isExOpen} onClose={() => setIsExOpen(false)} />
    </>
  );
};

export default Header;