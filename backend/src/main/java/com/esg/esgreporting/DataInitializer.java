
package com.esg.esgreporting;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.esg.esgreporting.entity.AppUser;
import com.esg.esgreporting.repository.AppUserRepository;

@Configuration
public class DataInitializer {

    @Bean
    CommandLineRunner initializeUsers(
            AppUserRepository repository,
            PasswordEncoder passwordEncoder) {

        return args -> {
            createUser(repository, passwordEncoder,
                    "admin", "Admin@123", "ADMIN");

            createUser(repository, passwordEncoder,
                    "contributor", "Contributor@123", "CONTRIBUTOR");

            createUser(repository, passwordEncoder,
                    "reviewer", "Reviewer@123", "REVIEWER");

            createUser(repository, passwordEncoder,
                    "viewer", "Viewer@123", "REPORT_VIEWER");
        };
    }

    private void createUser(
            AppUserRepository repository,
            PasswordEncoder encoder,
            String username,
            String password,
            String role) {

        if (repository.findByUsername(username).isEmpty()) {
            AppUser user = new AppUser();
            user.setUsername(username);
            user.setPassword(encoder.encode(password));
            user.setRole(role);

            repository.save(user);
        }
    }
}
