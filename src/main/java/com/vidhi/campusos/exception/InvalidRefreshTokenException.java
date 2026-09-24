package com.vidhi.campusos.exception;

public class InvalidRefreshTokenException
        extends RuntimeException {

    public InvalidRefreshTokenException(String message) {
        super(message);
    }
}