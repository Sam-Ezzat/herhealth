interface ApiResponseData<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

class ApiResponse {
  static success<T>(data: T, message?: string, meta?: any) {
    const response: ApiResponseData<T> = {
      success: true,
      data,
    };

    if (message) {
      response.message = message;
    }

    if (meta) {
      response.meta = meta;
    }

    return response;
  }

  static error(message: string, statusCode = 500) {
    return {
      success: false,
      error: message,
      statusCode,
    };
  }

  static paginated<T>(
    data: T[],
    page: number,
    limit: number,
    total: number,
    message?: string
  ) {
    return {
      success: true,
      message,
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

export default ApiResponse;
