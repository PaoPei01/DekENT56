export type MajorInfo = {
  code: string;
  th: string;
  en: string;
  aliases?: string[];
};

export const majorCatalog: MajorInfo[] = [
  { code: 'CE', th: 'วิศวกรรมโยธา', en: 'Civil Engineering', aliases: ['ภาควิชาวิศวกรรมโยธา'] },
  { code: 'CIE', th: 'วิศวกรรมโยธา (นานาชาติ)', en: 'Civil Engineering (International)', aliases: ['ภาควิชาวิศวกรรมโยธา (นานาชาติ)'] },
  { code: 'CPE', th: 'วิศวกรรมคอมพิวเตอร์', en: 'Computer Engineering', aliases: ['ภาควิชาวิศวกรรมคอมพิวเตอร์'] },
  { code: 'EE', th: 'วิศวกรรมไฟฟ้า', en: 'Electrical Engineering', aliases: ['ภาควิชาวิศวกรรมไฟฟ้า'] },
  { code: 'EESG', th: 'วิศวกรรมไฟฟ้าและเทคโนโลยีโครงข่ายไฟฟ้าอัจฉริยะ', en: 'Electrical Engineering and Smart Grid Technology', aliases: ['ภาควิชาวิศวกรรมไฟฟ้าและเทคโนโลยีโครงข่ายไฟฟ้าอัจฉริยะ'] },
  { code: 'ENVI', th: 'วิศวกรรมสิ่งแวดล้อม', en: 'Environmental Engineering', aliases: ['ภาควิชาวิศวกรรมสิ่งแวดล้อม'] },
  { code: 'IE', th: 'วิศวกรรมอุตสาหการ', en: 'Industrial Engineering', aliases: ['ภาควิชาวิศวกรรมอุตสาหการ'] },
  { code: 'IEL', th: 'วิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์', en: 'Industrial Engineering and Logistics Management', aliases: ['ภาควิชาวิศวกรรมอุตสาหการและการจัดการ โลจิสติกส์'] },
  { code: 'IGE', th: 'วิศวกรรมบูรณาการ', en: 'Integrated Engineering', aliases: ['ภาควิชาวิศวกรรมบูรณาการ'] },
  { code: 'IGME', th: 'วิศวกรรมบูรณาการ และพหุวิทยาการ', en: 'Integrated and Multi-disciplinary Engineering', aliases: ['ภาควิชาวิศวกรรมบูรณาการ และพหุวิทยาการ', 'IGE International', 'IGE international', 'Integrated and Multi-disciplinary Engineering (IGE International)'] },
  { code: 'ISCE', th: 'วิศวกรรมระบบสารสนเทศและความมั่นคงปลอดภัยไซเบอร์', en: 'Information Systems and Cybersecurity Engineering', aliases: ['ภาควิชาวิศวกรรมระบบสารสนเทศและความมั่นคงปลอดภัยไซเบอร์'] },
  { code: 'ISNE', th: 'วิศวกรรมระบบสารสนเทศและเครือข่าย', en: 'Information Systems and Network Engineering', aliases: ['ภาควิชาวิศวกรรมระบบสารสนเทศและเครือข่าย'] },
  { code: 'ME', th: 'วิศวกรรมเครื่องกล', en: 'Mechanical Engineering', aliases: ['ภาควิชาวิศวกรรมเครื่องกล'] },
  { code: 'MEPM', th: 'วิศวกรรมเครื่องกลและการบริหารโครงการวิศวกรรม', en: 'Mechanical Engineering and Engineering Project Management', aliases: ['ภาควิชาวิศวกรรมเครื่องกลและการบริหารโครงการวิศวกรรม'] },
  { code: 'MNP', th: 'วิศวกรรมเหมืองแร่และปิโตรเลียม', en: 'Mining and Petroleum Engineering', aliases: ['ภาควิชาวิศวกรรมเหมืองแร่และปิโตรเลียม'] },
  { code: 'REAI', th: 'วิศวกรรมหุ่นยนต์และปัญญาประดิษฐ์', en: 'Robotics Engineering and Artificial Intelligence', aliases: ['ภาควิชาวิศวกรรมหุ่นยนต์และปัญญาประดิษฐ์'] },
  { code: 'SCE', th: 'วิศวกรรมเซมิคอนดักเตอร์', en: 'Semiconductor Engineering', aliases: ['ภาควิชาวิศวกรรมเซมิคอนดักเตอร์'] },
];

export function canonicalMajor(info: MajorInfo) {
  return `${info.th} (${info.code === 'IGME' ? 'IGE international' : info.code})`;
}

function simplifyMajor(value: string) {
  return value
    .toLowerCase()
    .replace(/ภาควิชา/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function getMajorCode(major?: string | null) {
  const value = major ?? '';
  const match = value.match(/\(([^)]+)\)\s*$/);
  if (match) {
    const rawCode = match[1].replace(/\s+/g, ' ').trim();
    if (/^(ige\s*international|igme)$/i.test(rawCode)) return 'IGME';
    const code = rawCode.toUpperCase();
    if (majorCatalog.some((majorInfo) => majorInfo.code === code)) return code;
  }
  const normalized = simplifyMajor(value);
  const exactCode = majorCatalog.find((majorInfo) => normalized === majorInfo.code.toLowerCase());
  if (exactCode) return exactCode.code;
  return (
    [...majorCatalog].sort((a, b) => b.th.length + b.en.length - (a.th.length + a.en.length)).find((majorInfo) => {
      const code = majorInfo.code.toLowerCase();
      return [
        majorInfo.en,
        majorInfo.th,
        ...(majorInfo.aliases ?? []),
        `(${code})`,
      ].some((candidate) => normalized.includes(simplifyMajor(candidate)));
    })?.code ?? value
  );
}

export function normalizeMajor(major?: string | null) {
  const code = getMajorCode(major);
  const info = majorCatalog.find((item) => item.code === code);
  return info ? canonicalMajor(info) : (major ?? 'ไม่ระบุ');
}

export function majorLabel(major?: string | null, language: 'th' | 'en' = 'th') {
  const code = getMajorCode(major);
  const info = majorCatalog.find((item) => item.code === code);
  if (!info) return major ?? (language === 'th' ? 'ไม่ระบุ' : 'Not specified');
  return language === 'th' ? canonicalMajor(info) : `${info.en} (${info.code})`;
}

export function majorCodeOptions(values: (string | null)[]) {
  return [...new Set(values.map(getMajorCode).filter(Boolean))].sort();
}
