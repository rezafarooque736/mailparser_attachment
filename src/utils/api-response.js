class ApiResponse {
  constructor(statusCode, data, message = "Success") {
    this.statusCode = Number(statusCode);
    this.data = data;
    this.message = String(message);
    this.success = this.statusCode < 400;
  }
}

export default ApiResponse;
