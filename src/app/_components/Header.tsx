"use client";

import { cn } from "cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 bg-slate-800 shadow">
      <div
        className={cn(
          "mx-auto max-w-6xl px-3 py-2.5 sm:px-5",
          "flex items-center justify-between",
          "font-bold text-white"
        )}
      >
        <Link
          href="/"
          className="flex items-center gap-2 text-base transition hover:text-amber-400 sm:text-lg"
        >
          <FontAwesomeIcon icon={faFire} className="text-amber-400" />
          <span>Monster Strike Calendar</span>
        </Link>

        <Link
          href="/about"
          className="flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-300 transition hover:bg-slate-700 hover:text-white sm:text-sm"
        >
          <FontAwesomeIcon icon={faCircleInfo} />
          <span>About</span>
        </Link>
      </div>
    </header>
  );
};

export default Header;