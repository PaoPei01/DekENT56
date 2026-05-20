export const copy = {
  th: {
    hiddenForPrivacy: 'ซ่อนเพื่อความเป็นส่วนตัว',
    tryNicknameOrMajor: 'ลองค้นด้วยชื่อเล่นหรือสาขา',
    tryPublicSearch: 'ไม่พบรายชื่อ ลองค้นด้วยชื่อเล่น สาขา หรือชื่อภาษาอังกฤษ',
    importCommit: 'นำเข้าข้อมูลจริง',
    syncStaffRoster: 'ซิงค์ข้อมูลทีมงาน',
    staffLogin: 'เข้าสู่ระบบทีมงาน',
    staffAccount: 'บัญชีทีมงาน',
    staffHome: 'หน้าสตาฟ',
    adminDashboard: 'แดชบอร์ดแอดมิน',
    clearFilters: 'ล้างตัวกรอง',
    generatedRememberSave: 'จัดกลุ่มใหม่แล้ว อย่าลืมกดบันทึก',
    medicalVisible: 'ข้อมูลสุขภาพที่มองเห็น',
    clearGroups: 'ลบการจัดกลุ่มทั้งหมด',
  },
  en: {
    hiddenForPrivacy: 'Hidden for privacy',
    tryNicknameOrMajor: 'Try searching by nickname or major',
    tryPublicSearch: 'No participants found. Try nickname, major, or English name.',
    importCommit: 'Commit import',
    syncStaffRoster: 'Sync staff roster',
    staffLogin: 'Staff Login',
    staffAccount: 'Staff Account',
    staffHome: 'Staff Home',
    adminDashboard: 'Admin Dashboard',
    clearFilters: 'Clear filters',
    generatedRememberSave: 'Groups regenerated. Remember to save.',
    medicalVisible: 'Visible medical data',
    clearGroups: 'Clear all groups',
  },
};

export type CopyLanguage = keyof typeof copy;
