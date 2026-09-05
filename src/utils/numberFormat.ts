// Bengali numeral and formatting utilities

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBnDigits(num: number | string): string {
  if (num === null || num === undefined) return '';
  const str = String(num);
  return str.replace(/\d/g, (d) => BN_DIGITS[parseInt(d, 10)]);
}

export function formatNum(num: number | string, useBengali = true): string {
  if (num === null || num === undefined || isNaN(Number(num))) return '০';
  const val = typeof num === 'number' ? (Number.isInteger(num) ? num : num.toFixed(2)) : num;
  return useBengali ? toBnDigits(val) : String(val);
}

export function formatCurrency(
  amount: number | null | undefined,
  currency = '৳',
  useBengali = true
): string {
  if (amount === null || amount === undefined || isNaN(amount)) return `${currency}০`;
  const formatted = amount % 1 === 0 ? amount.toFixed(0) : amount.toFixed(2);
  return `${currency}${useBengali ? toBnDigits(formatted) : formatted}`;
}

export function getTodayFormatted(format: 'DD MMMM YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' = 'DD MMMM YYYY'): string {
  const d = new Date();
  const day = d.getDate();
  const monthIndex = d.getMonth();
  const year = d.getFullYear();

  const monthsBn = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];

  const monthsEn = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (format === 'DD/MM/YYYY') {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(day)}/${pad(monthIndex + 1)}/${year}`;
  }

  if (format === 'YYYY-MM-DD') {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${year}-${pad(monthIndex + 1)}-${pad(day)}`;
  }

  const padDay = String(day).padStart(2, '0');
  return `${padDay} ${monthsEn[monthIndex]} ${year}`;
}

export function getTimeFormatted(): string {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const padMin = String(minutes).padStart(2, '0');
  return `${String(hours).padStart(2, '0')}:${padMin} ${ampm}`;
}
