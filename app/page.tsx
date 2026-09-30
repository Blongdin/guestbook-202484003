import { connection } from "next/server";
import { listEntries } from "@/lib/entries";
import Guestbook from "./guestbook";

export default async function Home() {
  await connection();
  const entries = await listEntries();

  return (
    <main className="mx-auto w-full max-w-xl px-4 py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">방명록</h1>
        <p className="mt-2 text-sm text-zinc-600">개발자: 김동현 · 학번: 202484003</p>
      </header>
      <Guestbook initialEntries={entries} />
    </main>
  );
}
