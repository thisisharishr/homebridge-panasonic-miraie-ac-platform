export class Utils {
  public static generateId(length : number) {
    length = length || 5;
    return (Math.random() + 1).toString(36).substring(2, length);
  }

  public static isNumber(value?: string | number): boolean
  {
    return ((value != null) &&
        (value !== '') &&
        !isNaN(Number(value.toString())));
  }
}
