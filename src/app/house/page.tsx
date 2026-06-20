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
          강남 삼성동 일대 전형적인 다세대주택 형태를 반영한 인터랙티브 3D 모델입니다.
          왼쪽 슬라이더로 층수·크기·필로티·옥탑을 실제 집에 맞춰 조정하세요. 정확한
          외형은 정면·측면 사진이나 건축물대장 수치(층수·건축면적·높이)를 반영해 더
          정교하게 만들 수 있습니다.
        </p>
      </div>
      <House3D />
    </>
  );
}
