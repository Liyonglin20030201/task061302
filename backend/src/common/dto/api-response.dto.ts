export class ApiResponse<T> {
  code: number;
  message: string;
  data: T;

  static success<T>(data: T, message = 'Success'): ApiResponse<T> {
    const res = new ApiResponse<T>();
    res.code = 200;
    res.message = message;
    res.data = data;
    return res;
  }

  static error(code: number, message: string): ApiResponse<null> {
    const res = new ApiResponse<null>();
    res.code = code;
    res.message = message;
    res.data = null;
    return res;
  }
}
