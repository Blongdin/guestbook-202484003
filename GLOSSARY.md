# Guestbook

A single-page mini guestbook where anyone can leave a message without an account, and only the person who knows an entry's password can edit or delete it.

## Language

**방명록 글 (Entry)**:
One record left in the guestbook, made up of an author name, a message, and the time it was written.
_Avoid_: 게시물, 게시글, 댓글, post, comment

**작성자 (Author)**:
The person who wrote an Entry, identified only by the name they typed; there are no accounts.
_Avoid_: 사용자, 회원, user, member

**메시지 (Message)**:
The body text of an Entry; the only part of an Entry that can be edited.
_Avoid_: 내용, content, body

**비밀번호 (Entry Password)**:
A secret the Author sets when writing an Entry, required to edit or delete that one Entry.
_Avoid_: 계정 비밀번호, login password

**작성 시각 (Written At)**:
The moment an Entry was first created; the guestbook is ordered by it, newest first, and editing never changes it.
_Avoid_: 등록일, 날짜, date
