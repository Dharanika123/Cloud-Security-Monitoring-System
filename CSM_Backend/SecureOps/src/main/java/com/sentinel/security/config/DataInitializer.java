package com.sentinel.security.config;

import java.time.OffsetDateTime;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.sentinel.security.model.User;
import com.sentinel.security.repo.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        userRepository.findByUsernameIgnoreCase("admin").ifPresentOrElse(
            user -> {
                user.setPassword(passwordEncoder.encode("Admin@123"));
                user.setRole(User.MyRole.ADMIN);
                userRepository.save(user);
                System.out.println(">>> [DataInitializer] Admin password updated successfully to 'Admin@123' for user: " + user.getUsername());
            },
            () -> {
                String email = "admin@sentinel.com";
                if (userRepository.existsByEmail(email)) {
                    email = "admin_system@sentinel.com";
                }
                User admin = new User(
                    "admin",
                    email,
                    passwordEncoder.encode("Admin@123"),
                    User.MyRole.ADMIN,
                    OffsetDateTime.now()
                );
                userRepository.save(admin);
                System.out.println(">>> [DataInitializer] Admin user created successfully with username 'admin' and password 'Admin@123'");
            }
        );
    }
}
