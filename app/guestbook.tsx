"use client";

import { useState } from "react";
import type { Entry } from "@/lib/entries";
import { formatWrittenAt } from "@/lib/format";
import { LIMITS } from "@/lib/validation";

const inputClass =
  "w-full rounded-xl bg-field px-4 py-3 text-[15px] text-ink placeholder:text-ink-3 outline-none ring-brand transition focus:ring-2";
const buttonClass =
  "rounded-xl bg-brand px-4 py-3 text-[15px] font-semibold text-white transition hover:bg-brand-strong active:scale-[0.98] disabled:opacity-40";
const ghostButtonClass =
  "shrink-0 rounded-xl bg-field px-4 py-3 text-[15px] font-semibold text-ink-2 transition hover:bg-line active:scale-[0.98]";
const errorClass = "text-[13px] font-medium text-rise";

const AVATAR_COLORS = ["bg-[#3182f6]", "bg-[#f04452]", "bg-[#00c471]", "bg-[#8b5cf6]", "bg-[#ff9f0a]"];

// Stable color per Author name, like a ticker icon.
function avatarColor(name: string): string {
  let hash = 0;
  for (const ch of name) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

async function request(method: string, path: string, body?: unknown) {
  try {
    const res = await fetch(path, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const json = await res.json().catch(() => null);
    return { status: res.status, json };
  } catch {
    return { status: 0, json: null };
  }
}

function errorOf(json: unknown): string {
  const error = (json as { error?: unknown } | null)?.error;
  return typeof error === "string" ? error : "잠시 후 다시 시도해 주세요.";
}

type Mode = "edit" | "delete";
type Open = { id: number; mode: Mode } | null;

export default function Guestbook({ initialEntries }: { initialEntries: Entry[] }) {
  const [entries, setEntries] = useState(initialEntries);
  // Only one inline form is open at a time across the whole list.
  const [open, setOpen] = useState<Open>(null);
  const [notice, setNotice] = useState("");

  // notice is shown above the list, e.g. when the Entry it came from has vanished.
  async function refresh(message = "") {
    setNotice(message);
    const { status, json } = await request("GET", "/api/entries");
    if (status === 200) setEntries(json as Entry[]);
  }

  return (
    <>
      <section className="rounded-3xl bg-surface px-6 py-6">
        <p className="text-[14px] font-medium text-ink-3">지금까지 쌓인 방명록</p>
        <p className="mt-1 text-[32px] font-bold tracking-tight tabular-nums">
          {entries.length.toLocaleString("ko-KR")}
          <span className="ml-1 text-[22px]">개</span>
        </p>
        <p className="mt-1 text-[14px] font-medium text-brand">누구나 남기고, 비밀번호로 지켜요</p>
      </section>

      <CreateForm onCreated={() => refresh()} />

      <section className="mt-3 rounded-3xl bg-surface pb-2 pt-6">
        <div className="flex items-center justify-between px-6 pb-2">
          <h2 className="text-[18px] font-bold">전체 방명록</h2>
          <span className="rounded-full bg-field px-3 py-1 text-[12px] font-semibold text-ink-2">최신순</span>
        </div>
        {notice && (
          <p className="mx-6 mb-2 mt-2 rounded-xl bg-brand/15 px-4 py-3 text-[14px] font-medium text-[#6aa8ff]">
            {notice}
          </p>
        )}
        {entries.length === 0 ? (
          <p className="px-6 py-14 text-center text-[15px] text-ink-3">아직 방명록 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-line">
            {entries.map((entry) => (
              <EntryItem
                key={entry.id}
                entry={entry}
                mode={open?.id === entry.id ? open.mode : null}
                onOpen={(mode) => setOpen({ id: entry.id, mode })}
                onClose={() => setOpen(null)}
                onChanged={refresh}
              />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

function CreateForm({ onCreated }: { onCreated: () => Promise<void> }) {
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const { status, json } = await request("POST", "/api/entries", { name, message, password });
    if (status === 201) {
      setName("");
      setMessage("");
      setPassword("");
      await onCreated();
    } else {
      setError(errorOf(json));
    }
    setPending(false);
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-3 rounded-3xl bg-surface p-6">
      <h2 className="mb-1 text-[18px] font-bold">방명록 남기기</h2>
      <div className="flex gap-2">
        <input
          className={inputClass}
          placeholder="이름"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={LIMITS.name.max}
          required
        />
        <input
          className={inputClass}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={LIMITS.password.min}
          maxLength={LIMITS.password.max}
          required
        />
      </div>
      <textarea
        className={`${inputClass} min-h-28 resize-none`}
        placeholder="메시지를 남겨 주세요"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={LIMITS.message.max}
        required
      />
      <div className="flex justify-end text-[12px] text-ink-3 tabular-nums">
        {message.length}/{LIMITS.message.max}
      </div>
      {error && <p className={errorClass}>{error}</p>}
      <button className={`w-full py-4 text-[16px] ${buttonClass}`} disabled={pending}>
        {pending ? "등록 중…" : "등록하기"}
      </button>
    </form>
  );
}

function EntryItem({
  entry,
  mode,
  onOpen,
  onClose,
  onChanged,
}: {
  entry: Entry;
  mode: Mode | null;
  onOpen: (mode: Mode) => void;
  onClose: () => void;
  onChanged: (notice?: string) => Promise<void>;
}) {
  return (
    <li className="px-6 py-4">
      <div className="flex gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white ${avatarColor(entry.name)}`}
          aria-hidden
        >
          {Array.from(entry.name)[0]}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <span className="truncate text-[15px] font-semibold">{entry.name}</span>
            {mode === null && (
              <div className="flex shrink-0 gap-1.5">
                <button
                  className="rounded-lg bg-field px-2.5 py-1 text-[12px] font-semibold text-ink-2 transition hover:bg-line"
                  onClick={() => onOpen("edit")}
                >
                  수정
                </button>
                <button
                  className="rounded-lg bg-field px-2.5 py-1 text-[12px] font-semibold text-rise transition hover:bg-line"
                  onClick={() => onOpen("delete")}
                >
                  삭제
                </button>
              </div>
            )}
          </div>
          <p className="mt-0.5 text-[13px] text-ink-3 tabular-nums">
            {formatWrittenAt(entry.writtenAt)}
            {entry.updatedAt && " (수정됨)"}
          </p>
          <p className="mt-2 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink-2">{entry.message}</p>
        </div>
      </div>
      {mode === "edit" && <EditForm entry={entry} onClose={onClose} onChanged={onChanged} />}
      {mode === "delete" && <DeleteForm id={entry.id} onClose={onClose} onChanged={onChanged} />}
    </li>
  );
}

function EditForm({
  entry,
  onClose,
  onChanged,
}: {
  entry: Entry;
  onClose: () => void;
  onChanged: (notice?: string) => Promise<void>;
}) {
  const [message, setMessage] = useState(entry.message);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const { status, json } = await request("PATCH", `/api/entries/${entry.id}`, { message, password });
    setPending(false);
    if (status === 200 || status === 404) {
      onClose();
      await onChanged(status === 404 ? errorOf(json) : "");
      return;
    }
    // Keep the new message; only the password has to be retyped.
    setError(errorOf(json));
    setPassword("");
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-2xl bg-panel p-3">
      <p className="px-1 text-[13px] font-semibold text-ink-2">메시지 수정</p>
      <textarea
        className={`${inputClass} min-h-24 resize-none`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={LIMITS.message.max}
        autoFocus
        required
      />
      <div className="flex gap-2">
        <input
          className={inputClass}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="button" className={ghostButtonClass} onClick={onClose}>
          취소
        </button>
        <button className={`shrink-0 ${buttonClass}`} disabled={pending}>
          저장
        </button>
      </div>
      {error && <p className={`px-1 ${errorClass}`}>{error}</p>}
    </form>
  );
}

function DeleteForm({ id, onClose, onChanged }: { id: number; onClose: () => void; onChanged: (notice?: string) => Promise<void> }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError("");
    const { status, json } = await request("DELETE", `/api/entries/${id}`, { password });
    setPending(false);
    if (status === 200) {
      onClose();
      await onChanged();
      return;
    }
    if (status === 404) {
      onClose();
      await onChanged(errorOf(json));
      return;
    }
    setError(errorOf(json));
    setPassword("");
  }

  return (
    <form onSubmit={submit} className="mt-3 space-y-2 rounded-2xl bg-panel p-3">
      <p className="px-1 text-[13px] font-semibold text-ink-2">이 방명록 글을 삭제할까요?</p>
      <div className="flex gap-2">
        <input
          className={inputClass}
          type="password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        <button type="button" className={ghostButtonClass} onClick={onClose}>
          취소
        </button>
        <button
          className="shrink-0 rounded-xl bg-rise px-4 py-3 text-[15px] font-semibold text-white transition hover:brightness-110 active:scale-[0.98] disabled:opacity-40"
          disabled={pending}
        >
          삭제
        </button>
      </div>
      {error && <p className={`px-1 ${errorClass}`}>{error}</p>}
    </form>
  );
}
