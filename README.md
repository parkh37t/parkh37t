# Parkh37t Dashboard

개인 일정과 할 일을 한 화면에서 관리하는 대시보드. Next.js 15 + Supabase + Google Calendar.

## 빠른 시작

```bash
npm install
cp .env.example .env.local   # Supabase / Google 키 채우기
npm run dev
```

env가 비어 있어도 데모 데이터로 화면이 뜹니다.

## 셋업 체크리스트

1. **Supabase**: 새 프로젝트 생성 → `supabase/schema.sql` 을 SQL editor에 붙여 실행 → URL과 anon key를 `.env.local`에 입력.
2. **Google Calendar**: [Google Cloud Console](https://console.cloud.google.com/apis/credentials)에서 OAuth 클라이언트 생성, 리다이렉트 URI를 `http://localhost:3000/api/google/callback`로 등록 → 클라이언트 ID/시크릿을 `.env.local`에 입력.
3. `npm run dev` 후 `/calendar` 페이지에서 "Google Calendar 연결" 버튼.

## 페이지

- `/` 대시보드 — 오늘 일정 / 할 일 / 이번 주 / 메모 위젯
- `/tasks` 할 일 전체 보기
- `/calendar` 주간 캘린더

## 스택

Next.js 15 (App Router, RSC) · TypeScript · Tailwind CSS · Supabase · Google Calendar API · PWA

상세 아키텍처는 [CLAUDE.md](./CLAUDE.md) 참고.
