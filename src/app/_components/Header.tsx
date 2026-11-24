"use client";

import { cn } from "cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFire, faCircleInfo } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header>
      <div className="bg-slate-800 py-2.5 shadow">
        <div
          className={cn(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
          <Link href="/" className="flex items-center gap-2 hover:text-amber-400 transition">
            <FontAwesomeIcon icon={faFire} className="text-amber-400" />
            <span>Monster Strike Calendar</span>
          </Link>

          <Link
            href="/about"
            className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white transition"
          >
            <FontAwesomeIcon icon={faCircleInfo} />
            <span>About</span>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;