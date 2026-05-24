# Microcopy Style Guide

## Purpose

Use short, natural, Thai-first wording that feels trustworthy during real event operations. Public users should see what they need to do next, not how the system works internally.

## General Rules

- Keep public empty states short: `ยังไม่มีประกาศ`, `ยังไม่มีข้อมูลในขณะนี้`, `ไม่พบข้อมูล กรุณาตรวจสอบอีกครั้ง`.
- Do not expose internal implementation words in public UI: `pilot`, `backend`, `database`, `sync`, `RPC`, `Visible`, `Audience`.
- Keep admin troubleshooting in guide/help docs, not primary empty states.
- Use formal but natural Thai. Avoid phrases like `ระบบได้ทำการ`, `ข้อมูลดังกล่าวข้างต้น`, and `ดำเนินการดังกล่าว`.
- English copy should be direct: `Loading data`, `No data yet`, `Request submitted`, `Could not save. Please try again.`

## Public Examples

Before: `ถ้าเพิ่งสร้างประกาศ ให้ตรวจว่าเลือก Visible, Audience เป็น Public หรือ Staff`

After: `โปรดติดตามประกาศและอัปเดตจากผู้ดูแลกิจกรรม`

Before: `ใบสมัครนี้เป็น pilot ของระบบหลายกิจกรรม`

After: `ส่งใบสมัครแล้วติดตามสถานะได้จากหน้ากิจกรรมนี้`

Before: `สถานะในฐานข้อมูลอาจรอการซิงก์`

After: `ระบบได้รับใบสมัครแล้ว หากมีข้อมูลที่ต้องตรวจเพิ่มเติม ผู้ดูแลจะตรวจสอบภายหลัง`

## Attendance Labels

- `present`: `เช็กชื่อแล้ว` / `Checked in`
- `late`: `มาสาย` / `Late`
- `absent`: `ยังไม่เช็กชื่อ` / `Not checked in`
- `excused`: `แจ้งไว้แล้ว` / `Excused`
- `checked_out`: `เช็กออกแล้ว` / `Checked out`

Use `สถานะล่าสุด` / `Latest status` for the most recent staff-facing attendance card.

## Attendance Methods

- `admin_scan`, `personal_qr`, `admin_scan_staff_qr`: `แอดมินสแกน QR` / `Admin scanned QR`
- `session_qr`, `verified_qr`, `verified_camera_scan`: `สแกน QR รอบเช็กชื่อ` / `Session QR scan`
- `manual`: `เช็กชื่อโดยผู้ดูแล` / `Manual check-in`
- `system`: `บันทึกโดยระบบ` / `System`

## Safety

Do not show other applicants' or staff members' private data in public flows. For verified staff attendance history, show only the staff member matched by the verified token.
