import type { MainGroup, Subgroup } from './types';

export const mainGroups: MainGroup[] = ['Red', 'Blue', 'Yellow', 'Green', 'Pink', 'Purple', 'Orange'];
export const subgroups: Subgroup[] = ['A', 'B'];

export const groupMeta: Record<MainGroup, { th: string; en: string; color: string; soft: string; motto: string; meetingPoint: string; schedule: string; mentors: string[] }> = {
  Red: {
    th: 'สีแดง',
    en: 'Red',
    color: '#e53935',
    soft: 'rgba(229, 57, 53, 0.12)',
    motto: 'กล้าเริ่ม กล้าลุย ไปด้วยกัน',
    meetingPoint: 'ลานกิจกรรมโซนแดง',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟแดง A', 'พี่สตาฟแดง B'],
  },
  Blue: {
    th: 'สีน้ำเงิน',
    en: 'Blue',
    color: '#246bfe',
    soft: 'rgba(36, 107, 254, 0.12)',
    motto: 'มั่นใจ ชัดเจน ช่วยกัน',
    meetingPoint: 'ลานกิจกรรมโซนน้ำเงิน',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟน้ำเงิน A', 'พี่สตาฟน้ำเงิน B'],
  },
  Yellow: {
    th: 'สีเหลือง',
    en: 'Yellow',
    color: '#f2b705',
    soft: 'rgba(242, 183, 5, 0.16)',
    motto: 'สดใส เปิดใจ รู้จักเพื่อนใหม่',
    meetingPoint: 'ลานกิจกรรมโซนเหลือง',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟเหลือง A', 'พี่สตาฟเหลือง B'],
  },
  Green: {
    th: 'สีเขียว',
    en: 'Green',
    color: '#1f9d55',
    soft: 'rgba(31, 157, 85, 0.13)',
    motto: 'เติบโตไปพร้อมกัน',
    meetingPoint: 'ลานกิจกรรมโซนเขียว',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟเขียว A', 'พี่สตาฟเขียว B'],
  },
  Pink: {
    th: 'สีชมพู',
    en: 'Pink',
    color: '#e84a8a',
    soft: 'rgba(232, 74, 138, 0.13)',
    motto: 'อ่อนโยน สนุก และดูแลกัน',
    meetingPoint: 'ลานกิจกรรมโซนชมพู',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟชมพู A', 'พี่สตาฟชมพู B'],
  },
  Purple: {
    th: 'สีม่วง',
    en: 'Purple',
    color: '#7c4dff',
    soft: 'rgba(124, 77, 255, 0.13)',
    motto: 'คิดต่าง สร้างทีม',
    meetingPoint: 'ลานกิจกรรมโซนม่วง',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟม่วง A', 'พี่สตาฟม่วง B'],
  },
  Orange: {
    th: 'สีส้ม',
    en: 'Orange',
    color: '#f47b20',
    soft: 'rgba(244, 123, 32, 0.14)',
    motto: 'พลังเยอะ ยิ้มง่าย ช่วยไว',
    meetingPoint: 'ลานกิจกรรมโซนส้ม',
    schedule: '08:30 ลงทะเบียน · 09:00 กิจกรรมกลุ่ม',
    mentors: ['พี่สตาฟส้ม A', 'พี่สตาฟส้ม B'],
  },
};

export function groupKey(mainGroup: MainGroup, subgroup: Subgroup) {
  return `${mainGroup}-${subgroup}`;
}
