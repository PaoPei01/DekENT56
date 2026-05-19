export type MajorInfo = {
  code: string;
  th: string;
  en: string;
};

export const majorCatalog: MajorInfo[] = [
  { code: 'CE', th: 'ภาควิชาวิศวกรรมโยธา', en: 'Civil Engineering' },
  { code: 'CIE', th: 'ภาควิชาวิศวกรรมโยธา (นานาชาติ)', en: 'Civil Engineering International Program' },
  { code: 'CPE', th: 'ภาควิชาวิศวกรรมคอมพิวเตอร์', en: 'Computer Engineering' },
  { code: 'EE', th: 'ภาควิชาวิศวกรรมไฟฟ้า', en: 'Electrical Engineering' },
  { code: 'EESG', th: 'ภาควิชาวิศวกรรมไฟฟ้าและเทคโนโลยีโครงข่ายไฟฟ้าอัจฉริยะ', en: 'Electrical Engineering and Smart Grid Technology' },
  { code: 'ENVI', th: 'ภาควิชาวิศวกรรมสิ่งแวดล้อม', en: 'Environmental Engineering' },
  { code: 'IE', th: 'ภาควิชาวิศวกรรมอุตสาหการ', en: 'Industrial Engineering' },
  { code: 'IEL', th: 'ภาควิชาวิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์', en: 'Industrial Engineering and Logistics Management' },
  { code: 'IGE', th: 'ภาควิชาวิศวกรรมบูรณาการ', en: 'Integrated Engineering' },
  { code: 'ISCE', th: 'ภาควิชาวิศวกรรมระบบสารสนเทศและความมั่นคงปลอดภัยไซเบอร์', en: 'Information Systems and Cyber Security Engineering' },
  { code: 'ME', th: 'ภาควิชาวิศวกรรมเครื่องกล', en: 'Mechanical Engineering' },
  { code: 'MEPM', th: 'ภาควิชาวิศวกรรมเครื่องกลและการบริหารโครงการวิศวกรรม', en: 'Mechanical Engineering and Project Management' },
  { code: 'MNP', th: 'ภาควิชาวิศวกรรมเหมืองแร่และปิโตรเลียม', en: 'Mining and Petroleum Engineering' },
  { code: 'REAI', th: 'ภาควิชาวิศวกรรมหุ่นยนต์และปัญญาประดิษฐ์', en: 'Robotics and Artificial Intelligence Engineering' },
  { code: 'SCE', th: 'ภาควิชาวิศวกรรมเซมิคอนดักเตอร์', en: 'Semiconductor Engineering' },
];

export function getMajorCode(major?: string | null) {
  const value = major ?? '';
  const match = value.match(/\(([A-Z0-9]+)\)\s*$/);
  if (match) return match[1];
  const normalized = value.toLowerCase();
  return majorCatalog.find((majorInfo) => normalized.includes(majorInfo.en.toLowerCase()) || normalized.includes(majorInfo.th.toLowerCase()))?.code ?? value;
}

export function normalizeMajor(major?: string | null) {
  const code = getMajorCode(major);
  const info = majorCatalog.find((item) => item.code === code);
  return info ? `${info.th} (${info.code})` : (major ?? 'ไม่ระบุ');
}

export function majorLabel(major?: string | null, language: 'th' | 'en' = 'th') {
  const code = getMajorCode(major);
  const info = majorCatalog.find((item) => item.code === code);
  if (!info) return major ?? (language === 'th' ? 'ไม่ระบุ' : 'Not specified');
  return language === 'th' ? `${info.code} · ${info.th}` : `${info.code} · ${info.en}`;
}

export function majorCodeOptions(values: (string | null)[]) {
  return [...new Set(values.map(getMajorCode).filter(Boolean))].sort();
}
