# 01: 방명록 글 작성과 목록 조회 (Create + Read)

**What to build:** 방문자가 로그인 없이 이름·메시지·비밀번호를 입력해 방명록 글을 남기면, 새로고침 없이 목록 맨 위에 나타난다. 페이지에 들어오면 전체 방명록 글이 작성 시각 최신순(한국 시간 `YYYY-MM-DD HH:mm`)으로 보이고, 헤더에는 개발자 이름 김동현과 학번 202484003이 항상 표시된다. 이 티켓은 이후 티켓이 쓸 기반도 함께 만든다: `entries` 스키마와 `npm run db:init`, 비밀번호 해시(작성 시 저장), 입력 검증, `npm run smoke` 뼈대. 세부 계약은 `.scratch/guestbook/spec.md`를 따른다.

**Blocked by:** None (can start immediately)

**Status:** done

- [x] `package.json`의 `name`이 `guestbook-202484003`이다
- [x] `npm run db:init`이 스펙의 `entries` 테이블을 `CREATE TABLE IF NOT EXISTS`로 만들고, 여러 번 실행해도 오류가 없다
- [x] 비밀번호는 Node 내장 `crypto.scrypt` + 랜덤 salt로 해시되어 저장되고, 평문은 어디에도 저장되지 않는다
- [x] `POST /api/entries`는 정상 입력에 `201`과 생성된 방명록 글을, 검증 실패(trim 후 이름 1–20자, 메시지 1–500자, 비밀번호 4–20자 위반 또는 누락)에 `400`과 `{ "error": "<한국어 문구>" }`를 돌려준다
- [x] `GET /api/entries`는 `created_at DESC, id DESC` 순서로 전체 방명록 글을 돌려준다
- [x] 어떤 API 응답에도 `password_hash`나 비밀번호가 포함되지 않는다
- [x] 페이지와 API는 캐시되지 않아 항상 최신 목록을 보여준다
- [x] 헤더에 "방명록"과 "개발자: 김동현 · 학번: 202484003"이 표시된다
- [x] 작성 폼: 비밀번호 입력란이 가려지고, 요청 중에는 버튼이 비활성화되며, 성공하면 폼이 비워지고 목록이 갱신되고, 실패하면 오류 문구가 표시되며 입력이 유지된다
- [x] 목록 항목에 작성자 이름, 작성 시각(`Asia/Seoul`), 메시지(줄바꿈 보존, HTML은 글자 그대로)가 표시되고, 방명록 글이 없으면 "아직 방명록 글이 없습니다."가 표시된다
- [x] `npm run smoke`(`SMOKE_URL` 기본값 `http://localhost:3000`)가 스펙의 smoke 1–3단계를 통과하고, 실패하면 non-zero로 종료한다
- [x] `npm run build`가 통과한다

참고: 이 시점에는 DELETE가 없어서 smoke가 실행할 때마다 테스트용 방명록 글이 1개씩 남는다. 02 완료 후 정리한다.
