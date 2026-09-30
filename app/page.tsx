import { connection } from "next/server";
import { listEntries } from "@/lib/entries";
import Guestbook from "./guestbook";

export default async function Home() {
  await connection();
  const entries = await listEntries();

  return (
    <main className="mx-auto w-full max-w-[480px] px-5 pb-20 pt-10">
      <header className="mb-6">
        <p className="text-[13px] font-medium text-ink-3">개발자: 김동현 · 학번: 202484003</p>
        <h1 className="mt-1 text-[26px] font-bold tracking-tight">방명록</h1>
      </header>
      <Guestbook initialEntries={entries} />
    </main>
  );
}
