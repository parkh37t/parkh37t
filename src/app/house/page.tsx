import { House3D } from "@/components/house/house-3d";

export const metadata = {
  title: "우리집 3D · Dashboard",
};

export default function HousePage() {
  return (
    <>
      <div className="mb-7">
        <div className="text-[13px] text-ink-muted font-medium mb-1.5">
          서울 강남구 봉은사로 21길 57 · 다세대주택
        </div>
        <h1 className="text-[32px] lg:text-[40px] font-extrabold tracking-tight">
          우리집 3D
        </h1>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-ink-muted">
          실제 사진을 반영한 인터랙티브 3D 모델입니다 — 적벽돌 외벽, 기와 모임지붕,
          위층 코너의 통유리 베란다, 검은 대문과 벽돌 담장, 주차 캐노피 아래 SUV까지.
          왼쪽 슬라이더·토글로 층수·크기·반지하 노출 등을 더 세밀하게 맞출 수 있습니다.
        </p>
      </div>
      <House3D />
    </>
  );
}
