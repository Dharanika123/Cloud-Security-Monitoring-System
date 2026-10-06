package com.sentinel.security.security;

import io.jsonwebtoken.ExpiredJwtException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class JwtServiceTest {

    @Test
    void shouldGenerateAndValidateToken() {
        JwtService jwtService = new JwtService("test-secret-key-that-is-long-enough", 3600000L);

        String token = jwtService.generateToken("demo-user", "EMPLOYEE");

        assertNotNull(token);
        assertEquals("demo-user", jwtService.extractUsername(token));
        assertTrue(jwtService.isTokenValid(token, "demo-user"));
    }

    @Test
    void shouldThrowExpiredJwtExceptionForExpiredToken() {
        JwtService jwtService = new JwtService("test-secret-key-that-is-long-enough", -1000L);

        String token = jwtService.generateToken("demo-user", "EMPLOYEE");

        assertThrows(ExpiredJwtException.class, () -> jwtService.extractUsername(token));
    }
}
