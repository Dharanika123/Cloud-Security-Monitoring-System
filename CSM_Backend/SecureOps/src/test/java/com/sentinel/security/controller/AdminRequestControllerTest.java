package com.sentinel.security.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;

class AdminRequestControllerTest {

//    @AfterEach
//    void clearSecurityContext() {
//        SecurityContextHolder.clearContext();
//    }
//
//    @Test
//    void getMyRequestsUsesSecurityContextWhenNoAuthenticationArgumentIsProvided() {
//        AdminRequestService requestService = mock(AdminRequestService.class);
//        UserRepository userRepository = mock(UserRepository.class);
//        AdminRequestController controller = new AdminRequestController(requestService, userRepository);
//
//        User user = new User("alice", "alice@example.com", "pw", User.MyRole.EMPLOYEE, OffsetDateTime.now());
//        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(user));
//        when(requestService.getUserRequests(any(User.class))).thenReturn(Collections.emptyList());
//
//        SecurityContextHolder.getContext().setAuthentication(new TestingAuthenticationToken("alice", "password"));
//
//        ResponseEntity<java.util.List<AdminRequest>> response = controller.getMyRequests(null, new MockHttpServletRequest());
//
//        assertEquals(200, response.getStatusCode().value());
//        assertEquals(Collections.emptyList(), response.getBody());
//    }
}
