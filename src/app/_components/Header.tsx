"use client";
import { cn } from "cn";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCoffee,
    faUser,
    faMagnifyingGlass
} from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";

const Header: React.FC = () => {
  return (
    <header>
      <div className="bg-slate-800 py-2">
        <div
          className={cn(
            "mx-4 max-w-2xl md:mx-auto",
            "flex items-center justify-between",
            "text-lg font-bold text-white"
          )}
        >
                  <div>
                      <Link href="/">
            <FontAwesomeIcon icon={faCoffee} className="mr-1" />
                      Monster Strike Calendar
                      </Link>
                  </div>
                  <div>
                      <Link href="/about">About</Link>
                  </div>
                  <div>
                    <FontAwesomeIcon icon={ faMagnifyingGlass } className="mr-1" />
                    検索
                  </div>
          <div>
            <FontAwesomeIcon icon={faUser} className="mr-1" />
            about
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;