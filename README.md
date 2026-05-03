# parkh37t Dashboard — Visual Refresh Patch

새 라벤더 미니멀 디자인을 기존 Next.js 레포(`parkh37t/parkh37t`)에 적용하기 위한 패치 묶음입니다.

## 📦 변경 파일 목록

### 수정 (덮어쓰기)
```
tailwind.config.ts
src/app/globals.css
src/app/layout.tsx
src/app/page.tsx
src/app/tasks/page.tsx
src/app/calendar/page.tsx
src/components/nav.tsx
src/components/dashboard/today-schedule.tsx
src/components/dashboard/task-list.tsx
src/components/dashboard/week-view.tsx
src/components/dashboard/quick-note.tsx
src/lib/theme.ts
src/lib/actions.ts
```

### 신규
```
src/lib/linkify.tsx
src/components/calendar/monthly-grid.tsx
```

## 🚀 적용 방법

### 옵션 1: 직접 복사 (가장 쉬움)
```bash
# 레포 루트에서
cp -r /path/to/parkh37t-patch/* ./
git checkout -b design/lavender-refresh
git add -A
git commit -m "feat(ui): lavender minimal dashboard redesign"
git push origin design/lavender-refresh
```
GitHub에서 PR 생성 → 머지하면 **Vercel이 자동 배포**합니다.

### 옵션 2: PR 만들 때 메시지
```
## 변경사항
- 라벤더 그라디언트 + 흰 카드 라이트 디자인 적용
- 24px radius 카드, 그라디언트 아이콘 헤더
- 우선순위 색 바 + soft pill 뱃지
- 주간 카드: today pulse 애니메이션, 점 인디케이터
- 메모: URL 자동 링크화 (linkify)
- 신규 월간 캘린더 페이지 (/calendar)
- 모바일 햄버거 → 사이드 drawer
- 한글 카테고리 라벨 (일반/업무/운동/학습/개인)
- 할 일 폼에 카테고리 + 마감일시 input 추가

## DB 마이그레이션 필요?
- ✅ 기존 스키마 그대로 호환 (category 컬럼은 이미 존재 가정)
- 만약 `category` 컬럼이 없다면 supabase/schema.sql에 추가 후 db:push
```

## ⚠️ 호환성 노트

### 1. `category` 컬럼이 DB에 있는지 확인
`supabase/schema.sql`의 `tasks` 테이블에 `category text` 컬럼과 CHECK 제약이 있어야 합니다. 없으면:

```sql
alter table tasks add column category text default 'default'
  check (category in ('default','work','personal','health','study'));
```

### 2. `due_at` 컬럼
`Task.dueAt` 필드는 이미 `src/types/index.ts`에 존재. DB의 `tasks.due_at` 컬럼이 있으면 OK.

### 3. lucide-react 아이콘
이미 `package.json`에 포함되어 있어 추가 설치 불필요.

### 4. 폰트
`<head>`에 Google Fonts (Inter, Noto Sans KR)를 inline `<link>` 로 추가했습니다. `next/font` 사용을 선호한다면 `layout.tsx`를 자유롭게 변경하세요.

## ✅ 적용 후 체크리스트

- [ ] `npm run dev`로 로컬에서 확인
- [ ] `npm run typecheck` 통과
- [ ] `npm run lint` 통과
- [ ] 대시보드 / 할 일 / 캘린더 3개 라우트 확인
- [ ] 모바일 (< 768px) 햄버거 메뉴 확인
- [ ] PR 생성 → 머지
- [ ] Vercel 자동 배포 (parkh37t.vercel.app) 확인

## 🎨 디자인 시스템 요약

| 토큰 | 값 |
|---|---|
| Surface | `#F5F4F8` + 라벤더 라디얼 그라디언트 |
| Card | `#FFFFFF`, radius 24px, 보더 `#F1F1F5` |
| Ink | `#1A1A2E` (primary), `#6B7280` (muted) |
| Lavender | `#7C6BF6` (primary), `#5046A8` (deep) |
| Priority | low `#60A5FA` / med `#FB923C` / high `#F472B6` |
