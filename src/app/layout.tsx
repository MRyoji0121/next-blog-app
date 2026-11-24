import type { Metadata } from "next";
import "./globals.css";

import "@fortawesome/fontawesome-svg-core/styles.css";
import { config } from "@fortawesome/fontawesome-svg-core";
config.autoAddCss = false;

import Header from "@/app/_components/Header";

export const metadata: Metadata = {
  title: "Monster Strike Calendar",
  description: "イベント・コラボ開催スケジュール＆リマインダー",
};

type Props = {
  children: React.ReactNode;
};

const RootLayout: React.FC<Props> = (props) => {
  const { children } = props;
  return (
    <html lang="ja">
      <body className="bg-slate-100 text-slate-900">
        <Header />
        <div className="mx-auto mt-4 max-w-7xl px-3 sm:px-6">
          {children}
        </div>
      </body>
    </html>
  );
};

export default RootLayout;