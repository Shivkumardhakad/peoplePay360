package com.dj.payroll.exception;

import java.time.LocalDateTime;
import java.util.Map;

public class ApiErrorResponse {

	private LocalDateTime timestamp;
	private int status;
	private String error;
	private String message;
	private String path;
	private Map<String, String> validationErrors;

	public ApiErrorResponse(
			LocalDateTime timestamp,
			int status,
			String error,
			String message,
			String path,
			Map<String, String> validationErrors
	) {
		this.timestamp = timestamp;
		this.status = status;
		this.error = error;
		this.message = message;
		this.path = path;
		this.validationErrors = validationErrors;
	}

	public static ApiErrorResponse of(int status, String error, String message, String path) {
		return new ApiErrorResponse(LocalDateTime.now(), status, error, message, path, null);
	}

	public static ApiErrorResponse withValidationErrors(
			int status,
			String error,
			String message,
			String path,
			Map<String, String> validationErrors
	) {
		return new ApiErrorResponse(LocalDateTime.now(), status, error, message, path, validationErrors);
	}

	public LocalDateTime getTimestamp() {
		return timestamp;
	}

	public int getStatus() {
		return status;
	}

	public String getError() {
		return error;
	}

	public String getMessage() {
		return message;
	}

	public String getPath() {
		return path;
	}

	public Map<String, String> getValidationErrors() {
		return validationErrors;
	}
}
