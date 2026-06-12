import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

type FormatDate = Date | dayjs.Dayjs | number | number[] | string;

type Format =
  | 'HH'
  | 'HH:mm'
  | 'HH:mm:ss'
  | 'YYYY'
  | 'YYYY-MM'
  | 'YYYY-MM-DD'
  | 'YYYY-MM-DD HH'
  | 'YYYY-MM-DD HH:mm'
  | 'YYYY-MM-DD HH:mm:ss'
  | (string & {});

export function formatDate(time?: FormatDate, format: Format = 'YYYY-MM-DD') {
  // 日期不存在，则返回空
  if (!time) {
    return '';
  }
  try {
    // 处理 Java LocalDate/LocalDateTime 序列化后的数组格式（月份从1开始）
    // LocalDate: [year, month, day]  LocalDateTime: [year, month, day, hour, minute, second]
    if (Array.isArray(time)) {
      const [year, month, day, hour, minute, second] = time;
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      if (hour !== undefined) {
        time = `${dateStr} ${String(hour).padStart(2, '0')}:${String(minute ?? 0).padStart(2, '0')}:${String(second ?? 0).padStart(2, '0')}`;
      } else {
        time = dateStr;
      }
    }
    const date = dayjs.isDayjs(time) ? time : dayjs(time);
    if (!date.isValid()) {
      throw new Error('Invalid date');
    }
    return date.tz().format(format);
  } catch (error) {
    console.error(`Error formatting date: ${error}`);
    return String(time ?? '');
  }
}

export function formatDateTime(time?: FormatDate) {
  return formatDate(time, 'YYYY-MM-DD HH:mm:ss');
}

export function formatDate2(date: Date, format?: string): string {
  // 日期不存在，则返回空
  if (!date) {
    return '';
  }
  // 日期存在，则进行格式化
  return date ? dayjs(date).format(format ?? 'YYYY-MM-DD HH:mm:ss') : '';
}

export function isDate(value: any): value is Date {
  return value instanceof Date;
}

export function isDayjsObject(value: any): value is dayjs.Dayjs {
  return dayjs.isDayjs(value);
}

/**
 * element plus 的时间 Formatter 实现，使用 YYYY-MM-DD HH:mm:ss 格式
 *
 * @param _row
 * @param _column
 * @param cellValue 字段值
 */
export function dateFormatter(_row: any, _column: any, cellValue: any): string {
  return cellValue ? formatDate(cellValue)?.toString() || '' : '';
}

/**
 * 获取当前时区
 * @returns 当前时区
 */
export const getSystemTimezone = () => {
  return dayjs.tz.guess();
};

/**
 * 自定义设置的时区
 */
let currentTimezone = getSystemTimezone();

/**
 * 设置默认时区
 * @param timezone
 */
export const setCurrentTimezone = (timezone?: string) => {
  currentTimezone = timezone || getSystemTimezone();
  dayjs.tz.setDefault(currentTimezone);
};

/**
 * 获取设置的时区
 * @returns 设置的时区
 */
export const getCurrentTimezone = () => {
  return currentTimezone;
};
