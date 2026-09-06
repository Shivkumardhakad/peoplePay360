package com.dj.payroll.exception;

import jakarta.servlet.http.HttpServletRequest;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

	@ExceptionHandler(ResourceNotFoundException.class)
	public ResponseEntity<ApiErrorResponse> handleResourceNotFoundException(
			ResourceNotFoundException exception,
			HttpServletRequest request
	) {
		HttpStatus status = HttpStatus.NOT_FOUND;
		return ResponseEntity.status(status)
				.body(ApiErrorResponse.of(status.value(), status.getReasonPhrase(), exception.getMessage(), request.getRequestURI()));
	}

	@ExceptionHandler(IllegalArgumentException.class)
	public ResponseEntity<ApiErrorResponse> handleIllegalArgumentException(
			IllegalArgumentException exception,
			HttpServletRequest request
	) {
		HttpStatus status = HttpStatus.BAD_REQUEST;
		return ResponseEntity.status(status)
				.body(ApiErrorResponse.of(status.value(), status.getReasonPhrase(), exception.getMessage(), request.getRequestURI()));
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<ApiErrorResponse> handleDataIntegrityViolation(
			DataIntegrityViolationException exception, HttpServletRequest request) {
		HttpStatus status = HttpStatus.CONFLICT;
		String detail = "The requested change conflicts with existing data.";
		Throwable root = exception.getMostSpecificCause();
		if (root != null && root.getMessage() != null) {
			detail = root.getMessage();
		}
		return ResponseEntity.status(status).body(ApiErrorResponse.of(
				status.value(), status.getReasonPhrase(), detail,
				request.getRequestURI()));
	}

	@ExceptionHandler(ExternalServiceException.class)
	public ResponseEntity<ApiErrorResponse> handleExternalService(
			ExternalServiceException exception, HttpServletRequest request) {
		HttpStatus status = HttpStatus.SERVICE_UNAVAILABLE;
		return ResponseEntity.status(status).body(ApiErrorResponse.of(
				status.value(), status.getReasonPhrase(), exception.getMessage(), request.getRequestURI()));
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValidException(
			MethodArgumentNotValidException exception,
			HttpServletRequest request
	) {
		HttpStatus status = HttpStatus.BAD_REQUEST;
		Map<String, String> validationErrors = exception.getBindingResult()
				.getFieldErrors()
				.stream()
				.collect(Collectors.toMap(
						error -> error.getField(),
						error -> error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage(),
						(existing, replacement) -> existing
				));

		return ResponseEntity.status(status)
				.body(ApiErrorResponse.withValidationErrors(
						status.value(),
						status.getReasonPhrase(),
						"Validation failed",
						request.getRequestURI(),
						validationErrors
				));
	}

	@ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
	public ResponseEntity<ApiErrorResponse> handleMalformedRequest(Exception exception, HttpServletRequest request) {
		HttpStatus status = HttpStatus.BAD_REQUEST;
		return ResponseEntity.status(status).body(ApiErrorResponse.of(
				status.value(), status.getReasonPhrase(), "Request body or parameter format is invalid.",
				request.getRequestURI()));
	}

	@ExceptionHandler(AccessDeniedException.class)
	public ResponseEntity<ApiErrorResponse> handleAccessDenied(AccessDeniedException exception, HttpServletRequest request) {
		HttpStatus status = HttpStatus.FORBIDDEN;
		return ResponseEntity.status(status).body(ApiErrorResponse.of(
				status.value(), status.getReasonPhrase(), "You do not have permission to perform this action.",
				request.getRequestURI()));
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<ApiErrorResponse> handleAuthentication(AuthenticationException exception, HttpServletRequest request) {
		HttpStatus status = HttpStatus.UNAUTHORIZED;
		return ResponseEntity.status(status).body(ApiErrorResponse.of(
				status.value(), status.getReasonPhrase(), "Authentication is required.", request.getRequestURI()));
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<ApiErrorResponse> handleException(Exception exception, HttpServletRequest request) {
		HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
		return ResponseEntity.status(status)
				.body(ApiErrorResponse.of(
						status.value(),
						status.getReasonPhrase(),
						"Something went wrong. Please try again later.",
						request.getRequestURI()
				));
	}
}
