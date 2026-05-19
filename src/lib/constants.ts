export const editableFields = [
  'nickname',
  'phone',
  'emergency_phone',
  'line_id',
  'instagram',
  'facebook',
  'other_contact',
  'food_allergy',
  'disease',
  'drug_allergy',
] as const;

export const fieldLabels: Record<string, string> = {
  email: 'อีเมล',
  student_id: 'รหัสนักศึกษา',
  name_th: 'ชื่อภาษาไทย',
  name_en: 'ชื่อภาษาอังกฤษ',
  nickname: 'ชื่อเล่น',
  major: 'สาขา',
  phone: 'เบอร์โทร',
  emergency_phone: 'เบอร์ติดต่อฉุกเฉิน',
  line_id: 'Line ID',
  instagram: 'Instagram',
  facebook: 'Facebook',
  other_contact: 'ช่องทางติดต่ออื่น',
  food_allergy: 'แพ้อาหาร',
  disease: 'โรคประจำตัว',
  drug_allergy: 'แพ้ยา',
};

export const sensitiveFields = [
  'email',
  'phone',
  'emergency_phone',
  'line_id',
  'instagram',
  'facebook',
  'other_contact',
  'food_allergy',
  'disease',
  'drug_allergy',
];
