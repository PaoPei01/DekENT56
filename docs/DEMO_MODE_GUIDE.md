# Demo Mode Guide

## Purpose

Demo Mode provides presentation-ready interactive pages for Entaneer Gear 56 / สานสัมพันธ์ 69 / Entaneer Bonding 69 using mock data only.

It is intended for:

- ทีมงานทั่วไป
- พี่กลุ่ม
- พี่ฐาน
- ฝ่ายจราจร
- ฝ่ายพยาบาล
- ฝ่ายสวัสดิการ
- ฝ่ายช่างภาพ
- ทีมงานระบบ
- ผู้ดูแลกิจกรรม

## Routes

- `/#/demo`
- `/#/demo/staff`
- `/#/demo/system`
- `/#/demo/attendance`
- `/#/demo/emergency`

There is intentionally no `/demo/documents`, `/demo/applicant`, or `/demo/parent-orientation` route in Phase 1.

## Scope

Demo Mode focuses only on Entaneer Gear 56 / สานสัมพันธ์ 69.

Do not add Parent Orientation content, staff recruitment for Parent Orientation, public applicant flows, Document Center, document templates, document generation, document history, or DOCX export workflows to these demo pages.

## Mock Data Policy

Mock data lives in:

```text
src/data/demoEntaneerGear56.ts
```

All names, student IDs, contacts, attendance states, and case examples in that file must stay fake. Do not put real student, staff, participant, health, contact, or incident data in demo files.

Masked phone examples such as `08x-xxx-1234` are acceptable.

If a health note is ever needed for a demo, use generic wording only, such as:

```text
ข้อมูลสุขภาพจำลองสำหรับการสาธิต
```

## Presentation Use

Suggested flow:

1. Start at `/#/demo` to explain the four demo areas.
2. Open `/#/demo/staff` to show how a normal staff member checks their group, schedule, and duties.
3. Open `/#/demo/system` to show readiness, group distribution, station readiness, and admin action concepts.
4. Open `/#/demo/attendance` to show QR check-in and manual fallback concepts.
5. Open `/#/demo/emergency` to show field coordination and rain-plan handling.

All actions are local state only. Demo buttons may show a toast or modal, but must not call Supabase write APIs.

## Safety Notes

- Do not write to Supabase from demo pages.
- Do not import submit/update/delete service functions into demo pages.
- Do not expose private data.
- Do not require admin login.
- Do not break existing production routes.
- Keep every demo page visibly marked with `โหมดสาธิต`, `Demo Mode`, and mock-data warnings.
