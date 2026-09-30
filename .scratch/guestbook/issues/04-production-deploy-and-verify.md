# 04: Production 배포와 실사이트 검증

**What to build:** 채점자가 Vercel Production 주소에 접속하면 방명록 글 작성·조회·수정·삭제가 모두 실제로 동작하고, 틀린 비밀번호로는 수정·삭제가 거부되며, 개발자 이름과 학번이 보인다. 로컬과 Production이 같은 Neon DB를 쓰므로, 제출 시점에는 테스트용 방명록 글이 남아 있지 않다. 배포 순서와 체크리스트는 `.scratch/guestbook/spec.md`의 Testing Decisions와 Further Notes를 따른다.

**Blocked by:** 02 (비밀번호 확인 후 삭제), 03 (비밀번호 확인 후 메시지 수정)

**Status:** ready-for-human

- [x] 로컬에서 `npm run build`와 `npm run lint`가 통과한다
- [x] 변경 사항이 GitHub 저장소 `guestbook-202484003`에 push되어 있다
- [x] Vercel 프로젝트 `guestbook-202484003`의 Production 배포가 성공했고, `DATABASE_URL` 환경변수가 Production에 적용되어 있다
- [x] `SMOKE_URL=<production 도메인> npm run smoke`가 1–8단계를 모두 통과한다
- [ ] UI 수동 체크리스트를 로컬과 Production에서 모두 통과한다: 개발자 이름·학번 표시 / 작성하면 맨 위에 나타나고 폼이 비워짐 / 틀린 비밀번호로 수정·삭제하면 폼 안에 안내가 뜨고 입력 유지 / 맞는 비밀번호로 수정하면 "(수정됨)", 삭제하면 사라짐 / 빈 입력은 안내와 함께 거부
- [x] 제출 직전 목록에 테스트용 방명록 글이 남아 있지 않다
- [x] Production URL이 기록되어 있다(이 티켓의 `## Comments`에 남긴다)

## Comments

**2026-09-30 — 에이전트 검증 기록**

- Production URL: https://test1-mu-inky-74.vercel.app
- 배포 커밋: `3b9dfce` (GitHub commit status `Vercel=success`, GitHub deployment 환경 `Production`)
- `SMOKE_URL=https://test1-mu-inky-74.vercel.app npm run smoke`: 1–8단계 전부 `ok`, `smoke passed`
- 추가 확인(Production):
  - 페이지 `200`, 헤더에 "개발자: 김동현 · 학번: 202484003" 표시
  - 작성 시각이 한국 시간으로 표시됨: UTC `06:30` → `2026-09-30 15:30`
  - HTML이 글자 그대로 이스케이프됨: `<b>x</b>` → `&lt;b&gt;x&lt;/b&gt;`
  - 틀린 비밀번호 DELETE → `403` "비밀번호가 일치하지 않습니다."
- 검증 후 `GET /api/entries` → `[]` (테스트용 방명록 글 없음)
- 로컬: `npm run lint`, `tsc`, smoke 1–8 통과. `npm run build`는 `c646d96`에서 로컬 통과, `3b9dfce`는 Vercel 빌드로 통과.
- 남은 항목: UI 수동 체크리스트(브라우저 클릭 동작)는 에이전트가 브라우저를 조작할 수 없어 사람이 확인해야 함 → Status `ready-for-human`. 확인 후 체크하고 Status를 `done`으로 바꾼다.
