// All data in this file is fake and for demonstration only. Do not put real personal data here.

export type DemoGroup = {
  group_key: string;
  label_th: string;
  label_en: string;
  subgroups: Array<'A' | 'B'>;
  participant_count: number;
  staff_count: number;
  checked_in_count: number;
  emergency_flag_count: number;
};

export type DemoStation = {
  station_number: number;
  location_th: string;
  departments: string[];
  staff_quota: number;
  current_staff_count: number;
  checked_in_staff_count: number;
  status: 'ready' | 'warning' | 'needs_attention';
};

export type DemoStaff = {
  id: string;
  student_id: string;
  name_th: string;
  name_en: string;
  nickname: string;
  major: string;
  year_level: number;
  role: string;
  main_group: string;
  subgroup: 'A' | 'B';
  station_number?: number;
  phone: string;
  attendance_status: 'checked_in' | 'pending' | 'late';
  profile_status: 'verified' | 'needs_update' | 'incomplete';
  emergency_role: boolean;
};

export type DemoParticipant = {
  id: string;
  student_id: string;
  name_th: string;
  name_en: string;
  nickname: string;
  major: string;
  main_group: string;
  subgroup: 'A' | 'B';
  check_in_status: 'checked_in' | 'pending' | 'late';
  public_safe_note: string;
};

export const demoEvent = {
  slug: 'entaneer-bonding-69',
  name_th: 'Entaneer Gear 56',
  secondary_name_th: 'สานสัมพันธ์ 69',
  name_en: 'Entaneer Gear 56',
  secondary_name_en: 'Entaneer Bonding 69',
  date_th: 'วันเสาร์ที่ 20 มิถุนายน 2569',
  rehearsal_th: 'วันศุกร์ที่ 13 มิถุนายน 2569',
  time_th: '08:00 - 17:15 น.',
  location_th: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยเชียงใหม่',
  expected_freshmen: 1050,
  confirmed_estimate: 1203,
  staff_total: 226,
  total_expected: 1276,
  group_count: 7,
  participants_per_color: 150,
  subgroups_per_color: 2,
  participants_per_subgroup: 75,
} as const;

export const demoGroups: DemoGroup[] = [
  { group_key: 'red', label_th: 'แดง', label_en: 'Red', subgroups: ['A', 'B'], participant_count: 151, staff_count: 10, checked_in_count: 138, emergency_flag_count: 1 },
  { group_key: 'blue', label_th: 'น้ำเงิน', label_en: 'Blue', subgroups: ['A', 'B'], participant_count: 149, staff_count: 10, checked_in_count: 140, emergency_flag_count: 0 },
  { group_key: 'green', label_th: 'เขียว', label_en: 'Green', subgroups: ['A', 'B'], participant_count: 152, staff_count: 11, checked_in_count: 143, emergency_flag_count: 1 },
  { group_key: 'yellow', label_th: 'เหลือง', label_en: 'Yellow', subgroups: ['A', 'B'], participant_count: 148, staff_count: 9, checked_in_count: 134, emergency_flag_count: 2 },
  { group_key: 'orange', label_th: 'ส้ม', label_en: 'Orange', subgroups: ['A', 'B'], participant_count: 150, staff_count: 10, checked_in_count: 139, emergency_flag_count: 0 },
  { group_key: 'purple', label_th: 'ม่วง', label_en: 'Purple', subgroups: ['A', 'B'], participant_count: 151, staff_count: 10, checked_in_count: 137, emergency_flag_count: 1 },
  { group_key: 'pink', label_th: 'ชมพู', label_en: 'Pink', subgroups: ['A', 'B'], participant_count: 149, staff_count: 10, checked_in_count: 136, emergency_flag_count: 1 },
];

export const demoStaffRoles = [
  { role: 'management', label_th: 'ทีมบริหาร', quota: 7 },
  { role: 'group_mentor', label_th: 'พี่กลุ่ม', quota: 70 },
  { role: 'station_staff', label_th: 'พี่ฐานประจำกิจกรรม', quota: 112 },
  { role: 'timer', label_th: 'ฝ่ายไทม์เมอร์', quota: 9 },
  { role: 'medical', label_th: 'ฝ่ายพยาบาล', quota: 9 },
  { role: 'entertainment', label_th: 'สตาฟให้ความบันเทิง', quota: 4 },
  { role: 'welfare', label_th: 'ฝ่ายสวัสดิการ', quota: 8 },
  { role: 'traffic', label_th: 'ฝ่ายจราจร', quota: 13 },
  { role: 'photographer', label_th: 'ฝ่ายช่างภาพ', quota: 7 },
];

export const demoStations: DemoStation[] = [
  { station_number: 1, location_th: 'อาคารฤทธา', departments: ['CE', 'CIE'], staff_quota: 16, current_staff_count: 16, checked_in_staff_count: 15, status: 'ready' },
  { station_number: 2, location_th: 'อาคาร SMC HUB', departments: ['EE', 'EESG'], staff_quota: 16, current_staff_count: 15, checked_in_staff_count: 13, status: 'warning' },
  { station_number: 3, location_th: 'โรงอาหาร ชั้น 1', departments: ['ME', 'MEPM'], staff_quota: 16, current_staff_count: 16, checked_in_staff_count: 16, status: 'ready' },
  { station_number: 4, location_th: 'อาคารเรียนรวม 3 ชั้น', departments: ['IE', 'IEL'], staff_quota: 16, current_staff_count: 14, checked_in_staff_count: 12, status: 'warning' },
  { station_number: 5, location_th: 'อาคาร 30 ปี / ตึก 8 ชั้น', departments: ['ENVI', 'MNP'], staff_quota: 16, current_staff_count: 13, checked_in_staff_count: 10, status: 'needs_attention' },
  { station_number: 6, location_th: 'อาคารเรียนรวม 4 ชั้น', departments: ['CPE', 'ISNE'], staff_quota: 16, current_staff_count: 16, checked_in_staff_count: 14, status: 'ready' },
  { station_number: 7, location_th: 'โรงอาหาร ชั้น 2', departments: ['RAI', 'IGE', 'IGME'], staff_quota: 16, current_staff_count: 15, checked_in_staff_count: 13, status: 'warning' },
];

const staffNames = [
  ['นายตัวอย่าง ทีมงาน', 'Example Staff One', 'ต้น', 'พี่กลุ่ม', 'แดง', 'A', 1],
  ['นางสาวสาธิต ใจดี', 'Demo Jaidee', 'มายด์', 'พี่กลุ่ม', 'แดง', 'A', 1],
  ['นายระบบ พร้อมใช้', 'System Ready', 'คิว', 'ทีมงานระบบ', 'แดง', 'B', 6],
  ['นางสาวดูแล หน้างาน', 'Field Care', 'แพร', 'ฝ่ายพยาบาล', 'น้ำเงิน', 'A', 2],
  ['นายจราจร คล่องตัว', 'Traffic Flow', 'บอส', 'ฝ่ายจราจร', 'น้ำเงิน', 'B', 2],
  ['นางสาวกล้อง เก็บภาพ', 'Photo Snap', 'ฟ้า', 'ฝ่ายช่างภาพ', 'เขียว', 'A', 3],
  ['นายฐาน พร้อมกิจกรรม', 'Station Ready', 'เจมส์', 'พี่ฐาน', 'เขียว', 'B', 3],
  ['นางสาวสวัสดิการ อิ่มใจ', 'Welfare Kind', 'พลอย', 'ฝ่ายสวัสดิการ', 'เหลือง', 'A', 4],
  ['นายเวลา แม่นยำ', 'Timer Pace', 'นัท', 'ฝ่ายไทม์เมอร์', 'เหลือง', 'B', 4],
  ['นางสาวบันเทิง สดใส', 'Entertain Bright', 'เพลง', 'สตาฟให้ความบันเทิง', 'ส้ม', 'A', 5],
  ['นายประสานงาน เรียบร้อย', 'Coordinator Neat', 'โอม', 'ทีมบริหาร', 'ส้ม', 'B', 5],
  ['นางสาวพี่กลุ่ม อุ่นใจ', 'Mentor Warm', 'แอน', 'พี่กลุ่ม', 'ม่วง', 'A', 6],
  ['นายฐาน สนุกดี', 'Station Fun', 'ปอนด์', 'พี่ฐาน', 'ม่วง', 'B', 6],
  ['นางสาวพยาบาล สบายดี', 'Medic Calm', 'น้ำ', 'ฝ่ายพยาบาล', 'ชมพู', 'A', 7],
  ['นายถ่ายภาพ มุมดี', 'Photo Angle', 'วิน', 'ฝ่ายช่างภาพ', 'ชมพู', 'B', 7],
  ['นางสาวจราจร ทางสะดวก', 'Traffic Clear', 'เบล', 'ฝ่ายจราจร', 'แดง', 'B', 1],
  ['นายสวัสดิการ พร้อมแจก', 'Welfare Supply', 'เต้', 'ฝ่ายสวัสดิการ', 'น้ำเงิน', 'A', 2],
  ['นางสาวระบบ เช็กอิน', 'System Checkin', 'มุก', 'ทีมงานระบบ', 'เขียว', 'B', 3],
  ['นายพี่กลุ่ม ใจเย็น', 'Mentor Cool', 'อาร์ม', 'พี่กลุ่ม', 'เหลือง', 'A', 4],
  ['นางสาวฐาน ประจำจุด', 'Station Point', 'อิง', 'พี่ฐาน', 'ส้ม', 'B', 5],
  ['นายบริหาร ภาพรวม', 'Admin Overview', 'กันต์', 'ทีมบริหาร', 'ม่วง', 'A', 6],
  ['นางสาวไทม์เมอร์ เป๊ะ', 'Timer Exact', 'จูน', 'ฝ่ายไทม์เมอร์', 'ชมพู', 'B', 7],
  ['นายพยาบาล เฝ้าระวัง', 'Medic Watch', 'แม็ก', 'ฝ่ายพยาบาล', 'แดง', 'A', 1],
  ['นางสาวทั่วไป ช่วยงาน', 'General Helper', 'ฝ้าย', 'พี่ฐาน', 'น้ำเงิน', 'B', 2],
  ['นายกิจกรรม สนุกมาก', 'Activity Joy', 'บีม', 'สตาฟให้ความบันเทิง', 'เขียว', 'A', 3],
  ['นางสาวกลุ่ม ดูแลดี', 'Group Care', 'ขิม', 'พี่กลุ่ม', 'เหลือง', 'B', 4],
  ['นายระบบ สำรอง', 'System Backup', 'แทน', 'ทีมงานระบบ', 'ส้ม', 'A', 5],
  ['นางสาวจราจร จุดรวมพล', 'Traffic Meet', 'แพท', 'ฝ่ายจราจร', 'ม่วง', 'B', 6],
] as const;

export const demoStaff: DemoStaff[] = staffNames.map((item, index) => ({
  id: `staff-${index + 1}`,
  student_id: `66${String(index + 1).padStart(7, '0')}`,
  name_th: item[0],
  name_en: item[1],
  nickname: item[2],
  major: ['CE', 'CPE', 'ME', 'EE', 'IE', 'ENVI', 'RAI'][index % 7],
  year_level: index % 2 === 0 ? 3 : 2,
  role: item[3],
  main_group: item[4],
  subgroup: item[5],
  station_number: item[6],
  phone: `08x-xxx-${String(1200 + index).slice(-4)}`,
  attendance_status: index % 9 === 0 ? 'late' : index % 5 === 0 ? 'pending' : 'checked_in',
  profile_status: index % 11 === 0 ? 'incomplete' : index % 6 === 0 ? 'needs_update' : 'verified',
  emergency_role: ['ฝ่ายพยาบาล', 'ฝ่ายจราจร', 'ทีมบริหาร', 'ทีมงานระบบ'].includes(item[3]),
}));

const participantNicknames = ['ข้าว', 'มิว', 'ปิง', 'ฟาง', 'พีท', 'นุ่น', 'เฟิร์น', 'อิคคิว', 'จ๋า', 'ไทม์', 'วิว', 'ซัน', 'แพรว', 'ตูน', 'หมิว', 'เก้า', 'เอม', 'เนม', 'บิว', 'ฟิล์ม', 'กาย', 'มิ้นท์', 'ไนซ์', 'จีน', 'ภู', 'แป้ง', 'เติร์ด', 'ใบเตย', 'โอ๊ต', 'พริม', 'แพน', 'ฟลุค', 'เมย์', 'ยู', 'ต้า', 'ฝน', 'บูม', 'โม', 'ไอซ์', 'แบงค์', 'แคท', 'ปาย'];

export const demoParticipants: DemoParticipant[] = participantNicknames.map((nickname, index) => {
  const group = demoGroups[index % demoGroups.length];
  return {
    id: `freshman-${index + 1}`,
    student_id: `69${String(index + 1).padStart(7, '0')}`,
    name_th: `น้องตัวอย่าง ${nickname}`,
    name_en: `Demo Freshman ${index + 1}`,
    nickname,
    major: ['CE', 'CIE', 'CPE', 'EE', 'ME', 'IE', 'ENVI', 'RAI'][index % 8],
    main_group: group.label_th,
    subgroup: index % 2 === 0 ? 'A' : 'B',
    check_in_status: index % 13 === 0 ? 'late' : index % 6 === 0 ? 'pending' : 'checked_in',
    public_safe_note: 'ข้อมูลสาธิตที่ปลอดภัยต่อการแสดงผล',
  };
});

export const demoAttendanceSessions = [
  { id: 'rehearsal', title_th: 'วันซ้อม', checked_in: 198, pending: 23, late: 5 },
  { id: 'event-morning', title_th: 'ลงทะเบียนเช้าวันงาน', checked_in: 203, pending: 18, late: 5 },
  { id: 'before-stations', title_th: 'ก่อนเริ่มเดินฐาน', checked_in: 210, pending: 12, late: 4 },
  { id: 'after-event', title_th: 'หลังจบกิจกรรม', checked_in: 206, pending: 16, late: 4 },
];

export const demoEmergencyCases = [
  { id: 'case-1', title_th: 'น้องหากลุ่มไม่เจอ', location_th: 'หน้าอาคารฤทธา', responsible_role: 'พี่กลุ่ม', priority: 'medium', status: 'open' },
  { id: 'case-2', title_th: 'ผู้เข้าร่วมรู้สึกไม่สบาย', location_th: 'โรงอาหาร ชั้น 1', responsible_role: 'ฝ่ายพยาบาล', priority: 'high', status: 'in_progress' },
  { id: 'case-3', title_th: 'ฝนตกบริเวณฐานกิจกรรม', location_th: 'อาคาร 30 ปี / ตึก 8 ชั้น', responsible_role: 'ทีมบริหาร', priority: 'medium', status: 'open' },
  { id: 'case-4', title_th: 'จุดลงทะเบียนแออัด', location_th: 'จุดลงทะเบียนโรงอาหาร', responsible_role: 'ฝ่ายจราจร', priority: 'low', status: 'resolved' },
] as const;

export const demoRainPlans = [
  { condition_th: 'ฝนตกก่อนเริ่มงาน', action_th: 'ปรับพื้นที่รวมพลเข้าสู่อาคารในร่มและแจ้งจุดรวมพลผ่านประกาศกิจกรรม' },
  { condition_th: 'ฝนตกเบาระหว่างกิจกรรม', action_th: 'ให้สตาฟตรวจพื้นลื่นและปรับรูปแบบกิจกรรมตามความเหมาะสม' },
  { condition_th: 'ฝนตกหนักระหว่างกิจกรรม', action_th: 'หยุดการเดินเวียนฐานชั่วคราวและให้น้องอยู่ในพื้นที่ปลอดภัยของฐานนั้น ๆ' },
  { condition_th: 'ฝนตกหลังเสร็จสิ้นกิจกรรม', action_th: 'ดูแลให้อยู่ในอาคารจนกว่าสภาพอากาศปลอดภัยและประสานจุดรับกลับ' },
];
