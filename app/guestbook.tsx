"use client";

import { useState } from "react";
import type { Entry } from "@/lib/entries";
import { formatWrittenAt } from "@/lib/format";
import { LIMITS } from "@/lib/validation";

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500";
const buttonClass =
  "rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50";

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
      <CreateForm onCreated={() => refresh()} />
      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold text-zinc-500">방명록 글 {entries.length}개</h2>
        {notice && <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800">{notice}</p>}
        {entries.length === 0 ? (
          <p className="rounded-lg bg-white p-6 text-center text-sm text-zinc-500">아직 방명록 글이 없습니다.</p>
        ) : (
          <ul className="space-y-3">
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
    <form onSubmit={submit} className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
      <div className="flex gap-3">
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
          placeholder="비밀번호 (4–20자)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={LIMITS.password.min}
          maxLength={LIMITS.password.max}
          required
        />
      </div>
      <textarea
        className={`${inputClass} min-h-24 resize-y`}
        placeholder="메시지를 남겨 주세요"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={LIMITS.message.max}
        required
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-red-600">{error}</p>
        <button className={buttonClass} disabled={pending}>
          {pending ? "등록 중…" : "등록"}
        </button>
      </div>
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
    <li className="rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-baseline justify-between gap-3">
        <span className="font-semibold">{entry.name}</span>
        <span className="text-xs text-zinc-500">
          {formatWrittenAt(entry.createdAt)}
          {entry.updatedAt && " (수정됨)"}
        </span>
      </div>
      <p className="mt-2 whitespace-pre-wrap break-words text-sm">{entry.message}</p>
      {mode === null ? (
        <div className="mt-3 flex justify-end gap-3 text-xs text-zinc-500">
          <button className="hover:text-zinc-900" onClick={() => onOpen("edit")}>
            수정
          </button>
          <button className="hover:text-red-600" onClick={() => onOpen("delete")}>
            삭제
          </button>
        </div>
      ) : mode === "edit" ? (
        <EditForm entry={entry} onClose={onClose} onChanged={onChanged} />
      ) : (
        <DeleteForm id={entry.id} onClose={onClose} onChanged={onChanged} />
      )}
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
    <form onSubmit={submit} className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
      <textarea
        className={`${inputClass} min-h-20 resize-y`}
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
        <button className={`shrink-0 ${buttonClass}`} disabled={pending}>
          저장
        </button>
        <button type="button" className="shrink-0 rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100" onClick={onClose}>
          취소
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
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
    <form onSubmit={submit} className="mt-3 space-y-2 border-t border-zinc-100 pt-3">
      <div className="flex gap-2">
        <input
          className={inputClass}
          type="password"
          placeholder="비밀번호를 입력하면 삭제됩니다"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
          required
        />
        <button className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50" disabled={pending}>
          삭제
        </button>
        <button type="button" className="shrink-0 rounded-md px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100" onClick={onClose}>
          취소
        </button>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  );
}
