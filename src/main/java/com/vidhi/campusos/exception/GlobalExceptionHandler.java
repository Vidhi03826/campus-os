package com.vidhi.campusos.exception;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.Instant;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // =========================================================
    // DUPLICATE RESOURCE
    // =========================================================

    @ExceptionHandler(ResourceAlreadyExistsException.class)
    public ResponseEntity<ErrorResponse> handleDuplicate(
            ResourceAlreadyExistsException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.CONFLICT,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // RESOURCE NOT FOUND
    // =========================================================

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            ResourceNotFoundException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.NOT_FOUND,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // INVALID CREDENTIALS
    // =========================================================

    @ExceptionHandler(InvalidCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleInvalidCredentials(
            InvalidCredentialsException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.UNAUTHORIZED,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // ACCOUNT LOCKED
    // =========================================================

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(
            AccountLockedException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.LOCKED,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // INVALID REFRESH TOKEN
    // =========================================================

    @ExceptionHandler(InvalidRefreshTokenException.class)
    public ResponseEntity<ErrorResponse> handleInvalidRefreshToken(
            InvalidRefreshTokenException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.UNAUTHORIZED,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // VALIDATION ERRORS
    // =========================================================

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {

        String message = exception.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error ->
                        error.getField()
                                + ": "
                                + error.getDefaultMessage()
                )
                .collect(Collectors.joining(", "));

        return build(
                HttpStatus.BAD_REQUEST,
                message,
                request
        );
    }


    // =========================================================
    // ILLEGAL ARGUMENT
    // =========================================================

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(
            IllegalArgumentException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // ILLEGAL STATE
    // =========================================================

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(
            IllegalStateException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.BAD_REQUEST,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // FORBIDDEN
    // =========================================================

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(
            AccessDeniedException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.FORBIDDEN,
                exception.getMessage(),
                request
        );
    }


    // =========================================================
    // DATABASE CONSTRAINT VIOLATION
    // =========================================================

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrityViolation(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.CONFLICT,
                "The request conflicts with existing data",
                request
        );
    }


    // =========================================================
    // FALLBACK - UNEXPECTED ERROR
    // =========================================================

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception exception,
            HttpServletRequest request
    ) {

        return build(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "An unexpected error occurred",
                request
        );
    }


    // =========================================================
    // COMMON ERROR RESPONSE BUILDER
    // =========================================================

    private ResponseEntity<ErrorResponse> build(
            HttpStatus status,
            String message,
            HttpServletRequest request
    ) {

        ErrorResponse error = new ErrorResponse(
                status.value(),
                message,
                request.getRequestURI(),
                Instant.now()
        );

        return ResponseEntity
                .status(status)
                .body(error);
    }
}