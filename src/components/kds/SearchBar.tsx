"use client";

import React, {
  memo,
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface SearchBarProps {
  totalMatched: number;
  totalOrders: number;
}

function SearchBarComponent({ totalMatched, totalOrders }: SearchBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const urlQuery = searchParams.get("search") ?? "";
  const [localValue, setLocalValue] = useState(urlQuery);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalValue(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === "/" &&
        document.activeElement?.tagName !== "INPUT" &&
        document.activeElement?.tagName !== "TEXTAREA"
      ) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const syncSearchToUrl = useCallback(
    (nextValue: string) => {
      setLocalValue(nextValue);

      const params = new URLSearchParams(searchParams.toString());
      const trimmed = nextValue.trim();

      if (trimmed) {
        params.set("search", nextValue);
      } else {
        params.delete("search");
      }

      const queryString = params.toString();
      const targetUrl = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.replace(targetUrl, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const handleClear = () => {
    syncSearchToUrl("");
    inputRef.current?.focus();
  };

  return (
    <div className="relative flex items-center w-full sm:w-80 md:w-96">
      <input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={(e) => syncSearchToUrl(e.target.value)}
        placeholder="Cari #ORD-101, Meja 08, atau menu..."
        aria-label="Cari nomor pesanan atau nomor meja"
        className="w-full rounded-xl bg-white px-4 pr-24 py-2 text-sm text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.05)] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00AEEF]/35 transition-all"
      />
      <div className="absolute right-2.5 flex items-center gap-1.5">
        {localValue && (
          <>
            <span className="rounded-full bg-[#EC008C]/10 px-2 py-0.5 font-mono text-[11px] font-semibold text-[#EC008C]">
              {totalMatched}/{totalOrders}
            </span>
            <button
              type="button"
              onClick={handleClear}
              aria-label="Hapus pencarian"
              className="rounded-md px-1.5 py-0.5 text-xs font-medium text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
            >
              Reset
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export const SearchBar = memo(SearchBarComponent);
